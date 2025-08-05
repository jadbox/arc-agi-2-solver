#!/usr/bin/env bun
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
    const rawResponse = await callOpenAI(prompt, { code: true });

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

/**
 * Generates a prompt for the OpenAI API based on the analysis and training data.
 * Reads the analysis from 'analysis.txt', the template from 'solution_example.ts',
 * and the training data from 'training.txt'.
 * @param workingDir The directory where the analysis and training files are located.
 * @returns A formatted prompt string for OpenAI.
 */
async function makePrompt(workingDir: string = "working") {
  const analysis = readFileSync(
    path.join(process.cwd(), workingDir, "analysis.txt"),
    "utf-8"
  ).split("FINAL>")[1];
  if (!analysis) {
    throw new Error("No analysis found in analysis.txt");
  }

  const template = readFileSync(
    path.join(process.cwd(), "solution_example.ts"),
    "utf-8"
  );

  const training = readFileSync(
    path.join(process.cwd(), workingDir, "training.txt"),
    "utf-8"
  );

  // Read old code if it exists
  let old_code = "";
  const oldCodePath = path.join(workingDir, "solution.ts");
  if (existsSync(oldCodePath)) {
    old_code = readFileSync(oldCodePath, "utf-8");
  }

  let oldResults = "";
  const oldResultsPath = path.join(workingDir, "training_run.txt");
  if (existsSync(oldResultsPath)) {
    oldResults = readFileSync(oldResultsPath, "utf-8");
  }

  const prompt = `
    Based on the following analysis:
    ---
    ${analysis}
    ---
    Generate a TypeScript solution file named 'solution.ts' that implements the logic described to map input number[] .
    Use this template as a starting point:
    ---
    ${old_code || template}
    ---
    The generated code should be a single TypeScript file. Return final solution.ts after a <SOLUTION> marker.
    <DATA>
    ${training}
    </DATA>
    ${oldResults ? `\n\nTemplate Results:\n\n${oldResults}` : ""}
  `;

  return prompt;
}
