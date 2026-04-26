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
| `OPENAI_MODEL_CLI`      | No       | Model name to use (defaults to `gpt-3.5-turbo`)                             |

You can set these in your shell profile or in a `.env` file at the project root.

```sh-session
$ export OPENAI_API_KEY_CLI="***your-api-key***"

# Optional: use a custom OpenAI-compatible endpoint (e.g. a local proxy or another provider)
$ export OPENAI_BASE_URL_CLI="https://your-custom-endpoint/v1"

# Optional: override the model
$ export OPENAI_MODEL_CLI="gpt-4o"
```

## Usage

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

![](docs/images/animation.gif)
