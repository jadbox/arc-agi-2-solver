#!/usr/bin/env bun
import { $ } from "bun";

export default function repeatChars(str: string, count: number): string {
  return str.repeat(count);
}

// Script takes two arguments: a string and a number
// if (import.meta.main) {
//   const args = process.argv.slice(2);

//   const inputName = args[0] || "abc";

//   const result = repeatChars(inputName, Number.parseInt(args[1] || "3"));
//   console.log(result);
// }
