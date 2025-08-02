## Brief overview
This document outlines guidelines for executing tests within the project, specifically focusing on avoiding time-consuming automated runs.

## Test execution
- **Avoid long-running tests:** Do not automatically run `arc.ts` or `solver.ts` as part of automated testing or verification steps. These tests are time-consuming and must be executed manually when required.
