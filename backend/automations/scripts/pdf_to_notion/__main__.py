"""CLI entry point for pdf_to_notion package.

Usage: uv run python -m pdf_to_notion <path-to-pdf>
"""

import sys
from pathlib import Path

from dotenv import load_dotenv
from notion_client import Client

from .models import NotionConfig
from .notion_writer import sync_experiences, sync_papers, sync_projects
from .resume_parser import extract_text, parse_resume


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: uv run python -m pdf_to_notion <path-to-pdf>")
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)

    # Load .env from the automations directory (two levels up from this package)
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(env_path)

    try:
        config = NotionConfig.from_env()
    except ValueError as exc:
        print(f"Error: {exc}")
        sys.exit(1)

    print(f"Parsing PDF: {pdf_path}")
    text = extract_text(pdf_path)
    print(f"Extracted {len(text)} characters")

    experiences, projects, papers = parse_resume(text)
    print(f"\nFound: {len(experiences)} experiences, {len(projects)} projects, {len(papers)} papers")

    for i, e in enumerate(experiences, 1):
        positions = ", ".join(e.positions) if e.positions else "N/A"
        print(f"  Exp {i}: {e.company} ({positions})")
    for i, p in enumerate(projects, 1):
        print(f"  Proj {i}: {p.name}")
    for i, p in enumerate(papers, 1):
        print(f"  Paper {i}: {p.title}")

    print("\nSyncing to Notion (additive only)...")
    notion = Client(auth=config.token)

    sync_experiences(notion, config, experiences)
    sync_projects(notion, config, projects)
    sync_papers(notion, config, papers)

    print("\nDone!")


if __name__ == "__main__":
    main()
