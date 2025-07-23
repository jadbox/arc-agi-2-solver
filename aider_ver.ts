import { $ } from "bun";

// EXAMPLE usage of $ CLI calling
// const response = await fetch("https://example.com");
// await $`cat < ${response} | wc -c`; // returns 1256
export async function check() {
  const aider_ver = await $`aider --version`;
  // check if not installed
  if (aider_ver.exitCode !== 0) {
    console.error(
      "Aider is not installed. Please install Aider to run this script."
    );
    process.exit(1);
  }

  const t = aider_ver?.text();
  const ver = t.trim().split(" ")[1];
  if (!aider_ver || !t || !ver) {
    throw new Error("Aider version command did not return text.");
  }
  // check if result is "aider 0.85.2" or later
  console.log("Aider version:", ver);
  if (ver < "0.85.2") {
    console.error("Please update Aider to version 0.85.2 or later.");
    process.exit(1);
  }
}
