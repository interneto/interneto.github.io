---
title: AI Chatbot Platforms
description: Layer-by-layer comparison of ChatGPT, Claude, Gemini, and DeepSeek — models, architecture, capabilities, tooling, and infrastructure (June 2026 snapshot)
date: 2026-06-07
next: true
prev: true
footer: true
tags:
  - comparison
  - software
---

# AI Chatbot Platform

Layer-by-layer comparison of ChatGPT, Claude, Gemini, and DeepSeek — from model internals to client UI and infrastructure.

This is a living document. Update it when major model versions, protocols, or platform architecture change.

## Platform Stack

<table>
  <colgroup>
    <col style="width:18%">
    <col style="width:20.5%">
    <col style="width:20.5%">
    <col style="width:20.5%">
    <col style="width:20.5%">
  </colgroup>
  <thead>
    <tr>
      <th>Dimension</th>
      <th><img src="/img/software/apps/chatgpt.svg" width="18" height="18" style="display:inline;vertical-align:middle"> ChatGPT</th>
      <th><img src="/img/software/apps/claude.svg" width="18" height="18" style="display:inline;vertical-align:middle"> Claude</th>
      <th><img src="/img/software/apps/deepseek.svg" width="18" height="18" style="display:inline;vertical-align:middle"> DeepSeek</th>
      <th><img src="/img/software/apps/gemini.svg" width="18" height="18" style="display:inline;vertical-align:middle"> Gemini</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Company</strong></td>
      <td>OpenAI</td>
      <td>Anthropic</td>
      <td>DeepSeek AI</td>
      <td>Google DeepMind</td>
    </tr>
    <tr>
      <td><strong>Type / License</strong></td>
      <td colspan="2">Proprietary — closed weights, closed API</td>
      <td>Open weights (MIT / Apache 2.0 per model); closed API available</td>
      <td>Proprietary — closed weights, closed API</td>
    </tr>
    <tr>
      <td><strong>Pricing</strong></td>
      <td>Free tier · Plus / Pro subscription · API per-token</td>
      <td>Free tier · Pro / Max subscription · API per-token</td>
      <td>Free tier · low-cost API per-token · self-host free (open weights)</td>
      <td>Free tier · AI Pro / Ultra subscription · API per-token</td>
    </tr>
    <tr>
      <td><strong>Model family (Jun 2026)</strong></td>
      <td>GPT family; Instant / Thinking / Pro auto-routing</td>
      <td>Opus / Sonnet / Haiku family</td>
      <td>DeepSeek family; open-model-first</td>
      <td>Gemini family (Flash + Pro)</td>
    </tr>
    <tr>
      <td><strong>Architecture</strong></td>
      <td colspan="2">Decoder-only Transformer; internals undisclosed</td>
      <td>Decoder-only Transformer; open weights</td>
      <td>Decoder-only Transformer; confirmed MoE top-k routing</td>
    </tr>
    <tr>
      <td><strong>Multimodality</strong></td>
      <td>Text, image, audio, voice</td>
      <td>Text + vision</td>
      <td>Text; focus on reasoning and coding</td>
      <td>Native interleaved: text, image, audio, video</td>
    </tr>
    <tr>
      <td><strong>Context window</strong></td>
      <td>~400K tokens</td>
      <td colspan="2">200K+ (tier-dependent)</td>
      <td>1M tokens</td>
    </tr>
    <tr>
      <td><strong>Output + transport</strong></td>
      <td colspan="4">Markdown + SSE / JSON deltas — de facto standard <em>(Gemini additionally uses gRPC / protobuf internally)</em></td>
    </tr>
    <tr>
      <td><strong>Render path</strong></td>
      <td colspan="4">Markdown → AST → React components — no major divergence</td>
    </tr>
    <tr>
      <td><strong>Rich UI / agents</strong></td>
      <td>Apps SDK + Canvas over MCP</td>
      <td>Artifacts + Cowork / Design; MCP origin</td>
      <td>—</td>
      <td>Canvas + Workspace depth; A2UI + MCP</td>
    </tr>
    <tr>
      <td><strong>Tool standard</strong></td>
      <td colspan="4">MCP — variance is ecosystem maturity and packaging, not protocol direction</td>
    </tr>
    <tr>
      <td><strong>Client</strong></td>
      <td colspan="4">Web React / TypeScript + native apps — depth varies by ecosystem</td>
    </tr>
    <tr>
      <td><strong>Platforms (OS)</strong></td>
      <td>Web · iOS · Android · Windows · macOS</td>
      <td>Web · iOS · Android · Windows · macOS</td>
      <td>Web · iOS · Android</td>
      <td>Web · iOS · Android</td>
    </tr>
    <tr>
      <td><strong>Infra</strong></td>
      <td>Azure</td>
      <td>AWS Trainium + Google TPU</td>
      <td>—</td>
      <td>Google TPUs</td>
    </tr>
  </tbody>
</table>

> **Linux** has no official native client for any of these — use the web app. ChatGPT and Claude ship native **Windows / macOS** desktop apps; DeepSeek and Gemini are web + mobile only (Gemini is also built into Android and ChromeOS).
>
> **What the price buys:** not the model — the weights, clients, and protocols are free (DeepSeek's are even downloadable). You're paying to **rent compute** (per-token API or the subscription's hosted inference) plus the **managed service** around it: uptime, guardrails, the app, support, and ongoing training / post-training and the staff behind it. Self-host an open model and the software is free; you just supply the hardware.

## Capabilities

Beyond chat, each platform exposes interactive tools and rich rendering. What the app can *do* in a conversation — search the web, run code, render diagrams, preview UI — increasingly matters as much as raw model quality. Snapshot below; these features ship and change fast.

<table>
  <colgroup>
    <col style="width:18%">
    <col style="width:20.5%">
    <col style="width:20.5%">
    <col style="width:20.5%">
    <col style="width:20.5%">
  </colgroup>
  <thead>
    <tr>
      <th>Capability</th>
      <th><img src="/img/software/apps/chatgpt.svg" width="18" height="18" style="display:inline;vertical-align:middle"> ChatGPT</th>
      <th><img src="/img/software/apps/claude.svg" width="18" height="18" style="display:inline;vertical-align:middle"> Claude</th>
      <th><img src="/img/software/apps/deepseek.svg" width="18" height="18" style="display:inline;vertical-align:middle"> DeepSeek</th>
      <th><img src="/img/software/apps/gemini.svg" width="18" height="18" style="display:inline;vertical-align:middle"> Gemini</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><strong>Web search</strong></td><td>✅ with citations</td><td>✅</td><td>✅</td><td>✅ Search grounding</td></tr>
    <tr><td><strong>Code execution</strong></td><td>✅ Python sandbox</td><td>✅ analysis tool</td><td>⚠️ code-gen only</td><td>✅ Python</td></tr>
    <tr><td><strong>Live editor</strong></td><td>Canvas</td><td>Artifacts</td><td>—</td><td>Canvas</td></tr>
    <tr><td><strong>Mermaid diagrams</strong></td><td>✅ in Canvas</td><td>✅ in Artifacts</td><td>code only</td><td>✅ in Canvas</td></tr>
    <tr><td><strong>SVG / HTML / React preview</strong></td><td>✅ Canvas</td><td>✅ Artifacts</td><td>—</td><td>✅ Canvas</td></tr>
    <tr><td><strong>Interactive maps</strong></td><td>✅ Apps (e.g. Mapbox)</td><td>⚠️ via MCP</td><td>—</td><td>✅ Google Maps</td></tr>
    <tr><td><strong>Image generation</strong></td><td>✅</td><td>—</td><td>—</td><td>✅</td></tr>
    <tr><td><strong>Voice (in / out)</strong></td><td>✅ Advanced Voice</td><td>⚠️ mobile</td><td>—</td><td>✅ Gemini Live</td></tr>
    <tr><td><strong>File / data analysis</strong></td><td>✅</td><td>✅</td><td>⚠️ basic</td><td>✅</td></tr>
    <tr><td><strong>Apps / extensibility</strong></td><td>✅ Apps SDK + MCP</td><td>✅ MCP connectors</td><td>—</td><td>✅ A2UI + MCP</td></tr>
  </tbody>
</table>

> **Note:** Rich-UI output renders through the live-editor surfaces — ChatGPT **Canvas**, Claude **Artifacts**, Gemini **Canvas** — which preview HTML/React, SVG, and Mermaid inline. Maps and other third-party widgets arrive through the **Apps/MCP** layer, not the base model.

## AI Coding Clients

Claude Code, Codex, GitHub Copilot, and OpenCode solve a similar problem (AI-assisted coding), but they are client-layer products — not foundation model platforms.

<table>
  <colgroup>
    <col style="width:18%">
    <col style="width:20.5%">
    <col style="width:20.5%">
    <col style="width:20.5%">
    <col style="width:20.5%">
  </colgroup>
  <thead>
    <tr>
      <th>Dimension</th>
      <th><img src="/img/software/apps/claude-code.svg" width="18" height="18" style="display:inline;vertical-align:middle"> Claude Code</th>
      <th><img src="/img/software/apps/codex.svg" width="18" height="18" style="display:inline;vertical-align:middle"> Codex</th>
      <th><img src="/img/software/vscode-extensions/github-copilot.svg" width="18" height="18" style="display:inline;vertical-align:middle;background:white;border-radius:50%;border:1px solid #ccc;padding:1px"> GitHub Copilot</th>
      <th><img src="/img/software/apps/opencode.svg" width="18" height="18" style="display:inline;vertical-align:middle"> OpenCode</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Company</strong></td>
      <td>Anthropic</td>
      <td>OpenAI</td>
      <td>GitHub (Microsoft)</td>
      <td>sst (community)</td>
    </tr>
    <tr>
      <td><strong>Type / License</strong></td>
      <td>Proprietary client — closed source; subscription required</td>
      <td>Open-source client — MIT; subscription required for the API</td>
      <td colspan="2">Open-source client — MIT; BYOK: Ollama, any API provider, or GitHub-hosted models</td>
    </tr>
    <tr>
      <td><strong>Model strategy</strong></td>
      <td colspan="2">Tightly coupled to native model ecosystem</td>
      <td colspan="2">Multi-provider: GitHub-hosted models, BYOK, or local (Ollama)</td>
    </tr>
    <tr>
      <td><strong>Interface</strong></td>
      <td colspan="2">Agentic coding sessions in terminal / editor</td>
      <td>VS Code / IDE chat + inline completion + agent flows</td>
      <td>Terminal-first workflow</td>
    </tr>
    <tr>
      <td><strong>Tool fit</strong></td>
      <td colspan="2">Integrated coding-tool loops</td>
      <td>MCP ecosystem alignment</td>
      <td>MCP / open-tooling flexibility</td>
    </tr>
    <tr>
      <td><strong>Layer</strong></td>
      <td colspan="4">Application-layer clients above model platforms</td>
    </tr>
  </tbody>
</table>

## Key Takeaways

- The middle layers have converged: Markdown output, SSE + JSON delta streaming, Markdown → AST → React rendering, and MCP as the tool-calling standard.
- Real differences sit in model behavior, reasoning quality, context window reliability, product UX, and infrastructure strategy.
- DeepSeek is the only platform here with open weights — a meaningful distinction for self-hosting and reproducibility.
- Claude Code, Codex, GitHub Copilot, and OpenCode are coding clients built on top of these platforms, not independent model stacks.
- Most internal architecture details remain proprietary; treat vendor-unconfirmed claims as estimates.

## Maintenance Note

Update this article when model families, default routing behavior, context windows, or protocol layers change.


