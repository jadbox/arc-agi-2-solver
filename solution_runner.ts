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

interface SampleItem {
  input: number[][];
  output: number[][];
}

/**
 * Utility function to get items from either 'train' or 'test' key.
 * @param sample The parsed sample JSON object.
 * @param key The key to retrieve ('train' or 'test').
 * @returns An array of sample items.
 * @throws Error if the key is not found or the data is invalid.
 */
function getSampleItems(sample: any, key: "train" | "test"): SampleItem[] {
  if (!sample?.[key] || !Array.isArray(sample[key])) {
    throw new Error(`Sample JSON does not contain a valid '${key}' property.`);
  }
  // Validate each item in the array
  for (const item of sample[key]) {
    if (!item.input || !Array.isArray(item.input) || item.input.length === 0) {
      throw new Error(`Each '${key}' item must have a valid 'input' array.`);
    }
    if (
      !item.output ||
      !Array.isArray(item.output) ||
      item.output.length === 0
    ) {
      throw new Error(`Each '${key}' item must have a valid 'output' array.`);
    }
  }
  return sample[key] as SampleItem[];
}

type SolutionResult = {
  result: number[][];
  input: number[][];
  passed: boolean;
  answer: number[][];
};

// TRAIN
const trainItems = getSampleItems(parsedSample, "train");
let trainSolutions: SolutionResult[] = await Promise.all(
  trainItems.map(async (item) => {
    const _solution = await solution(item.input);
    const passed =
      JSON.stringify(_solution.result) === JSON.stringify(item.output);
    return { ..._solution, passed, answer: item.output };
  })
).catch((error) => {
  console.error("Error during training solution processing:", error);
  process.exit(1);
});

if (trainSolutions.length === 0) {
  console.error("❌ No training solutions found. Exiting.");
  process.exit(1);
}

const allTrainPassed = trainSolutions.every((s) => s.passed);
const failedTests = trainSolutions.filter((s) => !s.passed);
const passedTests = trainSolutions.filter((s) => s.passed);

// Run TEST
let testSolutions: SolutionResult[] = [];
let testsPassed = false;

if (!allTrainPassed) {
  console.log(
    `⚠️ Not all training tests passed for ${workingDir}. Skipping test data run.`
  );
  //console.log(trainSolutions.filter((s) => !s.passed));
  // Save a error file in workingDir called error.txt

  writeFileSync(
    path.join(workingDir, "error_train.json"),
    `${JSON.stringify({
      successCount: passedTests.length,
      failedCount: failedTests.length,
      failed: failedTests,
    })}`
  );

  console.log(`Error details saved to error_train.json in ${workingDir}`);

  console.warn(
    `❌ failed:${failedTests.length}, passed:${passedTests.length} for TRAINING samples. Please fix the issues before running test data.`
  );
  process.exit(2);
}

// If all training tests passed, proceed to test data
if (allTrainPassed) {
  console.log("🎉 All TRAINING tests passed! Running on test data...");
  const testItems = getSampleItems(parsedSample, "test");
  testSolutions = await Promise.all(
    testItems.map(async (item) => {
      const _solution = await solution(item.input);
      const passed =
        JSON.stringify(_solution.result) === JSON.stringify(item.output);
      return { ..._solution, passed, answer: item.output };
    })
  );

  testsPassed = testSolutions.every((s) => s.passed);
  console.log(`✅ All TEST solutions passed ${testSolutions.length}`);
}

const outputPath = path.join(workingDir, "solution_output.json");
const outData = JSON.stringify({
  train: {
    passed: allTrainPassed,
    solutions: trainSolutions,
  },
  test: {
    passed: testsPassed, // Only allPassed if train also passed
    solutions: testSolutions,
  },
  passed: allTrainPassed && testsPassed,
});
writeFileSync(outputPath, outData);

console.log(`✅ Test complete. Results saved to ${outputPath}`);
console.log(
  `Training results: ${allTrainPassed ? "🎉 All passed!" : "⚠️ Some failed."}`
);
console.log(
  `Test passed: ${testsPassed ? "🎉 All passed!" : "⚠️ Some failed."}`
);

// if (!allTrainPassed) {
//   console.error("\n❌ Some TESTS failed. Check the output file for details.");
//   let failedSolutions = trainSolutions.filter((s) => !s.passed);
//   console.warn(
//     "Failed training solutions:",
//     JSON.stringify(failedSolutions)
//       .replace(/],/g, "],\n")
//       .replace(/":/g, '":\n')
//   );
// } else
if (testSolutions.length > 0 && !testSolutions.every((s) => s.passed)) {
  console.error(
    "\n❌ Some test tests failed. Check the output file for details."
  );
  let failedSolutions = testSolutions.filter((s) => !s.passed);
  console.error(
    "Failed test solutions:\n",
    JSON.stringify(failedSolutions)
      .replace(/],/g, "],\n")
      .replace(/":/g, '":\n')
  );
  process.exit(3);
}
