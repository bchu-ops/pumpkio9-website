"""
sync_notion.py

Fetches a public Notion page and its subpages via Notion's internal API,
then saves each subpage as a static JSON file for react-notion-x to render.

Usage: uv run python sync_notion.py

Requires: NOTION_PAGE_ID in .env (the parent "Portfolio" page)

Output structure:
  ../../frontend/src/data/notion/
    index.json              — parent page recordMap
    pages.json              — manifest mapping slug → { id, title, section }
    <slug>.json             — each subpage's recordMap

The slug is derived from the subpage title (lowercased, spaces → hyphens).
"""

import json
import os
import re
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

NOTION_PAGE_ID = os.getenv("NOTION_PAGE_ID", "").replace("-", "")
NOTION_API_URL = "https://www.notion.so/api/v3"
OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "data" / "notion"


def format_uuid(raw_id: str) -> str:
    """Convert a 32-char hex string to UUID format."""
    h = raw_id.replace("-", "")
    return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:]}"


def slugify(title: str) -> str:
    """Convert a title to a URL-safe slug."""
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s-]+", "-", slug)
    return slug.strip("-")


def fetch_page(client: httpx.Client, page_id: str) -> dict:
    """Fetch a public Notion page's recordMap via the internal API."""
    formatted_id = format_uuid(page_id) if "-" not in page_id else page_id

    resp = client.post(
        f"{NOTION_API_URL}/loadPageChunk",
        json={
            "page": {"id": formatted_id},
            "limit": 100,
            "cursor": {"stack": []},
            "chunkNumber": 0,
            "verticalColumns": False,
        },
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0",
        },
    )
    resp.raise_for_status()
    return resp.json().get("recordMap", {})


def extract_title(block: dict) -> str:
    """Extract the title text from a Notion block's properties."""
    properties = block.get("value", {}).get("properties", {})
    title_parts = properties.get("title", [])
    return "".join(part[0] for part in title_parts if isinstance(part, list) and part)


def extract_subpages(record_map: dict, parent_id: str) -> list[dict]:
    """Find all subpage blocks under the parent page."""
    subpages = []
    blocks = record_map.get("block", {})

    parent_block = blocks.get(parent_id, {})
    content_ids = parent_block.get("value", {}).get("content", [])

    for block_id in content_ids:
        block = blocks.get(block_id, {})
        block_value = block.get("value", {})

        if block_value.get("type") == "page":
            title = extract_title(block)
            if title:
                subpages.append({
                    "id": block_id,
                    "title": title,
                    "slug": slugify(title),
                })

    return subpages


def detect_section(title: str) -> str:
    """Guess which section a subpage belongs to based on title keywords."""
    lower = title.lower()
    project_keywords = ["speed demon", "nlp", "drug", "personal website", "pumpkio"]
    paper_keywords = ["lpcvd", "heat exchanger", "reverse osmosis", "ph control", "liposome", "photocatalytic", "paper"]

    if any(kw in lower for kw in paper_keywords):
        return "papers"
    if any(kw in lower for kw in project_keywords):
        return "projects"
    return "experiences"


def main():
    if not NOTION_PAGE_ID:
        print("Error: NOTION_PAGE_ID not set in .env")
        sys.exit(1)

    print(f"Fetching parent page: {NOTION_PAGE_ID}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with httpx.Client(timeout=30) as client:
        # Fetch parent page
        try:
            parent_record_map = fetch_page(client, NOTION_PAGE_ID)
        except httpx.HTTPStatusError as e:
            print(f"Failed to fetch parent page: {e.response.status_code}")
            sys.exit(1)

        # Save parent page
        with open(OUTPUT_DIR / "index.json", "w") as f:
            json.dump(parent_record_map, f, indent=2)

        # Find subpages
        parent_uuid = format_uuid(NOTION_PAGE_ID)
        subpages = extract_subpages(parent_record_map, parent_uuid)

        if not subpages:
            print("No subpages found. Make sure the parent page has subpages.")
            print("Saved parent page only.")
            return

        print(f"Found {len(subpages)} subpages:\n")

        manifest = {}

        for sp in subpages:
            section = detect_section(sp["title"])
            print(f"  [{section}] {sp['title']} → {sp['slug']}.json")

            try:
                record_map = fetch_page(client, sp["id"])

                with open(OUTPUT_DIR / f"{sp['slug']}.json", "w") as f:
                    json.dump(record_map, f, indent=2)

                manifest[sp["slug"]] = {
                    "id": sp["id"],
                    "title": sp["title"],
                    "section": section,
                }
            except httpx.HTTPStatusError as e:
                print(f"    Failed: {e.response.status_code}")

        # Save manifest
        with open(OUTPUT_DIR / "pages.json", "w") as f:
            json.dump(manifest, f, indent=2)

        print(f"\nSaved {len(manifest)} subpages to {OUTPUT_DIR}")
        print("Sync complete!")


if __name__ == "__main__":
    main()
