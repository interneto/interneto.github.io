---
title: AI Chatbot Platforms, Coding Agents, and Model Families
description: A June 2026 comparison of AI chatbot platforms, coding agents, model families, and LLM serving across Anthropic, OpenAI, Google, Meta, DeepSeek, xAI, Mistral, Alibaba, Zhipu, and Kimi.
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

A layer-by-layer comparison of the AI ecosystem stack: LLM serving, client agents, model families, protocol transport, and UI rendering. The goal is to separate what's converged and shared across the whole space from what actually differs — ecosystem by ecosystem, and model family by model family — so the tables below can stay focused on the differences that matter.

## Common ground

- The middle layers have converged: Markdown output, SSE + JSON delta streaming, Markdown → AST → React rendering, and MCP as the tool-calling standard.
- Real differences sit in model behavior, reasoning quality, context window reliability, product UX, and infrastructure strategy.
- Open weights aren't rare: DeepSeek, Qwen, Llama, GLM, and Kimi all ship open checkpoints — DeepSeek and Qwen are the most practical picks for self-hosting and reproducibility.
- Claude Code, Codex, GitHub Copilot, and OpenCode are coding clients built on top of these platforms, not independent model stacks.
- Most internal architecture details remain proprietary; treat vendor-unconfirmed claims as estimates.

## AI agent ecosystems

| Ecosystem      | Country | Client / agent                                                        | Model family          | LLM serving                                          | Integration                                        | Platforms              | Price                                        |
|----------------|---------|-----------------------------------------------------------------------|-----------------------|------------------------------------------------------|----------------------------------------------------|------------------------|----------------------------------------------|
| 🟣 Anthropic   | 🇺🇸    | Claude Code · Agent                                                   | Claude                | AWS · Anthropic cloud                                | GitHub · IDE · Cloud · MCP                         | Desktop · Web · Mobile | $20 ~1× · $100 ~5× · $200 ~20×               |
| 🟢 OpenAI      | 🇺🇸    | Codex · Cloud GPT                                                     | GPT                   | Azure · OpenAI cloud                                 | GitHub · IDE · Cloud · MCP                         | Desktop · Web · Mobile | $20 ~1× · $200 ~10×                          |
| 🔵 Google      | 🇺🇸    | Gemini CLI · Antigravity                                              | Gemini                | Google Cloud · TPUs                                  | GitHub · IDE · Google Cloud · MCP                  | Desktop · Web · Mobile | $20 ~1× · $100 ~5× · $200 ~20×               |
| ⚫ GitHub      | 🇺🇸    | Copilot · Agent                                                       | GPT · Claude · Gemini | GitHub cloud · Actions · runners                     | GitHub · PR · Issues · Actions                     | Desktop · Web · Mobile | $10 Pro · $35 Pro+ · usage credits           |
| 🟠 Open Coding | 🌍      | OpenCode · Cline · Kilo Code                                          | Any                   | Ollama · vLLM · llama.cpp · LM Studio · local server | Git · IDE · Terminal · MCP · APIs                  | Desktop · Web          | Free runtime · OpenCode Zen pay-as-you-go · Go $10 · API / local |
| 🔴 Autonomous  | 🌍      | OpenClaw · Hermes                                                     | Any                   | Ollama · vLLM · llama.cpp · cloud optional           | Tools · Memory · Skills · Automation · MCP         | Desktop · Web · Mobile | Free runtime · API / local                   |

For live, continuously-updated numbers behind the figures above, see this site's own [LLM Pricing](/blog/llm-pricing/) tracker.

**Best value by ecosystem**

- **Open Coding** — best absolute value: free runtime, $10/month unlocks near-frontier models.
- **Google (Gemini)** — best $/multiplier: the $200 tier reaches 20× the $20 base plan.
- **Autonomous** (OpenClaw, Hermes) — best for unattended automation at near-zero licensing cost.

## Model families by company

| Country | Company    | LLM family (name & variants)                        |
|---------|------------|-------------------------------------------------------|
| 🇫🇷      | Mistral AI | Mistral — Large · Small · Codestral                    |
| 🇺🇸      | Anthropic  | Claude — Sonnet · Opus · Haiku                          |
| 🇺🇸      | Google     | Gemini — 3 · Flash · Pro · Ultra                        |
| 🇺🇸      | Meta       | Llama — 4.x family                                      |
| 🇺🇸      | OpenAI     | GPT — Luna · Terra · Sol · Astra                        |
| 🇺🇸      | xAI        | Grok — family                                           |
| 🇨🇳      | Alibaba    | Qwen — 3 family                                         |
| 🇨🇳      | DeepSeek   | DeepSeek — V4 · reasoning variants                      |
| 🇨🇳      | Moonshot   | Kimi — K2 · reasoning family                            |
| 🇨🇳      | Zhipu      | GLM — 4.5                                               |
| 🇨🇳      | Tencent    | Hunyuan — Hy3 · Hy4 · T1 reasoning                      |
| 🇨🇳      | Xiaomi     | MiMo — V2.5 · V2.5 Pro · Omni                           |

**Best value by model family**, based on [LiveBench](https://livebench.ai/) scores:

- **GLM** (Zhipu) — value leader among open models: strong scores at a fraction of frontier pricing.
- **Qwen** (Alibaba) — best for self-hosting: smaller checkpoints run on one consumer GPU, Apache-2.0.
- **DeepSeek** — best open model overall: trails the closed frontier by a few points, MIT-licensed.

## Conclusion

The chatbot and coding-agent space keeps converging on the same middle layers — Markdown, SSE streaming, MCP — while the real differentiation has moved to the edges of the stack: which ecosystem fits how you actually work, and which model gives the best return per dollar. For most builders that settles into a hybrid pattern: a frontier subscription for the work that needs it (Claude for programming and design, ChatGPT for breadth of experience), paired with an open-weight model like Qwen or DeepSeek for the routine, high-volume tasks where self-hosting pays for itself.
