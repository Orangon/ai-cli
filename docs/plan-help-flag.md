# Plan: Add --help / -h Support and Environment Variable Docs

## Context

Currently `DefaultCommand` has `strict = false` so all arguments (including `-h`) are passed to the translator as raw input. `--help` works via `@oclif/plugin-help` but shows minimal output because the command has no `description`, `flags`, or `args` defined.

## TODO

- [x] 1. Add `summary`, `description`, and `usage` static properties to `DefaultCommand` in `src/ui/index.ts`
- [x] 2. Intercept `-h` and `--help` in `argv` before translation: detect them early and show help output
- [x] 3. Detect empty input (no arguments or whitespace-only): show help instead of calling OpenAI API
- [x] 4. Enhance the help output to include environment variable configuration docs (OPENAI_API_KEY_CLI, OPENAI_BASE_URL_CLI, OPENAI_MODEL_CLI) and usage examples
- [x] 5. Update `README.md` to reflect the new `--help` / `-h` support and empty-input behavior

## Acceptance Criteria

- `ai --help` and `ai -h` both display: usage, description, environment variables table, and usage examples
- `ai` (no arguments) shows the same help output as `ai --help`
- `ai "some natural language input"` still works as before (no regression)
- `ai -h` and `ai` (empty) do NOT call the OpenAI API
- Help output clearly shows all three env vars: OPENAI_API_KEY_CLI (required), OPENAI_BASE_URL_CLI (optional), OPENAI_MODEL_CLI (optional)
