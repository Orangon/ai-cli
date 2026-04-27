# `ai` CLI Tool - System Architecture

本文档展示了 `ai` CLI 工具的系统架构和数据流程。

## Overview (概述)

`ai` 是一个基于自然语言生成 shell 命令的 CLI 工具,使用 LLM API 将用户的自然语言指令转换为可执行的命令行命令。

## Architecture Diagram (架构图)

```mermaid
flowchart TD
    %% External Inputs (外部输入)
    User[用户 User] -->|输入自然语言指令| CLI

    %% Entry Points (入口点)
    subgraph Entry["Entry Points (入口点)"]
        ProdBin["bin/run<br/>生产环境"]
        DevBin["bin/dev<br/>开发环境<br/>使用 ts-node"]
    end

    CLI --> ProdBin
    CLI --> DevBin

    %% UI Layer (UI 层)
    subgraph UILayer["UI Layer (src/ui/index.ts)"]
        DefaultCommand["oclif DefaultCommand"]
        JoinArgv["将 argv 连接成字符串"]
        ShowSpinner["显示提示信息:<br/>'Translating into command line'"]
        CallTranslate["调用 translate()"]
        PrintResult["打印结果<br/青色命令文本"]
        HandleDangerous["处理危险命令<br/>显示红色 CAUTION 横幅"]
        HandleError["处理错误<br/>显示错误信息<br/>退出码 500"]
    end

    ProdBin --> DefaultCommand
    DevBin --> DefaultCommand

    DefaultCommand --> JoinArgv
    JoinArgv --> ShowSpinner
    ShowSpinner --> CallTranslate

    %% Translator Layer (翻译器层)
    subgraph Translator["Translator (src/translator/index.ts)"]
        TranslateFunc["translate() 函数"]
        GenPrompt["generatePromptMessages(input)<br/>生成提示消息"]
        CallChatCompletion["createChatCompletion(messages)<br/>调用 OpenAI API"]
        ParseResponse["解析响应:<br/>- 移除 '>' 前缀<br/>- 检测 'DANGEROUS' 后缀"]
        ReturnCmd["返回 CommandLine 对象"]
    end

    CallTranslate --> TranslateFunc
    TranslateFunc --> GenPrompt
    GenPrompt --> CallChatCompletion
    CallChatCompletion --> ParseResponse
    ParseResponse --> ReturnCmd

    %% Prompt Builder Layer (提示构建器层)
    subgraph PromptBuilder["Prompt Builder (src/prompt/index.ts)"]
        ReadTemplate["读取模板文件:<br/>prompt-template/default.md"]
        ParseSections["解析章节:<br/># SYSTEM, # USER, # ASSISTANT"]
        MapToRoles["映射到聊天角色"]
        SubstituteOS["替换 \${OS} 为实际平台"]
        ReturnMessages["返回 ChatCompletionRequestMessage[]"]
    end

    GenPrompt --> ReadTemplate
    ReadTemplate --> ParseSections
    ParseSections --> MapToRoles
    MapToRoles --> SubstituteOS
    SubstituteOS --> ReturnMessages

    %% OpenAI Client Layer (OpenAI 客户端层)
    subgraph OpenAIClient["OpenAI Client (src/open-ai/index.ts)"]
        SDKWrapper["OpenAI SDK v4 包装器"]
        ConfigFromEnv["从环境变量配置:<br/>- OPENAI_API_KEY<br/>- OPENAI_BASE_URL (可选)<br/>- OPENAI_MODEL (可选)"]
        MakeAPICall["发起 API 调用"]
        ReturnContent["返回助手消息内容字符串"]
    end

    CallChatCompletion --> SDKWrapper
    SDKWrapper --> ConfigFromEnv
    ConfigFromEnv --> MakeAPICall
    MakeAPICall --> ReturnContent
    ReturnContent --> ParseResponse

    %% External Service (外部服务)
    subgraph ExternalAPI["External Service (外部服务)"]
        OpenAIAPI["OpenAI API<br/>或兼容端点"]
    end

    MakeAPICall --> OpenAIAPI
    OpenAIAPI --> ReturnContent

    %% Output Handling (输出处理)
    ReturnCmd -->|成功| PrintResult
    ReturnCmd -->|isDangerous=true| HandleDangerous
    ReturnCmd -->|错误| HandleError

    PrintResult --> Output[用户输出]
    HandleDangerous --> Output
    HandleError --> Output

    %% Styling (样式)
    classDef entryPoint fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef uiLayer fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef translator fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef promptBuilder fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef openaiLayer fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef external fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef output fill:#c8e6c9,stroke:#388e3c,stroke-width:2px

    class ProdBin,DevBin entryPoint
    class DefaultCommand,JoinArgv,ShowSpinner,CallTranslate,PrintResult,HandleDangerous,HandleError uiLayer
    class TranslateFunc,GenPrompt,CallChatCompletion,ParseResponse,ReturnCmd translator
    class ReadTemplate,ParseSections,MapToRoles,SubstituteOS,ReturnMessages promptBuilder
    class SDKWrapper,ConfigFromEnv,MakeAPICall,ReturnContent openaiLayer
    class OpenAIAPI external
    class Output output
```

## Data Flow (数据流程)

1. **User Input (用户输入)**
   - 用户在命令行输入自然语言指令 (例如: `ai clone react from github`)
   - Shell 通过 `bin/run` (生产) 或 `bin/dev` (开发) 启动 CLI

2. **UI Layer Processing (UI 层处理)**
   - oclif `DefaultCommand` 接收命令参数
   - 将 `argv` 数组连接成单个字符串
   - 显示 "Translating into command line" 提示信息
   - 调用 `translate()` 函数

3. **Translation Process (翻译过程)**
   - **Prompt Generation (提示生成)**:
     - 读取 `prompt-template/default.md` 模板文件
     - 解析 `# SYSTEM`, `# USER`, `# ASSISTANT` 章节
     - 将章节映射到聊天角色
     - 替换模板中的 `${OS}` 占位符为实际操作系统平台
     - 返回格式化的 `ChatCompletionRequestMessage[]` 数组

   - **API Call (API 调用)**:
     - OpenAI Client 使用 SDK v4 发起请求
     - 从环境变量读取配置:
       - `OPENAI_API_KEY` (必需)
       - `OPENAI_BASE_URL` (可选,默认 OpenAI 端点)
       - `OPENAI_MODEL` (可选)
     - 发送请求到 OpenAI API (或兼容端点)
     - 接收助手的响应内容

   - **Response Parsing (响应解析)**:
     - 移除命令前缀的 `>` 字符
     - 检测命令末尾是否有 `DANGEROUS` 标记
     - 构建 `CommandLine` 对象:
       ```typescript
       {
         content: string,        // 生成的命令
         isDangerous?: boolean   // 是否为危险命令
       }
       ```

4. **Output Display (输出显示)**
   - **成功**: 以青色打印生成的命令
   - **危险命令**: 额外显示红色 "CAUTION" 横幅警告用户
   - **错误**: 显示错误信息并以退出码 500 退出

## Module Structure (模块结构)

```
ai-cli/
├── bin/
│   ├── run          # 生产环境入口
│   └── dev          # 开发环境入口 (ts-node)
├── src/
│   ├── ui/
│   │   └── index.ts         # oclif DefaultCommand - UI 层
│   ├── translator/
│   │   └── index.ts         # 翻译器 - 协调提示生成和 API 调用
│   ├── prompt/
│   │   ├── index.ts         # 提示构建器
│   │   └── template.ts      # 模板解析器
│   ├── open-ai/
│   │   └── index.ts         # OpenAI SDK 包装器
│   └── types.ts             # TypeScript 类型定义
├── prompt-template/
│   └── default.md           # 提示模板文件
└── dist/                    # 编译输出 (CommonJS)
```

## Key Types (关键类型)

```typescript
// 命令行输出对象
interface CommandLine {
  content: string;           // 生成的 shell 命令
  isDangerous?: boolean;     // 是否为危险命令 (如 rm, format 等)
}

// OpenAI 聊天消息
interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

## Environment Variables (环境变量)

| Variable (变量) | Required (必需) | Description (描述) |
|----------------|----------------|-------------------|
| `OPENAI_API_KEY` | Yes | OpenAI API 密钥 |
| `OPENAI_BASE_URL` | No | 自定义 API 端点 (默认: OpenAI 官方端点) |
| `OPENAI_MODEL` | No | 使用的模型名称 (默认: gpt-3.5-turbo) |

## Technology Stack (技术栈)

- **Framework**: [oclif](https://oclif.io/) - Open CLI Framework
- **Language**: TypeScript (strict mode)
- **Target**: ES2019, CommonJS
- **AI SDK**: OpenAI SDK v4
- **Template Engine**: 自定义 Markdown 解析器
- **Build Tool**: TypeScript Compiler (tsc)
