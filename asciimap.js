#!/usr/bin/env bun
// ascii-mapper.js
// run with bun

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "fs";
import path from "path";

// Helper function to format 2D arrays as grid blocks
function formatGrid(grid) {
  return grid.map((row) => row.join("")).join("\n");
}

async function generateAsciiMap() {
  // Define the default input and output file names
  const defaultInputFileName = "data.json";
  const defaultWorkingDir = "working";
  const trainingFileName = "training.txt";
  const solutionFileName = "solution.txt";
  const testFileName = "test.txt";

  // Get command-line arguments.
  // process.argv[0] is 'bun'
  // process.argv[1] is the script path (e.g., 'ascii-mapper.js')
  // process.argv[2] would be the input file name
  // process.argv[3] would be the working directory
  const args = process.argv.slice(2);

  // Determine the input file name: use the first argument if provided, otherwise use the default.
  const inputFileName = args[0] || defaultInputFileName;
  const workingDir = args[1] || defaultWorkingDir;

  try {
    // Create working directory if it doesn't exist
    const workingDirPath = path.join(process.cwd(), workingDir);
    mkdirSync(workingDirPath, { recursive: true });
    console.log(`Ensured working directory exists: ${workingDirPath}`);

    // Construct the full path to the input file
    const inputFilePath = path.join(process.cwd(), inputFileName);

    console.log(`Attempting to read data from: ${inputFilePath}`);

    // Read the JSON data file
    const jsonData = readFileSync(inputFilePath, "utf8");
    const data = JSON.parse(jsonData);

    // Handle the structure where data has 'train' and 'test' properties
    let itemsToProcess = [];

    if (data.train && Array.isArray(data.train)) {
      itemsToProcess = itemsToProcess.concat(
        data.train.map((item) => ({ ...item, type: "train" }))
      );
    }

    if (data.test && Array.isArray(data.test)) {
      itemsToProcess = itemsToProcess.concat(
        data.test.map((item) => ({ ...item, type: "test" }))
      );
    }

    // If data is directly an array (fallback for other formats)
    if (Array.isArray(data)) {
      itemsToProcess = data;
    }

    // Separate training and test items
    const trainItems = itemsToProcess.filter((item) => item.type === "train");
    const testItems = itemsToProcess.filter((item) => item.type === "test");

    // Generate training.txt - only training data
    let trainingContent = "";
    trainItems.forEach((item, index) => {
      const inputLabel = `<INPUT_${index + 1}>`;
      const outputLabel = `<OUTPUT_${index + 1}>`;

      trainingContent += `${inputLabel}:\n${formatGrid(item.input)}\n`;
      trainingContent += `${outputLabel}:\n${formatGrid(item.output)}\n\n`;
    });

    // Generate solution.txt - test input/output pairs
    let solutionContent = "";
    testItems.forEach((item, index) => {
      const inputLabel = `<INPUT_${index + 1}>`;
      const outputLabel = `<OUTPUT_${index + 1}>`;

      solutionContent += `${inputLabel}:\n${formatGrid(item.input)}\n`;
      solutionContent += `${outputLabel}:\n${formatGrid(item.output)}\n\n`;
    });

    // Generate test.txt - only test inputs
    let testContent = "";
    testItems.forEach((item, index) => {
      const inputLabel = `<INPUT_${index + 1}>`;
      testContent += `${inputLabel}:\n${formatGrid(item.input)}\n\n`;
    });

    // Write all three files to working directory
    const trainingFilePath = path.join(workingDirPath, trainingFileName);
    const solutionFilePath = path.join(workingDirPath, solutionFileName);
    const testFilePath = path.join(workingDirPath, testFileName);

    writeFileSync(trainingFilePath, trainingContent, "utf8");
    // writeFileSync(solutionFilePath, solutionContent, "utf8");
    // writeFileSync(testFilePath, testContent, "utf8");

    console.log(`Successfully generated three files from ${inputFileName}:`);
    console.log(`- ${workingDir}/${trainingFileName}: Training data only`);
    console.log(`- ${workingDir}/${solutionFileName}: Test input/output pairs`);
    console.log(`- ${workingDir}/${testFileName}: Test inputs only`);
  } catch (error) {
    console.error(`Error generating ASCII map: ${error.message}`);
    // Provide more specific error messages for common issues
    if (error.code === "ENOENT") {
      console.error(`Error: The input file '${inputFileName}' was not found.`);
      console.error(
        `Please ensure '${inputFileName}' exists in the current directory or provide the correct path.`
      );
    } else if (error instanceof SyntaxError) {
      console.error(
        `Error: The input file '${inputFileName}' contains invalid JSON.`
      );
      console.error(`Please check the JSON syntax.`);
    }
    console.error(error); // Log the full error for debugging
  }
}

// Execute the function
generateAsciiMap();
