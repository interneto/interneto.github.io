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
| ⚫ GitHub      | 🇺🇸    | Copilot · Agent                                                       | GPT · Claude · Gemini | GitHub cloud · Actions · runners                     | GitHub · PR · Issues · Actions                     | Desktop · Web · Mobile | $35 Pro · usage credits                      |
| 🟠 Open Coding | 🌍      | OpenCode · Cline · Kilo Code · t3code (agent harness control surface) | Any                   | Ollama · vLLM · llama.cpp · LM Studio · local server | Git · IDE · Terminal · MCP · APIs · t3code harness | Desktop · Web          | Free runtime · OpenCode Zen pay-as-you-go · Go $10 · API / local |
| 🔴 Autonomous  | 🌍      | OpenClaw · Hermes                                                     | Any                   | Ollama · vLLM · llama.cpp · cloud optional           | Tools · Memory · Skills · Automation · MCP         | Desktop · Web · Mobile | Free runtime · API / local                   |

`t3code` fits better with the Open Coding family than with the Autonomous row because it is a harness/control-surface layer rather than a full self-running autonomous runtime.

> **Best quality-price:** for pure value, **Open Coding** (OpenCode, Cline, Kilo Code) is hard to beat — the runtime is free and pairs with any open-weight model, with OpenCode's Go plan adding frontier-adjacent models for $10/month. Among the flagship subscriptions, **Google's Gemini** stretches furthest per dollar, with its $100 tier reaching up to a 20× multiplier over the $20 base plan.

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

## Key Takeaways

- The middle layers have converged: Markdown output, SSE + JSON delta streaming, Markdown → AST → React rendering, and MCP as the tool-calling standard.
- Real differences sit in model behavior, reasoning quality, context window reliability, product UX, and infrastructure strategy.
- DeepSeek is the only platform here with open weights — a meaningful distinction for self-hosting and reproducibility.
- Claude Code, Codex, GitHub Copilot, and OpenCode are coding clients built on top of these platforms, not independent model stacks.II
- Most internal architecture details remain proprietary; treat vendor-unconfirmed claims as estimates.
