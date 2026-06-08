# The Local LLM Index

A living index of tools for **running LLMs locally and on-device** — inference engines, runners,
local chat UIs, and quantization tooling — ranked by **momentum** (stars, push-recency, and how
fast a repo is rising) computed from live GitHub signals.

Live: https://local-llm-index.vercel.app

## How it works (self-updating)

A daily GitHub Action runs the pipeline and redeploys:

1. `build_data.py` — searches GitHub across several local-LLM queries, dedupes, filters to real
   local/on-device tooling (precision over recall), categorizes, scores momentum → `data.json`
   + SEO (`sitemap.xml`, `rss.xml`, `robots.txt`, `llms.txt`).
2. `gen_details.py` — one SEO'd landing page per tool (`p/<slug>/`) with `SoftwareSourceCode`
   JSON-LD + breadcrumb.
3. `gen_og.py` — renders the Open Graph card.
4. `deploy.py` — ships the static site to Vercel via the REST API (no CLI).

Static HTML/CSS/JS, no framework. "Blueprint / spec-sheet" aesthetic
(Bricolage Grotesque + DM Mono, blueprint grid, datasheet cards).

## Run locally

```bash
GITHUB_TOKEN=... python3 build_data.py
python3 gen_details.py && python3 gen_og.py
python3 -m http.server 8080
```
