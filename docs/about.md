---
title: About
description: Explaining the Interneto Project
date: 2023-10-08
next: false
prev: false
footer: true
---

> [!note]
> The name **Interneto** derives from "**inter**-communicated **net**works", with the **O** representing closed, circular connections.

**Interneto Links** is a curated web directory: a structured collection of categorized websites maintained in Raindrop.io and exported into Markdown-based documentation.

## Project Background

The project originated in 2020 by **David7ce**, with the goal of building a freely accessible, systematically organized database of websites.

At first glance, the scope appears infeasible. Estimates suggest there are between 1–2 billion registered domains, with continuous churn (creation and expiration). However, the effective working set is significantly smaller:

- Fewer than ~200 million domains are actively maintained  
- A large proportion are parked, inactive, or low-value  
- Only a small fraction (roughly an order of magnitude lower) provide meaningful utility  

Sources such as the *Netcraft Web Server Survey (February 2026)* and the *Majestic Million* dataset support this general distribution, although exact percentages vary depending on methodology and definition of “active” or “useful”.

Given this, attempting exhaustive classification is neither tractable nor particularly useful. **Interneto instead operates under a selective curation model**, prioritizing:

- Functional relevance  
- Technical or informational value  
- Signal over noise  

## Historical Context

Earlier efforts attempted to manually index the web:

- **DMOZ (Open Directory Project)** — discontinued in 2017  
- **Curlie** — a community-maintained successor, with limited activity  

These systems relied heavily on hierarchical taxonomy and human moderation. While structurally robust, they struggled with scalability and maintenance overhead.

In contrast, modern discovery is dominated by:

- Search engines (e.g., Google, Bing, DuckDuckGo, Yandex)  
- AI-driven interfaces (e.g., ChatGPT, Claude, Gemini)  

These systems optimize for retrieval rather than structured understanding, which has contributed to the decline of traditional directories.

## Why Web Directories Still Matter

Despite reduced mainstream usage, curated directories provide distinct advantages:

- **Low infrastructure overhead** — can be hosted as static content  
- **Privacy-preserving** — no tracking, profiling, or ad targeting  
- **High signal density** — manually filtered resources  
- **Independence from SEO and marketing incentives**  
- **Portability** — can be cloned, versioned, and used locally  

From a systems perspective, they function more like **knowledge bases** than search engines.

## Core Challenge: Structure vs Discoverability

The primary limitation of directories is not data collection, but **navigation**.

Strict hierarchical categorization introduces trade-offs:

| Approach            | Strengths                       | Limitations                      |
|---------------------|---------------------------------|----------------------------------|
| Hierarchical (tree) | Clear organization, predictable | Rigid, hard to explore laterally |
| Tag-based (graph)   | Flexible, multi-dimensional     | Can become inconsistent/noisy    |
| Search-driven       | Fast retrieval                  | Weak global structure            |

Interneto leans toward a **hybrid model**:

- Hierarchical categories for baseline structure  
- Tagging for cross-cutting relationships  
- Static export for performance and portability  

## Implementation Approach

The current workflow is:

1. **Collection** — curated links stored in Raindrop.io  
2. **Classification** — assignment of categories and tags  
3. **Export** — transformation into Markdown files  
4. **Presentation** — static website with navigable structure  

This design prioritizes:

- Simplicity  
- Version control compatibility  
- Long-term maintainability  

## Related Projects

Several modern projects operate in adjacent spaces:

- AlternativeTo — large curated index of tools and resources  
- FMHY — structured database of software alternatives  

While these platforms emphasize breadth and community contribution, **Interneto focuses more narrowly on structured classification and long-term knowledge organization**.

## Perspective

Interneto does not attempt to index the entire web. Instead, it treats the web as a **high-entropy system**, where value emerges from selective filtering and structured organization.

The underlying assumption is pragmatic:

> A smaller, well-structured subset of the web can be more useful than an exhaustive but unstructured whole.
