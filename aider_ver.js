import { $ } from "bun";

// EXAMPLE usage of $ CLI calling
// const response = await fetch("https://example.com");
// await $`cat < ${response} | wc -c`; // returns 1256
export async function check() {
  const aider_ver = await $`aider --version`;
  // check if not installed
  if (aider_ver.code !== 0) {
    console.error(
      "Aider is not installed. Please install Aider to run this script."
    );
    process.exit(1);
  }
  // check if result is "aider 0.85.2" or later
  if (aider_ver.text().trim() < "0.85.2") {
    console.error("Please update Aider to version 0.85.2 or later.");
    process.exit(1);
  }
}
