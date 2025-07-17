import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { $ } from "bun";
import OpenAI from "openai";
const client = new OpenAI({
  baseURL: "https://api.deepseek.com/v1", // "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.DEEPSEEK_API_KEY, // Ensure you have set your OpenAI API key in the environment variables
});

// Helper function to call openai with prompt and return response
export async function callOpenAI(prompt, outputFilePath) {
  console.log("🤖 Starting OpenAI request...");

  const stream = await client.chat.completions.create({
    model: "deepseek-chat", // "deepseek-reasoner",
    messages: [{ role: "user", content: prompt, system: { max_tokens: 999 } }],
    max_tokens: 999,
    max_completion_tokens: 999,
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
  writeFileSync(outputFilePath, fullResponse, "utf8");
  console.log(`✅ Output written to ${outputFilePath}`);

  return fullResponse;
}
