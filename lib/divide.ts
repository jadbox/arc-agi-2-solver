/*
File input:
<INPUT_1>:
00042000920000
44042909020000
40442099021101
04442090021111
<OUTPUT_1>:
0004
4494
4944
1444

<INPUT_2>:
44442909020001
44002990021000
40442000920101
00002009021010
<OUTPUT_2>:
4444
4400
4144
1090

we need to parse the above into a number[][][] format
*/
export function parseInput(input: string): string[][][] {
  // use regex to split the input into sections of just INPUT_[X] fields and stop before <OUTPUT_[X]> fields
  const inputSections = input.match(/<INPUT_\d+>:(.*?)<OUTPUT_\d+>/gs);
  if (!inputSections) {
    throw new Error("No valid input sections found in the provided input.");
  }
  return inputSections.map((section) => {
    const grid = section
      .replace(/<INPUT_\d+>:/, "")
      .replace(/<OUTPUT_\d+>/, "") // Remove the OUTPUT tag
      .trim()
      .split("\n")
      .map((line) => line.split(""));
    return grid;
  }); // .map(Number) not needed since we are dealing with strings
}

export function findGridDividers(grid: string[][][]) {
  // console.log("Finding grid dividers in:", grid);
  const r = grid.map((g) => _findGridDividers(g));
  if (!r[0]) throw new Error("Error finding grid dividers");

  if (r[0].divider) {
    // find only COMMON indexes in each grid, assume in same direction
    const indexes = r.reduce((acc, curr) => {
      return acc.filter((index) => curr.indexes.includes(index));
    }, r[0].indexes.slice()); // start with the first grid's indexes

    return {
      direction: r[0].direction,

      indexes: indexes,

      divider: true,
    };
  } else return r[0];
}

export function _findGridDividers(grid: string[][]): {
  direction: string;
  indexes: number[];
  divider: boolean;
} {
  if (grid.length === 0 || grid[0].length === 0) {
    return { direction: "", indexes: [], divider: false };
  }

  const rows = grid.length;
  const cols = grid[0].length;

  // Find vertical column separators
  const colSeparators: number[] = [];

  for (let col = 0; col < cols; col++) {
    if (grid[0] === undefined || grid[0][col] === undefined) {
      continue;
    }
    const firstValue: string = grid[0][col] as string; // Type assertion
    let isSeparator = true;

    for (let row = 1; row < rows; row++) {
      if (
        grid[row] === undefined ||
        grid[row][col] === undefined ||
        grid[row][col] !== firstValue
      ) {
        isSeparator = false;
        break;
      }
    }

    if (isSeparator) {
      colSeparators.push(col);
    }
  }

  // If we found column separators, return them
  if (colSeparators.length > 0) {
    return {
      direction: "col",
      indexes: colSeparators,
      divider: true,
    };
  }

  // Check for horizontal row separators
  const rowSeparators: number[] = [];

  for (let row = 0; row < rows; row++) {
    if (grid[row] === undefined || grid[row][0] === undefined) {
      continue;
    }
    const firstValue: string = grid[row][0] as string; // Type assertion
    let isSeparator = true;

    for (let col = 1; col < cols; col++) {
      if (grid[row][col] === undefined || grid[row][col] !== firstValue) {
        isSeparator = false;
        break;
      }
    }

    if (isSeparator) {
      rowSeparators.push(row);
    }
  }

  // If we found row separators, return them
  if (rowSeparators.length > 0) {
    return {
      direction: "row",
      indexes: rowSeparators,
      divider: true,
    };
  }

  // No separators found
  return { direction: "", indexes: [], divider: false };
}
