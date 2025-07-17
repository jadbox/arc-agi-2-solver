#!/usr/bin/env bun
// file working directory is ./working/
import { $ } from "bun";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

async function solution(input: string[]): Promise<string> {
  return "";
}

try {
  const solution1 = await solution(["25", "3"]); // use actual INPUT_1 training input data
  const solution2 = await solution(["84", "33"]); // use actual INPUT_2 training input data

  const outputPath = path.join("./working", "training_run.txt");
  writeFileSync(
    outputPath,
    `Solution 1: ${solution1}\nSolution 2: ${solution2}\n`
  );

  console.log(`✅ Test complete. Results saved to ${outputPath}`);
} catch (error) {
  console.error("❌ An error occurred during the test run:", error);
  process.exit(1);
}
