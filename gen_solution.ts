#!/usr/bin/env bun
import { $ } from "bun";
import { makePrompt } from "./gen_prompt.ts";
import { writeFileSync, readFileSync, existsSync } from "fs";
import path from "path";
import { callOpenAI } from "./lib/openai";

/**
 * Extracts the solution code from the raw OpenAI response.
 * It tries to find content within <SOLUTION> tags, then within markdown code blocks.
 * @param result The raw string response from OpenAI.
 * @returns The extracted and trimmed solution code.
 * @throws Error if no solution content or code block is found.
 */
function extractSolution(result: string): string {
  let solution = "";

  // Strategy 1: Extract content between <SOLUTION> and </SOLUTION> tags
  let solutionContent = result.split("<SOLUTION>")[1];
  if (solutionContent) {
    solutionContent = solutionContent.split("</SOLUTION>")[0]?.trim();
  }

  // Strategy 2: Extract content between triple backticks (the actual code)
  // This handles cases where the AI provides a code block directly or within <SOLUTION> tags
  const codeBlockMatch = solutionContent?.match(
    /```(?:typescript|ts)?\s*([\s\S]*?)\s*```/
  );
  if (codeBlockMatch && codeBlockMatch[1]) {
    solution = codeBlockMatch[1].trim();
  } else if (solutionContent) {
    // If no code block found within <SOLUTION> tags, use the whole solutionContent as solution
    solution = solutionContent;
  } else {
    // Fallback: if no <SOLUTION> tag, try to find a code block directly from the full result
    const directCodeBlockMatch = result.match(
      /```(?:typescript|ts)?\s*([\s\S]*?)\s*```/
    );
    if (directCodeBlockMatch && directCodeBlockMatch[1]) {
      solution = directCodeBlockMatch[1].trim();
    }
  }

  if (!solution) {
    throw new Error("No solution content or code block found in AI response.");
  }

  return solution;
}

/**
 * Cleans the extracted solution code by removing problematic TypeScript references.
 * @param solution The raw extracted solution string.
 * @returns The cleaned solution string.
 */
function cleanSolution(solution: string): string {
  // Remove any problematic 'ts' imports or references that might be generated
  // These are now less likely to appear if code block extraction is robust, but keep as a safeguard
  solution = solution.replace(
    /^import\s+.*?\s+from\s+["']typescript["'];?\n?/gm,
    ""
  );
  solution = solution.replace(/^import\s+ts\s+from\s+["'].*?["'];?\n?/gm, "");
  solution = solution.replace(/^ts\..*?;?\n?/gm, ""); // Remove lines starting with 'ts.'
  solution = solution.replace(/^declare\s+const\s+ts:.*?;\n?/gm, ""); // Remove declare const ts
  solution = solution.replace(/^\s*ts\s*$/gm, ""); // Remove lines containing only 'ts'
  return solution;
}

export async function main() {
  const args = process.argv.slice(2);
  const workingDir = args[0] || "working"; // Get working directory from arguments

  console.log(`🚀 Starting solution generation for ${workingDir}...`);

  try {
    // Generate prompt using the makePrompt function
    console.log("📝 Generating prompt from analysis...");
    const prompt = await makePrompt(workingDir);
    console.log("✅ Prompt generated successfully.");

    // Call OpenAI with the generated prompt
    const rawResponse = await callOpenAI(prompt);

    // Extract and clean the solution
    let solution = extractSolution(rawResponse);
    solution = cleanSolution(solution);

    // Save the solution to file
    const solutionPath = path.join(process.cwd(), workingDir, "solution.ts");
    writeFileSync(solutionPath, solution);
    console.log(`✅ Solution generated and saved to ${solutionPath}`);
    console.log("🎉 Process completed successfully!");
  } catch (error: any) {
    console.error("💥 Fatal error during solution generation:", error.message);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
