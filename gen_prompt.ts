#!/usr/bin/env bun
import { $ } from "bun";
import { callOpenAI } from "./lib/openai.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

export async function makePrompt(workingDir: string = "working") {
  const analysis = readFileSync(
    path.join(process.cwd(), workingDir, "analysis.txt"),
    "utf-8"
  );
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
