"""Write parsed resume entries to Notion databases (additive only)."""

from datetime import date

from notion_client import Client

from .models import ExperienceEntry, NotionConfig, PaperEntry, ProjectEntry


def _format_date(d: date | None) -> str | None:
    return d.isoformat() if d else None


def _date_property(start: date | None, end: date | None) -> dict:
    if start is None:
        return {"date": None}
    date_val: dict = {"start": _format_date(start)}
    if end is not None:
        date_val["end"] = _format_date(end)
    return {"date": date_val}


def _title_prop(text: str) -> dict:
    return {"title": [{"text": {"content": text}}]}


def _rich_text_prop(text: str) -> dict:
    return {"rich_text": [{"text": {"content": text[:2000]}}]}


def _url_prop(url: str) -> dict:
    return {"url": url if url else None}


def _multi_select_prop(values: list[str]) -> dict:
    return {"multi_select": [{"name": v} for v in values]}


def _query_existing_titles(
    notion: Client, database_id: str, title_property: str
) -> set[str]:
    """Fetch all existing titles from a database for dedup."""
    titles: set[str] = set()
    cursor = None
    while True:
        kwargs: dict = {
            "query": "",
            "filter": {"property": "object", "value": "page"},
            "page_size": 100,
        }
        if cursor:
            kwargs["start_cursor"] = cursor
        response = notion.search(**kwargs)
        for page in response["results"]:
            if page.get("parent", {}).get("database_id") != database_id:
                continue
            prop = page.get("properties", {}).get(title_property, {})
            title_parts = prop.get("title", [])
            if title_parts:
                titles.add(title_parts[0].get("plain_text", "").strip().lower())
        if not response.get("has_more"):
            break
        cursor = response.get("next_cursor")
    return titles


def _make_paragraph_block(text: str) -> dict:
    """Create a paragraph block with plain text."""
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {"content": text[:2000]}}]
        },
    }


def _make_bold_paragraph(text: str) -> dict:
    """Create a paragraph block with bold text."""
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [
                {
                    "type": "text",
                    "text": {"content": text[:2000]},
                    "annotations": {"bold": True},
                }
            ]
        },
    }


def _make_mixed_paragraph(parts: list[tuple[str, bool]]) -> dict:
    """Create a paragraph with mixed bold/plain segments."""
    rich_text = []
    for content, bold in parts:
        item: dict = {"type": "text", "text": {"content": content}}
        if bold:
            item["annotations"] = {"bold": True}
        rich_text.append(item)
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {"rich_text": rich_text},
    }


def _format_date_display(d: date | None) -> str:
    if d is None:
        return "Present"
    return d.strftime("%B %Y")


def _experience_body(entry: ExperienceEntry) -> list[dict]:
    blocks: list[dict] = []
    if entry.description:
        blocks.append(_make_paragraph_block(entry.description))
    elif entry.bullets:
        blocks.append(_make_paragraph_block(". ".join(entry.bullets)))

    # Date/team lines per position
    start_str = _format_date_display(entry.start_date)
    end_str = _format_date_display(entry.end_date)
    if entry.positions:
        for pos in entry.positions:
            team_suffix = f": {entry.team}" if entry.team else ""
            blocks.append(
                _make_bold_paragraph(f"[{start_str} -> {end_str}]{team_suffix}")
            )
    else:
        blocks.append(_make_bold_paragraph(f"[{start_str} -> {end_str}]"))

    if entry.tools:
        blocks.append(
            _make_mixed_paragraph([
                ("Languages / Tools Used: ", True),
                (entry.tools, False),
            ])
        )
    if entry.location:
        blocks.append(
            _make_mixed_paragraph([("Location: ", True), (entry.location, False)])
        )
    if entry.bullets:
        summary = entry.bullets[0] if len(entry.bullets) == 1 else entry.bullets[-1]
        blocks.append(_make_paragraph_block(summary))
    return blocks


def _project_body(entry: ProjectEntry) -> list[dict]:
    blocks: list[dict] = []
    desc = entry.description or ". ".join(entry.bullets)
    if desc:
        blocks.append(_make_paragraph_block(desc))
    if entry.tools:
        blocks.append(
            _make_mixed_paragraph([
                ("Languages / Tools Used: ", True),
                (entry.tools, False),
            ])
        )
    return blocks


def _paper_body(entry: PaperEntry) -> list[dict]:
    blocks: list[dict] = []
    desc = entry.description or ". ".join(entry.bullets)
    if desc:
        blocks.append(_make_paragraph_block(desc))
    if entry.tools:
        blocks.append(
            _make_mixed_paragraph([
                ("Tools / Methods: ", True),
                (entry.tools, False),
            ])
        )
    return blocks


def sync_experiences(
    notion: Client, config: NotionConfig, entries: list[ExperienceEntry]
) -> None:
    db_id = config.experiences_db_id
    existing = _query_existing_titles(notion, db_id, "Role")
    print(f"\n-- Experiences: {len(entries)} parsed, {len(existing)} already in DB --")

    for entry in entries:
        if entry.company.lower() in existing:
            print(f"  [skip] {entry.company}")
            continue
        try:
            props = {
                "Role": _title_prop(entry.company),
                "Position": _multi_select_prop(list(entry.positions)),
                "Team": _rich_text_prop(entry.team),
                "Duration": _date_property(entry.start_date, entry.end_date),
            }
            notion.pages.create(
                parent={"database_id": db_id},
                properties=props,
                children=_experience_body(entry),
            )
            print(f"  [added] {entry.company}")
        except Exception as exc:
            print(f"  [error] {entry.company}: {exc}")


def sync_projects(
    notion: Client, config: NotionConfig, entries: list[ProjectEntry]
) -> None:
    db_id = config.projects_db_id
    existing = _query_existing_titles(notion, db_id, "Project name")
    print(f"\n-- Projects: {len(entries)} parsed, {len(existing)} already in DB --")

    for entry in entries:
        if entry.name.lower() in existing:
            print(f"  [skip] {entry.name}")
            continue
        try:
            props = {
                "Project name": _title_prop(entry.name),
                "Description": _rich_text_prop(
                    entry.description or ". ".join(entry.bullets)
                ),
                "Date": _date_property(entry.start_date, entry.end_date),
                "Tools": _rich_text_prop(entry.tools),
                "Link": _url_prop(entry.link),
            }
            notion.pages.create(
                parent={"database_id": db_id},
                properties=props,
                children=_project_body(entry),
            )
            print(f"  [added] {entry.name}")
        except Exception as exc:
            print(f"  [error] {entry.name}: {exc}")


def sync_papers(
    notion: Client, config: NotionConfig, entries: list[PaperEntry]
) -> None:
    db_id = config.papers_db_id
    existing = _query_existing_titles(notion, db_id, "Title")
    print(f"\n-- Papers: {len(entries)} parsed, {len(existing)} already in DB --")

    for entry in entries:
        if entry.title.lower() in existing:
            print(f"  [skip] {entry.title}")
            continue
        try:
            props = {
                "Title": _title_prop(entry.title),
                "Description": _rich_text_prop(
                    entry.description or ". ".join(entry.bullets)
                ),
                "Tools": _rich_text_prop(entry.tools),
            }
            notion.pages.create(
                parent={"database_id": db_id},
                properties=props,
                children=_paper_body(entry),
            )
            print(f"  [added] {entry.title}")
        except Exception as exc:
            print(f"  [error] {entry.title}: {exc}")
