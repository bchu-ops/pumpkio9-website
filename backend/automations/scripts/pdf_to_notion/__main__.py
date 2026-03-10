"""CLI entry point for pdf_to_notion package.

Usage: uv run python -m pdf_to_notion <path-to-pdf>
"""

import logging
import sys
from pathlib import Path

from dotenv import load_dotenv
from notion_client import Client

from .models import NotionConfig
from .notion_writer import sync_experiences, sync_papers, sync_projects
from .resume_parser import extract_text, parse_resume

logger = logging.getLogger(__name__)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    if len(sys.argv) < 2:
        logger.error("Usage: uv run python -m pdf_to_notion <path-to-pdf>")
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        logger.error("File not found: %s", pdf_path)
        sys.exit(1)

    # Load .env from the automations directory (two levels up from this package)
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(env_path)

    try:
        config = NotionConfig.from_env()
    except ValueError as exc:
        logger.error("%s", exc)
        sys.exit(1)

    logger.info("Parsing PDF: %s", pdf_path)
    text = extract_text(pdf_path)
    logger.info("Extracted %d characters", len(text))

    experiences, projects, papers = parse_resume(text)
    logger.info(
        "Found: %d experiences, %d projects, %d papers",
        len(experiences), len(projects), len(papers),
    )

    for i, e in enumerate(experiences, 1):
        positions = ", ".join(e.positions) if e.positions else "N/A"
        logger.info("  Exp %d: %s (%s)", i, e.company, positions)
    for i, p in enumerate(projects, 1):
        logger.info("  Proj %d: %s", i, p.name)
    for i, p in enumerate(papers, 1):
        logger.info("  Paper %d: %s", i, p.title)

    logger.info("Syncing to Notion (additive only)...")
    notion = Client(auth=config.token)

    sync_experiences(notion, config, experiences)
    sync_projects(notion, config, projects)
    sync_papers(notion, config, papers)

    logger.info("Done!")


if __name__ == "__main__":
    main()
