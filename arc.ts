#!/usr/bin/env bun
import { $, file } from "bun";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { cpus } from "os";

interface ArcResults {
  successes: number;
  fails: number;
  success_dir: string[];
  fail_dir: string[];
}

const ARC_RESULTS_FILE = path.join("working", "arc_results.json");

// Function to load existing results or initialize new ones
function loadArcResults(): ArcResults {
  if (existsSync(ARC_RESULTS_FILE)) {
    try {
      const content = readFileSync(ARC_RESULTS_FILE, "utf8");
      return JSON.parse(content);
    } catch (error: any) {
      console.error(
        `⚠️ Error reading ${ARC_RESULTS_FILE}: ${error.message}. Initializing new results.`
      );
      return { successes: 0, fails: 0, success_dir: [], fail_dir: [] };
    }
  }
  return { successes: 0, fails: 0, success_dir: [], fail_dir: [] };
}

// Function to save results
function saveArcResults(results: ArcResults) {
  mkdirSync(path.dirname(ARC_RESULTS_FILE), { recursive: true }); // Ensure working directory exists
  writeFileSync(ARC_RESULTS_FILE, JSON.stringify(results, null, 2), "utf8");
}

// Function to run a single solver instance
async function runSolver(
  filename: string
): Promise<{ filename: string; success: boolean; message?: string }> {
  const fullPath = path.join("data", "evaluation", `${filename}.json`);
  console.log(`✨ Processing ${fullPath}...`);
  try {
    const { exitCode, stderr, stdout } = await $`bun ./solver.ts ${fullPath}`;
    if (exitCode !== 0) {
      console.error(`❌ Solver failed for ${filename}: ${stderr.toString()}`);
      // Give an error as the code IS NOT THROWING AN ERROR
      process.exit(1); // return { filename, success: false, message: stderr.toString() };
    }
    console.log(`✅ Successfully processed ${filename}`);
    return { filename, success: true, message: stdout.toString() };
  } catch (error: any) {
    console.error(
      `💥 Error processing ${filename}: ${(error as Error).message}`
    );
    process.exit(1);
    // return { filename, success: false, message: (error as Error).message };
  }
}

async function main() {
  const evaluationFilePath = path.join("data", "evaluation.txt");
  if (!existsSync(evaluationFilePath)) {
    console.error(
      `Error: ${evaluationFilePath} not found. Please be sure to clone ARC-AGI-2's data folder here.`
    );
    process.exit(1);
  }

  const filenames = readFileSync(evaluationFilePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const threads = parseInt(process.env.THREADS || "1", 10);
  const resumeMode = process.env.RESUME === "true";

  let arcResults = loadArcResults();

  console.log(`\n🚀 Starting ARC puzzle evaluation.`);
  console.log(`Total puzzles: ${filenames.length}`);
  console.log(
    `Processing mode: ${
      threads > 1 ? `Parallel (THREADS=${threads})` : "Sequential"
    }`
  );
  console.log(`Resume mode: ${resumeMode ? "Enabled" : "Disabled"}`);
  console.log(
    `Initial results: Successes: ${arcResults.successes}, Fails: ${arcResults.fails}`
  );

  const results: { filename: string; success: boolean; message?: string }[] =
    [];
  let processedCount = 0;
  let skippedCount = 0;

  if (threads <= 1) {
    // Sequential processing
    for (const filename of filenames) {
      const workingDirForFile = path.join("working", filename);
      if (resumeMode && existsSync(workingDirForFile)) {
        console.log(
          `⏭️ Skipping ${filename} (already processed in resume mode).`
        );
        skippedCount++;
        results.push({
          filename,
          success: true,
          message: "Skipped (already processed)",
        });
        // Also update arcResults if skipped, assuming skipped means success
        if (!arcResults.success_dir.includes(filename)) {
          arcResults.successes++;
          arcResults.success_dir.push(filename);
        }
        saveArcResults(arcResults);
        continue;
      }
      const result = await runSolver(filename);
      results.push(result);
      processedCount++;

      if (result.success) {
        arcResults.successes++;
        arcResults.success_dir.push(filename);
      } else {
        arcResults.fails++;
        arcResults.fail_dir.push(filename);
      }
      saveArcResults(arcResults); // Save after each run
    }
  } else {
    // Parallel processing
    const allPromises: Promise<any>[] = [];
    for (const filename of filenames) {
      const workingDirForFile = path.join("working", filename);
      if (resumeMode && existsSync(workingDirForFile)) {
        console.log(
          `⏭️ Skipping ${filename} (already processed in resume mode).`
        );
        skippedCount++;
        results.push({
          filename,
          success: true,
          message: "Skipped (already processed)",
        });
        // Also update arcResults if skipped, assuming skipped means success
        if (!arcResults.success_dir.includes(filename)) {
          arcResults.successes++;
          arcResults.success_dir.push(filename);
        }
        continue;
      }
      allPromises.push(runSolver(filename));
    }

    // Process in batches
    for (let i = 0; i < allPromises.length; i += threads) {
      const batch = allPromises.slice(i, i + threads);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      processedCount += batchResults.length;

      // Update arcResults for the batch
      batchResults.forEach((result) => {
        if (result.success) {
          arcResults.successes++;
          arcResults.success_dir.push(result.filename);
        } else {
          arcResults.fails++;
          arcResults.fail_dir.push(result.filename);
        }
      });
      saveArcResults(arcResults); // Save after each batch
    }
  }

  console.log(`\n--- Evaluation Summary ---`);
  console.log(`Total puzzles: ${filenames.length}`);
  console.log(`Processed: ${processedCount}`);
  console.log(`Skipped (resume mode): ${skippedCount}`);
  console.log(
    `Final results: Successes: ${arcResults.successes}, Fails: ${arcResults.fails}`
  );

  if (arcResults.fails > 0) {
    console.error(`\n❌ Some puzzles failed:`);
    arcResults.fail_dir.forEach((filename) => {
      const failedResult = results.find(
        (r) => r.filename === filename && !r.success
      );
      console.error(
        `- ${filename}: ${failedResult?.message || "Unknown error"}`
      );
    });
    process.exit(1);
  } else {
    console.log(`\n🎉 All processed puzzles completed successfully!`);
  }
}

if (import.meta.main) {
  main();
}
