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
    if (game.winner) {
      usernames.set(game.winner, '');
    }

    await Promise.all(Array.from(usernames.keys()).map(async (userId) => {
      const user = await ctx.db.query("users").filter((q) => q.eq(q.field("_id"), userId)).first();
      usernames.set(userId, user?.name ?? '');
    }));

    if (game.revealAnswer) {
      return {
        image: game.image,
        answer: game.answer,
        isHost: game.createdBy === userId,
        guesses: game.guesses.map((guess) => ({
          guess: guess.guess,
          username: usernames.get(guess.userId) ?? '',
        })),
        winner: game.winner ? usernames.get(game.winner) ?? '' : undefined,
        round: game.answersHistory.length,
        theme: game.theme,
      };
    } else {
      return {
        image: game.image,
        isHost: game.createdBy === userId,
        guesses: game.guesses.map((guess) => ({
          guess: guess.guess,
          username: usernames.get(guess.userId) ?? '',
        })),
        winner: game.winner ? usernames.get(game.winner) ?? '' : undefined,
        round: game.answersHistory.length,
        theme: game.theme,
      };
    }
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
    image: v.string(),
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

    await ctx.db.patch(args.gameId, {
      answer: args.answer,
      image: args.image,
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
      await ctx.db.patch(args.gameId, {
        guesses: [
          ...game.guesses,
          {
            guess: args.guess,
            userId: userId
          }],
        revealAnswer: true,
        winner: userId,
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
