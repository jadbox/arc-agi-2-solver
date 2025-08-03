#!/usr/bin/env bun
import { $ } from "bun";
import { callOpenAI } from "./lib/openai";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { parseInput, findGridDividers } from "./lib/divide";
import { transpile } from "typescript";

// import { promptGroq } from "./lib/groq";

let lastAttemptForSolutionTS = "";
// Helper function to read file synchronously
// The working directory will now be passed as an argument
// const _f = path.join(import.meta.dirname, "working", "solution.ts");
// const lastAttemptForSolutionTSFile = existsSync(_f) && readFileSync(_f, "utf8");
// if (lastAttemptForSolutionTSFile) {
//   lastAttemptForSolutionTS = lastAttemptForSolutionTSFile.trim();
// }

const prompt = `This is a puzzle game where an input grid transforms into an output grid using secret rules. 

Your checklist:
1) Say <OBSERVATIONS> and create bullet-point human-like observations of this transformation with labels: high [describe the visual differences like to a child] and medium [contextual associations]. Be concise, avoid data repetition. 
Focus on symmetry, repetition, and abstract patterns (e.g., "fill holes in number islands" or "creates the missing pattern under the box").

2) Say <THINK> followed by thinking high level theories of associations and transformations. No hardcoded solutions. Do not overanalyze or check values.

3) Say <VERIFY> with a section to verify pseudo-code against an example.

4) Say <FINAL> to then provide a final refined pseudo-code steps for use in code generation.

NOTES:

TIPS:
- The rules are system-based (not hardcoded to rows/cols) and rely on pattern operations (masking, comparison, object-like patterns). 
- Avoid mathematical operations on individual digits.
- All problems use simple rules that are easy for children to solve visually. 
- DO concise and dense in analysis.
- Do not overfit solution to specific examples, focus on generalizable patterns. Minimize hardcoded logic for general rules.

Sometimes problems require treating digit groups as visual shapes (e.g., "Group A has two holes").
- If a grid divider exists (fixed reference character, e.g., '2'):
   - Remove ALL occurrences of the divider character.
   - If removed characters formed a contiguous vertical/horizontal line, split the grid into sections along that line.
   - Otherwise, treat as a single grid.
   - Exclude the divider character from all sections.
   - Each sub-grid will be important for the puzzle. (e.g., "Left grid is masked by digit 3 in the right grid").
`;
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
    console.log(
      "Info: Grid dividers found:",
      parsedData.direction,
      parsedData.indexes
    );
    promptWithData += `${prompt}\n\nNOTE: grid is seperated by ${parsedData.direction} at indexes ${parsedData.indexes}\n. 
    Each col grid is key for solving the puzzle. Divide the grid by the col to look for solutions.\n\n<DATA>\n${trainingData}`;
  } else {
    promptWithData += `${prompt}\n\n<DATA>\n${trainingData}`;
  }

  console.log("Calling OpenAI with prompt:", promptWithData);
  const response = await callOpenAI(promptWithData, {
    // outputFilePath: path.join(workingDir, "analysis.txt"),
  });
  const trimmedResponse = response.trim(); // .split("VERIFY")[1];
  if (!trimmedResponse) throw new Error("No VERIFY tag found");
  if (trimmedResponse.indexOf("FINAL>") === -1)
    throw new Error("No FINAL tag found");

  writeFileSync(path.join(workingDir, "analysis.txt"), trimmedResponse, "utf8");
  console.log("Analysis written to analysis.txt");
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
