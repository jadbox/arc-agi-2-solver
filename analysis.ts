#!/usr/bin/env bun
import { $ } from "bun";
import { callOpenAI } from "./lib/openai";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { parseInput, findGridDividers } from "./lib/divide";

// import { promptGroq } from "./lib/groq";

let lastAttemptForSolutionTS = "";
// Helper function to read file synchronously
// The working directory will now be passed as an argument
// const _f = path.join(import.meta.dirname, "working", "solution.ts");
// const lastAttemptForSolutionTSFile = existsSync(_f) && readFileSync(_f, "utf8");
// if (lastAttemptForSolutionTSFile) {
//   lastAttemptForSolutionTS = lastAttemptForSolutionTSFile.trim();
// }

const prompt = `Here's a concise and improved prompt that addresses the grid separator exclusion issue:

<PROMPT>
This is a puzzle game where an input grid transforms into an output grid using secret rules. The rules are system-based (not hardcoded to rows/cols) and rely on pattern operations (masking, comparison, object-like patterns). Avoid mathematical operations on individual digits.
Do not repeat the input/output grid data.
All problems use simple rules and are easy for humans to solve. DO not be verbose.

1) BEFORE deeply thinking on solving, Create bullet-point observations of this transformation (labeled: high [visual], med [contextual], low [logical]). Be concise, avoid data repetition. Focus on symmetry, repetition, and abstract patterns (e.g., "fill holes in number islands").

2) Think and generate pseudo-code steps for the transformation rules. Systematize using row/col-agnostic patterns. No hardcoded solutions.

3) Verify pseudo-code against examples. After <FINAL>, provide a proof of the correct operation.

NOTES:
a) Treat digit groups as visual shapes (e.g., "Group A has two holes").
b) If a grid divider exists (fixed reference character, e.g., '2'):
   - Remove ALL occurrences of the divider character.
   - If removed characters formed a contiguous vertical/horizontal line, split the grid into sections along that line.
   - Otherwise, treat as a single grid.
   - Exclude the divider character from all sections.
   - Each sub-grid will be important for the puzzle. (e.g., "Left grid is masked by digit 3 in the right grid").
</PROMPT>

Key improvements:
1. Explicitly states to **remove ALL divider characters** first if there's sub-grids.
2. Clarifies splitting only occurs if removed characters form a **contiguous line**
3. Emphasizes **exclusion of divider characters** from sections
4. Maintains conciseness while addressing the core issue
5. Preserves all original requirements for pattern-based analysis`;

/*
${
  lastAttemptForSolutionTSFile
    ? `\n\nLast attempt for solution.ts:<LAST_ATTEMPT>\n${lastAttemptForSolutionTSFile}`
    : ""
}

IGNORE ME: LAST STEP: provide a list of common utilities needed for the solution thats not already included: ${readFileSync(
  "./gen/header.txt",
  "utf8"
)
*/

export async function solvePuzzle(trainingData: string, workingDir: string) {
  console.log("Parsing input data...");
  const parsedData = findGridDividers(parseInput(trainingData));
  // console.log("Parsed data:", parsedData);
  // return;
  let promptWithData = "";

  if (parsedData.divider) {
    promptWithData += `${prompt}\n\nNOTE: grid is seperated by ${parsedData.direction} at indexes ${parsedData.indexes}\n. 
    Each col grid is key for solving the puzzle. Divide the grid by the col to look for solutions.\n\n<DATA>\n${trainingData}`;
  } else {
    promptWithData += `${prompt}\n\n<DATA>\n${trainingData}`;
  }

  console.log("Calling OpenAI with prompt:", promptWithData);
  const response = await callOpenAI(
    promptWithData,
    false,
    path.join(workingDir, "analysis.txt")
  );
  console.log("OpenAI response:", response);
  return response;

  // const response = await run(
  //   `aider --prompt "${prompt}\n\n<DATA>\n${trainingData}" --max-tokens 1000 --exit-on-diff`
  // );

  // if (response.code !== 0) {
  //   throw new Error(`Aider failed to process the puzzle: ${response.stderr}`);
  // }
  // const output = response.text().trim();
  // console.log("Aider's response:", output);
  // return output;
}

// Call solvePuzzle() if this file is run directly from the CLI
if (import.meta.main) {
  const args = process.argv.slice(2);

  // Determine the input file name: use the first argument if provided, otherwise use the default.
  const inputFileName = args[0] || "working/training.txt";
  const workingDir = args[1] || "working"; // Get working directory from arguments

  const readFileSync = (await import("fs")).readFileSync;
  const trainingData = readFileSync(inputFileName, "utf8");

  solvePuzzle(trainingData, workingDir).catch(console.error);
}
