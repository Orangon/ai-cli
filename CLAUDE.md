# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`@wu-cl/ai-cli` (`ai`) — a CLI tool that translates natural-language instructions into shell commands using LLMs API. Built with [oclif](https://oclif.io/) and TypeScript.

Requires `OPENAI_API_KEY` in the environment (or a `.env` file at project root).

## Commands

```bash
yarn dev          # Run without building (uses ts-node)
yarn build        # Compile TypeScript → dist/
yarn lint         # ESLint on .ts files
yarn prepack      # build + oclif manifest + oclif readme (pre-publish)
```

Run the CLI in dev mode:
```bash
./bin/dev clone react from github
```

No tests exist yet despite Mocha being configured (`.mocharc.json`).

## Architecture

Four modules under `src/`, each with a single `index.ts`:

- **`ui/`** — oclif `DefaultCommand`; joins `argv` into a string and calls `translate()`
- **`translator/`** — orchestrates prompt generation + OpenAI call; parses the response (strips `>` prefix, detects `DANGEROUS` suffix for the `isDangerous` flag)
- **`prompt/`** — builds the `ChatCompletionRequestMessage[]` array; `template.ts` parses `prompt-template/default.md` into role-based messages and substitutes `${OS}` with the actual platform
- **`open-ai/`** — thin wrapper around `openai` SDK v4 with configurable base URL and model

Data flow: `bin/run` → `DefaultCommand.run()` → `translate()` → `generatePromptMessages()` + `createChatCompletion()` → prints result in cyan; red `CAUTION` banner if `isDangerous`.

## Prompt Template

`prompt-template/default.md` drives GPT behavior. Section headings (`# SYSTEM`, `# USER`, `# ASSISTANT`) map to chat roles. Rules baked into the template:
- Output only the command prefixed with `>`
- Output `UNKNOWN` if no translation is possible
- Append `DANGEROUS` on a new line for destructive commands

**Known bug:** the last example in the template reads `DANGERS` instead of `DANGEROUS`, so `isDangerous` detection silently fails for that example row.

## Tooling Notes

- TypeScript strict mode, compiled to CommonJS (`dist/`), targeting ES2019
- Prettier: single quotes, 120-char line width, import sorting via `@trivago/prettier-plugin-sort-imports`
- OpenAI SDK is **v4** — supports custom `OPENAI_BASE_URL` and `OPENAI_MODEL` via environment variables
