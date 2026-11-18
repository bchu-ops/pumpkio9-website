import json

import httpx
import pytest

import sync_notion as n

PARENT = "a" * 32
COL = "b" * 32
VIEW = "c" * 32
ROW1 = "d" * 32
ROW2 = "e" * 32


def uid(raw: str) -> str:
    return n.format_uuid(raw)


# --- normalize_record_map -------------------------------------------------


def test_normalize_flattens_nested_value_and_carries_role():
    rm = {"block": {"x": {"value": {"value": {"id": "x"}, "role": "reader"}, "spaceId": "s"}}}
    out = n.normalize_record_map(rm)
    assert out["block"]["x"] == {"value": {"id": "x"}, "role": "reader"}


def test_normalize_keeps_existing_role_and_flat_records():
    rm = {
        "block": {
            "a": {"role": "editor", "value": {"value": {"id": "a"}, "role": "reader"}},
            "b": {"value": {"id": "b"}},
        }
    }
    out = n.normalize_record_map(rm)
    assert out["block"]["a"]["role"] == "editor"
    assert out["block"]["b"] == {"value": {"id": "b"}}


def test_normalize_pops_version_and_tolerates_non_dicts():
    rm = {"__version__": 3, "block": {"a": "junk"}, "other": [1]}
    out = n.normalize_record_map(rm)
    assert "__version__" not in out
    assert out["block"] == {"a": "junk"}


# --- property extractors --------------------------------------------------


def test_extract_date_experience_open_end_is_present():
    parts = [["‣", [["d", {"start_date": "2024-01-01"}]]]]
    assert n.extract_date_prop(parts, "experiences") == {"start": "2024-01-01", "end": "Present"}
    assert n.extract_date_prop(parts, "projects") == {"start": "2024-01-01", "end": ""}


def test_extract_date_range_and_empty():
    parts = [["‣", [["d", {"start_date": "2020-01-01", "end_date": "2021-02-02"}]]]]
    assert n.extract_date_prop(parts, "experiences") == {"start": "2020-01-01", "end": "2021-02-02"}
    assert n.extract_date_prop([], "experiences") == {"start": "", "end": ""}
    assert n.extract_date_prop([["no date"], "junk"], "experiences") == {"start": "", "end": ""}


def test_extract_text_prop():
    props = {"t": [["Hello "], ["world"]]}
    assert n.extract_text_prop(props, "t") == "Hello world"
    assert n.extract_text_prop(props, "missing") == ""


def test_extract_file_url():
    link = {"f": [["name.png", ["a", "https://x/y.png"]]]}
    assert n.extract_file_url(link, "f") == "https://x/y.png"
    assert n.extract_file_url({"f": [["/local/a.png"]]}, "f") == "/local/a.png"
    assert n.extract_file_url({"f": [["‣", ["a", "notaurl"]]]}, "f") == ""
    assert n.extract_file_url({}, "f") == ""


@pytest.mark.parametrize(
    "title,slug",
    [
        ("Hello, World!", "hello-world"),
        ("  A  --  B  ", "a-b"),
        ("Papers & Publications", "papers-publications"),
        ("---", ""),
    ],
)
def test_slugify(title, slug):
    assert n.slugify(title) == slug


# --- sort_rows ------------------------------------------------------------


def exp(title, end):
    return {"title": title, "duration": {"start": "2000", "end": end}}


def test_sort_experiences_present_first_then_end_desc_stable():
    rows = [
        exp("old", "2019-05"),
        exp("tie1", "2022-01"),
        exp("now", "Present"),
        exp("tie2", "2022-01"),
        exp("nodate", ""),
        {"title": "noduration"},
    ]
    n.sort_rows("experiences", rows)
    assert [r["title"] for r in rows] == ["now", "tie1", "tie2", "old", "nodate", "noduration"]


def test_sort_projects_start_desc_missing_last_stable():
    rows = [
        {"title": "a", "date": {"start": "2021-01-01"}},
        {"title": "none"},
        {"title": "b", "date": {"start": "2023-01-01"}},
        {"title": "c", "date": {"start": "2021-01-01"}},
        {"title": "empty", "date": {"start": ""}},
    ]
    n.sort_rows("projects", rows)
    assert [r["title"] for r in rows] == ["b", "a", "c", "none", "empty"]


def test_sort_other_sections_unchanged():
    rows = [{"title": "z"}, {"title": "a"}]
    assert n.sort_rows("papers", rows) == [{"title": "z"}, {"title": "a"}]


# --- query_collection request shape ---------------------------------------


def test_query_collection_request_shape():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["body"] = json.loads(request.content)
        return httpx.Response(200, json={"ok": True})

    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        assert n.query_collection(client, COL, VIEW) == {"ok": True}

    assert seen["url"] == f"{n.NOTION_API_URL}/queryCollection"
    body = seen["body"]
    assert body["collection"] == {"id": uid(COL)}
    assert body["collectionView"] == {"id": uid(VIEW)}
    assert body["loader"]["reducers"]["collection_group_results"]["limit"] == n.QUERY_LIMIT
    assert body["loader"]["userTimeZone"] == n.USER_TIMEZONE


# --- run_sync: output only replaced after everything succeeded -------------


def make_handler(fail_query: bool = False, fail_parent: bool = False):
    parent_map = {
        "block": {
            "cv": {"value": {"type": "collection_view", "collection_id": COL, "view_ids": [VIEW]}},
        },
        "collection": {
            COL: {"value": {"name": [["Projects"]], "schema": {"d": {"name": "Date", "type": "date"}}}}
        },
    }
    rows = {
        uid(ROW1): ("Alpha", "2021-01-01"),
        uid(ROW2): ("Beta", "2023-01-01"),
    }

    def row_map(rid):
        title, start = rows[rid]
        return {
            "block": {
                rid: {
                    "value": {
                        "id": rid,
                        "properties": {
                            "title": [[title]],
                            "d": [["‣", [["d", {"start_date": start}]]]],
                        },
                    }
                }
            }
        }

    def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        if request.url.path.endswith("/queryCollection"):
            if fail_query:
                return httpx.Response(500)
            return httpx.Response(
                200,
                json={"result": {"reducerResults": {"collection_group_results": {"blockIds": list(rows)}}}},
            )
        pid = body["page"]["id"]
        if pid == uid(PARENT):
            if fail_parent:
                return httpx.Response(503)
            return httpx.Response(200, json={"recordMap": parent_map})
        return httpx.Response(200, json={"recordMap": row_map(pid)})

    return handler


def test_run_sync_success_writes_sorted_output_and_replaces_stale(tmp_path):
    out = tmp_path / "public" / "notion"
    out.mkdir(parents=True)
    (out / "stale.json").write_text("{}", encoding="utf-8")
    (out / "keep.txt").write_text("x", encoding="utf-8")

    with httpx.Client(transport=httpx.MockTransport(make_handler())) as client:
        assert n.run_sync(client, PARENT, out) == 0

    assert not (out / "stale.json").exists()
    assert (out / "keep.txt").exists()
    assert {p.name for p in out.glob("*.json")} == {
        "index.json", "collections.json", "pages.json", "alpha.json", "beta.json",
    }
    cols = json.loads((out / "collections.json").read_text(encoding="utf-8"))
    assert [r["title"] for r in cols["projects"]] == ["Beta", "Alpha"]
    # staging dir cleaned up
    assert [p.name for p in out.parent.iterdir()] == ["notion"]


@pytest.mark.parametrize("kw", [{"fail_query": True}, {"fail_parent": True}])
def test_run_sync_failure_exits_nonzero_and_preserves_existing_files(tmp_path, kw):
    out = tmp_path / "public" / "notion"
    out.mkdir(parents=True)
    (out / "collections.json").write_text('{"old": true}', encoding="utf-8")
    (out / "old-row.json").write_text("{}", encoding="utf-8")

    with httpx.Client(transport=httpx.MockTransport(make_handler(**kw))) as client:
        assert n.run_sync(client, PARENT, out) == 1

    assert (out / "collections.json").read_text(encoding="utf-8") == '{"old": true}'
    assert sorted(p.name for p in out.glob("*.json")) == ["collections.json", "old-row.json"]
    assert [p.name for p in out.parent.iterdir()] == ["notion"]
