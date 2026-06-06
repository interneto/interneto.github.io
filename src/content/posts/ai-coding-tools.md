---
title: AI Coding in 2026
description: Understanding the stack, tools, and models powering modern AI coding
date: 2026-04-29
next: true
prev: true
footer: true
---

## What Is AI Coding?

AI coding is no longer one tool and one model. Productive workflows now combine editors, coding interfaces, and model runtimes — and you choose them independently based on task, privacy, and team setup.

This guide explains **what you need to know** to build or use an AI-powered coding system: the industry architecture, why closed models lead, what a minimal viable stack looks like, and which tools do what.

Three layers power modern AI coding:
- **Editor-native AI** — inline completions and edits, in your editor
- **Coding agents** — autonomous CLI/cloud interfaces for complex tasks  
- **Model runtimes and APIs** — local inference or hosted cloud compute

---

## The Industry Stack

A frontier AI system is a vertical stack — from **silicon at the bottom to the app at the top**. Below are two ecosystems: the **closed / proprietary** labs (OpenAI · Anthropic · Google) and the **open-source** stack you can self-host. Read top-down (user-facing) to bottom (foundation); proprietary entries follow OpenAI/Anthropic/Google order, with `/` separating alternatives.

| Stack layer             | <img src="/img/software/apps/chatgpt.svg" alt="OpenAI" style="height:1.1em;vertical-align:-.18em;border-radius:0"> <img src="/img/software/apps/claude.svg" alt="Anthropic" style="height:1.1em;vertical-align:-.18em;border-radius:0"> <img src="/img/software/apps/gemini.svg" alt="Google" style="height:1.1em;vertical-align:-.18em;border-radius:0"> Closed / Proprietary | <img src="/img/assets/ai-coding-tools/meta.svg" alt="Llama" style="height:1.1em;vertical-align:-.18em;border-radius:0"> <img src="/img/assets/ai-coding-tools/qwen.svg" alt="Qwen" style="height:1.1em;vertical-align:-.18em;border-radius:0"> <img src="/img/software/apps/deepseek.svg" alt="DeepSeek" style="height:1.1em;vertical-align:-.18em;border-radius:0"> <img src="/img/assets/ai-coding-tools/kimi.svg" alt="Kimi" style="height:1.1em;vertical-align:-.18em;border-radius:0"> Open-Source |
|-------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **App**                 | ChatGPT / Claude / Gemini                                                                                                                                                                                                                                                                                                                                                      | Open WebUI / LM Studio / Jan                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Coding agent**        | Codex / Claude Code / Antigravity                                                                                                                                                                                                                                                                                                                                              | OpenCode / Cline / Aider                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Agent SDK**           | OpenAI Agents / Claude Agent SDK / Google ADK                                                                                                                                                                                                                                                                                                                                  | LangChain / LlamaIndex / CrewAI                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Vector DB / memory**  | Proprietary / managed (e.g. Vertex AI Search)                                                                                                                                                                                                                                                                                                                                  | pgvector / Qdrant / Chroma / Weaviate                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Model**               | GPT-5.5 / Claude Opus / Gemini 3 Pro                                                                                                                                                                                                                                                                                                                                           | Llama 4 / Qwen / DeepSeek / Kimi K2                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **API / Platform**      | OpenAI Platform / Anthropic API / Vertex AI                                                                                                                                                                                                                                                                                                                                    | OpenRouter / Together AI / Replicate                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Inference runtime**   | Proprietary serving (e.g. TensorRT-LLM)                                                                                                                                                                                                                                                                                                                                        | vLLM / Ollama / llama.cpp / SGLang                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Pre-training**        | Next-token on web + licensed + synthetic (undisclosed mix)                                                                                                                                                                                                                                                                                                                     | Next-token on open corpora (FineWeb / The Stack)                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Alignment**           | SFT / RLHF / Constitutional AI (Anthropic)                                                                                                                                                                                                                                                                                                                                     | SFT / DPO / RLHF (open preference data)                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Training framework**  | PyTorch / JAX                                                                                                                                                                                                                                                                                                                                                                  | PyTorch / DeepSpeed / Megatron                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Orchestration**       | Internal (Kubernetes / Ray)                                                                                                                                                                                                                                                                                                                                                    | Kubernetes / Ray / Slurm                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Operating system**    | Linux (Ubuntu / Debian / custom)                                                                                                                                                                                                                                                                                                                                               | Linux / macOS / Windows (self-host)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Cloud / data center** | Azure / AWS / Google Cloud                                                                                                                                                                                                                                                                                                                                                     | Vast.ai / RunPod / self-hosted                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Accelerator (chips)** | NVIDIA / TPU / Trainium / Broadcom (custom)                                                                                                                                                                                                                                                                                                                                    | NVIDIA / AMD / Apple Silicon                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Interconnect**        | NVLink / InfiniBand                                                                                                                                                                                                                                                                                                                                                            | InfiniBand / Ethernet                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

> **Note:** Closed stacks are vertically integrated — lower cost and tighter control, but heavier lock-in. The open-source stack trades turnkey convenience for portability: every layer, from the chip to the app, can be swapped or self-hosted.

### Why Closed Models Lead: The Data Flywheel

The two ecosystems share identical chips, training frameworks, and transformer architectures. **Raw pre-training is commoditizing.** The edge of closed labs lives in **post-training**: proprietary human-preference data, reward models, and a tight eval loop never published.

This creates a **flywheel**: frontier model → product → millions of users → fresh feedback → better post-training → better model. Users spin it for free. Open weights copy the artifact, not the loop.

The open stack has the machinery but lacks the fuel (product-scale feedback). The independent path: **RLVR (RL with verifiable rewards)** — for code/math, rewards are automatic (tests pass, answer checks). Perfect for coding, needs no massive user base.

### The Minimal Stack: What You Actually Need

A developer needs **four layers**; two tools cover it:

```bash
ollama run qwen3.6    # runtime + model
opencode              # optional agent
```

| Layer | You need | What it does |
|-------|----------|--------------|
| **Agent** | OpenCode *(optional)* | Intent → prompts + tools |
| **Runtime** | Ollama (llama.cpp) | Transformer forward pass |
| **Model** | Qwen Coder (GGUF) | Learned weight matrices |
| **Hardware** | GPU/CPU | Matrix multiply + attention |

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
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
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

|    AI components    |                                                                                                                                                                                                                                                                 Open-Source                                                                                                                                                                                                                                                                  |                                                                                                                                                                                         Proprietary                                                                                                                                                                                         |
|:-------------------:|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
| **Local Runtimes**  |                                     <a href="https://ollama.com/" class="icon-badge" title="Ollama">![Ollama][oll]</a> <a href="https://lmstudio.ai/" class="icon-badge" title="LM Studio">![LM Studio][lms]</a> <a href="https://github.com/ggml-org/llama.cpp" class="icon-badge" title="llama.cpp">![llama.cpp][llcp]</a> <a href="https://vllm.ai/" class="icon-badge" title="vLLM">![vLLM][vllm]</a> <a href="https://www.nomic.ai/gpt4all" class="icon-badge" title="GPT4All">![GPT4All][g4a]</a>                                      |                                                                                                                                                                                                                                                                                                                                                                                             |
|  **Code Editors**   |                                           <a href="https://antigravity.google/" class="icon-badge" title="Antigravity">![Antigravity][ag]</a> <a href="https://cursor.com/" class="icon-badge" title="Cursor">![Cursor][cur]</a> <a href="https://code.visualstudio.com/" class="icon-badge" title="VS Code">![VS Code][vsc]</a> <a href="https://windsurf.com/" class="icon-badge" title="Windsurf">![Windsurf][ws]</a> <a href="https://zed.dev/" class="icon-badge" title="Zed">![Zed][zed]</a>                                           |                                                                                                                                                                                                                                                                                                                                                                                             |
|  **Agents / CLI**   | <a href="https://opencode.ai/" class="icon-badge" title="OpenCode">![OpenCode][oc]</a> <a href="https://www.openinterpreter.com/" class="icon-badge" title="Open Interpreter">![Open Interpreter][oi]</a> <a href="https://hermes-agent.nousresearch.com/" class="icon-badge" title="Hermes">![Hermes][herm]</a> <a href="https://github.com/MiniMax-AI/cli" class="icon-badge" title="MiniMax CLI">![MiniMax][mmx]</a> <a href="https://github.com/pewdiepie-archdaemon/odysseus" class="icon-badge" title="Odysseus">![Odysseus][odys]</a> | <a href="https://claude.ai/code" class="icon-badge" title="Claude Code">![Claude Code][cc]</a> <a href="https://openai.com/codex/" class="icon-badge" title="Codex">![Codex][cdx]</a> <a href="https://devin.ai/" class="icon-badge" title="Devin">![Devin][devin]</a> <a href="https://github.com/features/copilot" class="icon-badge" title="GitHub Copilot">![GitHub Copilot][ghcli]</a> |
| **Model Platforms** |                                                                               <a href="https://huggingface.co/" class="icon-badge" title="Hugging Face">![Hugging Face][hfzg]</a> <a href="https://openrouter.ai/" class="icon-badge" title="OpenRouter">![OpenRouter][or]</a> <a href="https://replicate.com/" class="icon-badge" title="Replicate">![Replicate][rep]</a> <a href="https://vast.ai/" class="icon-badge" title="Vast.ai">![Vast.ai][vast]</a>                                                                                |                                                                                                                                                                                                                                                                                                                                                                                             |
|    **AI Models**    |                                                                                      <a href="https://www.llama.com/" class="icon-badge" title="Llama">![Llama][llm3]</a> <a href="https://qwenlm.github.io/" class="icon-badge" title="Qwen">![Qwen][qwen]</a> <a href="https://www.deepseek.com/" class="icon-badge" title="DeepSeek">![DeepSeek][dsv3]</a> <a href="https://mistral.ai/" class="icon-badge" title="Codestral">![Mistral][codes]</a>                                                                                       |              <a href="https://www.anthropic.com/claude" class="icon-badge" title="Claude">![Claude][cla4]</a> <a href="https://openai.com/chatgpt" class="icon-badge" title="GPT">![GPT][gpt5]</a> <a href="https://ai.google.dev/" class="icon-badge" title="Gemini">![Gemini][gemini]</a> <a href="https://www.kimi.com/" class="icon-badge" title="Kimi">![Kimi][kimi]</a>               |

---

## Multimodal AI: Beyond Text and Code

The same machinery — transformers plus **diffusion** models for pixels and audio — generates speech, images, video, and music. These aren't tools; they're models. They run identical forward-pass math on identical hardware; only the training domain changes. The closed-vs-open split repeats across every modality:

| Modality                 | Closed / Proprietary                                                                                                                                                                        | Open-Source                                                                                                                                                                                                                        | Run it locally with                                                                                                  |
|--------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| **Speech-to-text (STT)** | [OpenAI gpt-4o-transcribe](https://platform.openai.com/docs/guides/speech-to-text) / [Deepgram](https://deepgram.com/) / [ElevenLabs Scribe](https://elevenlabs.io/features/speech-to-text) | [Whisper](https://github.com/openai/whisper) / [NVIDIA Parakeet](https://github.com/NVIDIA/NeMo) / [Moonshine](https://github.com/kakao-ai/moonshine)                                                                              | [whisper.cpp](https://github.com/ggml-org/whisper.cpp) / [faster-whisper](https://github.com/SYSTRAN/faster-whisper) |
| **Text-to-speech (TTS)** | [ElevenLabs](https://elevenlabs.io/) / [OpenAI TTS](https://platform.openai.com/docs/guides/text-to-speech) / [Cartesia](https://cartesia.ai/)                                              | [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) / [XTTS](https://github.com/coqui-ai/TTS) / [Piper](https://github.com/rhasspy/piper) / [Orpheus](https://github.com/camb-ai/orpheus)                                          | [Piper](https://github.com/rhasspy/piper) / [ComfyUI](https://github.com/comfyanonymous/ComfyUI)                     |
| **Image generation**     | [Midjourney](https://www.midjourney.com/) / [GPT Image](https://platform.openai.com/docs/guides/vision) / [Google Nano Banana](https://ai.google.dev/models/gemini-2-0-flash)               | [FLUX.1](https://huggingface.co/black-forest-labs/FLUX.1-dev) / [Stable Diffusion 3.5](https://huggingface.co/stabilityai/stable-diffusion-3.5-large) / [Qwen-Image](https://github.com/QwenLM/Qwen-VL)                            | [ComfyUI](https://github.com/comfyanonymous/ComfyUI) / [Diffusers](https://github.com/huggingface/diffusers)         |
| **Video generation**     | [Sora](https://openai.com/sora) / [Veo 3](https://deepmind.google/technologies/veo/) / [Runway Gen-4](https://runwayml.com/) / [Kling](https://klingai.com/)                                | [Wan 2.2](https://huggingface.co/alimama-creative/Wan2.2) / [HunyuanVideo](https://github.com/Tencent/HunyuanVideo) / [LTX-Video](https://github.com/Lightricks/LTX-Video) / [Mochi](https://huggingface.co/genmo/mochi-1-preview) | [ComfyUI](https://github.com/comfyanonymous/ComfyUI)                                                                 |
| **Music / audio**        | [Suno](https://suno.com/) / [Udio](https://www.udio.com/) / [Google Lyria](https://deepmind.google/technologies/lyria/)                                                                     | [Stable Audio](https://www.stableaudio.com/) / [MusicGen](https://github.com/facebookresearch/audiocraft) / [ACE-Step](https://huggingface.co/Amplabs/ACE-Step)                                                                    | [Transformers](https://huggingface.co/docs/transformers/) / [ComfyUI](https://github.com/comfyanonymous/ComfyUI)     |
| **Embeddings**           | [OpenAI text-embedding-3](https://platform.openai.com/docs/guides/embeddings) / [Cohere](https://cohere.com/embeddings) / [Voyage](https://www.voyageai.com/)                               | [BGE](https://huggingface.co/BAAI/bge-large-en-v1.5) / [Nomic Embed](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) / [Qwen3-Embedding](https://github.com/QwenLM/Qwen)                                                    | [Ollama](https://ollama.com/) / [sentence-transformers](https://github.com/UKPLab/sentence-transformers)             |
| **3D / assets**          | [Meshy](https://www.meshy.ai/) / [Luma](https://lumalabs.ai/) / [Rodin](https://www.roblox.com/rodin)                                                                                       | [TRELLIS](https://huggingface.co/JeffreyXiang/TRELLIS) / [Hunyuan3D](https://github.com/Tencent/Hunyuan3D-2)                                                                                                                       | [ComfyUI](https://github.com/comfyanonymous/ComfyUI)                                                                 |

> **Note:** Image, video, and audio use **ComfyUI** as the universal open runtime — the Ollama of pixels. Speech uses **whisper.cpp**. Reverse flows (image/audio → understanding) are handled by multimodal LLMs above.

---

## The Jarvis Question

Assemble the pieces above and you get something familiar: a system you **talk to**, that **sees**, **reasons**, **plans**, writes code, **generates** visuals, **calls tools**, and **remembers**. That is **J.A.R.V.I.S.** from Iron Man.

The films treated it as one seamless intelligence. The tables above show the same capability set — just separate models behind a unified runtime. **Most of Jarvis already exists.** It simply isn't fused into one low-latency, always-on, autonomous system yet.

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

## Agent Skills: Extending AI Reasoning

Agent skills are reusable `.md` instruction sets that embed domain knowledge into agents without retraining. Use them to teach coding patterns, API protocols, company standards, or specialized workflows.

| Registry | Guides |
|----------|--------|
| **Skill ecosystems** | [skills.sh](https://skills.sh/) · [agentskills.io](https://agentskills.io/home) · [ClawHub](https://clawhub.ai/) · [Wondel.ai](https://skills.wondel.ai/) |
| **Official curations** | [Anthropic](https://github.com/anthropics/skills) · [OpenAI](https://github.com/openai/skills) · [Google](https://github.com/google/skills) · [Addy Osmani](https://github.com/addyosmani/agent-skills) |
| **Prompt guides** | [Prompting Guide](https://www.promptingguide.ai/) · [Learn Prompting](https://learnprompting.org/) · [Copilot Cookbook](https://docs.github.com/copilot/tutorials/copilot-chat-cookbook) |

---

## Where We Are

**The capability exists today.** The full stack is shipped: frontier models, open-source alternatives, local runtimes, agents, multimodal synthesis, and autonomous tool-use. 

**The remaining work is integration.** Jarvis requires not new capabilities but reliable orchestration: sub-second multimodal latency, persistent memory, autonomous long-horizon planning, and physical grounding. These are engineering problems, not research frontiers.

Choose your layers. Run locally for privacy. Use cloud for simplicity. Mix open and closed. The tools, the models, and the math are all available. The 2026 question isn't *what can we build* but *how do we build it well*.

<!-- favicon references -->
[ag]:     /img/assets/ai-coding-tools/antigravity.svg
[cc]:     /img/software/apps/claude-code.svg
[cdx]:    /img/software/apps/chatgpt.svg
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
