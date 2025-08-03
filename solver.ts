#!/usr/bin/env bun
import { $, file } from "bun";
import * as aider_ver from "./aider_ver.js";
import { solvePuzzle } from "./analysis.js";
import { readFileSync, existsSync } from "fs";
import { stdin } from "process";
import path from "path";

// await aider_ver.check();
// Run the ASCII map generation script with a sample input file to populuate working directory
// This assumes you have a sample JSON file named 'sample.json' in the current directory
// Output folder has solution.txt, training.txt, and test.txt

import { mkdirSync } from "fs";

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

const sampleFileName = path.basename(argFile, ".json");
const workingDir = path.join("working", sampleFileName);

// Create the sample-specific working directory
mkdirSync(workingDir, { recursive: true });
console.log(`Created working directory: ${workingDir}`);

console.log(`Generating ASCII map from ${argFile}...`);

const endFile = path.join(workingDir, "solution_output.json");
if (existsSync(endFile)) {
  console.log(`Solution output already exists: ${endFile}`);
  const output = JSON.parse(readFileSync(endFile, "utf8"));
  const passed = !!output.passed || !!output.allPassed; // allPassed legacy

  if (!passed) {
    const hasNoTests =
      output.test &&
      output.test.solutions &&
      output.test.solutions.length === 0;

    if (hasNoTests) {
      console.warn(
        `!! No tests found in ${endFile}. Please ensure your sample JSON has 'test' data.`
      );
    } else if (output?.test?.solutions.length > 0) {
      console.warn(`!! Tests have failed: ${endFile}`);
      process.exit(0);
    }
  } else {
    console.log(`!! Solution already exists and passed: ${endFile}`);
    console.log("You can delete the working directory to regenerate.");
    process.exit(0);
  }
} else {
  console.log(`No existing solution output found: ${endFile}. Starting...`);
}

const ascii = await $.nothrow()`bun ./asciimap.js ${argFile} ${workingDir}`;
if (ascii.exitCode !== 0) {
  console.error(`Failed to generate ASCII map: ${ascii.stderr}`);
  process.exit(1);
}
console.log("ASCII map generated successfully.");

// copy argFile to working/sample.json
const sampleFilePath = path.join(workingDir, "sample.json"); // copy of the problem in working/
await $`cp ${argFile} ${sampleFilePath.toString()}`;

// skip this step of analysis.txt exists in ./working/
const analysisFile = path.join(workingDir, "analysis.txt");
let analysisExists = existsSync(analysisFile);
if (!analysisExists) {
  const trainingFile = path.join(workingDir, "training.txt");
  const analysis = await $`./analysis.ts ${trainingFile} ${workingDir}`;
  if (analysis.exitCode !== 0) {
    throw new Error(`Analysis failed: ${analysis.stderr}`);
  }
} else {
  console.warn(`SKIPPING: Analysis file already exists: ${analysisFile}`);
}
// old method const solution = await solvePuzzle(trainingFile);

const solutionFile = path.join(workingDir, "solution.ts");
// Gen solution is only needed if solution.ts does not exist or analysis.txt did not exist
if (!analysisExists || !existsSync(solutionFile)) {
  const gen_solution = await $.nothrow()`./gen_solution.ts ${workingDir}`;
  if (gen_solution.exitCode !== 0) {
    console.error(`Failed to generate solution: ${gen_solution.stderr}`);
    process.exit(1);
  }
} else {
  console.warn(`SKIPPING: Solution file already exists: ${solutionFile}`);
}

// Run the solution runner to test the solution
console.log("Running solution runner...");
var result = await $.nothrow()`bun ./solution_runner.ts ${workingDir}`;
console.log(
  "Finished running: bun ./solution_runner.ts exit_code:" + result.exitCode
);
if (result.exitCode === 2 || result.exitCode === 3) {
  // convert error into string
  // console.log("Did not pass: "); //, result.stderr.toString()
  process.exit(result.exitCode); // Exit if training or test solutions failed
  // Either training or test solutions failed, just move on
} else if (result.exitCode !== 0) {
  console.error(`Solution runner failed: ${result.stderr.toString()}`);
  process.exit(result.exitCode);
}
console.log("\nFinal result:", result.text().trim());
process.exit(0);
