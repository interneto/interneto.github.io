---
title: AI Coding Tools
description: Understanding the stack, tools, and models powering modern AI coding
date: 2026-06-06
next: true
prev: true
footer: true
tags:
  - comparison
  - software
---

## What Is AI Coding?

AI coding is no longer one tool plus one model. Real workflows mix editor, agent, runtime, model host, and hardware depending on task, privacy, and budget.

This guide is compact by design:
1. The stack at a glance
2. Minimal local stack
3. Multimodal models
4. Build strategy

---

## The AI Stack

A frontier AI system is a vertical stack — **silicon at the bottom, the app on top**. Two ecosystems run in parallel: **open-source** layers you can self-host and swap freely, and **closed / proprietary** ones that trade portability for turnkey convenience and lock-in. The map below is the tooling at a glance, top of stack to bottom.

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

|    **Stack Layer**     |                                                                                                                                                                                                                                                                                                                                             **Open-Source**                                                                                                                                                                                                                                                                                                                                             |                                                                                                                                                                         **Proprietary**                                                                                                                                                                          |
|:----------------------:|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
|    **Code Editors**    |                                                                                                                                                                                                                   <a href="https://code.visualstudio.com/" class="icon-badge" title="VS Code">![VS Code][vsc]</a> <a href="https://zed.dev/" class="icon-badge" title="Zed">![Zed][zed]</a> <a href="https://vscodium.com/" class="icon-badge" title="VSCodium">![VSCodium][vsm]</a>                                                                                                                                                                                                                    |                                          <a href="https://antigravity.google/" class="icon-badge" title="Antigravity">![Antigravity][ag]</a> <a href="https://cursor.com/" class="icon-badge" title="Cursor">![Cursor][cur]</a> <a href="https://windsurf.com/" class="icon-badge" title="Windsurf">![Windsurf][ws]</a>                                          |
|    **Agents / CLI**    | <a href="https://openai.com/codex/" class="icon-badge" title="Codex">![Codex][cdx]</a> <a href="https://opencode.ai/" class="icon-badge" title="OpenCode">![OpenCode][oc]</a> <a href="https://www.openinterpreter.com/" class="icon-badge" title="Open Interpreter">![Open Interpreter][oi]</a> <a href="https://cline.bot/" class="icon-badge" title="Cline">![Cline][cline]</a> <a href="https://hermes-agent.nousresearch.com/" class="icon-badge" title="Hermes">![Hermes][herm]</a> <a href="https://github.com/MiniMax-AI/cli" class="icon-badge" title="MiniMax CLI">![MiniMax][mmx]</a> <a href="https://mimo.xiaomi.com/mimocode" class="icon-badge" title="MiMo Code">![MiMo Code][mimo]</a> |                               <a href="https://claude.ai/code" class="icon-badge" title="Claude Code">![Claude Code][cc]</a> <a href="https://devin.ai/" class="icon-badge" title="Devin">![Devin][devin]</a> <a href="https://github.com/features/copilot" class="icon-badge" title="GitHub Copilot">![GitHub Copilot][ghcli]</a>                               |
|     **AI Models**      |                                          <a href="https://www.llama.com/" class="icon-badge" title="Llama">![Llama][llm3]</a> <a href="https://qwenlm.github.io/" class="icon-badge" title="Qwen">![Qwen][qwen]</a> <a href="https://www.deepseek.com/" class="icon-badge" title="DeepSeek">![DeepSeek][dsv3]</a> <a href="https://mistral.ai/" class="icon-badge" title="Mistral">![Mistral][codes]</a> <a href="https://www.minimax.io/" class="icon-badge" title="MiniMax">![MiniMax][mmx]</a> <a href="https://mimo.xiaomi.com/" class="icon-badge" title="MiMo">![MiMo][mimo]</a> <a href="https://z.ai/" class="icon-badge" title="GLM">![GLM][glm]</a>                                           | <a href="https://www.anthropic.com/claude" class="icon-badge" title="Claude">![Claude][cla4]</a> <a href="https://openai.com/chatgpt" class="icon-badge" title="GPT">![GPT][gpt5]</a> <a href="https://ai.google.dev/" class="icon-badge" title="Gemini">![Gemini][gemini]</a> <a href="https://www.kimi.com/" class="icon-badge" title="Kimi">![Kimi][kimi]</a> |
|   **Model Hosting**    |                                                                                                                                                             <a href="https://huggingface.co/" class="icon-badge" title="Hugging Face">![Hugging Face][hfzg]</a> <a href="https://openrouter.ai/" class="icon-badge" title="OpenRouter">![OpenRouter][or]</a> <a href="https://replicate.com/" class="icon-badge" title="Replicate">![Replicate][rep]</a> <a href="https://vast.ai/" class="icon-badge" title="Vast.ai">![Vast.ai][vast]</a>                                                                                                                                                             |                       <a href="https://platform.openai.com/" class="icon-badge" title="OpenAI Platform">![OpenAI][oai]</a> <a href="https://www.anthropic.com/api" class="icon-badge" title="Anthropic API">![Anthropic][anth]</a> <a href="https://cloud.google.com/vertex-ai" class="icon-badge" title="Vertex AI">![Vertex AI][gcl]</a>                       |
|      **Runtimes**      |                                                <a href="https://github.com/ggml-org/llama.cpp" class="icon-badge" title="llama.cpp">![llama.cpp][llcp]</a> <a href="https://ollama.com/" class="icon-badge" title="Ollama">![Ollama][oll]</a> <a href="https://lmstudio.ai/" class="icon-badge" title="LM Studio">![LM Studio][lms]</a> <a href="https://vllm.ai/" class="icon-badge" title="vLLM">![vLLM][vllm]</a> <a href="https://www.nomic.ai/gpt4all" class="icon-badge" title="GPT4All">![GPT4All][g4a]</a> <a href="https://github.com/triton-inference-server/server" class="icon-badge" title="Triton Inference Server">![Triton][triton]</a>                                                 |                                                                                                                                                                       Cloud infrastructure                                                                                                                                                                       |
| **Vector DB / Memory** |                                                                                                                                                                                                       <a href="https://github.com/pgvector/pgvector" class="icon-badge" title="pgvector">![pgvector][pg]</a> <a href="https://www.mongodb.com/" class="icon-badge" title="MongoDB">![MongoDB][mdb]</a> <a href="https://www.sqlite.org/" class="icon-badge" title="SQLite">![SQLite][sqlite]</a>                                                                                                                                                                                                        |                                                                     <a href="https://www.pinecone.io/" class="icon-badge" title="Pinecone">![Pinecone][pc]</a> <a href="https://cloud.google.com/enterprise-search" class="icon-badge" title="Vertex AI Search">![Vertex AI Search][gcl]</a>                                                                     |
| **Infra / Containers** |                                                                                                                                                                                                                 <a href="https://www.docker.com/" class="icon-badge" title="Docker">![Docker][dock]</a> <a href="https://podman.io/" class="icon-badge" title="Podman">![Podman][pod]</a> <a href="https://www.terraform.io/" class="icon-badge" title="Terraform">![Terraform][tf]</a>                                                                                                                                                                                                                 |                                         <a href="https://aws.amazon.com/" class="icon-badge" title="AWS">![AWS][aws]</a> <a href="https://azure.microsoft.com/" class="icon-badge" title="Azure">![Azure][azr]</a> <a href="https://cloud.google.com/" class="icon-badge" title="Google Cloud">![Google Cloud][gcl]</a>                                          |

> **Below the badges:** the foundation layers share no clean tooling icons. **Open** — corpora (FineWeb, RedPajama, The Stack), alignment (TRL, Alignment Handbook), frameworks (PyTorch, JAX, DeepSpeed, Megatron-LM), accelerators (NVIDIA H100/B200, AMD MI300X, Apple Silicon). **Closed** — undisclosed data, proprietary RLHF / Constitutional AI, internal orchestration, cloud ASICs (TPU, Trainium, Axion). Every open layer can be swapped or self-hosted; closed stacks are vertically integrated — lower friction, heavier lock-in.

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

## Multimodal AI: Beyond Text and Code

The same machinery — transformers plus **diffusion** models for pixels and audio — generates speech, images, video, and music. These aren't tools; they're models. They run identical forward-pass math on identical hardware; only the training domain changes. The closed-vs-open split repeats across every modality:

| Modality                 | Closed / Proprietary                                                                                                    | Open-Source                                                                                                                                           | Run it locally with                                    |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| **Speech-to-text (STT)** | [OpenAI gpt-4o-transcribe](https://platform.openai.com/docs/guides/speech-to-text) / [Deepgram](https://deepgram.com/)  | [Whisper](https://github.com/openai/whisper) / [Moonshine](https://github.com/kakao-ai/moonshine)                                                     | [whisper.cpp](https://github.com/ggml-org/whisper.cpp) |
| **Text-to-speech (TTS)** | [ElevenLabs](https://elevenlabs.io/) / [OpenAI TTS](https://platform.openai.com/docs/guides/text-to-speech)             | [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) / [XTTS](https://github.com/coqui-ai/TTS)                                                         | [ComfyUI](https://github.com/comfyanonymous/ComfyUI)   |
| **Image generation**     | [Midjourney](https://www.midjourney.com/) / [GPT Image](https://platform.openai.com/docs/guides/vision)                 | [FLUX.1](https://huggingface.co/black-forest-labs/FLUX.1-dev) / [Stable Diffusion 3.5](https://huggingface.co/stabilityai/stable-diffusion-3.5-large) | [ComfyUI](https://github.com/comfyanonymous/ComfyUI)   |
| **Video generation**     | [Sora](https://openai.com/sora) / [Runway Gen-4](https://runwayml.com/)                                                 | [HunyuanVideo](https://github.com/Tencent/HunyuanVideo) / [LTX-Video](https://github.com/Lightricks/LTX-Video)                                        | [ComfyUI](https://github.com/comfyanonymous/ComfyUI)   |
| **Embeddings**           | [OpenAI text-embedding-3](https://platform.openai.com/docs/guides/embeddings) / [Cohere](https://cohere.com/embeddings) | [BGE](https://huggingface.co/BAAI/bge-large-en-v1.5) / [Nomic Embed](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)                           | [Ollama](https://ollama.com/)                          |

> **Note:** Image, video, and audio use **ComfyUI** as the universal open runtime — the Ollama of pixels. Speech uses **whisper.cpp**. Reverse flows (image/audio → understanding) are handled by multimodal LLMs above.

---

## Build Strategy in 2026

Use this quick decision rule:

- Local-first when privacy, cost control, or offline operation dominates
- Cloud-first when setup speed and model quality dominate
- Hybrid when you want local dev loops plus cloud fallback for hard tasks

At this point, the hard problem is no longer model availability. It is integration quality: latency, reliability, memory design, and tool orchestration.

<!-- favicon references -->
[ag]:     /img/assets/ai-coding-tools/antigravity.svg
[cc]:     /img/software/apps/claude-code.svg
[cdx]:    /img/software/apps/codex.svg
[cla4]:   /img/software/apps/claude.svg
[cline]:  /img/software/apps/cline.svg
[codes]:  /img/assets/ai-coding-tools/mistral.svg
[cur]:    /img/assets/ai-coding-tools/cursor.svg
[dock]:   /img/software/apps/docker.svg
[dsv3]:   /img/software/apps/deepseek.svg
[devin]:  /img/software/apps/devin.svg
[g4a]:    /img/assets/ai-coding-tools/gpt4all.svg
[gemini]: /img/software/apps/gemini.svg
[ghcli]:  /img/assets/ai-coding-tools/github-copilot.svg
[glm]:    /img/assets/ai-coding-tools/zai.svg
[gpt5]:   /img/software/apps/chatgpt.svg
[herm]:   /img/assets/ai-coding-tools/nousresearch-hermes.svg
[hfzg]:   /img/assets/ai-coding-tools/huggingface.svg
[kimi]:   /img/assets/ai-coding-tools/kimi.svg
[llcp]:   /img/software/apps/llama-cpp.svg
[llm3]:   /img/assets/ai-coding-tools/meta.svg
[lms]:    /img/assets/ai-coding-tools/lmstudio.svg
[mdb]:    /img/software/apps/mongodb.svg
[mimo]:   /img/assets/ai-coding-tools/xiaomi.svg
[mmx]:    /img/assets/ai-coding-tools/minimax.svg
[oc]:     /img/assets/ai-coding-tools/opencode.svg
[oi]:     /img/assets/ai-coding-tools/open-interpreter.svg
[oll]:    /img/software/apps/ollama.svg
[or]:     /img/software/apps/openrouter.svg
[pg]:     /img/software/apps/postgresql.svg
[pod]:    /img/software/apps/podman.svg
[qwen]:   /img/assets/ai-coding-tools/qwen.svg
[rep]:    /img/software/apps/replicate.svg
[sqlite]: /img/software/apps/sqlite.svg
[tf]:     /img/software/apps/terraform.svg
[triton]: /img/assets/ai-coding-tools/triton.svg
[vast]:   /img/assets/ai-coding-tools/vast.svg
[vllm]:   /img/assets/ai-coding-tools/vllm.svg
[vsc]:    /img/software/apps/visual-studio-code.svg
[vsm]:    /img/software/apps/vscodium.svg
[ws]:     /img/assets/ai-coding-tools/windsurf.svg
[zed]:    /img/software/apps/zed.svg
[oai]:    /img/assets/ai-coding-tools/openai.svg
[anth]:   /img/assets/ai-coding-tools/anthropic.svg
[gcl]:    /img/assets/ai-coding-tools/google-cloud.svg
[aws]:    /img/assets/ai-coding-tools/aws.svg
[azr]:    /img/assets/ai-coding-tools/azure.svg
[pc]:     /img/assets/ai-coding-tools/pinecone.svg
