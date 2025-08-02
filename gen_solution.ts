#!/usr/bin/env bun
import { $ } from "bun";
import { makePrompt } from "./gen_prompt.ts";
import { writeFileSync, readFileSync, existsSync } from "fs";
import path from "path";
import { callOpenAI } from "./lib/openai";

export async function main() {
  const args = process.argv.slice(2);
  const workingDir = args[0] || "working"; // Get working directory from arguments

  console.log(`🚀 Starting solution generation for ${workingDir}...`);

  try {
    // Generate prompt using the makePrompt function from gen_utility.ts
    console.log("📝 Generating prompt from analysis...");
    const prompt = await makePrompt(workingDir);
    console.log("✅ Prompt generated successfully.");

    // Call Claude CLI with the generated prompt
    const result = await callOpenAI(prompt); // await callClaudeCLI(prompt);

    // Extract solution from the result
    let solution = result.split("<SOLUTION>")[1]?.trim();
    // remove </SOLUTION>.*
    solution = solution?.replace(/<\/SOLUTION>.*$/, "").trim();

    // also remove typescript``` .. ``` code
    // Extract content between triple backticks with optional "typescript" after them
    const codeBlockMatch = solution?.match(
      /```(?:typescript)?\s*([\s\S]*?)\s*```/
    );
    if (codeBlockMatch && codeBlockMatch[1]) {
      solution = codeBlockMatch[1].trim();
    }

    if (solution) {
      const solutionPath = path.join(process.cwd(), workingDir, "solution.ts");
      writeFileSync(solutionPath, solution);
      console.log(`✅ Solution generated and saved to ${solutionPath}`);
      console.log("🎉 Process completed successfully!");
    } else {
      console.error("❌ No solution marker found in Claude response.");
      console.log("📄 Full response:", result);

      // Fallback: save the entire response if no solution marker found
      // const solutionPath = path.join(process.cwd(), workingDir, "solution.ts");
      // writeFileSync(solutionPath, result);

      // console.log(`⚠️  Saved full response as fallback to ${solutionPath}`);

      // Run it with bun
      console.log("🔄 Attempting to run the full response as a script...");
      await $`bun solution_runner.ts ${workingDir}`.then(async (x) => {
        console.log("✅ Script executed successfully with output:", x.stdout);
        // run cat working/training_run.txt
        // await $`cat working/training_run.txt`.then((y) => {
        //   console.log("📄 training_run.txt output:", y.stdout);
        // });
      });

      console.log(`View log: cat ${workingDir}/training_run.txt`);
    }
  } catch (error) {
    console.error("💥 Fatal error during solution generation:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
