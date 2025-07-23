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

const baseURL = "https://openrouter.ai/api/v1"; // or use your preferred OpenAI API endpoint
const apiKey = process.env.OPENROUTER_API_KEY;
const MODEL = "qwen/qwen3-coder"; // or use

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
export async function callOpenAI(prompt, outputFilePath) {
  console.log("🤖 Starting OpenAI request...");

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 999,
    //max_completion_tokens: 999,
    // stop: null,
    stream: false,
  });

  console.log("✅ OpenAI request completed", stream.choices);

  // console.log(`\n✅ Stream completed (${chunkCount} chunks received)`);
  let fullResponse =
    stream.choices[0].message.content ||
    stream.choices[0].message.reasoning_content;

  console.log(`\n✅ OpenAI response: ${fullResponse}`);

  if (!fullResponse) {
    throw new Error("No response from OpenAI");
  }

  fullResponse = fullResponse.trim();

  // write file to outputFilePath
  if (outputFilePath) {
    writeFileSync(outputFilePath, fullResponse, "utf8");
    console.log(`✅ Output written to ${outputFilePath}`);
  }

  return fullResponse;
}
