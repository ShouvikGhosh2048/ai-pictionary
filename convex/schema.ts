import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  games: defineTable({
    createdBy: v.id("users"),
    theme: v.string(),
    image: v.optional(v.object({
      image: v.id("_storage"),
      theme: v.string(),
      answer: v.string(),
    })),
    revealAnswer: v.boolean(),
    answersHistory: v.array(v.string()),
    guesses: v.array(v.object({
      guess: v.string(),
      userId: v.id("users"),
    })),
    scores: v.array(v.object({
      userId: v.id("users"),
      score: v.number(),
    })),
    winner: v.optional(v.id("users")),
  }),
  images: defineTable({
    image: v.id("_storage"),
    game: v.id("games"),
    theme: v.string(),
    answer: v.string(),
  }),
});
