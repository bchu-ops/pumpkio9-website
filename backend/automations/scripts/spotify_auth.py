"""
spotify_auth.py

One-time helper: log in to Spotify in the browser and print a refresh token
for sync_spotify.py. Run it once on your own machine, then store the token
as the SPOTIFY_REFRESH_TOKEN secret. Never commit the token.

Usage: uv run python scripts/spotify_auth.py

Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env, and
http://127.0.0.1:8888/callback added as a Redirect URI in the Spotify app.
"""

from __future__ import annotations

import base64
import os
import secrets
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlencode, urlparse

import httpx
from dotenv import load_dotenv

REDIRECT_URI = "http://127.0.0.1:8888/callback"
SCOPES = "user-read-recently-played user-top-read"


def wait_for_code(expected_state: str) -> str:
    result: dict[str, str] = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802 (stdlib name)
            query = parse_qs(urlparse(self.path).query)
            if query.get("state", [""])[0] != expected_state:
                result["error"] = "state mismatch"
            elif "error" in query:
                result["error"] = query["error"][0]
            else:
                result["code"] = query.get("code", [""])[0]
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Done. You can close this tab and go back to the terminal.")

        def log_message(self, *args) -> None:
            pass

    with HTTPServer(("127.0.0.1", 8888), Handler) as server:
        while not result:
            server.handle_request()
    if "error" in result:
        raise SystemExit(f"Spotify login failed: {result['error']}")
    return result["code"]


def main() -> None:
    load_dotenv()
    client_id = os.environ["SPOTIFY_CLIENT_ID"]
    client_secret = os.environ["SPOTIFY_CLIENT_SECRET"]
    state = secrets.token_urlsafe(16)

    url = "https://accounts.spotify.com/authorize?" + urlencode(
        {
            "client_id": client_id,
            "response_type": "code",
            "redirect_uri": REDIRECT_URI,
            "scope": SCOPES,
            "state": state,
        }
    )
    print(f"Opening Spotify login. If nothing opens, visit:\n{url}\n")
    webbrowser.open(url)
    code = wait_for_code(state)

    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    resp = httpx.post(
        "https://accounts.spotify.com/api/token",
        data={"grant_type": "authorization_code", "code": code, "redirect_uri": REDIRECT_URI},
        headers={"Authorization": f"Basic {basic}"},
        timeout=20,
    )
    resp.raise_for_status()
    print("Refresh token (save as SPOTIFY_REFRESH_TOKEN, keep it private):\n")
    print(resp.json()["refresh_token"])


if __name__ == "__main__":
    main()
