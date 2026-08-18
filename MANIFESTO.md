# Interneto Manifesto

This is the editorial and conceptual contract of Interneto — what it is, what it deliberately is not, and how curation decisions get made. It is not a technical guide; see `README.md` and `CLAUDE.md` for that.

## 1. What Interneto is

Interneto is two things working together:

- **The Atlas** — a curated directory of the web, organized into categories and subcategories, for discovery.
- **The Toolbox** — deliberately selected software (desktop, mobile, browser extensions, VS Code extensions, libraries, operating systems) plus a web directory of browser-based destinations, for getting things done.

Both exist to make a useful subset of the internet easy to find and easy to act on.

## 2. What Interneto is NOT

- Not an exhaustive software database.
- Not a generic "everything that exists" directory.
- Not a popularity ranking.
- Not an automatic aggregation of package repositories (npm, Play Store, winget, etc. are install *targets*, not sources of inclusion).
- Not a collection of every native wrapper around a web service — see §7.

## 3. Curation principles

- Every Toolbox entry is intentionally selected, not scraped or auto-imported.
- Inclusion requires a meaningful reason — solves a real problem, fills a real gap, or is clearly better than what's already listed.
- Prefer useful, mature, maintained, and trustworthy software over novelty.
- Prefer FOSS where comparable quality exists, but quality and usefulness take precedence over ideology.
- Proprietary software is welcome when it provides a meaningful advantage.
- Avoid unnecessary duplication — a new entry should earn its place next to what's already there.

## 4. Favorites

Favorites are not "the ones we liked." They are the **minimum useful set**: the smallest practical starting point within a category, for someone who wants a quick, trustworthy answer instead of a full menu. Favorites narrow the Toolbox down further, they don't run alongside it as a separate popularity list.

## 5. Taxonomy

Categories and subcategories carry meaning, not just filing. The subcategory names the problem or use case; entries sharing a subcategory are peers — alternatives for that same use case. This relationship is implicit in the taxonomy. Interneto does not maintain a separate, manually-curated "alternatives" system on top of it; if that ever becomes necessary, it should come from the existing category/subcategory structure being insufficient, not from wanting a nicer feature.

## 6. Platform philosophy

Android, iOS, Windows, Linux, macOS, browser extensions, and libraries are each treated according to their actual role, not forced into a single mold. Prefer cross-platform solutions when they hold up to comparable quality — but a platform-specific tool that's genuinely better on its platform is not penalized for being platform-specific.

## 7. Web vs native

A good web app is often the right recommendation over installing something unnecessary — the Web Directory exists for exactly this: destinations where opening the link *is* the install step. A native app earns its place when it offers something the browser can't: offline use, background operation, notifications, GPS/sensors/camera, Bluetooth/USB, deeper OS integration, performance, or specialized hardware access. Native apps should not duplicate an equivalent web experience just to exist on a platform.

## 8. Quality and maintenance

Prefer actively maintained projects. Weigh community health, documentation, reliability, and long-term viability. GitHub stars, popularity, or download counts are signals to notice, never automatic evidence of quality — they don't substitute for actually evaluating the thing.

## 9. Privacy and economics

Prefer no ads, no unnecessary account requirements, no invasive tracking, and transparent pricing. Prefer free software where quality is comparable, but paid software earns inclusion when its capabilities justify the cost. Subscription software faces a higher bar than free or one-time-purchase software — recurring cost is a recurring reason to double-check it's worth it.

## 10. Editorial independence

Interneto's recommendations are curated judgments, made by a person, not the output of an automated ranking. Clarity and usefulness win over completeness every time.

## 11. Decision rule

Before adding (or keeping) a Toolbox entry, ask:

- Is it genuinely useful?
- Is it maintained and trustworthy?
- Is there already an equivalent entry in this category/subcategory?
- Is there a good FOSS option that does the same job?
- Does it offer a meaningful advantage over the web (§7)?
- Is it filed under the right category/subcategory?
- Does it belong in **Favorites**, the general **Toolbox**, or nowhere?

If the honest answer to "does this help someone decide faster" is no, it doesn't belong here.
