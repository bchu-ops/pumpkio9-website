"""Parse a PDF resume into structured entry lists."""

import re
from datetime import date
from pathlib import Path

import pymupdf

from .models import ExperienceEntry, PaperEntry, ProjectEntry

MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

DATE_RANGE_RE = re.compile(
    r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z.]*\s*(\d{4})"
    r"\s*[-\u2013]\s*"
    r"(Present|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z.]*\s*(\d{4}))",
    re.IGNORECASE,
)

SECTION_HEADERS = {
    "experiences": re.compile(
        r"^(WORK\s+EXPERIENCE|Engineering\s+Experience)$", re.IGNORECASE
    ),
    "projects": re.compile(
        r"^(PROJECTS|Projects\s*&\s*Outside)$", re.IGNORECASE
    ),
    "papers": re.compile(
        r"^(PAPERS|PUBLICATIONS|Papers\s*&\s*Publications)$", re.IGNORECASE
    ),
    "skip": re.compile(r"^(EDUCATION|SKILLS|ACTIVITIES)$", re.IGNORECASE),
}

BULLET_RE = re.compile(r"^[\u25cf\u2022\u00b7\u25aa\u25a0\-]\s*")
ROLE_RE = re.compile(
    r"^(AI\s+Engineer|ML\s+Operations\s+Engineer|Software\s+Engineer"
    r"|Process\s+Engineer|Thermal\s+Process\s+Engineer"
    r"|Research\s+Intern|Battery\s+Research\s+Intern"
    r"|Professional\s+Referee|Lab\s+Team\s+Member"
    r"|Presenter\s+and\s+Lab\s+Team\s+Member"
    r"|[\w\s]*(?:Engineer|Intern|Developer|Researcher|Technician|Member|Referee))",
    re.IGNORECASE,
)


def extract_text(pdf_path: str | Path) -> str:
    """Extract all text from a PDF file."""
    doc = pymupdf.open(str(pdf_path))
    pages = [page.get_text() for page in doc]
    doc.close()
    return "\n".join(pages)


def _clean_line(line: str) -> str:
    """Remove zero-width spaces and excessive whitespace."""
    cleaned = line.replace("\u200b", "").replace("\u200c", "").replace("\u200d", "")
    return re.sub(r"\s+", " ", cleaned).strip()


def _parse_date(month_str: str, year_str: str) -> date:
    month = MONTH_MAP[month_str[:3].lower()]
    return date(int(year_str), month, 1)


def _parse_date_range(text: str) -> tuple[date | None, date | None]:
    match = DATE_RANGE_RE.search(text)
    if not match:
        return None, None
    start = _parse_date(match.group(1), match.group(2))
    if match.group(3).strip().lower() == "present":
        return start, None
    end = _parse_date(match.group(4), match.group(5))
    return start, end


def _detect_section(line: str) -> str | None:
    for name, pattern in SECTION_HEADERS.items():
        if pattern.match(line):
            return name
    return None


def _is_only_date(line: str) -> bool:
    """Check if line is just a date range (possibly with whitespace junk)."""
    stripped = DATE_RANGE_RE.sub("", line).strip()
    return len(stripped) < 3 and DATE_RANGE_RE.search(line) is not None


def _is_bullet_continuation(line: str) -> bool:
    """Check if a line looks like a wrapped continuation of a bullet."""
    if BULLET_RE.match(line) or DATE_RANGE_RE.search(line):
        return False
    if len(line) < 30:
        return False
    # Wrapped lines often start lowercase, or mid-word/mid-sentence
    return line[0].islower() or line[0] in (",", ")", "]")


def _has_company_marker(line: str) -> bool:
    """Lines with | separating company and location are entry headers."""
    return "|" in line and not line.startswith("(")


def parse_resume(text: str) -> tuple[
    list[ExperienceEntry], list[ProjectEntry], list[PaperEntry]
]:
    """Parse resume text into three lists of entries."""
    raw_lines = text.split("\n")
    lines = [_clean_line(ln) for ln in raw_lines]
    lines = [ln for ln in lines if ln]

    experiences: list[dict] = []
    projects: list[dict] = []
    papers: list[dict] = []

    current_section: str | None = None
    current: dict | None = None
    pending_date: tuple[date | None, date | None] | None = None
    last_was_bullet = False

    def _flush():
        nonlocal current
        if current is None or not current["name"]:
            current = None
            return
        target = {"experiences": experiences, "projects": projects, "papers": papers}
        bucket = target.get(current_section)  # type: ignore[arg-type]
        if bucket is not None:
            bucket.append(current)
        current = None

    for line in lines:
        section = _detect_section(line)
        if section:
            _flush()
            current_section = None if section == "skip" else section
            pending_date = None
            continue

        if current_section is None:
            continue

        # Bullet points
        if BULLET_RE.match(line):
            if current is not None:
                bullet = BULLET_RE.sub("", line)
                current["bullets"].append(bullet)
            last_was_bullet = True
            continue

        # Bullet continuation — wrapped line from a multi-line bullet
        # Only treat as a new entry title if it's short AND doesn't look like
        # a sentence fragment (e.g. starts with a common continuation word)
        _CONT_STARTERS = re.compile(
            r"^(and|or|with|for|using|to|by|in|on|at|the|a|an|"
            r"Network|Hugging|Regression|including|improving|enabling|replacing)"
            r"\b", re.IGNORECASE
        )
        is_likely_title = (
            len(line) < 55
            and line[0].isupper()
            and not _CONT_STARTERS.match(line)
        )
        if (
            last_was_bullet
            and current is not None
            and current["bullets"]
            and not DATE_RANGE_RE.search(line)
            and not _detect_section(line)
            and not _has_company_marker(line)
            and not is_likely_title
        ):
            current["bullets"][-1] += " " + line
            continue

        last_was_bullet = False

        # Date-only line — store for association with next/current entry
        if _is_only_date(line):
            s, e = _parse_date_range(line)
            if current is not None and not current["date_ranges"]:
                current["date_ranges"].append((s, e))
            else:
                pending_date = (s, e)
            continue

        # Line with company | location and possibly a date
        if _has_company_marker(line) and current_section == "experiences":
            _flush()
            parts = [p.strip() for p in line.split("|")]
            name = parts[0]
            location = parts[1] if len(parts) > 1 else ""
            s, e = _parse_date_range(line)
            date_ranges = [(s, e)] if s else []
            if not date_ranges and pending_date:
                date_ranges = [pending_date]
                pending_date = None
            current = {
                "name": name,
                "roles": [],
                "date_ranges": date_ranges,
                "location": location,
                "tools": "",
                "bullets": [],
            }
            continue

        # Role line (e.g. "AI Engineer", "Software Engineer Intern")
        if ROLE_RE.match(line) and not DATE_RANGE_RE.search(line):
            if current is not None:
                current["roles"].append(line)
                if pending_date:
                    current["date_ranges"].append(pending_date)
                    pending_date = None
            continue

        # Project/paper entry line (has date in it or is a title-like line)
        date_match = DATE_RANGE_RE.search(line)
        if date_match and current_section in ("projects", "papers"):
            _flush()
            name = DATE_RANGE_RE.sub("", line).replace("|", "").strip()
            s, e = _parse_date_range(line)
            current = {
                "name": name,
                "roles": [],
                "date_ranges": [(s, e)] if s else [],
                "location": "",
                "tools": "",
                "bullets": [],
            }
            continue

        # Experience sub-role with date
        if date_match and current is not None and current_section == "experiences":
            role_part = DATE_RANGE_RE.sub("", line).replace("|", "").strip()
            s, e = _parse_date_range(line)
            if role_part:
                current["roles"].append(role_part)
            current["date_ranges"].append((s, e))
            continue

        # Bullet continuation — wrapped line (starts lowercase or mid-sentence)
        if (
            current is not None
            and current["bullets"]
            and len(line) > 20
            and not _has_company_marker(line)
            and (line[0].islower() or line[0] in (",", ")", "]", ";"))
        ):
            current["bullets"][-1] += " " + line
            continue

        # New entry (project/paper name without date)
        if current_section in ("projects", "papers") and len(line) > 5:
            _flush()
            current = {
                "name": line,
                "roles": [],
                "date_ranges": [pending_date] if pending_date else [],
                "location": "",
                "tools": "",
                "bullets": [],
            }
            pending_date = None
            continue

    _flush()

    return (
        [_to_experience(e) for e in experiences],
        [_to_project(p) for p in projects],
        [_to_paper(p) for p in papers],
    )


def _earliest_start(ranges: list[tuple]) -> date | None:
    starts = [s for s, _ in ranges if s]
    return min(starts) if starts else None


def _latest_end(ranges: list[tuple]) -> date | None:
    has_present = any(e is None for s, e in ranges if s is not None)
    if has_present:
        return None
    ends = [e for _, e in ranges if e is not None]
    return max(ends) if ends else None


def _to_experience(raw: dict) -> ExperienceEntry:
    return ExperienceEntry(
        company=raw["name"],
        positions=tuple(raw["roles"]),
        team="",
        start_date=_earliest_start(raw["date_ranges"]),
        end_date=_latest_end(raw["date_ranges"]),
        location=raw.get("location", ""),
        tools=raw.get("tools", ""),
        description="",
        bullets=tuple(raw["bullets"]),
    )


def _to_project(raw: dict) -> ProjectEntry:
    return ProjectEntry(
        name=raw["name"],
        description="",
        start_date=_earliest_start(raw["date_ranges"]),
        end_date=_latest_end(raw["date_ranges"]),
        tools=raw.get("tools", ""),
        link="",
        bullets=tuple(raw["bullets"]),
    )


def _to_paper(raw: dict) -> PaperEntry:
    return PaperEntry(
        title=raw["name"],
        description="",
        tools=raw.get("tools", ""),
        bullets=tuple(raw["bullets"]),
    )
