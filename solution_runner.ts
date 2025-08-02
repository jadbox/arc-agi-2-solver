#!/usr/bin/env bun
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";

// First half of file comes from working_solution_example.ts
// This is static test setup, do not modify for problem solving

const args = process.argv.slice(2);
const workingDir = args[0] || "working"; // Get working directory from arguments

// Dynamically import the solution from the specified working directory
const solutionModulePath = path.join(process.cwd(), workingDir, "solution.ts");
const { solution } = await import(solutionModulePath);

const sample = readFileSync(path.join(workingDir, "sample.json"), "utf8");
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

const outputPath = path.join(workingDir, "solution_output.json");
const allPassed = solutions.every((s) => s.passed);
const outData = JSON.stringify({ allPassed, solutions }); // , null, 2
writeFileSync(outputPath, outData);

console.log(`✅ Test complete. Results saved to ${outputPath}`);
console.log(allPassed ? "🎉 All tests passed!" : "⚠️ Some tests failed.");

if (!allPassed) {
  console.error("❌ Some tests failed. Check the output file for details.");
  let failedSolutions = solutions.filter((s) => !s.passed);

  console.error(
    "Failed solutions:",
    JSON.stringify(failedSolutions)
      .replace(/],/g, "],\n")
      .replace(/":/g, '":\n')
  );
}
