#!/usr/bin/env bun
import { $ } from "bun";
import * as aider_ver from "./aider_ver.js";
import { solvePuzzle } from "./analysis.js";

await aider_ver.check();
// Run the ASCII map generation script with a sample input file to populuate working directory
// This assumes you have a sample JSON file named 'sample.json' in the current directory
// Output folder has solution.txt, training.txt, and test.txt
await run(`bun run asciimap.js sample.json`);

const trainingFile = "working/training.txt";
await run(`bun run analysis.js ${trainingFile}`);
// old method const solution = await solvePuzzle(trainingFile);

await run(`bun run gen_utility.ts`);

const result = await run(`bun ./working/solution.ts`);
console.log("Final result:", result.text().trim());

async function run(cmd) {
  console.log(`Running command: ${cmd}`);
  const c = await $`${cmd}`;
  if (c.code !== 0) {
    throw new Error(`Command failed with code ${c.code}: ${c.stderr}`);
  }
  // console.log(`Command output: ${c.text().trim()}`);
  return c;
}
