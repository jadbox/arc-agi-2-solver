#!/usr/bin/env bun
// CWD is ./working/
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";

// Input is a 2D array of SINGLE digit numbers
// ONLY Modify this function to solve the problem
function solution(input: number[][]) {
  return {
    result: [
      [1, 1],
      [2, 2],
    ],
    input: input,
  }; // Example output
}

// This is static test setup, do not modify for problem solving
const sample = readFileSync(path.join("./working", "sample.json"), "utf8");
const parsedSample = JSON.parse(sample);
if (
  !parsedSample?.train ||
  !Array.isArray(parsedSample.train) ||
  !parsedSample.train[0].input
) {
  throw new Error("Sample JSON does not contain 'train' property.");
}

let solutions = [];
for (const item of parsedSample.train) {
  if (!item.input || !Array.isArray(item.input) || item.input.length === 0) {
    throw new Error("Each training item must have a valid 'input' array.");
  }
  const itemInput = item.input as number[][];
  const _solution = await solution(itemInput);
  const passed =
    JSON.stringify(_solution.result) === JSON.stringify(item.output);
  solutions.push({ ..._solution, passed, answer: item.output });
}

const outputPath = path.join("./working", "solution_output.json");
const allPassed = solutions.every((s) => s.passed);
const outData = JSON.stringify({ allPassed, solutions }); // , null, 2
writeFileSync(outputPath, outData);

console.log(`✅ Test complete. Results saved to ${outputPath}`);
console.log(allPassed ? "🎉 All tests passed!" : "⚠️ Some tests failed.");
