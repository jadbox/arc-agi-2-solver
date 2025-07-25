#!/usr/bin/env bun
import { $ } from "bun";
import { callOpenAI } from "./lib/openai";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { parseInput, findGridDividers } from "./lib/divide";

// import { promptGroq } from "./lib/groq";

let lastAttemptForSolutionTS = "";
// Helper function to read file synchronously
const _f = path.join(import.meta.dirname, "working", "solution.ts");
const lastAttemptForSolutionTSFile = existsSync(_f) && readFileSync(_f, "utf8");
if (lastAttemptForSolutionTSFile) {
  lastAttemptForSolutionTS = lastAttemptForSolutionTSFile.trim();
}

const prompt = `This is a puzzle game where an input grid gets transformed into the output grid. The game has simple secret rules for transformations. Sometimes the grid is separated into a legend key. The secret rules are system rules that are not hard coded to rows/cols, and the solution should not need to specific row/cols to transform. Each digit in the grid could be a number or character- do not use math on the individual digits.

1) Create a bullet point list of observations of this specific transformation problem (labeled with detail analysis levels of high [visual clues], med [contextual], low [logical]) and the hidden rules. Do not repeat the data. Be concise. These problems can be solved by using object-like patterns, symmetry, repetition, and abstract perspective ("fill in the holes in each number island").

2) After the list of observations, create list of pseudo-code steps that replicates the transformation secret rules. Systematize the process by looking at patterns that are not specific to individual cols/rows. Do not rely on hard-coded solutions.

3) double check pseudo code against a listed example, and propose a final strategy pseudo-code after a <FINAL> tag.

a) Note sometimes the puzzles will create "groupify" blocks of numbers as a individual units which may require thinking of blocks of numbers as 'islands with holes' or similar object associations in thinking.
b) NOTE sometimes there's a grid divider [fixed reference/divider] with critical importance for solving, write a section called <LEGEND> with a visual, deductive analysis of the smaller 'legend' key for solving [example: "legend key indicates all 2x2 blocks are flipped horizontally, and all 1x3 blocks are flipped vertically"].

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

export async function solvePuzzle(trainingData: string) {
  console.log("Parsing input data...");
  const parsedData = findGridDividers(parseInput(trainingData));
  // console.log("Parsed data:", parsedData);
  // return;
  let promptWithData = "";

  if (parsedData.divider) {
    promptWithData += `${prompt}\n\nNOTE: grid is seperated by ${parsedData.direction} at indexes ${parsedData.indexes}\n <DATA>\n${trainingData}`;
  } else {
    promptWithData += `${prompt}\n\n<DATA>\n${trainingData}`;
  }

  console.log("Calling OpenAI with prompt:", promptWithData);
  const response = await callOpenAI(
    promptWithData,
    false,
    "working/analysis.txt"
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

  const readFileSync = (await import("fs")).readFileSync;
  const trainingData = readFileSync(inputFileName, "utf8");

  solvePuzzle(trainingData).catch(console.error);
}

function run(cmd: string) {
  console.log(`Running command: ${cmd}`);
  return $`${cmd}`;
}
