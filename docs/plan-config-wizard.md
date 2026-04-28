# Plan: Guided Environment Variable Configuration Wizard

## Context

Currently users must manually set `OPENAI_API_KEY_CLI`, `OPENAI_BASE_URL_CLI`, and `OPENAI_MODEL_CLI` via shell profiles or `.env` files. This plan adds an interactive setup wizard triggered on first run, and a `--config` flag for managing existing config.

## TODO

- [ ] 1. Create `src/config/index.ts` — config management module
  - `getConfigPath()` → returns `~/.ai-cli/.env`
  - `loadConfig()` → reads `~/.ai-cli/.env` with dotenv and populates `process.env`
  - `saveConfig(vars: Record<string, string>)` → writes key=value pairs to `~/.ai-cli/.env`
  - `isConfigured()` → checks if `OPENAI_API_KEY_CLI` is set in `process.env`
  - `maskKey(key: string)` → returns masked version for display (e.g. `sk-****5678`)
  - Create `~/.ai-cli/` directory if it doesn't exist

- [ ] 2. Add `setupWizard()` to `src/config/index.ts` — guided first-time setup
  - Welcome message explaining what's needed
  - Prompt for API key (required, validate non-empty)
  - Prompt for base URL (optional, Enter to skip)
  - Prompt for model name (optional, Enter to skip, show default)
  - Save to `~/.ai-cli/.env`
  - Show success message with config file path

- [ ] 3. Add `configManager()` to `src/config/index.ts` — interactive config management
  - Display current values (API key masked)
  - Menu: update a value / clear an optional value / exit
  - Update: select which var, enter new value, save
  - Clear: select optional var (BASE_URL or MODEL only), remove from file, save
  - Exit: quit config manager

- [ ] 4. Make OpenAI client lazy-init in `src/open-ai/index.ts`
  - Change module-scope `new OpenAI(...)` to a `getClient()` function that creates on first call
  - This ensures config wizard runs before client reads env vars

- [ ] 5. Update `src/ui/index.ts` — add first-run detection and `--config` handling
  - In `run()`, before any translation, call `loadConfig()` to load `~/.ai-cli/.env`
  - Detect `--config` in argv → run `configManager()`, then exit
  - If `OPENAI_API_KEY_CLI` not set → run `setupWizard()`, then proceed with original input
  - Existing `--help` / `-h` / empty-input logic stays as-is

- [ ] 6. Update `bin/run` and `bin/dev` — load config from `~/.ai-cli/.env`
  - Keep `require('dotenv/config')` for CWD `.env` backward compat
  - Add explicit `dotenv.config({ path: '~/.ai-cli/.env' })` after CWD load
  - The config module's `loadConfig()` handles this at runtime too

- [ ] 7. Update docs (`README.md`, `.env.example`)
  - Document the guided setup flow (first run auto-triggers)
  - Document `ai --config` for managing config
  - Note config file location: `~/.ai-cli/.env`

## Acceptance Criteria

- `ai` (first run, no env vars) triggers interactive setup wizard
- `ai` (subsequent runs, after setup) works normally without wizard
- `ai --config` shows current config and allows update/delete of values
- `ai "some text"` works as before after configuration
- `ai --help` / `ai -h` still show help without triggering wizard
- Config is persisted in `~/.ai-cli/.env` and survives restarts
- API key is masked (never shown in full) in config manager display
- BASE_URL and MODEL can be cleared via config manager; API key cannot
- Existing env vars from shell profile or CWD `.env` still work (backward compat)
- `ai --config` does NOT call the OpenAI API
