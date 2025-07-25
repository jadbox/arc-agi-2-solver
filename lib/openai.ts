import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { $ } from "bun";
import OpenAI from "openai";

//const baseURL = "https://api.deepseek.com/v1"; // or use your preferred OpenAI API endpoint
// const apiKey = process.env.DEEPSEEK_API_KEY;
// const MODEL = "deepseek-chat"; // "deepseek-reasoner",

/* const baseURL = "https://api.anthropic.com/v1/";
const apiKey = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-20250514"; // or use your preferred OpenAI
*/

const ROUTER_MODELS = {
  K2: "moonshotai/kimi-k2",
  Qwen3Coder: "qwen/qwen3-coder",
  Qwen3: "qwen/qwen3-235b-a22b-07-25",
};
type RouterModelKey = keyof typeof ROUTER_MODELS;
const baseURL = "https://openrouter.ai/api/v1"; // or use your preferred OpenAI API endpoint
const apiKey = process.env.OPENROUTER_API_KEY;
const MODEL =
  ROUTER_MODELS[process.env.aimodel as RouterModelKey] ||
  ROUTER_MODELS["Qwen3Coder"];

if (!MODEL) {
  throw new Error("No model");
}

if (!apiKey) {
  throw new Error(
    "OPENROUTER_API_KEY environment variable is not set. Please set it to your OpenRouter API key."
  );
}
const client = new OpenAI({
  baseURL: baseURL, // "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: apiKey, // Ensure you have set your OpenAI API key in the environment variables
});

// Helper function to call openai with prompt and return response
export async function callOpenAI(
  prompt: string,
  outputJSON: boolean = false,
  outputFilePath: string = ""
) {
  console.log(`🤖 Starting OpenAI request with ${MODEL} at ${baseURL}...`);

  try {
    const stream = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4200,
      temperature: 0.7,
      top_p: 0.8,
      // repetition_penalty: 1.05,
      stream: true,
      response_format: {
        type: outputJSON ? "json_object" : "text",
      },
    });

    let fullResponse = "";
    let chunkCount = 0;

    console.log("🔄 Streaming response...");

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        process.stdout.write(content); // stream to console
        chunkCount++;
      }
    }

    console.log(`\n✅ Stream completed (${chunkCount} chunks received)`);

    if (!fullResponse) {
      throw new Error("No response received from OpenAI.");
    }

    fullResponse = fullResponse.trim();

    if (outputFilePath) {
      writeFileSync(outputFilePath, fullResponse, "utf8");
      console.log(`✅ Output written to ${outputFilePath}`);
    }

    return fullResponse;
  } catch (error) {
    console.error("❌ Error calling OpenAI:", error);
    // Fallback to a simpler, non-streaming call in case of error
    throw error;
  }
}
