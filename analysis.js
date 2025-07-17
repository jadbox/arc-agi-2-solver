#!/usr/bin/env bun
import { $ } from "bun";
import { callOpenAI } from "./lib/openai";

const prompt = `This is a puzzle game where the left size grid gets 
transformed with the right side grid. The game has simple secret rules for transformations. 

Try to create a bullet point list of observations (labeled with detail analysis levels of high, med, low) and the hidden rules. Do not repeat the data results. Be concise.

Often the puzzles will create "groupify" blocks of numbers as a logical units 
which may require thinking of blocks of numbers as 'islands with holes' or 
similar object associations in thinking.

LAST STEP: provide a list of common utilities needed for the solution thats not already included: ${readFileSync(
  "./gen/header.txt",
  "utf8"
)}`;

export async function solvePuzzle(trainingFile) {
  const readFileSync = (await import("fs")).readFileSync;
  const trainingData = readFileSync(trainingFile, "utf8");

  const promptWithData = `${prompt}\n\n<DATA>\n${trainingData}`;
  console.log("Calling OpenAI with prompt:", promptWithData);
  const response = await callOpenAI(promptWithData);
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

  solvePuzzle(inputFileName).catch(console.error);
}

function run(cmd) {
  console.log(`Running command: ${cmd}`);
  return $`${cmd}`;
}
