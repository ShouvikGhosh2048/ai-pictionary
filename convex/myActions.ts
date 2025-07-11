"use node";

import { v } from "convex/values";
import { action, ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { GoogleGenAI, Modality } from "@google/genai";

async function getImageFromGemini(theme: string, answer: string, ctx: ActionCtx) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

  const imageDescription = `We are playing a pictionary game.
  Create an image for the topic ${answer} (the theme of the pictionary is ${theme}, and the topic was chosen from this theme).
  It should be a simple, clear drawing of that answer suitable for a pictionary game. 
  The drawing should have clean lines, recognizable shapes, and be easy to draw. 
  Focus on the key visual elements that make this answer recognizable.
  Do not include any text in the image. The image should look like a drawing on a whiteboard.

  Only add the image in your response, no other text.
  `;
  const imageResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: imageDescription,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
  });
  const imageResponseParts = imageResponse.candidates?.[0]?.content?.parts;
  if (!imageResponseParts) { throw new Error("No parts in image response"); }
  for (const part of imageResponseParts) {
    if (part.inlineData) {
      const image = part.inlineData.data;
      if (!image) { continue; }
    
      // Upload the base64 image to Convex storage
      // Convert base64 string to Blob
      // https://stackoverflow.com/a/42775613
      const buffer = Buffer.from(image, 'base64');
      const blob = new Blob([buffer], { type: "image/png" });
      
      const storageId = await ctx.storage.store(blob);
      return storageId;
    }
  }

  throw new Error("Didn't recieve an image");
}

export const newRound = action({
    args: {
      gameId: v.id("games"),
    },
  
    handler: async (ctx, args) => {
      const game = await ctx.runQuery(internal.myFunctions.getFullGame, { gameId: args.gameId });
      if (game === null) {
        return;
      }
    
      // https://github.com/googleapis/js-genai
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }
  
      try {
        // For now, we'll use a simple approach to generate a description
        // You can integrate with actual image generation services later
        const answerDescription = `We are playing a pictionary game. Choose a answer for the theme ${game.theme}.
        
        Your response should be of the form:
        <answer>
  
        Only add the answer, no other text. The answer should be a single word.

        Example:
        Pikachu
  
        The previous answers are: ${game.answersHistory.join(", ")}. Do not use any of these answers.
        `;

        // https://ai.google.dev/gemini-api/docs/image-generation#gemini
        const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
        const answerResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite-preview-06-17",
          contents: answerDescription,
          config: {
            responseModalities: [Modality.TEXT],
          },
        });
  
        const answerResponseParts = answerResponse.candidates?.[0]?.content?.parts;
        if (!answerResponseParts) { throw new Error("No parts in answer response"); }

        const answer = answerResponseParts[0]?.text;
        if (!answer) { throw new Error("Didn't get an answer"); }

        const storageId = await getImageFromGemini(game.theme, answer, ctx);
        // const storageId = await ctx.runQuery(internal.myFunctions.getRandomImage); // For dev
  
        await ctx.runMutation(internal.myFunctions.setNewImage, {
          gameId: args.gameId,
          answer: answer,
          theme: game.theme,
          imageStorageId: storageId,
        });
      } catch (error) {
        console.error("Error generating image description:", error);
        if (error instanceof Error) {
            console.error(error.message);
        }
        return;
      }
    }
  });