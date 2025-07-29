#!/usr/bin/env bun
import { $, file } from "bun";
import * as aider_ver from "./aider_ver.js";
import { solvePuzzle } from "./analysis.js";
import { readFileSync, existsSync } from "fs";
import { stdin } from "process";
import path from "path";

await aider_ver.check();
// Run the ASCII map generation script with a sample input file to populuate working directory
// This assumes you have a sample JSON file named 'sample.json' in the current directory
// Output folder has solution.txt, training.txt, and test.txt

let argFile = "sample.json";
// check Bun parameter passed in for file
if (process.argv.length > 2) {
  argFile = process.argv[2] as string;
  if (argFile) {
    console.log(`Using provided file: ${argFile}`);
    if (!argFile.endsWith(".json")) {
      throw new Error("Provided file must be a JSON file.");
    }
  }
}

console.log(`Generating ASCII map from ${argFile}...`);
// press a key to conine

await run`bun ./asciimap.js ${argFile}`;

// copy argFile to working/sample.json
const sampleFilePath = path.join("working", "sample.json"); // copy of the problem in working/
await run`cp ${argFile} ${sampleFilePath.toString()}`;

// skip this step of analysis.txt exists in ./working/
const analysisFile = path.join("working", "analysis.txt");
// console.log(`Analysis file path: ${analysisFile}`);
// console.log(`Checking if analysis file exists...`, existsSync(analysisFile));
// process.exit(0); // Skip analysis step for now
if (!existsSync(analysisFile)) {
  const trainingFile = path.join("working", "training.txt");
  const analysis = await run`./analysis.ts ${trainingFile}`;
  if (analysis.exitCode !== 0) {
    throw new Error(`Analysis failed: ${analysis.stderr}`);
  }
} else {
  console.warn(`SKIPPING: Analysis file already exists: ${analysisFile}`);
}
// old method const solution = await solvePuzzle(trainingFile);

const gen_solution = await run`./gen_solution.ts`;
if (gen_solution.exitCode !== 0) {
  throw new Error(`Failed to generate solution: ${gen_solution.stderr}`);
}

const result = await run`bun ./solution_runner.ts`;
if (result.exitCode !== 0) {
  throw new Error(`Solution runner failed: ${result.stderr}`);
}
console.log("\nFinal result:", result.text().trim());

// readFileSync("./working/training_run.txt", "utf8");
// const trainingRun = readFileSync("./working/training_run.txt", "utf8");
// console.log("\n\nTraining training_run.txt output:\n", trainingRun);

async function run(strings: TemplateStringsArray, ...values: any[]) {
  console.log(`Running command: ${strings.join(" ")} with ${values.join(" ")}`);
  const c = await $(strings, ...values);
  if (c.exitCode !== 0) {
    throw new Error(`Command failed with code ${c.exitCode}: ${c.stderr}`);
  }
  // console.log(`Command output: ${c.text().trim()}`);
  return c;
}
