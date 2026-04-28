# cli-gpt

Translate human language to command line using LLM.

## Installation

```sh-session
$ npm install -g @wu-cl/ai-cli
```

## Configuration

| Environment Variable    | Required | Description                                                                 |
| ----------------------- | -------- | --------------------------------------------------------------------------- |
| `OPENAI_API_KEY_CLI`    | Yes      | Your API key                                                                |
| `OPENAI_BASE_URL_CLI`   | No       | Custom base URL for any OpenAI-compatible API (defaults to OpenAI official) |
| `OPENAI_MODEL_CLI`      | No       | Model name to use (defaults to `deepseek-v4-flash`)                             |

### Guided Setup (First Run)

On first use, `ai` will detect that no API key is configured and launch an interactive setup wizard:

```sh-session
$ ai list all docker images

Welcome to ai-cli! Let's set up your configuration.

Enter your API key (OPENAI_API_KEY_CLI): ****
Enter base URL (OPENAI_BASE_URL_CLI) — Enter to skip:
Enter model name (OPENAI_MODEL_CLI) — Enter for default (deepseek-v4-flash):

Configuration saved to ~/.ai-cli/.env
```

Configuration is stored in `~/.ai-cli/.env`. You can also set environment variables in your shell profile or in a `.env` file at the project root.

### Manage Configuration

Use `--config` to view or update your configuration at any time:

```sh-session
$ ai --config

Current Configuration:
  1. API Key:  sk-****670f
  2. Base URL: https://api.vveai.com/v1
  3. Model:    gpt-4o

Choose: (u)pdate / (c)lear / (q)uit:
```

## Usage

Run `ai` followed by a natural-language description of the command you need:

```sh-session
$ ai clone react from github and switch to a new branch named feature/gpt
Translating your words into command line...... done

git clone https://github.com/facebook/react.git && cd react && git checkout -b feature/gpt

$ ai delete all the docker untitled images
Translating your words into command line...... done

docker rmi $(docker images -f "dangling=true" -q)

CAUTION: This command is dangerous!

$ ai 删除所有文件和文件夹
Translating your words into command line...... done

rm -rf *

CAUTION: This command is dangerous!
```

Use `--help` or `-h` to show usage and configuration info (also shown when running with no arguments):

```sh-session
$ ai --help
$ ai -h
$ ai
```

Manage your configuration interactively:

```sh-session
$ ai --config
```

![](docs/images/animation.gif)
