import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// You can read data from the database via a query:
export const listNumbers = query({
  // Validators for arguments.
  args: {
    count: v.number(),
  },

  // Query implementation.
  handler: async (ctx, args) => {
    //// Read the database as many times as you need here.
    //// See https://docs.convex.dev/database/reading-data.
    const numbers = await ctx.db
      .query("numbers")
      // Ordered by _creationTime, return most recent
      .order("desc")
      .take(args.count);
    const userId = await getAuthUserId(ctx);
    const user = userId === null ? null : await ctx.db.get(userId);
    return {
      viewer: user?.email ?? null,
      numbers: numbers.reverse().map((number) => number.value),
    };
  },
});

// You can write data to the database via a mutation:
export const addNumber = mutation({
  // Validators for arguments.
  args: {
    value: v.number(),
  },

  // Mutation implementation.
  handler: async (ctx, args) => {
    //// Insert or modify documents in the database here.
    //// Mutations can also read from the database like queries.
    //// See https://docs.convex.dev/database/writing-data.

    const id = await ctx.db.insert("numbers", { value: args.value });

    console.log("Added new document with id:", id);
    // Optionally, return a value from your mutation.
    // return id;
  },
});

export const getGame = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.query("games").filter((q) => q.eq(q.field("_id"), args.id)).first();
    if (game === null) {
      return null;
    }

    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const usernames = new Map<string, string>();
    for (const guess of game.guesses) {
      usernames.set(guess.userId, '');
    }
    for (const score of game.scores) {
      usernames.set(score.userId, '');
    }
    await Promise.all(Array.from(usernames.keys()).map(async (userId) => {
      const user = await ctx.db.query("users").filter((q) => q.eq(q.field("_id"), userId)).first();
      usernames.set(userId, user?.name ?? '');
    }));

    // Get a URL that can be used to access the image
    let imageUrl = undefined;
    if (game.image) {
      imageUrl = await ctx.storage.getUrl(game.image);
      if (!imageUrl) {
        throw new Error("Failed to get URL for uploaded image");
      }
    }

    return {
      image: imageUrl,
      isHost: game.createdBy === userId,
      answer: game.revealAnswer ? game.answer : undefined, // Only show answer if it's been revealed
      guesses: game.guesses.map((guess) => ({
        guess: guess.guess,
        username: usernames.get(guess.userId) ?? '',
      })),
      winner: game.winner ? usernames.get(game.winner) ?? '' : undefined,
      round: game.answersHistory.length,
      theme: game.theme,
      scores: game.scores.map((score) => ({
        username: usernames.get(score.userId) ?? '',
        score: score.score,
      })),
    };
  },
});

export const getFullGame = internalQuery({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  }
});

export const createGame = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User not authenticated");
    }

    const gameId = await ctx.db.insert("games", {
      createdBy: userId,
      revealAnswer: false,
      answersHistory: [],
      guesses: [],
      theme: '',
      scores: [],
    });
    return gameId;
  },
});

export const isCreator = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.query("games").filter((q) => q.eq(q.field("_id"), args.gameId)).first();
    if (game === null) {
      return false;
    }
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return false;
    }
    return game.createdBy === userId;
  }
});

export const setNewImage = mutation({
  args: {
    gameId: v.id("games"),
    answer: v.string(),
    imageStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const isCreator = await ctx.runQuery(api.myFunctions.isCreator, { gameId: args.gameId });
    if (!isCreator) {
      return;
    }

    const game = await ctx.db.query("games").filter((q) => q.eq(q.field("_id"), args.gameId)).first();
    if (game === null) {
      return null;
    }

    await ctx.db.insert("images", {
      image: args.imageStorageId,
      game: args.gameId,
      theme: game.theme,
      answer: args.answer,
    });

    await ctx.db.patch(args.gameId, {
      answer: args.answer,
      image: args.imageStorageId,
      revealAnswer: false,
      answersHistory: [...game.answersHistory, args.answer],
      guesses: [],
      winner: undefined,
    });
  }
});

export const revealAnswer = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const isCreator = await ctx.runQuery(api.myFunctions.isCreator, { gameId: args.gameId });
    if (!isCreator) {
      return;
    }

    await ctx.db.patch(args.gameId, { revealAnswer: true });
  }
});

export const setTheme = mutation({
  args: {
    gameId: v.id("games"),
    theme: v.string(),
  },
  handler: async (ctx, args) => {
    const isCreator = await ctx.runQuery(api.myFunctions.isCreator, { gameId: args.gameId });
    if (!isCreator) {
      return;
    }

    await ctx.db.patch(args.gameId, { theme: args.theme });
  }
});

export const addGuess = mutation({
  args: {
    gameId: v.id("games"),
    guess: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.query("games").filter((q) => q.eq(q.field("_id"), args.gameId)).first();
    if (game === null) {
      return;
    }
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return;
    }

    if (args.guess.toLowerCase() === game.answer?.toLowerCase()) {
      const scores = game.scores;
      const scoreIndex = scores.findIndex((score) => score.userId === userId);
      if (scoreIndex === -1) {
        scores.push({ userId: userId, score: 1 });
      } else {
        scores[scoreIndex].score++;
      }
      scores.sort((a, b) => b.score - a.score);

      await ctx.db.patch(args.gameId, {
        guesses: [
          ...game.guesses,
          {
            guess: args.guess,
            userId: userId
          }],
        revealAnswer: true,
        winner: userId,
        scores: scores,
      });
    } else {
      await ctx.db.patch(args.gameId, {
        guesses: [
          ...game.guesses,
          {
            guess: args.guess,
            userId: userId
          }]
      });
    }
  }
});

export const getRandomImage = internalQuery({
  args: {},
  handler: async (ctx) => {
    const images = await ctx.db.system.query("_storage").collect();
    if (images.length === 0) {
      throw new Error("No images in storage");
    }
    const image = images[Math.floor(Math.random() * images.length)];
    return image._id;
  }
});

export const getImages = query({
  args: {},
  handler: async (ctx) => {
    const images = await ctx.db.query("images").collect();
    images.sort((a, b) => b._creationTime - a._creationTime);
    const res = await Promise.all(images.map(async (image) => {
      const imageUrl = await ctx.storage.getUrl(image.image);
      if (!imageUrl) {
        throw new Error("Failed to get URL for uploaded image");
      }
      return {
        image: imageUrl,
        theme: image.theme,
        answer: image.answer,
      };
    }));
    return res;
  }
});

export const getImagesPaginated = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6; // Default to 6 images per page
    
    let query = ctx.db.query("images").order("desc");
    
    // If cursor is provided, start after that ID
    const cursor = args.cursor;
    if (cursor) {
      // TODO: Might be an issue if two images are created at the same time
      query = query.filter((q) => q.lt(q.field("_creationTime"), cursor));
    }
    
    const images = await query.take(limit + 1); // Take one extra to check if there's more
    const hasMore = images.length > limit;
    const imagesToReturn = hasMore ? images.slice(0, limit) : images;
    
    const res = await Promise.all(imagesToReturn.map(async (image) => {
      const imageUrl = await ctx.storage.getUrl(image.image);
      if (!imageUrl) {
        throw new Error("Failed to get URL for uploaded image");
      }
      return {
        _id: image._id,
        image: imageUrl,
        theme: image.theme,
        answer: image.answer,
        _creationTime: image._creationTime,
      };
    }));
    
    return {
      images: res,
      hasMore,
      nextCursor: hasMore ? imagesToReturn[imagesToReturn.length - 1]._id : null,
    };
  }
});