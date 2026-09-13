---
title: AI Chatbot Platforms, Coding Agents, and Model Families
description: A June 2026 comparison of AI chatbot platforms, coding agents, model families, and LLM serving across Anthropic, OpenAI, Google, Meta, DeepSeek, xAI, Mistral, Cohere, Alibaba, Zhipu, and Kimi.
date: 2026-06-07
next: true
prev: true
footer: true
category: AI Tools & Services
tags:
  - comparison
  - software
---

# AI Chatbot Platforms, Coding Agents, and Model Families

Layer-by-layer comparison of the AI ecosystem stack: LLM serving, client agents, model families, protocol transport, and UI rendering.

## Final comparison — complete AI agent ecosystems

| Ecosystem      | Country | Client / agent                                                        | Model family          | LLM serving                                          | Integration                                        | Platforms              | Price                                        |
|----------------|---------|-----------------------------------------------------------------------|-----------------------|------------------------------------------------------|----------------------------------------------------|------------------------|----------------------------------------------|
| 🟣 Anthropic   | 🇺🇸    | Claude Code · Agent                                                   | Claude                | AWS · Anthropic cloud                                | GitHub · IDE · Cloud · MCP                         | Desktop · Web · Mobile | $20 ~1× · $100 ~5× · $200 ~20×               |
| 🟢 OpenAI      | 🇺🇸    | Codex · Cloud GPT                                                     | GPT                   | Azure · OpenAI cloud                                 | GitHub · IDE · Cloud · MCP                         | Desktop · Web · Mobile | $20 ~1× · $200 ~10×                          |
| 🔵 Google      | 🇺🇸    | Gemini CLI · Antigravity                                              | Gemini                | Google Cloud · TPUs                                  | GitHub · IDE · Google Cloud · MCP                  | Desktop · Web · Mobile | $20 ~1× · $100 ~5–20×                        |
| ⚫ GitHub      | 🇺🇸    | Copilot · Agent                                                       | GPT · Claude · Gemini | GitHub cloud · Actions · runners                     | GitHub · PR · Issues · Actions                     | Desktop · Web · Mobile | $10+ · usage credits                         |
| 🟠 Open Coding | 🌍      | OpenCode · Cline · Kilo Code · t3code (agent harness control surface) | Any                   | Ollama · vLLM · llama.cpp · LM Studio · local server | Git · IDE · Terminal · MCP · APIs · t3code harness | Desktop · Web          | Free runtime · OpenCode Go $10 · API / local |
| 🔴 Autonomous  | 🌍      | OpenClaw · Hermes                                                     | Any                   | Ollama · vLLM · llama.cpp · cloud optional           | Tools · Memory · Skills · Automation · MCP         | Desktop · Web · Mobile | Free runtime · API / local                   |

`t3code` fits better with the Open Coding family than with the Autonomous row because it is a harness/control-surface layer rather than a full self-running autonomous runtime.

## Model families by company

| Country | Company    | LLM family | Models / families                          | LLM serving                                         |
|---------|------------|------------|--------------------------------------------|-----------------------------------------------------|
| 🇨🇦      | Cohere     | Command    | Command R · Command R+ · Command A         | Cohere cloud / API                                  |
| 🇫🇷      | Mistral AI | Mistral    | Mistral Large · Small · Codestral          | Mistral cloud · API · local inference routes        |
| 🇺🇸      | Anthropic  | Claude     | Claude Sonnet · Claude Opus · Claude Haiku | AWS · Anthropic cloud                               |
| 🇺🇸      | Google     | Gemini     | Gemini 3 · Flash · Pro · Ultra             | Google Cloud · TPUs                                 |
| 🇺🇸      | Meta       | Llama      | Llama 4.x family                           | Local via Ollama · vLLM · llama.cpp · API providers |
| 🇺🇸      | OpenAI     | GPT        | GPT Luna · Terra · Sol · Astra             | Azure · OpenAI cloud                                |
| 🇺🇸      | xAI        | Grok       | Grok family                                | X cloud / API                                       |
| 🇨🇳      | Alibaba    | Qwen       | Qwen 3 family                              | Local via Ollama · vLLM · OpenRouter · API          |
| 🇨🇳      | DeepSeek   | DeepSeek   | DeepSeek V4 · reasoning variants           | DeepSeek cloud or local inference                   |
| 🇨🇳      | Moonshot   | Kimi       | Kimi K2 · Kimi reasoning family            | Moonshot cloud / API · local via providers          |
| 🇨🇳      | Zhipu      | GLM        | GLM-4.5                                    | Cloud API; local option varies                      |

The model-family table intentionally keeps only the economic and runtime labels that matter for comparison: company, family, main model naming, and serving route. The rest of the differences — UI surface, output format, transport, and richer product positioning — are already covered in the first ecosystem table and in the shared notes below it.

## References

- Anthropic: https://www.anthropic.com/
- OpenAI: https://openai.com/
- Google Gemini: https://deepmind.google/technologies/gemini/
- Meta Llama: https://www.llama.com/
- DeepSeek: https://www.deepseek.com/
- xAI Grok: https://x.ai/
- Alibaba Qwen: https://qwen.ai/
- Zhipu GLM: https://zhipu.ai/
- Cohere Command: https://cohere.com/
- Mistral AI: https://mistral.ai/
- Moonshot / Kimi: https://kimi.moonshot.cn/
- OpenCode: https://github.com/opencode-ai/opencode
- Cline: https://github.com/cline/cline
- Kilo Code: https://github.com/kilocodehq/kilocode
- t3code: https://github.com/pingdotgg/t3code

## Key Takeaways

- The middle layers have converged: Markdown output, SSE + JSON delta streaming, Markdown → AST → React rendering, and MCP as the tool-calling standard.
- Real differences sit in model behavior, reasoning quality, context window reliability, product UX, and infrastructure strategy.
- DeepSeek is the only platform here with open weights — a meaningful distinction for self-hosting and reproducibility.
- Claude Code, Codex, GitHub Copilot, and OpenCode are coding clients built on top of these platforms, not independent model stacks.II
- Most internal architecture details remain proprietary; treat vendor-unconfirmed claims as estimates.

## Maintenance Note

Update this article when model families, default routing behavior, context windows, or protocol layers change.
