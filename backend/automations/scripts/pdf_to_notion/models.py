"""Frozen dataclasses for resume entries and Notion configuration."""

import os
from dataclasses import dataclass, field
from datetime import date


@dataclass(frozen=True)
class ExperienceEntry:
    """A work experience parsed from the resume."""

    company: str
    positions: tuple[str, ...] = ()
    team: str = ""
    start_date: date | None = None
    end_date: date | None = None  # None means "Present"
    location: str = ""
    tools: str = ""
    description: str = ""
    bullets: tuple[str, ...] = ()


@dataclass(frozen=True)
class ProjectEntry:
    """A project parsed from the resume."""

    name: str
    description: str = ""
    start_date: date | None = None
    end_date: date | None = None
    tools: str = ""
    link: str = ""
    bullets: tuple[str, ...] = ()


@dataclass(frozen=True)
class PaperEntry:
    """A paper or publication parsed from the resume."""

    title: str
    description: str = ""
    tools: str = ""
    bullets: tuple[str, ...] = ()


@dataclass(frozen=True)
class NotionConfig:
    """Notion API configuration loaded from environment variables."""

    token: str
    experiences_db_id: str
    projects_db_id: str
    papers_db_id: str

    @staticmethod
    def from_env() -> "NotionConfig":
        """Load config from environment variables. Raises ValueError if missing."""
        token = os.getenv("NOTION_TOKEN", "")
        exp_id = os.getenv("NOTION_EXPERIENCES_DB_ID", "")
        proj_id = os.getenv("NOTION_PROJECTS_DB_ID", "")
        papers_id = os.getenv("NOTION_PAPERS_DB_ID", "")

        missing = []
        if not token:
            missing.append("NOTION_TOKEN")
        if not exp_id:
            missing.append("NOTION_EXPERIENCES_DB_ID")
        if not proj_id:
            missing.append("NOTION_PROJECTS_DB_ID")
        if not papers_id:
            missing.append("NOTION_PAPERS_DB_ID")

        if missing:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing)}"
            )

        return NotionConfig(
            token=token,
            experiences_db_id=exp_id,
            projects_db_id=proj_id,
            papers_db_id=papers_id,
        )
