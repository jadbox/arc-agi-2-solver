## Brief overview
This document outlines development guidelines for ensuring code is robust, well-logged, and tested iteratively.

## Development workflow
- **Iterative Testing:** After implementing a feature or a fix, it should be tested. I will provide feedback and error logs if any issues arise.
- **Debugging from Logs:** Use the logs I provide to diagnose and fix bugs. The logs are the primary source of information for debugging.

## Coding best practices
- **Error Handling and Fallbacks:** Implement robust error handling. For features that might be unreliable (e.g., network requests, experimental APIs), include a fallback to a more stable alternative.
- **Informative Logging:** Add clear and descriptive logging to the code. Use it to indicate the status of operations (start, success, failure, fallback), which helps in monitoring and debugging. Emojis can be used to make logs more readable.
