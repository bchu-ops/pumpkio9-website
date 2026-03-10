"""
pdf_to_notion.py

Parses a PDF resume and adds experience entries to a Notion database.

Usage: uv run python pdf_to_notion.py <path-to-pdf>
  e.g. uv run python pdf_to_notion.py ../../frontend/public/resume/Brian_Chu_Resume.pdf

Requires: NOTION_TOKEN and NOTION_DATABASE_ID in .env

Expected Notion database columns:
  - Name (title)
  - Role (rich_text)
  - Section (select): Experiences / Projects / Papers
  - Order (number)
  - Description (rich_text)
  - Dates (rich_text)
  - Location (rich_text)
"""

import os
import re
import sys
from pathlib import Path

import pymupdf
from dotenv import load_dotenv
from notion_client import Client

load_dotenv()

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

DATE_PATTERN = re.compile(
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z.]*\s*\d{4}"
    r"\s*[-–]\s*"
    r"(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z.]*\s*\d{4})",
    re.IGNORECASE,
)

ROLE_KEYWORDS = re.compile(
    r"engineer|intern|technician|member|referee|operations|developer",
    re.IGNORECASE,
)


def extract_text(pdf_path: str) -> str:
    """Extract text from a PDF using PyMuPDF."""
    doc = pymupdf.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text


def parse_resume(text: str) -> list[dict]:
    """Parse resume text into structured entries."""
    entries = []
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    current_section = None
    current_entry = None

    for line in lines:
        # Detect section headers
        if re.match(r"^WORK EXPERIENCE$", line, re.IGNORECASE) or re.match(
            r"^Engineering Experience", line, re.IGNORECASE
        ):
            current_section = "Experiences"
            continue
        if re.match(r"^PROJECTS$", line, re.IGNORECASE) or re.match(
            r"^Projects & Outside", line, re.IGNORECASE
        ):
            current_section = "Projects"
            continue
        if re.match(r"^(EDUCATION|SKILLS)$", line, re.IGNORECASE):
            current_section = None
            continue

        if not current_section:
            continue

        # Bullet points → add to current entry
        if re.match(r"^[●•·\-▪]", line):
            if current_entry:
                bullet = re.sub(r"^[●•·\-▪]\s*", "", line)
                current_entry["bullets"].append(bullet)
            continue

        date_match = DATE_PATTERN.search(line)

        if date_match:
            name_part = DATE_PATTERN.sub("", line).replace("|", "").strip()

            if current_entry and not current_entry["role"]:
                current_entry["role"] = name_part
                current_entry["dates"] = date_match.group()
            else:
                if current_entry:
                    entries.append(dict(current_entry))
                current_entry = {
                    "name": name_part,
                    "role": "",
                    "dates": date_match.group(),
                    "location": "",
                    "section": current_section,
                    "bullets": [],
                }
            continue

        # Location pattern
        loc_match = re.search(r"\|\s*(.+(?:CA|Remote|Taiwan))", line, re.IGNORECASE)
        if loc_match and current_entry:
            current_entry["location"] = loc_match.group(1).strip()
            continue

        # Role titles
        if current_entry and not current_entry["role"] and ROLE_KEYWORDS.search(line):
            current_entry["role"] = line
            continue

        # New entry name
        if current_entry:
            entries.append(dict(current_entry))
        current_entry = {
            "name": line,
            "role": "",
            "dates": "",
            "location": "",
            "section": current_section,
            "bullets": [],
        }

    if current_entry:
        entries.append(dict(current_entry))

    return entries


def create_notion_page(notion: Client, entry: dict, order: int) -> None:
    """Create a page in the Notion database for an entry."""
    description = "\n".join(entry["bullets"])

    notion.pages.create(
        parent={"database_id": DATABASE_ID},
        properties={
            "Name": {"title": [{"text": {"content": entry["name"]}}]},
            "Role": {"rich_text": [{"text": {"content": entry["role"]}}]},
            "Section": {"select": {"name": entry["section"]}},
            "Order": {"number": order},
            "Description": {
                "rich_text": [{"text": {"content": description[:2000]}}]
            },
            "Dates": {"rich_text": [{"text": {"content": entry["dates"]}}]},
            "Location": {"rich_text": [{"text": {"content": entry["location"]}}]},
        },
    )


def main():
    if len(sys.argv) < 2:
        print("Usage: uv run python pdf_to_notion.py <path-to-pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]

    if not NOTION_TOKEN or not DATABASE_ID:
        print("Error: NOTION_TOKEN and NOTION_DATABASE_ID must be set in .env")
        sys.exit(1)

    path = Path(pdf_path)
    if not path.exists():
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)

    print(f"Parsing PDF: {pdf_path}")
    text = extract_text(pdf_path)
    print(f"Extracted {len(text)} characters")

    entries = parse_resume(text)
    print(f"Found {len(entries)} entries:\n")

    for i, e in enumerate(entries, 1):
        print(f"  {i}. [{e['section']}] {e['name']} — {e['role']} ({e['dates']})")

    print("\nPushing to Notion...")

    notion = Client(auth=NOTION_TOKEN)

    for i, entry in enumerate(entries):
        try:
            create_notion_page(notion, entry, i + 1)
            print(f"  Added: {entry['name']}")
        except Exception as e:
            print(f"  Failed to add \"{entry['name']}\": {e}")

    print("\nDone!")


if __name__ == "__main__":
    main()
