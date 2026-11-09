"""
sync_spotify.py

Pulls Brian's Spotify listening data and saves it as static JSON for the
/Spotify page. Same shape as sync_notion.py: a scheduled job writes JSON,
React reads it, and no token ever reaches the browser.

Usage: uv run python scripts/sync_spotify.py

Requires (in .env locally, or GitHub Actions secrets):
  SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
  (get the refresh token once with scripts/spotify_auth.py)

Output: frontend/public/spotify/listening.json

If anything fails, the script exits non-zero and leaves the previous
JSON untouched, so the page keeps showing the last good data.
"""

from __future__ import annotations

import base64
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv
from pydantic import BaseModel

log = logging.getLogger("sync_spotify")

TOKEN_URL = "https://accounts.spotify.com/api/token"
API_URL = "https://api.spotify.com/v1"
TIME_RANGES = ("short_term", "medium_term", "long_term")
RECENT_LIMIT = 50
TOP_LIMIT = 10
OUTPUT_PATH = (
    Path(__file__).resolve().parents[3] / "frontend" / "public" / "spotify" / "listening.json"
)


class Link(BaseModel):
    name: str
    url: str | None = None


class Album(BaseModel):
    name: str
    image: str | None = None
    url: str | None = None


class Track(BaseModel):
    id: str
    name: str
    url: str | None = None
    duration_ms: int
    artists: list[Link]
    album: Album


class Play(BaseModel):
    played_at: str
    track: Track


class Artist(BaseModel):
    id: str
    name: str
    url: str | None = None
    image: str | None = None


class Listening(BaseModel):
    generated_at: str
    recent: list[Play]
    top_tracks: dict[str, list[Track]]
    top_artists: dict[str, list[Artist]]


def pick_image(images: list[dict] | None, target: int = 300) -> str | None:
    """Smallest image at least `target` px wide, else the largest available."""
    if not images:
        return None
    by_size = sorted(images, key=lambda i: i.get("width") or 0)
    for image in by_size:
        if (image.get("width") or 0) >= target:
            return image["url"]
    return by_size[-1]["url"]


def to_track(raw: dict) -> Track:
    album = raw.get("album") or {}
    return Track(
        id=raw["id"],
        name=raw["name"],
        url=(raw.get("external_urls") or {}).get("spotify"),
        duration_ms=raw.get("duration_ms", 0),
        artists=[
            Link(name=a["name"], url=(a.get("external_urls") or {}).get("spotify"))
            for a in raw.get("artists", [])
        ],
        album=Album(
            name=album.get("name", ""),
            image=pick_image(album.get("images")),
            url=(album.get("external_urls") or {}).get("spotify"),
        ),
    )


def to_artist(raw: dict) -> Artist:
    return Artist(
        id=raw["id"],
        name=raw["name"],
        url=(raw.get("external_urls") or {}).get("spotify"),
        image=pick_image(raw.get("images")),
    )


def refresh_access_token(
    client: httpx.Client, client_id: str, client_secret: str, refresh_token: str
) -> str:
    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    resp = client.post(
        TOKEN_URL,
        data={"grant_type": "refresh_token", "refresh_token": refresh_token},
        headers={"Authorization": f"Basic {basic}"},
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def fetch_listening(client: httpx.Client, access_token: str) -> Listening:
    headers = {"Authorization": f"Bearer {access_token}"}

    def get(path: str, **params) -> dict:
        resp = client.get(f"{API_URL}{path}", params=params, headers=headers)
        resp.raise_for_status()
        return resp.json()

    recent = [
        Play(played_at=item["played_at"], track=to_track(item["track"]))
        for item in get("/me/player/recently-played", limit=RECENT_LIMIT)["items"]
        if item.get("track") and item["track"].get("id")
    ]
    top_tracks = {
        r: [to_track(t) for t in get("/me/top/tracks", time_range=r, limit=TOP_LIMIT)["items"]]
        for r in TIME_RANGES
    }
    top_artists = {
        r: [to_artist(a) for a in get("/me/top/artists", time_range=r, limit=TOP_LIMIT)["items"]]
        for r in TIME_RANGES
    }
    return Listening(
        generated_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        recent=recent,
        top_tracks=top_tracks,
        top_artists=top_artists,
    )


def write_if_changed(listening: Listening, path: Path) -> bool:
    """Write the JSON. Returns False when only `generated_at` would change."""
    new_body = listening.model_dump(exclude={"generated_at"})
    if path.exists():
        try:
            old = Listening.model_validate_json(path.read_text())
            if old.model_dump(exclude={"generated_at"}) == new_body:
                return False
        except ValueError:
            log.warning("Existing %s is invalid; overwriting", path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(listening.model_dump_json(indent=2) + "\n")
    tmp.replace(path)
    return True


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise SystemExit(f"Missing {name}. Set it in backend/automations/.env or Actions secrets.")
    return value


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    load_dotenv()
    client_id = require_env("SPOTIFY_CLIENT_ID")
    client_secret = require_env("SPOTIFY_CLIENT_SECRET")
    refresh_token = require_env("SPOTIFY_REFRESH_TOKEN")

    try:
        with httpx.Client(timeout=20) as client:
            token = refresh_access_token(client, client_id, client_secret, refresh_token)
            log.info("Refreshed access token")
            listening = fetch_listening(client, token)
    except httpx.HTTPStatusError as err:
        log.error("Spotify returned %s for %s", err.response.status_code, err.request.url)
        return 1
    except httpx.HTTPError as err:
        log.error("Network error talking to Spotify: %s", err)
        return 1

    log.info("Fetched %d recent plays", len(listening.recent))
    changed = write_if_changed(listening, OUTPUT_PATH)
    log.info("Wrote %s" if changed else "No changes in %s", OUTPUT_PATH)
    return 0


if __name__ == "__main__":
    sys.exit(main())
