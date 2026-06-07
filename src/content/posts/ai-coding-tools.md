---
title: AI Coding Tools
description: Understanding the stack, tools, and models powering modern AI coding
date: 2026-04-29
next: true
prev: true
footer: true
---

## What Is AI Coding?

AI coding is no longer one tool and one model. Productive workflows now combine editors, coding interfaces, and model runtimes — and you choose them independently based on task, privacy, and team setup.

This guide explains **what you need to know** to build or use an AI-powered coding system:
1. The industry architecture — two competing stacks
2. Why closed models lead — the data flywheel
3. What a minimal viable stack looks like — and where the math runs
4. Which tools do what — comprehensive catalog across layers

---

## The Industry Stack

A frontier AI system is a vertical stack — from **silicon at the bottom to the app at the top**. Below are two ecosystems: the **closed / proprietary** labs (OpenAI · Anthropic · Google) and the **open-source** stack you can self-host. Read top-down (user-facing) to bottom (foundation); proprietary entries follow OpenAI/Anthropic/Google order, with `/` separating alternatives.

| **Stack Layer**                  | **Closed / Proprietary Ecosystem**                               | **Open-Source / Self-Hosted Ecosystem**                                                       |
|----------------------------------|------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| **App (UI/UX)**                  | ChatGPT, Claude, Gemini                                          | Open WebUI, AnythingLLM, Jan                                                                  |
| **Coding Agent**                 | GitHub Copilot, Claude Code, Cursor                              | Cline, Aider, OpenDevin (All Hands)                                                           |
| **Agent SDK / Orchestrator**     | OpenAI Assistants API, LangChain Smith (Managed)                 | LangChain, LlamaIndex, CrewAI, Autogen                                                        |
| **Vector DB / Memory**           | Pinecone, Vertex AI Search, Enterprise Weaviate                  | pgvector, Qdrant, Chroma, Milvus                                                              |
| **Model**                        | GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro                        | Llama 3, Qwen 2.5, DeepSeek-V3, Phi-4                                                         |
| **API / Model Hosting**          | OpenAI Platform, Anthropic API, Vertex AI                        | _Self-hosted:_ vLLM, Ollama, TGI <br> _Managed Open-Model Providers:_ OpenRouter, Together AI |
| **Inference Runtime**            | Proprietary internal engines (Google/OpenAI)                     | vLLM, Ollama, llama.cpp, SGLang, TensorRT-LLM                                                 |
| **Pre-training Data**            | Undisclosed web scraping, licensed media, private synthetic data | Open corpora (FineWeb, RedPajama, The Stack)                                                  |
| **Alignment (RLHF/DPO)**         | Proprietary RLHF, Constitutional AI, RL methods                  | Open-source alignment pipelines (TRL, Alignment Handbook), Open datasets                      |
| **Training Frameworks**          | Custom internal orchestration layers                             | PyTorch, JAX, DeepSpeed, Megatron-LM                                                          |
| **Infrastructure Orchestration** | Managed hyperscaler clusters                                     | Kubernetes, Ray, Slurm (bare-metal)                                                           |
| **Cloud Compute**                | AWS, Azure, Google Cloud (TPUs)                                  | RunPod, Vast.ai, Lambda Labs, on-prem clusters                                                |
| **Hardware Accelerator**         | Custom Cloud ASICs (TPU, Trainium, Axion)                        | NVIDIA GPUs (H100/B200), AMD Instinct (MI300X), Apple Silicon                                 |
| **Interconnect**                 | InfiniBand, NVLink / NVSwitch (NVIDIA ecosystem)                 | Ultra Ethernet, Standard RoCE/Ethernet                                                        |

> **Note:** Closed stacks are vertically integrated — lower cost and tighter control, but heavier lock-in. The open-source stack trades turnkey convenience for portability: every layer, from the chip to the app, can be swapped or self-hosted.

### Why Closed Models Lead: The Data Flywheel

The two ecosystems share identical chips, frameworks, and architectures. **Raw pre-training is commoditizing.** The edge of closed labs lives in **post-training**: proprietary human-preference data, reward models, and a tight eval loop. This creates a **flywheel**: frontier model → product → millions of users → feedback → better post-training → better model. Users spin it for free. Open weights copy the artifact, not the loop that produced it.

The open stack has the machinery but lacks product-scale feedback. The independent path: **RLVR (RL with verifiable rewards)** — for code/math, rewards are automatic (tests pass, answer checks). Perfect for coding, needs no massive user base.

### The Minimal Stack: What You Actually Need

A developer needs **four layers**; two tools cover it:

```bash
ollama run qwen3.6    # runtime + model
opencode              # optional agent
```

| Layer        | Tool / Component      | What it does                |
|--------------|-----------------------|-----------------------------|
| **Agent**    | OpenCode *(optional)* | Intent → prompts + tools    |
| **Runtime**  | Ollama (llama.cpp)    | Transformer forward pass    |
| **Model**    | Qwen Coder (GGUF)     | Learned weight matrices     |
| **Hardware** | GPU / CPU             | Matrix multiply + attention |

**The computation:** Prompt → tokens → embeddings → stacked Transformer blocks (self-attention + feed-forward = mostly GEMM). Runtime schedules operations; chip executes them — billions of multiply-adds per token.

**Summary:** Model = numbers. Runtime = recipe. Hardware = executor. Everything else is optional.

## AI Components

<style>
.icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5em;
  height: 2.5em;
  margin: 0.3em;
  background: rgba(128,128,128,0.08);
  border: 1px solid rgba(128,128,128,0.2);
  border-radius: 0.5em;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
</style>

|    AI components    |                                                                                                                                                                                                                                                  Open-Source                                                                                                                                                                                                                                                   |                                                                                                                                                                           Proprietary                                                                                                                                                                            |
|:-------------------:|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
| **Local Runtimes**  |                      <a href="https://github.com/ggml-org/llama.cpp" class="icon-badge" title="llama.cpp">![llama.cpp][llcp]</a> <a href="https://ollama.com/" class="icon-badge" title="Ollama">![Ollama][oll]</a> <a href="https://lmstudio.ai/" class="icon-badge" title="LM Studio">![LM Studio][lms]</a> <a href="https://vllm.ai/" class="icon-badge" title="vLLM">![vLLM][vllm]</a> <a href="https://www.nomic.ai/gpt4all" class="icon-badge" title="GPT4All">![GPT4All][g4a]</a>                       |                                                                                                                                                                                                                                                                                                                                                                  |
|  **Code Editors**   |                                                                                                                                                                   <a href="https://code.visualstudio.com/" class="icon-badge" title="VS Code">![VS Code][vsc]</a> <a href="https://zed.dev/" class="icon-badge" title="Zed">![Zed][zed]</a>                                                                                                                                                                    |                                          <a href="https://antigravity.google/" class="icon-badge" title="Antigravity">![Antigravity][ag]</a> <a href="https://cursor.com/" class="icon-badge" title="Cursor">![Cursor][cur]</a> <a href="https://windsurf.com/" class="icon-badge" title="Windsurf">![Windsurf][ws]</a>                                          |
|  **Agents / CLI**   | <a href="https://openai.com/codex/" class="icon-badge" title="Codex">![Codex][cdx]</a> <a href="https://opencode.ai/" class="icon-badge" title="OpenCode">![OpenCode][oc]</a> <a href="https://www.openinterpreter.com/" class="icon-badge" title="Open Interpreter">![Open Interpreter][oi]</a> <a href="https://hermes-agent.nousresearch.com/" class="icon-badge" title="Hermes">![Hermes][herm]</a> <a href="https://github.com/MiniMax-AI/cli" class="icon-badge" title="MiniMax CLI">![MiniMax][mmx]</a> |                               <a href="https://claude.ai/code" class="icon-badge" title="Claude Code">![Claude Code][cc]</a> <a href="https://devin.ai/" class="icon-badge" title="Devin">![Devin][devin]</a> <a href="https://github.com/features/copilot" class="icon-badge" title="GitHub Copilot">![GitHub Copilot][ghcli]</a>                               |
| **Model Platforms** |                                                                <a href="https://huggingface.co/" class="icon-badge" title="Hugging Face">![Hugging Face][hfzg]</a> <a href="https://openrouter.ai/" class="icon-badge" title="OpenRouter">![OpenRouter][or]</a> <a href="https://replicate.com/" class="icon-badge" title="Replicate">![Replicate][rep]</a> <a href="https://vast.ai/" class="icon-badge" title="Vast.ai">![Vast.ai][vast]</a>                                                                 |                                                                                                                                                                                                                                                                                                                                                                  |
|    **AI Models**    |                                                                       <a href="https://www.llama.com/" class="icon-badge" title="Llama">![Llama][llm3]</a> <a href="https://qwenlm.github.io/" class="icon-badge" title="Qwen">![Qwen][qwen]</a> <a href="https://www.deepseek.com/" class="icon-badge" title="DeepSeek">![DeepSeek][dsv3]</a> <a href="https://mistral.ai/" class="icon-badge" title="Codestral">![Mistral][codes]</a>                                                                        | <a href="https://www.anthropic.com/claude" class="icon-badge" title="Claude">![Claude][cla4]</a> <a href="https://openai.com/chatgpt" class="icon-badge" title="GPT">![GPT][gpt5]</a> <a href="https://ai.google.dev/" class="icon-badge" title="Gemini">![Gemini][gemini]</a> <a href="https://www.kimi.com/" class="icon-badge" title="Kimi">![Kimi][kimi]</a> |

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

## Building Jarvis: Integration Over Capability

Assemble the pieces above and you get something familiar: a system you **talk to**, that **sees**, **reasons**, **plans**, writes code, **generates** visuals, **calls tools**, and **remembers**. That is **J.A.R.V.I.S.** from Iron Man.

The films treated it as one seamless intelligence. The stacks above show the same capability set — separate models unified behind a runtime. **Most of Jarvis already exists.** It simply isn't fused into one low-latency, always-on, autonomous system yet.

| Jarvis capability   | Built from (today's stack)                          | Status        |
|---------------------|-----------------------------------------------------|---------------|
| Talk & listen       | STT + LLM + TTS (Whisper → GPT/Claude → ElevenLabs) | ✅ Works today |
| Reason & plan       | Frontier LLM + agent loop                           | ✅ Strong      |
| See & understand    | Multimodal LLM (vision)                             | ✅ Works today |
| Design & generate   | Image / video / 3D models (FLUX / Veo / TRELLIS)    | ◑ Partial     |
| Act — control tools | Agent SDK + MCP + tool calling                      | ◑ Sandboxed   |
| Remember            | Vector DB + long context                            | ◑ Improving   |
| Always-on autonomy  | Orchestration + RLVR agents                         | ❌ Not yet     |
| Physical embodiment | Robotics + world models                             | ❌ Early       |

> **What is still science fiction:** not the individual abilities — those ship today — but the *integration*: sub-second multimodal round-trips, reliable long-horizon autonomy with no human in the loop, persistent lifelong memory, and a grounded world model for acting in physical space. Jarvis is now an **orchestration and reliability** problem, not a capability one.

---

## Agent Skills: Extending Capabilities

Agent skills are reusable `.md` instruction sets that embed domain knowledge into agents without retraining. Teach coding patterns, API protocols, company standards, or specialized workflows.

- **Registries:** [skills.sh](https://skills.sh/) · [agentskills.io](https://agentskills.io/) · [ClawHub](https://clawhub.ai/)
- **Official:** [Anthropic](https://github.com/anthropics/skills) · [OpenAI](https://github.com/openai/skills) · [Google](https://github.com/google/skills)
- **Learn:** [Prompting Guide](https://www.promptingguide.ai/) · [Learn Prompting](https://learnprompting.org/)

---

## Where We Are

**The capability exists today.** The full stack is shipped: frontier models, open-source alternatives, local runtimes, agents, multimodal synthesis, and autonomous tool-use. For coding specifically, the gap between theory and shipping code is now near-zero.

**The remaining work is integration.** Jarvis requires not new capabilities but reliable orchestration: sub-second multimodal latency, persistent memory across sessions, autonomous long-horizon planning without human intervention, and physical grounding for robots. These are engineering and reliability problems — not research frontiers.

**The 2026 choice:** Run locally for privacy, use cloud for simplicity, or mix both. The tools exist. The models exist. The math is public. The question is no longer *what can we build* but *how do we build it well*.

<!-- favicon references -->
[ag]:     /img/assets/ai-coding-tools/antigravity.svg
[cc]:     /img/software/apps/claude-code.svg
[cdx]:    /img/software/apps/codex.svg
[cla4]:   /img/software/apps/claude.svg
[cline]:   /img/software/apps/cline.svg
[codes]:  /img/assets/ai-coding-tools/mistral.svg
[cur]:    /img/assets/ai-coding-tools/cursor.svg
[dsv3]:   /img/software/apps/deepseek.svg
[devin]:  /img/software/apps/devin.svg
[g4a]:    /img/assets/ai-coding-tools/gpt4all.svg
[gemini]: /img/software/apps/gemini.svg
[ghcli]:  /img/assets/ai-coding-tools/github-copilot.svg
[gpt5]:   /img/software/apps/chatgpt.svg
[herm]:   /img/assets/ai-coding-tools/nousresearch.svg
[hfzg]:   /img/assets/ai-coding-tools/huggingface.svg
[kimi]:   /img/assets/ai-coding-tools/kimi.svg
[llcp]:   /img/software/apps/llama-cpp.svg
[llm3]:   /img/assets/ai-coding-tools/meta.svg
[lms]:    /img/assets/ai-coding-tools/lmstudio.svg
[mimo]:   /img/assets/ai-coding-tools/xiaomi.svg
[mmx]:    /img/assets/ai-coding-tools/minimax.svg
[oc]:     /img/assets/ai-coding-tools/opencode.svg
[odys]:   /img/software/apps/odysseus.svg
[oi]:     /img/assets/ai-coding-tools/open-interpreter.svg
[oll]:    /img/software/apps/ollama.svg
[oclaw]:  /img/software/apps/github.svg
[openai]: /img/software/apps/chatgpt.svg
[ollama]: /img/software/apps/ollama.svg
[or]:     /img/software/apps/openrouter.svg
[qwen]:   /img/assets/ai-coding-tools/qwen.svg
[rep]:    /img/software/apps/replicate.svg
[vast]:   /img/assets/ai-coding-tools/vast.svg
[vllm]:   /img/assets/ai-coding-tools/vllm.svg
[vsc]:    /img/software/apps/visual-studio-code.svg
[ws]:     /img/assets/ai-coding-tools/windsurf.svg
[zed]:    /img/software/apps/zed.svg
