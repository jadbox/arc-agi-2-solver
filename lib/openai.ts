import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { $ } from "bun";
import OpenAI from "openai";

const max_tokens = 16000;

//const baseURL = "https://api.deepseek.com/v1"; // or use your preferred OpenAI API endpoint
// const apiKey = process.env.DEEPSEEK_API_KEY;
// const MODEL = "deepseek-chat"; // "deepseek-reasoner",

// const baseURL = "https://api.anthropic.com/v1/";
// const apiKey = process.env.ANTHROPIC_API_KEY;
// const MODEL = "claude-sonnet-4-20250514"; // or use your preferred OpenAI

// "https://api.cerebras.ai/v1"
// const baseURL = "https://api.cerebras.ai/v1"; // or use your preferred OpenAI API endpoint
// const apiKey = process.env.CEREBRAS_API_KEY; // Use OpenAI API key
// const MODEL = "qwen-3-235b-a22b";

// gemini
// const baseURL = "https://generativelanguage.googleapis.com/v1beta/openai/";
// const MODEL = "gemini-2.5-flash";
// const apiKey = process.env.GEMINI_API_KEY; // Use OpenAI API key if Gemini key is not set

const OR_ROUTER_MODELS = {
  K2: "moonshotai/kimi-k2", // cant do sample2
  Qwen3Coder: "qwen/qwen3-coder",
  Qwen3: "qwen/qwen3-235b-a22b-07-25",
  Qwen3Think: "qwen/qwen3-235b-a22b-thinking-2507",
  glm: "z-ai/glm-4.5",
  glm_air: "z-ai/glm-4.5-air",
  chatgpt: "openai/chatgpt-4o-latest",
  Qwen3Nitro: "qwen/qwen3-235b-a22b-2507:nitro",
};
type RouterModelKey = keyof typeof OR_ROUTER_MODELS;
const baseURL = "https://openrouter.ai/api/v1"; // or use your preferred OpenAI API endpoint
const apiKey = process.env.OPENROUTER_API_KEY;
const MODEL =
  OR_ROUTER_MODELS[process.env.aimodel as RouterModelKey] ||
  OR_ROUTER_MODELS.Qwen3Nitro;

if (!MODEL) {
  throw new Error("No model");
}

const CEREBRAS_PARAMS = {
  tempuerature: 0.6, // 0.1
  top_p: 0.8, // 0.5
  provider: {
    only: ["cerebras"], // or "openai" for OpenAI models
  },
};

const GEMIN_PARAMS = {
  tempuerature: 0.1,
  top_p: 0.5,
  provider: {
    only: ["cerebras"], // or "openai" for OpenAI models
  },
};

if (!apiKey) {
  throw new Error(
    "OPENROUTER_API_KEY environment variable is not set. Please set it to your OpenRouter API key."
  );
}
const client = new OpenAI({
  baseURL: baseURL, // "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: apiKey, // Ensure you have set your OpenAI API key in the environment variables
});

export async function callOpenAI(
  prompt: string,
  outputJSON: boolean = false,
  outputFilePath: string = ""
) {
  return callOpenAIStream(prompt, outputJSON, outputFilePath);
}

// Helper function to call openai with prompt and return response
export async function callOpenAISync(
  prompt: string,
  outputJSON: boolean = false,
  outputFilePath: string = ""
) {
  console.log(`🤖 Starting OpenAI request with ${MODEL} at ${baseURL}...`);

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: max_tokens,
      temperature: 0.7,
      top_p: 0.8,
      // repetition_penalty: 1.05,
      // response_format: {
      //   type: outputJSON ? "json_object" : "text",
      // },
    });

    const fullResponse = response.choices[0]?.message?.content;

    if (!fullResponse) {
      console.warn("Response:", response);
      throw new Error("No response received from OpenAI.");
    }

    const trimmedResponse = fullResponse.trim();

    console.log(`✅ Response received (${trimmedResponse.length} characters)`);

    if (outputFilePath) {
      writeFileSync(outputFilePath, trimmedResponse, "utf8");
      console.log(`✅ Output written to ${outputFilePath}`);
    }

    return trimmedResponse;
  } catch (error) {
    console.error("❌ Error calling OpenAI:", error);
    throw error;
  }
}

// Helper function to call openai with prompt and return response
export async function callOpenAIStream(
  prompt: string,
  outputJSON: boolean = false,
  outputFilePath: string = ""
) {
  console.log(`🤖 Starting OpenAI request with ${MODEL} at ${baseURL}...`);

  try {
    const stream = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: max_tokens,
      temperature: 0.6, // 0.1
      top_p: 0.8, // 0.5
      // repetition_penalty: 1.05,
      stream: true,
      response_format: {
        type: outputJSON ? "json_object" : "text",
      },
      provider: {
        only: ["cerebras"],
      },
    } as any);

    let fullResponse = "";
    let chunkCount = 0;

    console.log("🔄 Streaming response...");

    let isReasoning = false;
    for await (const chunk of stream as any) {
      // console.log(`🔄 Received chunk`, chunk.choices[0]);
      const reasoning = (chunk.choices[0]?.delta as any)?.reasoning || "";
      if (reasoning) {
        if (!isReasoning) {
          isReasoning = true;
          console.log("🔍 Reasoning started:");
        }
        process.stdout.write(reasoning);
        continue;
      }

      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        if (!fullResponse) {
          console.log("💬 Final response started:");
        }
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
