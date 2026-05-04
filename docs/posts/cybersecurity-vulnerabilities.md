---
title: Cybersecurity Vulnerabilities: CVE, KEV, 0-Day, and Theoretical Risk
description: A practical guide to vulnerability types and why reported weaknesses keep growing every year.
date: 2026-05-03
next: true
prev: true
footer: true
---

<Post authors="David7ce"/>

Reported vulnerabilities keep rising every year — not because security is getting worse, but because there is more software, more researchers, and better tooling to find flaws. What matters is not volume, but which ones are actually exploitable in your environment.

**Contents**

- [CVE Growth Trend](#cve-growth-trend)
- [Key Concepts](#key-concepts)
- [Risk and Difficulty Matrix](#risk-and-difficulty-matrix)
- [The Hidden Gap](#the-hidden-gap)
- [Takeaways](#takeaways)
- [References](#references)

## CVE Growth Trend

Published CVEs have grown sharply every year. KEV entries (actively exploited) also increase, but far more slowly — only ~3–4% of the total CVE universe ends up being actively weaponized in the wild.

```text
Approximate yearly CVE publications (2016-2025)

2016 | ###                     ~6.4k
2017 | #######                 ~14.6k
2018 | ########                ~16.5k
2019 | #########               ~17.4k
2020 | ##########              ~18.3k
2021 | ###########             ~20.1k
2022 | ##############          ~25.0k
2023 | ################        ~28.8k
2024 | #####################   ~40.0k
2025 | ######################  ~44.0k (preliminary)

Scale: each # ≈ 2,000 CVEs
```

In 2024: ~40–45k CVEs published · ~1,200–1,500 KEV entries · ~2–8% are genuinely high priority in a typical enterprise backlog.

## Key Concepts

| Term            | What it is                                                               | Risk level     | Response                                                  |
|-----------------|--------------------------------------------------------------------------|----------------|-----------------------------------------------------------|
| **CVE**         | Publicly disclosed vulnerability with a unique ID (e.g. CVE-2025-12345). | Medium to High | Prioritize by context: exposure, CVSS, EPSS.              |
| **KEV**         | CISA catalog entry — active exploitation observed in the wild.           | Critical       | Patch or mitigate immediately. Days matter.               |
| **0-Day**       | Exploited before a patch exists, or before defenders can deploy one.     | Critical       | Emergency: contain, compensating controls, hunt.          |
| **Theoretical** | Plausible weakness with no proven exploit path in your environment.      | Low to Medium  | Validate reachability first; handle in hardening backlog. |

## Risk and Difficulty Matrix

Scores are baselines — adjust up if the asset is internet-facing or business-critical, down if it is isolated or already mitigated.

| Vulnerability class                   | Risk (0–10) | Exploit difficulty              | ~Share of CVEs |   ~KEV presence    | Priority                        |
|---------------------------------------|:-----------:|---------------------------------|:--------------:|:------------------:|---------------------------------|
| 0-day (no patch available)            |   **9.8**   | Attacker-dependent              |     <0.1%      |         —          | Emergency response              |
| Unauthenticated RCE (internet-facing) |   **9.5**   | Practical                       |      2–5%      |   High (20–30%)    | Immediate emergency             |
| Injection (SQLi, command injection)   |   **8.0**   | Practical → config-dependent    |     12–20%     |  Medium (10–18%)   | Very high                       |
| Privilege escalation (authenticated)  |   **7.5**   | Requires specific configuration |     10–15%     |  Medium (10–20%)   | Very high                       |
| AuthN/AuthZ logic flaw                |   **7.0**   | Configuration-dependent         |     8–12%      |   Medium (8–15%)   | High                            |
| Cryptographic weakness / misuse       |   **6.5**   | Config-dependent → advanced     |     8–12%      |     Low (<3%)      | Medium–high                     |
| Information disclosure                |   **5.5**   | Theoretical → practical         |     12–18%     | Low–medium (5–10%) | Medium (higher if chain exists) |
| Denial of service                     |   **5.0**   | Practical                       |     18–25%     |     Low (3–6%)     | Medium                          |
| Theoretical (no practical path)       |   **3.0**   | Theoretical                     |     30–50%     |      Very low      | Architecture hardening backlog  |

> **Notes:** ~15–30% of CVEs are practically exploitable; ~30–50% are theoretical and never weaponized. Hard to replicate ≠ low impact — a difficult exploit on a critical system can still be devastating. Percentages are approximate ranges from NVD (2022–2024) and CISA KEV data; sector context changes everything.

## The Hidden Gap

Two scenarios make your real exposure window wider than CVE databases suggest.

### 0-Days held by white-hat researchers

During responsible disclosure, a researcher knows the full exploit but stays silent while waiting for the vendor to patch — typically up to 90 days. During that window, the bug exists, may be independently discovered by attackers, and has no public CVE to scan for.

| Example                                    | Gap window | What happened                                                                                                                   |
|--------------------------------------------|:----------:|---------------------------------------------------------------------------------------------------------------------------------|
| **ProxyLogon** — CVE-2021-26855 (Exchange) |  ~56 days  | Nation-state actors found it independently during the disclosure window and began exploiting before the patch shipped.          |
| **Spring4Shell** — CVE-2022-22965          | Hours–days | PoC leaked publicly before the vendor finished the fix, forcing an emergency release.                                           |
| **CVE-2024-38193** (Windows AFD / Lazarus) |   ~weeks   | Lazarus group used it in targeted attacks during the coordinated disclosure period.                                             |
| **Google Project Zero** (general policy)   | 0–90+ days | P0 has published exploits for Chrome, iOS, and Windows when vendors missed the 90-day deadline — with or without a patch ready. |

### KEV-listed CVEs left unpatched for 30–120+ days

A KEV listing means active exploitation is happening now. Yet median remediation time at many organizations is 30–120+ days, because of dependency complexity, required downtime, or poor asset visibility.

| Example                                                      |       Typical patch lag        | Why it dragged                                                                              |
|--------------------------------------------------------------|:------------------------------:|---------------------------------------------------------------------------------------------|
| **Log4Shell** — CVE-2021-44228                               |        Weeks to months         | Log4j was embedded in hundreds of products; orgs did not know where it lived.               |
| **Citrix NetScaler Bleed** — CVE-2023-4966                   |          30–90+ days           | Healthcare and financial appliances stayed exposed well after the advisory.                 |
| **Fortinet FortiOS auth bypass** — CVE-2022-40684 (CVSS 9.8) |          30–60+ days           | Slow patch adoption on older hardware despite emergency-level severity.                     |
| **MOVEit Transfer SQLi** — CVE-2023-34362                    | Days–weeks (+ pre-patch 0-day) | Cl0p ransomware exploited it as a 0-day first; then slow adoption after the patch released. |

Both windows — researcher-held 0-days and unpatched KEVs — are periods of asymmetric exposure. Attackers may already know and have an operational head start.

## Takeaways

- **Volume ≠ risk.** Most CVEs are never weaponized; focus on KEV, exposure, and exploitability (EPSS).
- **KEV = treat as ongoing incident.** Define an SLA measured in days, not patch cycles.
- **Theoretical vulnerabilities** matter for architecture hardening, but should not crowd out urgent fixes.

## References

- [CVE Program](https://www.cve.org/)
- [NIST National Vulnerability Database (NVD)](https://nvd.nist.gov/)
- [CISA Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [FIRST EPSS (Exploit Prediction Scoring System)](https://www.first.org/epss/)
- [MITRE ATT&CK](https://attack.mitre.org/)
- [Verizon Data Breach Investigations Report](https://www.verizon.com/business/resources/reports/dbir/)
- [Zero Day Initiative Advisories](https://www.zerodayinitiative.com/advisories/)
