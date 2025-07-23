#!/usr/bin/env bun
import { $ } from "bun";
import { makePrompt } from "./gen_prompt.ts";
import { writeFileSync } from "fs";
import path from "path";
import { callOpenAI } from "./lib/openai";

export async function callClaudeCLI(prompt: string): Promise<string> {
  console.log("🤖 Starting Claude CLI request...");

  try {
    // Use file-based approach for better handling of complex prompts
    const tempPromptFile = path.join(process.cwd(), "temp_prompt.txt");
    writeFileSync(tempPromptFile, prompt);

    const command = `claude --model sonnet --print < "${tempPromptFile}"`;
    const result = await run(command);

    // Clean up temp file
    await $`rm -f ${tempPromptFile}`;

    console.log("✅ Claude CLI request completed successfully.");
    return result.text().trim();
  } catch (error) {
    console.error("❌ Claude CLI request failed:", error);

    // Fallback: Try with direct prompt argument
    console.log("🔄 Attempting fallback with direct prompt...");
    try {
      // Escape the prompt properly for shell execution
      const escapedPrompt = prompt.replace(/'/g, "'\"'\"'");
      const fallbackCommand = `claude --model sonnet --print '${escapedPrompt}'`;
      const fallbackResult = await run(fallbackCommand);

      console.log("✅ Fallback Claude CLI request completed successfully.");
      return fallbackResult.text().trim();
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError);
      throw new Error(
        `Both primary and fallback Claude CLI calls failed: ${error}`
      );
    }
  }
}

async function run(cmd: string) {
  console.log(`🔧 Running command: ${cmd.substring(0, 100)}...`);
  const c = await $`sh -c ${cmd}`;

  if (c.exitCode !== 0) {
    const errorOutput = c.stderr?.toString() || "Unknown error";
    throw new Error(`Command failed with code ${c.exitCode}: ${errorOutput}`);
  }

  return c;
}

export async function main() {
  console.log("🚀 Starting solution generation with Claude CLI...");

  try {
    // Generate prompt using the makePrompt function from gen_utility.ts
    console.log("📝 Generating prompt from analysis...");
    const prompt = await makePrompt();
    console.log("✅ Prompt generated successfully.");

    // Call Claude CLI with the generated prompt
    const result = await callOpenAI(prompt); // await callClaudeCLI(prompt);

    // Extract solution from the result
    let solution = result.split("<SOLUTION>")[1]?.trim();
    // remove </SOLUTION>.*
    solution = solution?.replace(/<\/SOLUTION>.*$/, "").trim();

    // also remove typescript``` .. ``` code
    solution = solution
      ?.replace(/```typescript\s*([\s\S]*?)\s*```/g, "$1")
      .trim();

    if (solution) {
      const solutionPath = path.join(process.cwd(), "working", "solution.ts");
      writeFileSync(solutionPath, solution);
      console.log(`✅ Solution generated and saved to ${solutionPath}`);
      console.log("🎉 Process completed successfully!");
    } else {
      console.error("❌ No solution marker found in Claude response.");
      console.log("📄 Full response:", result);

      // Fallback: save the entire response if no solution marker found
      const solutionPath = path.join(process.cwd(), "working", "solution.ts");
      writeFileSync(solutionPath, result);
      console.log(`⚠️  Saved full response as fallback to ${solutionPath}`);
    }
  } catch (error) {
    console.error("💥 Fatal error during solution generation:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
