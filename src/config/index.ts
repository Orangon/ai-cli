import { ux } from '@oclif/core';
import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const CONFIG_DIR = path.join(os.homedir(), '.ai-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, '.env');

const ENV_KEYS = {
  apiKey: 'OPENAI_API_KEY_CLI',
  baseUrl: 'OPENAI_BASE_URL_CLI',
  model: 'OPENAI_MODEL_CLI',
} as const;

type EnvKey = (typeof ENV_KEYS)[keyof typeof ENV_KEYS];

const ENV_LABELS: Record<EnvKey, string> = {
  [ENV_KEYS.apiKey]: 'API Key',
  [ENV_KEYS.baseUrl]: 'Base URL',
  [ENV_KEYS.model]: 'Model',
};

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function loadConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    dotenv.config({ path: CONFIG_FILE });
  }
}

export function isConfigured(): boolean {
  return !!process.env[ENV_KEYS.apiKey];
}

export function getCurrentValues(): Record<EnvKey, string> {
  return {
    [ENV_KEYS.apiKey]: process.env[ENV_KEYS.apiKey] || '',
    [ENV_KEYS.baseUrl]: process.env[ENV_KEYS.baseUrl] || '',
    [ENV_KEYS.model]: process.env[ENV_KEYS.model] || '',
  };
}

function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 3)}****${key.slice(-4)}`;
}

function saveConfig(vars: Record<string, string>): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  let existing: Record<string, string> = {};
  if (fs.existsSync(CONFIG_FILE)) {
    existing = dotenv.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  }

  const merged = { ...existing };
  for (const [k, v] of Object.entries(vars)) {
    if (v) {
      merged[k] = v;
    } else {
      delete merged[k];
    }
  }

  const lines = Object.entries(merged).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(CONFIG_FILE, lines.join('\n') + '\n');

  for (const [k, v] of Object.entries(vars)) {
    if (v) process.env[k] = v;
    else delete process.env[k];
  }
}

export async function setupWizard(): Promise<void> {
  ux.log("\n\x1b[36mWelcome to ai-cli! Let's set up your configuration.\x1b[0m\n");

  const apiKey = await ux.prompt('Enter your API key (OPENAI_API_KEY_CLI)', { type: 'hide' });
  if (!apiKey.trim()) {
    ux.log('\x1b[31mAPI key is required. Exiting.\x1b[0m');
    return;
  }

  const baseUrl = await ux.prompt('Enter base URL (OPENAI_BASE_URL_CLI) — Enter to skip', {
    required: false,
    default: '',
  });
  const model = await ux.prompt('Enter model name (OPENAI_MODEL_CLI) — Enter for default (deepseek-v4-flash)', {
    required: false,
    default: '',
  });

  const vars: Record<string, string> = { [ENV_KEYS.apiKey]: apiKey.trim() };
  if (baseUrl.trim()) vars[ENV_KEYS.baseUrl] = baseUrl.trim();
  if (model.trim()) vars[ENV_KEYS.model] = model.trim();

  saveConfig(vars);
  ux.log(`\n\x1b[32mConfiguration saved to ${CONFIG_FILE}\x1b[0m\n`);
}

function displayValues(): void {
  const values = getCurrentValues();
  ux.log('\n\x1b[36mCurrent Configuration:\x1b[0m');
  ux.log(`  1. API Key:  ${values[ENV_KEYS.apiKey] ? maskKey(values[ENV_KEYS.apiKey]) : '\x1b[33m(not set)\x1b[0m'}`);
  ux.log(`  2. Base URL: ${values[ENV_KEYS.baseUrl] || '\x1b[33m(not set)\x1b[0m'}`);
  ux.log(`  3. Model:    ${values[ENV_KEYS.model] || '\x1b[33m(not set, default: deepseek-v4-flash)\x1b[0m'}`);
  ux.log('');
}

export async function configManager(): Promise<void> {
  displayValues();

  while (true) {
    const action = await ux.prompt('Choose: (u)pdate / (c)lear / (q)uit');
    const a = action.trim().toLowerCase();

    if (a === 'q' || a === 'quit') {
      ux.log('Exiting configuration.');
      break;
    }

    if (a === 'u' || a === 'update') {
      const which = await ux.prompt('Which to update? (1) API Key / (2) Base URL / (3) Model');
      const key: EnvKey | '' = which === '1' ? ENV_KEYS.apiKey : which === '2' ? ENV_KEYS.baseUrl : which === '3' ? ENV_KEYS.model : '';
      if (!key) {
        ux.log('\x1b[33mInvalid choice.\x1b[0m');
        continue;
      }

      const promptOpts = key === ENV_KEYS.apiKey ? { type: 'hide' as const } : {};
      const newValue = await ux.prompt(`Enter new value for ${ENV_LABELS[key]}`, promptOpts);
      if (!newValue.trim()) {
        ux.log('\x1b[33mValue cannot be empty. Use "clear" to remove.\x1b[0m');
        continue;
      }

      const updated = getCurrentValues();
      updated[key] = newValue.trim();
      saveConfig(updated);
      ux.log('\x1b[32mUpdated.\x1b[0m');
      displayValues();
      continue;
    }

    if (a === 'c' || a === 'clear') {
      const which = await ux.prompt('Which to clear? (2) Base URL / (3) Model');
      const key: EnvKey | '' = which === '2' ? ENV_KEYS.baseUrl : which === '3' ? ENV_KEYS.model : '';
      if (!key) {
        ux.log('\x1b[33mCan only clear Base URL (2) or Model (3). API Key is required.\x1b[0m');
        continue;
      }

      const updated = getCurrentValues();
      updated[key] = '';
      saveConfig(updated);
      ux.log('\x1b[32mCleared.\x1b[0m');
      displayValues();
      continue;
    }

    ux.log('\x1b[33mInvalid action. Use u, c, or q.\x1b[0m');
  }
}
