# JAD: JSON ARC Dataset Solver

This project is a command-line tool for solving ARC (Abstraction and Reasoning Corpus) puzzles provided in a JSON format. It analyzes training examples and attempts to find a solution for the test input.

This project employs two main strategies:
1. **ASCII Map Generation**: It generates an ASCII representation of the puzzle to visualize the structure and relationships within the data.
2. **Self-Executing Bun Scripts**: It generates CLI self-executing bun scripts in a subfolder with files named /gen/[[utility-name]].js and a /gen/index.js that exports each function with a one line description of what it does. This approach allows for modular and reusable code, making it easier to maintain and extend the functionality of the solver.

## How to Use

To solve a puzzle, run the `solver.js` script from your terminal. You need to provide a sample JSON file containing the puzzle data.

```bash
bun run solver.js
```

The script will then:
1.  Generate an ASCII map of the puzzle in the `working` directory.
2.  Analyze the training examples.
3.  Attempt to find a solution and save it to `working/solution.txt`.

## Project Structure

The project is organized into the following files and directories:

-   `solver.js`: The main entry point for the CLI tool.
-   `lib/`: Contains helper modules, such as the OpenAI API wrapper.
-   `analysis.js`: The core logic for analyzing the puzzle and finding a solution.
-   `asciimap.js`: A script for generating an ASCII representation of the puzzle.
-   `working/`: A directory for storing intermediate files, such as the ASCII map and the final solution.

## Libraries

This project uses the following libraries:

-   [Bun](https://bun.sh): A fast all-in-one JavaScript runtime.
-   [OpenAI](https://www.npmjs.com/package/openai): The official Node.js library for the OpenAI API.
