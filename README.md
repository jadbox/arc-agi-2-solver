# ARC-AGI-2 TypeScript Problem Solver

This project is a robust TypeScript framework designed to solve ARC (Abstraction and Reasoning Corpus) puzzles, specifically those from the ARC-AGI-2 dataset. It provides a command-line interface (CLI) tool that analyzes training examples from JSON-formatted puzzles and attempts to generate a solution for the corresponding test input. The framework supports integration with multiple different AI models, allowing for flexible and powerful problem-solving approaches.

## Core Strategies

This framework employs advanced strategies to tackle ARC puzzles:

1.  **ASCII Map Generation**: Visualizes the puzzle's structure and relationships by generating an ASCII representation of the input and output grids. This aids in understanding spatial patterns and transformations.
2.  **Self-Executing Bun Scripts**: Generates modular and reusable CLI self-executing Bun scripts. These scripts are organized in a `gen/` subfolder, with individual utility files (e.g., `gen/[[utility-name]].ts`) and a `gen/index.ts` that exports each function with a concise description. This approach enhances maintainability and extensibility.

## How to Use

To begin solving puzzles, follow these steps:

### Step 1: Prepare the Data

Copy the `data/` directory from the ARC-AGI-02 repository (https://github.com/arcprize/ARC-AGI-2) into the root of this project. This directory should contain the JSON puzzle files.

### Step 2: Run the Solver

You can run the full evaluation across all puzzles or target a specific puzzle:

*   **Run Full ARC Evaluation**: To process all puzzles listed in `data/evaluation.txt`:
    ```bash
    bun run arc.ts data/evaluation.txt
    ```

*   **Run a Specific Puzzle**: To solve a single puzzle (e.g., `ff001.json`):
    ```bash
    bun run solver.ts data/evaluation/ff001.json
    ```

Upon execution, the script will perform the following actions:
1.  Generate an ASCII map of the puzzle in the `working/` directory.
2.  Analyze the provided training examples.
3.  Attempt to find a solution and save it to `working/solution.ts`.

### Understanding `analysis.ts`

`analysis.ts` contains the core logic for analyzing the puzzle data and deriving a solution. While it is a critical component of the framework, it is not intended to be run directly as a standalone script. Its functionalities are integrated and orchestrated by `arc.ts` and `solver.ts`.

## AI Model Configuration

This framework supports various AI models for solving ARC puzzles. You can switch between models by setting specific environment variables.

The `lib/openai.ts` file configures the AI model used by the solver. The following models are supported:

*   **Cerebras**:
    *   Set `CEREBRAS_API_KEY` to your Cerebras API key.
    *   The default model is `qwen-3-235b-a22b-instruct-2507`.

*   **Anthropic**:
    *   Set `ANTHROPIC_API_KEY` to your Anthropic API key.
    *   The default model is `claude-sonnet-4-20250514`.

*   **Deepseek**:
    *   Set `DEEPSEEK_API_KEY` to your Deepseek API key.
    *   The default model is `deepseek-chat`.

*   **Gemini**:
    *   Set `GEMINI_API_KEY` to your Gemini API key.
    *   The default model is `gemini-2.5-flash`.

*   **OpenRouter**:
    *   Set `OPENROUTER_API_KEY` to your OpenRouter API key.
    *   You can specify the model by setting the `aimodel` environment variable to one of the keys defined in `OR_ROUTER_MODELS` within `lib/openai.ts` (e.g., `K2`, `Qwen3Coder`, `Qwen3`, `Qwen3Think`, `glm`, `glm_air`, `chatgpt`, `Qwen3Nitro`). If `aimodel` is not set, it defaults to `Qwen3Think`.

**Example: Setting Environment Variables (Bash/Zsh)**

```bash
# For Cerebras
export CEREBRAS_API_KEY="your_cerebras_api_key_here"
bun run solver.ts data/evaluation/ff001.json

# For OpenRouter with a specific model
export OPENROUTER_API_KEY="your_openrouter_api_key_here"
export aimodel="Qwen3Coder"
bun run solver.ts data/evaluation/ff001.json
```

## Project Structure

The project is organized into the following files and directories:

*   `arc.ts`: Script for running full ARC evaluation on multiple puzzles.
*   `solver.ts`: The main entry point for solving individual ARC puzzles via the CLI.
*   `analysis.ts`: Contains the core logic for puzzle analysis and solution generation.
*   `asciimap.js`: A utility script for generating ASCII representations of puzzle grids.
*   `lib/`: Contains helper modules, including the AI API wrappers (`openai.ts`).
*   `commons/`: Common utility functions and shared resources.
*   `tests/`: Contains project tests.
*   `working/`: A directory for storing intermediate and output files.

Output files within the `working/` directory are structured as follows:

*   `working/arc_results.json`: A summary of results for all processed puzzles during a full evaluation.
*   `working/[[challenge-id]]/solution.ts`: The generated TypeScript solution code for a specific puzzle.
*   `working/[[challenge-id]]/analysis.txt`: A text representation of the solution analysis for a specific puzzle.
*   `working/[[challenge-id]]/solution_output.json`: Results of running the generated solution code against the test data.

## Libraries

This project utilizes the following key libraries:

*   [Bun](https://bun.sh): A fast all-in-one JavaScript runtime, used for executing scripts and managing dependencies.
*   [OpenAI](https://www.npmjs.com/package/openai): The official Node.js library for the OpenAI API, used as a client for various compatible AI model APIs (e.g., Cerebras, Anthropic, Deepseek, Gemini, OpenRouter).
