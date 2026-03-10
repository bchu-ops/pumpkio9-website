# Automation Scripts

Two scripts that bridge Notion and the portfolio website:

| Script | Direction | Purpose |
|--------|-----------|---------|
| `sync_notion.py` | Notion → Website | Pulls Notion page content as static JSON for react-notion-x |
| `pdf_to_notion/` | PDF → Notion | Parses resume PDFs and creates database entries in 3 Notion databases |

**Typical flow:** Edit resume PDF → `pdf_to_notion` → clean up in Notion → `sync_notion.py` → deploy

---

## Scripts

### 1. `sync_notion.py` — Notion to Website

Fetches a public Notion page and all its subpages, saves them as static JSON files that react-notion-x renders on the frontend.

**When to use:**
- After editing any content on your Notion page (text, images, layout)
- After adding or removing a subpage
- Before deploying the website

**How to run:**
```bash
cd backend/automations
uv run python scripts/sync_notion.py
```

**Requires:**
- `NOTION_PAGE_ID` in `.env` — the parent Notion page ID
- The Notion page must be **published to web** (Share > Publish)

**Output:**
```
frontend/public/notion/
  index.json          — parent page data
  collections.json    — extracted database rows grouped by section
  pages.json          — manifest of all subpages (slug, title, section)
  <slug>.json         — each subpage's data (for react-notion-x detail pages)
```

**How syncing works:**
- Each run **wipes all JSON files** in `public/notion/` and re-fetches everything fresh
- No incremental diffing — the full dataset is re-written every time
- For the current portfolio size (~19 rows, ~23 API calls, ~15-20 seconds) this is fine
- If the portfolio grows to 100+ rows, consider adding caching via `last_edited_time` comparison to skip unchanged rows

**What it does NOT update:**
- Images hosted on Notion — their URLs expire after ~1 hour. Use local images in `frontend/public/images/` instead
- Card images/thumbnails on the homepage — those are hardcoded
- The `detect_section()` keyword list — add new keywords if new subpage titles don't match

**Limitations:**
- Only works with **public** Notion pages (uses the unofficial API, no auth token)
- Large pages (100+ blocks) may require multiple chunks — currently fetches 1 chunk of 100 blocks
- Notion's internal API is unofficial and may change without notice

---

### 2. `pdf_to_notion/` — PDF Resume to Notion Databases

Parses a PDF resume, extracts work experiences, projects, and papers, then creates entries in 3 Notion databases. **Additive only** — never removes existing entries, skips duplicates by title.

**When to use:**
- When you have a new or updated resume and want to add new entries to Notion
- First-time setup of database content

**How to run:**
```bash
cd backend/automations/scripts
uv run python -m pdf_to_notion ../../../frontend/public/resume/Brian_Chu_Resume.pdf
```

**Requires:**
- `NOTION_TOKEN` in `.env` — integration token from [notion.so/my-integrations](https://www.notion.so/my-integrations)
- `NOTION_EXPERIENCES_DB_ID`, `NOTION_PROJECTS_DB_ID`, `NOTION_PAPERS_DB_ID` in `.env`
- The integration must be **connected** to the Portfolio page (page > ... > Connections > add your integration)

**Target databases and schemas:**

| Database | Title property | Other properties |
|----------|---------------|-----------------|
| Experiences (Work) | Role (company name) | Position (multi_select), Team (text), Duration (date), Image (files) |
| Projects | Project name | Description (text), Date (date), Tools (text), Link (url), Image (files) |
| Papers & Publications | Title | Description (text), Tools (text), Image (files) |

**Page content style (Vulcan format):**
- Description paragraph
- Bold date/team lines: `**[January 2025 → Present]: Backend Team**`
- Bold tools line: `**Languages / Tools Used:** Python, FastAPI, ...`
- Bold location line: `**Location:** Irvine, CA`

**What it updates:**
- Creates new database entries with properties and page content
- Deduplicates by title (case-insensitive) — running twice won't create duplicates

**What it does NOT update:**
- Existing entries are never modified or deleted
- Cover images — add manually in Notion
- PDFs in paper cards — drag/drop manually in Notion
- Gallery/table view settings — configure manually in Notion UI

**Limitations:**
- PDF parsing is regex-based — works with standard resume formats but may misparse unusual layouts
- Section detection relies on headers like "WORK EXPERIENCE" and "PROJECTS"
- Multi-line bullet wrapping uses heuristics (line length, capitalization) — may occasionally merge or split incorrectly
- Description text truncated at 2000 chars per field (Notion API limit)
- Multi-column PDF layouts may not parse correctly (PyMuPDF extracts text linearly)

**Package structure:**
```
pdf_to_notion/
  __init__.py        — package marker
  __main__.py        — CLI entry point
  models.py          — frozen dataclasses (ExperienceEntry, ProjectEntry, PaperEntry, NotionConfig)
  resume_parser.py   — PDF text extraction and parsing into 3 entry types
  notion_writer.py   — dedup check + create pages in Notion with properties and content blocks
```

---

## When You Update Your Resume

### Step 1: Replace the PDF files

- **SWE resume:** `frontend/public/resume/Brian_Chu_Resume.pdf`
- **ChemE resume:** `frontend/public/resume/Brian_Chu_Resume_ChemE.pdf`

### Step 2: Update Google Drive links (if re-uploaded)

Google Drive links are in `frontend/src/components/Footer.js`:
- **ChemE Drive link:** line ~67 — `https://drive.google.com/file/d/<FILE_ID>/view?usp=drive_link`
- **SWE Drive link:** line ~84 — `https://drive.google.com/file/d/<FILE_ID>/view?usp=drive_link`

Replace the `<FILE_ID>` portion if you uploaded a new file to Google Drive (the ID changes per upload).

### Step 3: Sync new entries to Notion (if resume has new experiences/projects/papers)

```bash
cd backend/automations/scripts
uv run python -m pdf_to_notion ../../../frontend/public/resume/Brian_Chu_Resume.pdf
```

This only **adds** new entries — existing ones are skipped by title match. If an entry exists in Notion with a different name than what the resume parser extracts, it won't be detected as a duplicate.

### Step 4: Review in Notion

- Check new entries for misparsed data
- Add cover images manually (API can't set these)
- Drag/drop PDFs into paper cards if needed
- Set gallery view with Image as card preview if needed

### Step 5: Sync Notion to website

```bash
cd backend/automations
uv run python scripts/sync_notion.py
```

### Step 6: Update frontend (if needed)

- Update card components if new entries were added or removed
- Update `NotionCards.js` resume button filenames if PDF names changed

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
NOTION_PAGE_ID=abc123...                    # Parent Notion page (for sync_notion.py)
NOTION_TOKEN=ntn_xxx...                     # From notion.so/my-integrations
NOTION_EXPERIENCES_DB_ID=xxx...             # Database page ID from Notion URL
NOTION_PROJECTS_DB_ID=xxx...               # Database page ID from Notion URL
NOTION_PAPERS_DB_ID=xxx...                 # Database page ID from Notion URL
NOTION_EXPERIENCES_COLLECTION_ID=xxx...    # Collection ID (for sync_notion.py internal API)
NOTION_PROJECTS_COLLECTION_ID=xxx...       # Collection ID (for sync_notion.py internal API)
NOTION_PAPERS_COLLECTION_ID=xxx...         # Collection ID (for sync_notion.py internal API)
```
