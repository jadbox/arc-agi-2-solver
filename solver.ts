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
  const output = JSON.parse(readFileSync(endFile, "utf8"));
  const passed = output.passed;

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
}

await run`bun ./asciimap.js ${argFile} ${workingDir}`;

// copy argFile to working/sample.json
const sampleFilePath = path.join(workingDir, "sample.json"); // copy of the problem in working/
await run`cp ${argFile} ${sampleFilePath.toString()}`;

// skip this step of analysis.txt exists in ./working/
const analysisFile = path.join(workingDir, "analysis.txt");
if (!existsSync(analysisFile)) {
  const trainingFile = path.join(workingDir, "training.txt");
  const analysis = await run`./analysis.ts ${trainingFile} ${workingDir}`;
  if (analysis.exitCode !== 0) {
    throw new Error(`Analysis failed: ${analysis.stderr}`);
  }
} else {
  console.warn(`SKIPPING: Analysis file already exists: ${analysisFile}`);
}
// old method const solution = await solvePuzzle(trainingFile);

const solutionFile = path.join(workingDir, "solution.ts");
if (!existsSync(solutionFile)) {
  const gen_solution = await run`./gen_solution.ts ${workingDir}`;
  if (gen_solution.exitCode !== 0) {
    throw new Error(`Failed to generate solution: ${gen_solution.stderr}`);
    process.exit(1);
  }
} else {
  console.warn(`SKIPPING: Solution file already exists: ${solutionFile}`);
}

// Run the solution runner to test the solution
console.log("Running solution runner...");
const result = await run`bun ./solution_runner.ts ${workingDir}`;
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
