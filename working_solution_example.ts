#!/usr/bin/env bun
// file working directory is ./working/
import { $ } from "bun";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

// Input is a 2D array of SINGLE digit numbers
function solution(input: number[][]) {
  return {
    result: [
      [1, 1, 1],
      [2, 2, 2],
    ],
    input: input,
  }; // Example output
}

try {
  const solution1 = await solution([[3], [3]]); // use actual INPUT_1 training input data as single digits
  const solution2 = await solution([[7], [7]]); // use actual INPUT_2 training input data as single digits

  const outputPath = path.join("./working", "training_run.txt");
  writeFileSync(
    outputPath,
    `<INPUT_1>${JSON.stringify(solution1.input)}\n<OUTPUT_1>\n${JSON.stringify(
      solution1.result
    )}
    \n\n<INPUT_2>${JSON.stringify(
      solution2.input
    )}\n<OUTPUT_2>\n${JSON.stringify(solution2.result)}\n`
  );

  console.log(`✅ Test complete. Results saved to ${outputPath}`);
} catch (error) {
  console.error("❌ An error occurred during the test run:", error);
  process.exit(1);
}
