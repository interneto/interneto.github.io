---
title: Generative AI Tools
description: Understanding the stack, tools, and models powering modern Generative AI
date: 2026-06-06
next: true
prev: true
footer: true
category: AI Tools & Services
tags:
  - comparison
  - software
---

## What Is Generative AI?

Generative AI is no longer a chatbot or interface with input-output, nowadays it has been evolutioned to an agentic tools integrated into apps or fully AI generative assistant tools.

---

## It's Stochastic, Not a Calculator

Every output here is **non-deterministic** — stochastic, probabilistic, random. The model doesn't *compute* an answer; at each step it samples the next token from a probability distribution, so the same prompt can yield different results (and *temperature* / sampling settings dial that randomness up or down).

The model itself is a **black box**: billions of trained weights, not readable logic. You can't program a specific output the way you write a function. You only steer it three ways:

- **Training / fine-tuning** — shapes the distribution it samples from (the slow, expensive lever).
- **Prompting & context** — steers each run toward what you want (the fast lever).
- **Guardrails** — filter and validate inputs/outputs *around* the model, since you can't enforce rules *inside* it.

Even at temperature 0 it's only *near*-deterministic — floating-point and hardware differences still drift. This is also why models **hallucinate**: a confident, plausible token sequence is not a verified fact.

So it is **not a calculator**, even though it can *call* one. For anything exact — math, dates, lookups, code execution — give the model deterministic **tools**; the model decides *when* to call them, the tool returns the correct result. Probabilistic reasoning on top, deterministic computation underneath.

---

## The AI Stack

A frontier AI system is a vertical stack — **silicon at the bottom, the app on top**. Two ecosystems run in parallel: **closed / proprietary** ones that trade portability for turnkey convenience and lock-in and **open-source** layers you can self-host and swap freely. The map below is the tooling at a glance, top of stack to bottom.

<style>
.icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5em;
  height: 2.5em;
  margin: 0.3em;
  background: rgba(128,128,128,0.55);
  border: 1px solid rgba(128,128,128,0.35);
  border-radius: 0.5em;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  transition: all 0.2s;
}

.icon-badge:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-1px);
}

.icon-badge img {
  width: 1.5em;
  height: 1.5em;
  object-fit: contain;
}

/* Astro emits `align="center"` (an attribute), which .vp-prose th's
   text-align:left overrides — re-center via a more specific selector. */
.vp-prose th[align="center"],
.vp-prose td[align="center"] {
  text-align: center;
  vertical-align: middle;
}
</style>

|    **Stack Layer**     |                                                                                                                                                                                                                                                                                                                       **Closed-Source**                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                                                                                                                                                                                                                    **Open-Source**                                                                                                                                                                                                                                                                                                                                                    |
|:----------------------:|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
|      **Web Apps**      | **Chat:** <a href="https://chatgpt.com/" class="icon-badge" title="ChatGPT">![ChatGPT][gpt]</a> <a href="https://claude.ai/" class="icon-badge" title="Claude">![Claude][claude]</a> <a href="https://gemini.google.com/" class="icon-badge" title="Gemini">![Gemini][gem]</a> <a href="https://grok.com/" class="icon-badge" title="Grok">![Grok][grok]</a><br>**Media:** <a href="https://magnific.ai/" class="icon-badge" title="Magnific">![Magnific][mag]</a> <a href="https://elevenlabs.io/" class="icon-badge" title="ElevenLabs">![ElevenLabs][el]</a> <a href="https://higgsfield.ai/" class="icon-badge" title="Higgsfield">![Higgsfield][hig]</a> |                                                                                                                     **Chat:** <a href="https://chat.deepseek.com/" class="icon-badge" title="DeepSeek">![DeepSeek][dseek]</a> <a href="https://chat.qwen.ai/" class="icon-badge" title="Qwen">![Qwen][qwn]</a> <a href="https://chat.z.ai/" class="icon-badge" title="z.ai">![z.ai][zai]</a> <a href="https://www.kimi.com/" class="icon-badge" title="Kimi">![Kimi][km]</a><br>**Media:** <a href="https://www.comfy.org/" class="icon-badge" title="ComfyUI Cloud">![ComfyUI Cloud][comfy]</a>                                                                                                                      |
|    **Code Editors**    |                                                                                                                                                                                        <a href="https://antigravity.google/" class="icon-badge" title="Antigravity">![Antigravity][ag]</a> <a href="https://cursor.com/" class="icon-badge" title="Cursor">![Cursor][cur]</a> <a href="https://windsurf.com/" class="icon-badge" title="Windsurf">![Windsurf][ws]</a>                                                                                                                                                                                         |                                                                                                                                                                                                                          <a href="https://code.visualstudio.com/" class="icon-badge" title="VS Code">![VS Code][vsc]</a> <a href="https://zed.dev/" class="icon-badge" title="Zed">![Zed][zed]</a> <a href="https://vscodium.com/" class="icon-badge" title="VSCodium">![VSCodium][vsm]</a>                                                                                                                                                                                                                           |
|    **Agents / CLI**    |                                                                                                                                                                                                                                        <a href="https://claude.ai/code" class="icon-badge" title="Claude Code">![Claude Code][cc]</a> <a href="https://devin.ai/" class="icon-badge" title="Devin">![Devin][devin]</a>                                                                                                                                                                                                                                        |                                                                                                              <a href="https://github.com/features/copilot" class="icon-badge" title="GitHub Copilot">![GitHub Copilot][ghcli]</a> <a href="https://openai.com/codex/" class="icon-badge" title="Codex">![Codex][cdx]</a> <a href="https://opencode.ai/" class="icon-badge" title="OpenCode">![OpenCode][oc]</a> <a href="https://cline.bot/" class="icon-badge" title="Cline">![Cline][cline]</a> <a href="https://hermes-agent.nousresearch.com/" class="icon-badge" title="Hermes">![Hermes][herm]</a>                                                                                                              |
|     **AI Models**      |                                                                                                                  **LLMs:** [Claude](https://www.anthropic.com/claude) · [GPT-5](https://openai.com/chatgpt) · [Gemini 3](https://ai.google.dev/) · [Kimi K2](https://www.kimi.com/) · [Grok](https://x.ai/)<br>**Media:** [Midjourney](https://www.midjourney.com/) · [Ideogram 3](https://ideogram.ai/) · · [Seedance 2](https://www.volcengine.com/) · [Veo 3](https://deepmind.google/models/veo/) · [ElevenLabs](https://elevenlabs.io/)                                                                                                                  |                                   **LLMs:** [Llama 4](https://www.llama.com/) · [Qwen3](https://qwenlm.github.io/) · [DeepSeek-V4](https://platform.deepseek.com/) · [GLM-5](https://chat.z.ai/) · [MiniMax M2](https://www.minimax.io/) · [MiMo](https://mimo.xiaomi.com/) · [Mistral](https://mistral.ai/)<br>**Media:** [FLUX.3](https://huggingface.co/black-forest-labs) · [LTX 2.3](https://ltx.io/model/ltx-2-3) ·  [Stability AI](https://huggingface.co/stabilityai) · [HunyuanVideo](https://github.com/Tencent/HunyuanVideo) · [Wan](https://github.com/Wan-Video) · [Whisper](https://github.com/openai/whisper) · [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M)                                    |
|   **Model Hosting**    |                                                                                                                                                                     <a href="https://platform.openai.com/" class="icon-badge" title="OpenAI Platform">![OpenAI][oai]</a> <a href="https://www.anthropic.com/api" class="icon-badge" title="Anthropic API">![Anthropic][anth]</a> <a href="https://cloud.google.com/vertex-ai" class="icon-badge" title="Vertex AI">![Vertex AI][gcl]</a>                                                                                                                                                                      |                                                                                                                                                                    <a href="https://huggingface.co/" class="icon-badge" title="Hugging Face">![Hugging Face][hfzg]</a> <a href="https://openrouter.ai/" class="icon-badge" title="OpenRouter">![OpenRouter][or]</a> <a href="https://replicate.com/" class="icon-badge" title="Replicate">![Replicate][rep]</a> <a href="https://vast.ai/" class="icon-badge" title="Vast.ai">![Vast.ai][vast]</a>                                                                                                                                                                    |
|      **Runtimes**      |                                                                                                                                                                                                                                                                                                                     Cloud infrastructure                                                                                                                                                                                                                                                                                                                      | <a href="https://github.com/ggml-org/llama.cpp" class="icon-badge" title="llama.cpp">![llama.cpp][llcp]</a> <a href="https://ollama.com/" class="icon-badge" title="Ollama">![Ollama][oll]</a> <a href="https://lmstudio.ai/" class="icon-badge" title="LM Studio">![LM Studio][lms]</a> <a href="https://vllm.ai/" class="icon-badge" title="vLLM">![vLLM][vllm]</a> <a href="https://www.nomic.ai/gpt4all" class="icon-badge" title="GPT4All">![GPT4All][g4a]</a> <a href="https://github.com/triton-inference-server/server" class="icon-badge" title="Triton Inference Server">![Triton][triton]</a> <a href="https://github.com/comfyanonymous/ComfyUI" class="icon-badge" title="ComfyUI">![ComfyUI][comfy]</a> |
| **Vector DB / Memory** |                                                                                                                                                                                                                   <a href="https://www.pinecone.io/" class="icon-badge" title="Pinecone">![Pinecone][pc]</a> <a href="https://cloud.google.com/enterprise-search" class="icon-badge" title="Vertex AI Search">![Vertex AI Search][gcl]</a>                                                                                                                                                                                                                    |                                                                                                                                                                                                              <a href="https://qdrant.tech/" class="icon-badge" title="Qdrant">![Qdrant][qdr]</a> <a href="https://github.com/pgvector/pgvector" class="icon-badge" title="pgvector">![pgvector][pg]</a> <a href="https://www.mongodb.com/" class="icon-badge" title="MongoDB">![MongoDB][mdb]</a> <a href="https://www.sqlite.org/" class="icon-badge" title="SQLite">![SQLite][sqlite]</a>                                                                                                                                                                                                               |
| **Infra / Containers** |                                                                                                                                                                                        <a href="https://aws.amazon.com/" class="icon-badge" title="AWS">![AWS][aws]</a> <a href="https://azure.microsoft.com/" class="icon-badge" title="Azure">![Azure][azr]</a> <a href="https://cloud.google.com/" class="icon-badge" title="Google Cloud">![Google Cloud][gcl]</a>                                                                                                                                                                                        |                                                                                                                                                                                                                        <a href="https://www.docker.com/" class="icon-badge" title="Docker">![Docker][dock]</a> <a href="https://podman.io/" class="icon-badge" title="Podman">![Podman][pod]</a> <a href="https://www.terraform.io/" class="icon-badge" title="Terraform">![Terraform][tf]</a>                                                                                                                                                                                                                        |

> **Below the badges:** the foundation layers share no clean tooling icons. **Open** — corpora (FineWeb, RedPajama, The Stack), alignment (TRL, Alignment Handbook), frameworks (PyTorch, JAX, DeepSpeed, Megatron-LM), accelerators (NVIDIA H100/B200, AMD MI300X, Apple Silicon). **Closed** — undisclosed data, proprietary RLHF / Constitutional AI, internal orchestration, cloud ASICs (TPU, Trainium, Axion). Every open layer can be swapped or self-hosted; closed stacks are vertically integrated — lower friction, heavier lock-in.
>
> **On models:** every entry is the same transformer (plus **diffusion** for pixels/audio) — only training domain and size change. **Coding** and **multimodal** LLMs are where the labs compete hardest. Run open models locally with **[Ollama](https://ollama.com/)** (text), **[ComfyUI](https://github.com/comfyanonymous/ComfyUI)** (image/video/audio — the Ollama of pixels), and **[whisper.cpp](https://github.com/ggml-org/whisper.cpp)** (speech).

### What Is Mostly Standardized

- Markdown-first text output
- SSE + JSON delta streaming
- Markdown -> AST -> component render path
- MCP as practical tool-calling standard

The middle layers have converged; real differences concentrate in model behavior, context reliability, product UX, and ecosystem lock-in. For the provider-by-provider comparison — and what each chatbot can actually do (web search, Canvas/Artifacts, Mermaid, maps) — see [AI Chatbot Platforms](/blog/ai-chatbot-platforms/).

### The Minimal Stack

Four layers — **model, runtime, agent, hardware** — but two tools cover the software:

```bash
ollama run qwen3.6    # runtime + model
opencode              # optional agent
```

Prompt → tokens → embeddings → stacked Transformer blocks (self-attention + feed-forward, mostly GEMM); the runtime schedules the ops, the chip runs the multiply-adds. **Model = numbers, runtime = recipe, hardware = executor. Everything else is optional.**

---

## Context, Memory, Connectors, Skills & Plugins

A model on its own only knows its training data and what fits in the current prompt. A handful of mechanisms extend it — they're how a chatbot becomes an *agent*:

- **Context** — the token window the model sees *this turn* (prompt, files, tool output, history). Finite (often 200K–1M tokens); fill it with what's relevant, everything else gets truncated or summarized. *Think RAM: fast, small, wiped each turn.*
- **Memory** — state that **persists across turns/sessions** beyond the window: scratch files, conversation summaries, or a [vector DB](https://github.com/pgvector/pgvector) for retrieval (RAG). *Think disk: it persists.*
- **Connectors (MCP)** — the [Model Context Protocol](https://modelcontextprotocol.io/), a standard wire format for exposing tools, data, and actions to any model. One MCP server (GitHub, Postgres, filesystem, Slack…) works across Claude, ChatGPT, and IDEs — no per-app glue. *Think I/O bus, and it's the one that's converged: write a tool once, every model can call it.*
- **Skills** — folders of instructions, scripts, and resources the agent loads on demand to do a specific task its way ([skills.sh](https://www.skills.sh/), [anthropics/skills](https://github.com/anthropics/skills), [openai/skills](https://github.com/openai/skills)). Just files — portable across agents, version-controlled, no code to wire in. *Think a how-to manual the agent reads when the task calls for it.*
- **Plugins** — packaged bundles of tools/skills/prompts you install into a host app, built on MCP or a host's own API (ChatGPT apps, Claude/IDE plugins, editor extensions). *Think installed apps.*

---

## What You Actually Pay For

The software is mostly **free**. Open weights, runtimes ([Ollama](https://ollama.com/), llama.cpp, vLLM), MCP, and most of the tooling above cost nothing to download and run. The money goes to **compute and the managed service around it**:

- **Renting compute** — GPUs/TPUs are expensive and a large model needs a lot of them. You either rent *by the token* (a hosted API) or rent the *machine by the hour* ([Vast.ai](https://vast.ai/), [Replicate](https://replicate.com/), cloud GPUs). The bill tracks usage.
- **The managed platform** — a subscription (ChatGPT Plus, Claude Pro, Gemini AI Pro) bundles inference *plus* everything around it: uptime, scaling, guardrails, the app/UI, support, and the ongoing cost of training, post-training (RLHF), and the people who do it.

Run an open model on hardware you already own and the software is free — you only pay the electricity. The moment someone else runs it for you, you're paying rent on **their compute and their service**, not for the model itself.

> **Three pricing shapes:** *self-host* (free software, your hardware) · *per-token API* (rent compute by usage) · *subscription* (rent the whole managed platform).

## How to Choose

Pick where the work runs, then the smallest model that clears the task:

- **Local-first** — privacy, cost control, or offline matter most. [Ollama](https://ollama.com/) + an open model gets you running in one command; you trade some quality for full control.
- **Cloud-first** — setup speed and top-end quality matter most. A frontier API (Claude, GPT-5, Gemini) is the fastest path to the best answers, at the cost of per-token billing and lock-in.
- **Hybrid** — the common real-world default: a local loop for the cheap, high-volume work and a cloud fallback for the hard cases.

## The Takeaway

The model layer is no longer the bottleneck — open weights trail the frontier by months, not years, and the stack between them has converged on the same handful of standards (MCP, SSE streaming, markdown I/O). What separates a demo from a product now is **integration**: how you manage context, where you keep memory, which tools you wire in, and how reliably they run. The models are commodities; the system you build around them is the work.

## References

- [Agent Arena | AI Agent Performance Leaderboard](https://arena.ai/leaderboard/agent)
- [Artificial Analysis | AI Model & API Providers Analysis](https://artificialanalysis.ai/)
- [LiveBench | LLM Benchmark](https://livebench.ai/#/?highunseenbias=true)
- [Interneto | LLM Pricing](https://interneto.github.io/llm-pricing/)

<!-- favicon references -->
[ag]:     /img/assets/ai-tools/antigravity.svg
[gpt]:    /img/software/apps/chatgpt.svg
[claude]: /img/software/apps/claude.svg
[gem]:    /img/software/apps/gemini.svg
[grok]:   /img/software/apps/grok.svg
[dseek]:  /img/software/apps/deepseek.svg
[qwn]:    /img/assets/ai-tools/qwen.svg
[km]:     /img/assets/ai-tools/kimi.svg
[zai]:    /img/assets/ai-tools/zai.svg
[mag]:    /img/software/apps/magnific.svg
[el]:     /img/software/apps/elevenlabs.svg
[hig]:    /img/assets/ai-tools/higgsfield.svg
[cc]:     /img/software/apps/claude-code.svg
[cdx]:    /img/software/apps/codex.svg
[cline]:  /img/software/apps/cline.svg
[comfy]:  /img/software/apps/comfyui.svg
[cur]:    /img/assets/ai-tools/cursor.svg
[dock]:   /img/software/apps/docker.svg
[devin]:  /img/software/apps/devin.svg
[g4a]:    /img/assets/ai-tools/gpt4all.svg
[ghcli]:  /img/assets/ai-tools/github-copilot.svg
[herm]:   /img/assets/ai-tools/nousresearch-hermes.svg
[hfzg]:   /img/assets/ai-tools/huggingface.svg
[llcp]:   /img/software/apps/llama-cpp.svg
[lms]:    /img/assets/ai-tools/lmstudio.svg
[mdb]:    /img/software/apps/mongodb.svg
[mimo]:   /img/assets/ai-tools/xiaomi.svg
[mmx]:    /img/assets/ai-tools/minimax.svg
[oc]:     /img/assets/ai-tools/opencode.svg
[oi]:     /img/assets/ai-tools/open-interpreter.svg
[oll]:    /img/software/apps/ollama.svg
[or]:     /img/software/apps/openrouter.svg
[pg]:     /img/software/apps/postgresql.svg
[qdr]:    /img/assets/ai-tools/qdrant.svg
[pod]:    /img/software/apps/podman.svg
[rep]:    /img/software/apps/replicate.svg
[sqlite]: /img/software/apps/sqlite.svg
[tf]:     /img/software/apps/terraform.svg
[triton]: /img/assets/ai-tools/triton.svg
[vast]:   /img/assets/ai-tools/vast.svg
[vllm]:   /img/assets/ai-tools/vllm.svg
[vsc]:    /img/software/apps/visual-studio-code.svg
[vsm]:    /img/software/apps/vscodium.svg
[ws]:     /img/assets/ai-tools/windsurf.svg
[zed]:    /img/software/apps/zed.svg
[oai]:    /img/assets/ai-tools/openai.svg
[anth]:   /img/assets/ai-tools/anthropic.svg
[gcl]:    /img/assets/ai-tools/google-cloud.svg
[aws]:    /img/assets/ai-tools/aws.svg
[azr]:    /img/assets/ai-tools/azure.svg
[pc]:     /img/assets/ai-tools/pinecone.svg
