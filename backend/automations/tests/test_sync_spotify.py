import json
import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import sync_spotify as s  # noqa: E402


def raw_track(track_id: str = "t1") -> dict:
    return {
        "id": track_id,
        "name": f"Song {track_id}",
        "duration_ms": 200000,
        "external_urls": {"spotify": f"https://open.spotify.com/track/{track_id}"},
        "artists": [{"name": "Artist A", "external_urls": {"spotify": "https://a"}}],
        "album": {
            "name": "Album",
            "external_urls": {"spotify": "https://album"},
            "images": [
                {"url": "big", "width": 640},
                {"url": "mid", "width": 300},
                {"url": "small", "width": 64},
            ],
        },
    }


def raw_artist(artist_id: str = "a1") -> dict:
    return {"id": artist_id, "name": "Artist", "images": [], "external_urls": {}}


def make_transport(calls: list) -> httpx.MockTransport:
    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        path = request.url.path
        if path == "/api/token":
            return httpx.Response(200, json={"access_token": "AT"})
        if path == "/v1/me/player/recently-played":
            return httpx.Response(
                200,
                json={
                    "items": [
                        {"played_at": "2026-11-09T10:00:00Z", "track": raw_track("t1")},
                        {"played_at": "2026-11-09T09:00:00Z", "track": None},
                    ]
                },
            )
        if path == "/v1/me/top/tracks":
            return httpx.Response(200, json={"items": [raw_track("t2")]})
        if path == "/v1/me/top/artists":
            return httpx.Response(200, json={"items": [raw_artist()]})
        return httpx.Response(404)

    return httpx.MockTransport(handler)


@pytest.mark.unit
def test_pick_image_prefers_smallest_at_least_target():
    images = [{"url": "big", "width": 640}, {"url": "mid", "width": 300}, {"url": "s", "width": 64}]
    assert s.pick_image(images) == "mid"
    assert s.pick_image([{"url": "s", "width": 64}]) == "s"
    assert s.pick_image([]) is None


@pytest.mark.unit
def test_refresh_sends_basic_auth_and_refresh_grant():
    calls: list = []
    with httpx.Client(transport=make_transport(calls)) as client:
        token = s.refresh_access_token(client, "id", "secret", "RT")
    assert token == "AT"
    req = calls[0]
    assert req.headers["Authorization"].startswith("Basic ")
    assert b"grant_type=refresh_token" in req.content
    assert b"refresh_token=RT" in req.content


@pytest.mark.unit
def test_fetch_listening_shapes_data_and_skips_empty_tracks():
    calls: list = []
    with httpx.Client(transport=make_transport(calls)) as client:
        listening = s.fetch_listening(client, "AT")
    assert [p.track.id for p in listening.recent] == ["t1"]
    assert listening.recent[0].track.album.image == "mid"
    assert set(listening.top_tracks) == set(s.TIME_RANGES)
    assert listening.top_artists["short_term"][0].name == "Artist"
    assert all(r.headers["Authorization"] == "Bearer AT" for r in calls)


@pytest.mark.unit
def test_fetch_listening_raises_on_forbidden():
    transport = httpx.MockTransport(lambda r: httpx.Response(403))
    with httpx.Client(transport=transport) as client, pytest.raises(httpx.HTTPStatusError):
        s.fetch_listening(client, "AT")


@pytest.mark.unit
def test_write_if_changed_ignores_generated_at(tmp_path):
    calls: list = []
    with httpx.Client(transport=make_transport(calls)) as client:
        listening = s.fetch_listening(client, "AT")
    out = tmp_path / "spotify" / "listening.json"
    assert s.write_if_changed(listening, out) is True
    assert json.loads(out.read_text())["recent"][0]["track"]["id"] == "t1"

    later = listening.model_copy(update={"generated_at": "2099-01-01T00:00:00+00:00"})
    assert s.write_if_changed(later, out) is False


@pytest.mark.unit
def test_main_keeps_old_json_when_spotify_fails(tmp_path, monkeypatch):
    out = tmp_path / "listening.json"
    out.write_text("OLD")
    monkeypatch.setattr(s, "OUTPUT_PATH", out)
    monkeypatch.setattr(s, "load_dotenv", lambda: None)
    for name in ("SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REFRESH_TOKEN"):
        monkeypatch.setenv(name, "x")
    real_client = httpx.Client
    monkeypatch.setattr(
        s.httpx,
        "Client",
        lambda **kw: real_client(transport=httpx.MockTransport(lambda r: httpx.Response(401))),
    )
    assert s.main() == 1
    assert out.read_text() == "OLD"


@pytest.mark.unit
def test_missing_env_exits(monkeypatch):
    monkeypatch.delenv("SPOTIFY_CLIENT_ID", raising=False)
    with pytest.raises(SystemExit):
        s.require_env("SPOTIFY_CLIENT_ID")
