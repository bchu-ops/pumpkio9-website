"""
sync_notion.py

Fetches a public Notion page and its collection (database) rows
via Notion's internal API, then saves everything as static JSON.

Usage: uv run python sync_notion.py

Requires: NOTION_PAGE_ID in .env (the parent "Portfolio" page)

Output structure:
  frontend/public/notion/
    index.json              — parent page recordMap
    collections.json        — extracted collection rows grouped by section
    pages.json              — manifest mapping slug → { id, title, section }
    <slug>.json             — each row's recordMap (for react-notion-x detail pages)
"""

import json
import os
import re
import shutil
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

NOTION_PAGE_ID = os.getenv("NOTION_PAGE_ID", "").replace("-", "")
NOTION_API_URL = "https://www.notion.so/api/v3"
OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent.parent / "frontend" / "public" / "notion"

HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0",
}

SECTION_MAP = {
    "Work": "experiences",
    "Experiences": "experiences",
    "Projects": "projects",
    "Papers & Publications": "papers",
}


def format_uuid(raw_id: str) -> str:
    h = raw_id.replace("-", "")
    return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:]}"


def slugify(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s-]+", "-", slug)
    return slug.strip("-")


def fetch_page(client: httpx.Client, page_id: str) -> dict:
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
        headers=HEADERS,
    )
    resp.raise_for_status()
    return resp.json().get("recordMap", {})


def query_collection(client: httpx.Client, collection_id: str, view_id: str) -> dict:
    """Query a collection and return full response (includes recordMap with row data)."""
    resp = client.post(
        f"{NOTION_API_URL}/queryCollection",
        json={
            "collection": {"id": format_uuid(collection_id)},
            "collectionView": {"id": format_uuid(view_id)},
            "loader": {
                "type": "reducer",
                "reducers": {
                    "collection_group_results": {
                        "type": "results",
                        "limit": 50,
                    }
                },
                "searchQuery": "",
                "userTimeZone": "America/Los_Angeles",
            },
        },
        headers=HEADERS,
    )
    resp.raise_for_status()
    return resp.json()


def extract_text_prop(properties: dict, key: str) -> str:
    parts = properties.get(key, [])
    return "".join(p[0] for p in parts if isinstance(p, list) and p)


def extract_file_url(properties: dict, key: str) -> str:
    parts = properties.get(key, [])
    for part in parts:
        if isinstance(part, list):
            filename = part[0] if part else ""
            if len(part) > 1:
                for attr in part[1:]:
                    if isinstance(attr, list) and attr[0] == "a":
                        url = attr[1]
                        if url.startswith("http"):
                            return url
            if filename and not filename.startswith("\u2023"):
                return filename
    return ""


def extract_date_prop(date_parts: list, section: str = "") -> dict:
    """Extract date info. Returns dict with 'start' and 'end' keys."""
    for part in date_parts:
        if not isinstance(part, list):
            continue
        for attr in part:
            if not isinstance(attr, list):
                continue
            inner = attr
            if inner and isinstance(inner[0], list):
                inner = inner[0]
            if not inner or inner[0] != "d":
                continue
            date_info = inner[1]
            start = date_info.get("start_date", "")
            end = date_info.get("end_date", "")
            if start and not end and section == "experiences":
                end = "Present"
            return {"start": start, "end": end}
    return {"start": "", "end": ""}


def extract_collections_meta(record_map: dict) -> list[dict]:
    """Extract collection IDs, view IDs, and schemas from the parent page."""
    blocks = record_map.get("block", {})
    collections_meta = record_map.get("collection", {})

    result = []
    for bid, block in blocks.items():
        val = block.get("value", {})
        if val.get("type") == "collection_view":
            col_id = val.get("collection_id", "")
            view_ids = val.get("view_ids", [])
            col_data = collections_meta.get(col_id, {}).get("value", {})
            col_name = "".join(
                p[0] for p in col_data.get("name", [[]]) if isinstance(p, list) and p
            )
            result.append({
                "collection_id": col_id,
                "view_id": view_ids[0] if view_ids else "",
                "name": col_name,
                "schema": col_data.get("schema", {}),
            })
    return result


def rewrite_pdf_sources(record_map: dict, page_block_id: str) -> None:
    """Rewrite PDF block sources from Notion attachments to local file paths.

    Paper pages have 2 PDFs in order: presentation first, paper second.
    Both share the same filename but live in different local folders.
    """
    # Folder mapping: first PDF → presentations, second → papers
    folder_order = ["projects/presentations", "projects/papers"]

    blocks = record_map.get("block", {})
    page_block = blocks.get(page_block_id, {})
    content_ids = page_block.get("value", {}).get("content", [])

    pdf_index = 0
    for block_id in content_ids:
        block = blocks.get(block_id, {})
        val = block.get("value", {})
        if val.get("type") != "pdf":
            continue

        props = val.get("properties", {})
        source_parts = props.get("source", [])
        if not source_parts or not source_parts[0]:
            pdf_index += 1
            continue

        source = source_parts[0][0]
        # Extract filename from "attachment:<uuid>:<filename>"
        parts = source.split(":")
        filename = ":".join(parts[2:]) if len(parts) >= 3 else source.split("/")[-1]

        folder = folder_order[pdf_index] if pdf_index < len(folder_order) else folder_order[-1]
        props["source"] = [[f"/{folder}/{filename}"]]
        # Remove space_id so react-notion-x skips new URL() construction
        val.pop("space_id", None)
        pdf_index += 1


def extract_row_props(block_value: dict, schema: dict, section: str) -> dict:
    """Extract structured properties from a block's raw properties using the schema."""
    props = block_value.get("properties", {})
    title = extract_text_prop(props, "title")
    if not title:
        return {}

    row = {
        "id": block_value.get("id", ""),
        "title": title,
        "slug": slugify(title),
        "section": section,
    }

    for field_id, field_meta in schema.items():
        if field_id == "title":
            continue
        field_name = slugify(field_meta.get("name", field_id))
        field_type = field_meta.get("type", "text")

        if field_type == "file":
            row[field_name] = extract_file_url(props, field_id)
        elif field_type == "multi_select":
            raw = extract_text_prop(props, field_id)
            row[field_name] = [s.strip() for s in raw.split(",") if s.strip()]
        elif field_type == "date":
            row[field_name] = extract_date_prop(props.get(field_id, []), section)
        else:
            row[field_name] = extract_text_prop(props, field_id)

    return row


def process_collection(
    client: httpx.Client,
    col: dict,
    section: str,
    output_dir: Path,
    manifest: dict,
) -> list[dict]:
    """Query a collection, fetch each row's data, and save detail pages."""
    query_result = query_collection(client, col["collection_id"], col["view_id"])

    reducer = query_result.get("result", {}).get("reducerResults", {})
    block_ids = reducer.get("collection_group_results", {}).get("blockIds", [])

    rows = []
    for block_id in block_ids:
        try:
            detail_map = fetch_page(client, block_id)
        except httpx.HTTPStatusError:
            continue

        block_value = detail_map.get("block", {}).get(block_id, {}).get("value", {})
        row = extract_row_props(block_value, col["schema"], section)
        if not row:
            continue

        rows.append(row)
        slug = row["slug"]

        # Rewrite PDF attachment URLs to local paths for papers
        if section == "papers":
            rewrite_pdf_sources(detail_map, block_id)

        # Save full recordMap for react-notion-x detail page rendering
        with open(output_dir / f"{slug}.json", "w") as f:
            json.dump(detail_map, f, indent=2)

        manifest[slug] = {
            "id": block_id,
            "title": row["title"],
            "section": section,
        }

    return rows


def extract_resume_links(record_map: dict) -> list[dict]:
    """Extract resume links from the parent page's Resume section."""
    blocks = record_map.get("block", {})
    links = []
    for bid, b in blocks.items():
        val = b.get("value", {})
        props = val.get("properties", {})
        title_parts = props.get("title", [])
        for part in title_parts:
            if not isinstance(part, list) or len(part) < 2:
                continue
            text = part[0]
            # Attributes are in part[1] as a list of [type, value] pairs
            attrs = part[1] if isinstance(part[1], list) else []
            for attr in attrs:
                if isinstance(attr, list) and len(attr) >= 2 and attr[0] == "a":
                    url = attr[1]
                    if "resume" in url.lower() or "resume" in text.lower():
                        links.append({"title": text, "url": url})
    return links


def clean_output_dir(output_dir: Path) -> None:
    """Remove old slug JSON files to prevent stale data. Preserves the directory."""
    if not output_dir.exists():
        return
    for f in output_dir.glob("*.json"):
        f.unlink()


def main():
    if not NOTION_PAGE_ID:
        print("Error: NOTION_PAGE_ID not set in .env")
        sys.exit(1)

    print(f"Fetching parent page: {NOTION_PAGE_ID}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Clean old output to prevent stale/duplicate data
    clean_output_dir(OUTPUT_DIR)

    with httpx.Client(timeout=30) as client:
        # Fetch parent page
        try:
            parent_record_map = fetch_page(client, NOTION_PAGE_ID)
        except httpx.HTTPStatusError as e:
            print(f"Failed to fetch parent page: {e.response.status_code}")
            sys.exit(1)

        with open(OUTPUT_DIR / "index.json", "w") as f:
            json.dump(parent_record_map, f, indent=2)

        # Extract collection metadata from parent page (no extra API calls)
        collection_info = extract_collections_meta(parent_record_map)
        all_collections = {}
        manifest = {}

        if collection_info:
            print(f"\nFound {len(collection_info)} collections:")

            for col in collection_info:
                col_name = col["name"]
                section = SECTION_MAP.get(col_name, slugify(col_name))
                print(f"\n  [{section}] {col_name}")

                try:
                    rows = process_collection(
                        client, col, section, OUTPUT_DIR, manifest,
                    )
                    print(f"    {len(rows)} rows:")
                    for r in rows:
                        print(f"      - {r['title']}")

                    all_collections[section] = rows
                except httpx.HTTPStatusError as e:
                    print(f"    Failed to query: {e.response.status_code}")
                except Exception as e:
                    print(f"    Error: {e}")

        # Save collections and manifest
        with open(OUTPUT_DIR / "collections.json", "w") as f:
            json.dump(all_collections, f, indent=2)
        with open(OUTPUT_DIR / "pages.json", "w") as f:
            json.dump(manifest, f, indent=2)

        print(f"\nSaved to {OUTPUT_DIR}")
        print(f"API calls: 1 (parent) + {len(collection_info)} (queries) + {len(manifest)} (detail pages) = {1 + len(collection_info) + len(manifest)} total")
        print("Sync complete!")


if __name__ == "__main__":
    main()
