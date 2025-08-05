import { writeFileSync } from "fs";
import OpenAI from "openai";

// Maximum tokens for the AI model response.
const max_tokens = 16000;

// --- AI Model Configuration ---
// This section defines the base URL, API key, and model names for various AI providers.
// Uncomment and configure the desired provider.

// --- AI Model Configuration ---
// This section defines the base URL, API key, and model names for various AI providers.
// The active configuration is determined by the `aimodel` environment variable.

let baseURL: string;
let apiKey: string | undefined;
let MODEL: string;
let MODEL_CODER: string;

const OR_ROUTER_MODELS = {
  K2: "moonshotai/kimi-k2",
  Qwen3Coder: "qwen/qwen3-coder",
  Qwen3: "qwen/qwen3-235b-a22b-07-25",
  Qwen3Think: "qwen/qwen3-235b-a22b-thinking-2507:nitro",
  glm: "z-ai/glm-4.5",
  glm_air: "z-ai/glm-4.5-air",
  chatgpt: "openai/chatgpt-4o-latest",
  Qwen3Nitro: "qwen/qwen3-235b-a22b-2507:nitro",
};
type RouterModelKey = keyof typeof OR_ROUTER_MODELS;

const model = process.env.aimodel || "Cerebras";
switch (model) {
  case "Cerebras":
    baseURL = "https://api.cerebras.ai/v1";
    apiKey = process.env.CEREBRAS_API_KEY;
    MODEL = "qwen-3-235b-a22b-instruct-2507";
    MODEL_CODER = "qwen-3-coder-480b";
    break;
  case "Anthropic":
    baseURL = "https://api.anthropic.com/v1/";
    apiKey = process.env.ANTHROPIC_API_KEY;
    MODEL = "claude-sonnet-4-20250514";
    MODEL_CODER = MODEL; // Assuming coder model is same or not applicable
    break;
  case "Deepseek":
    baseURL = "https://api.deepseek.com/v1";
    apiKey = process.env.DEEPSEEK_API_KEY;
    MODEL = "deepseek-chat";
    MODEL_CODER = "deepseek-coder"; // Assuming a coder model exists
    break;
  case "Gemini":
    baseURL = "https://generativelanguage.googleapis.com/v1beta/openai/";
    MODEL = "gemini-2.5-flash";
    MODEL_CODER = MODEL;
    apiKey = process.env.GEMINI_API_KEY;
    break;
  case "OpenRouter":
  case "OpenRouter:K2":
  case "OpenRouter:Qwen3Coder":
  case "OpenRouter:Qwen3":
  case "OpenRouter:Qwen3Think":
  case "OpenRouter:glm":
  case "OpenRouter:glm_air":
  case "OpenRouter:chatgpt":
  case "OpenRouter:Qwen3Nitro":
    baseURL = "https://openrouter.ai/api/v1";
    apiKey = process.env.OPENROUTER_API_KEY;
    const openRouterModelKey =
      process.env.aimodel?.split(":")[1] || "Qwen3Think";
    MODEL =
      OR_ROUTER_MODELS[openRouterModelKey as RouterModelKey] ||
      OR_ROUTER_MODELS.Qwen3Think;
    MODEL_CODER = MODEL; // OpenRouter often uses the same model for coding tasks unless specified
    break;
  default:
    throw new Error(
      `Unsupported AI model: ${model}. Supported models are: Cerebras, Anthropic, Deepseek, Gemini, OpenRouter.`
    );
    break;
}

// Ensure a model is selected.
if (!MODEL) {
  throw new Error(
    "No AI model configured. Please set the 'aimodel' environment variable or configure a default."
  );
}

// Validate API key presence.
if (!apiKey) {
  throw new Error(
    `API key for the selected model (${
      process.env.aimodel || "Cerebras"
    }) is not set. Please set the appropriate environment variable.`
  );
}

// Initialize the OpenAI client with the configured base URL and API key.
const client = new OpenAI({
  baseURL: baseURL,
  apiKey: apiKey,
});

// Parameters specific to Cerebras models (these might be moved into the switch if they vary per model)
const CEREBRAS_PARAMS = {
  temperature: 0.6,
  top_p: 0.8,
  provider: {
    only: ["cerebras"],
  },
};

// Parameters specific to Gemini models (these might be moved into the switch if they vary per model)
const GEMINI_PARAMS = {
  temperature: 0.1,
  top_p: 0.5,
};

/**
 * Calls the OpenAI API with a given prompt and returns the response.
 * This function acts as a wrapper, internally calling `callOpenAIStream`.
 *
 * @param prompt The text prompt to send to the AI model.
 * @param options Configuration options for the API call.
 * @param options.outputJSON If true, requests a JSON object response.
 * @param options.outputFilePath If provided, the response will be written to this file.
 * @param options.code If true, uses the `MODEL_CODER` for code-specific tasks.
 * @returns A promise that resolves to the AI model's response as a string.
 */
export async function callOpenAI(
  prompt: string,
  options: {
    outputJSON?: boolean;
    outputFilePath?: string;
    code?: boolean;
  } = {}
) {
  return callOpenAIStream(prompt, options);
}

/**
 * Calls the OpenAI API with a given prompt and streams the response.
 * This function handles the streaming logic, logging, and error handling.
 *
 * @param prompt The text prompt to send to the AI model.
 * @param options Configuration options for the API call.
 * @param options.outputJSON If true, requests a JSON object response.
 * @param options.outputFilePath If provided, the response will be written to this file.
 * @param options.code If true, uses the `MODEL_CODER` for code-specific tasks.
 * @returns A promise that resolves to the AI model's complete response as a string.
 * @throws Error if no response is received or if the AI indicates it cannot solve the problem.
 */
export async function callOpenAIStream(
  prompt: string,
  options: {
    outputJSON?: boolean;
    outputFilePath?: string;
    code?: boolean;
  } = {}
) {
  const { outputJSON = false, outputFilePath = "", code = false } = options;
  const modelToUse = code ? MODEL_CODER : MODEL;

  console.log(`🤖 Starting OpenAI request with ${modelToUse} at ${baseURL}...`);

  try {
    const stream = await client.chat.completions.create({
      model: modelToUse,
      messages: [{ role: "user", content: prompt }],
      max_tokens: max_tokens,
      temperature: 0.1,
      top_p: 0.5,
      stream: true,
      response_format: {
        type: outputJSON ? "json_object" : "text",
      },
      // provider: {
      //   only: ["cerebras"],
      // },
    } as any);

    let fullResponse = "";
    let chunkCount = 0;

    console.log("🔄 Streaming response...");

    let isReasoning = false;
    for await (const chunk of stream as any) {
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
        process.stdout.write(content);
        chunkCount++;
      }
    }

    console.log(`\n✅ Stream completed (${chunkCount} chunks received)`);

    if (!fullResponse) {
      throw new Error("No response received from OpenAI.");
    }

    fullResponse = fullResponse.trim();

    if (
      fullResponse.indexOf("I cannot solve it.") !== -1 ||
      fullResponse.indexOf("giving up") !== -1
    ) {
      console.warn(
        "⚠️ OpenAI response indicates inability to solve the problem.",
        fullResponse
      );
      process.exit(1);
    }

    if (outputFilePath) {
      writeFileSync(outputFilePath, fullResponse, "utf8");
      console.log(`✅ Output written to ${outputFilePath}`);
    }

    return fullResponse;
  } catch (error) {
    console.error("❌ Error calling OpenAI:", error);
    throw error;
  }
}
