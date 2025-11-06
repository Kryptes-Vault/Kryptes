#!/usr/bin/env python3
"""
Rewrite author/committer dates for commits by a given author on a single day,
spreading them unevenly across [start_date, end_date].

Usage:
  python scripts/redistribute_commit_dates.py [--dry-run]

Requires: git filter-branch (run from repo root; uses bash for filter-branch).
"""
from __future__ import annotations

import argparse
import os
import random
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

AUTHOR = "thanmayeereddykotha@gmail.com"
SINCE = "2026-04-06 00:00:00"
UNTIL = "2026-04-07 00:00:00"
# April 1 through May 1 (inclusive end-of-day), IST
TZ = "+0530"
START = datetime(2026, 4, 1, 8, 30, 0)
END = datetime(2026, 5, 1, 23, 30, 0)
SEED = 20260406


def git_rev_list(repo: Path) -> list[str]:
    out = subprocess.check_output(
        [
            "git",
            "-C",
            str(repo),
            "rev-list",
            "--reverse",
            f"--author={AUTHOR}",
            "--since",
            SINCE,
            "--until",
            UNTIL,
            "--all",
        ],
        text=True,
    )
    return [ln.strip() for ln in out.splitlines() if ln.strip()]


def uneven_timestamps(n: int) -> list[datetime]:
    """Strictly increasing datetimes in [START, END], unevenly spaced."""
    if n == 0:
        return []
    random.seed(SEED)
    if n == 1:
        return [START + timedelta(seconds=random.uniform(3600, (END - START).total_seconds() * 0.5))]
    total_sec = (END - START).total_seconds()
    min_gap = 50  # seconds between successive commits
    slack = total_sec - min_gap * (n - 1)
    if slack < 0:
        raise SystemExit(f"Date window too small for {n} commits (need ~{min_gap * (n - 1)}s min spacing).")
    weights = [random.random() ** 0.58 for _ in range(n - 1)]
    sw = sum(weights)
    gaps = [min_gap + slack * w / sw for w in weights]
    out: list[datetime] = []
    cur = START + timedelta(seconds=random.uniform(0, min(3600, max(60.0, slack * 0.02))))
    for i in range(n):
        out.append(cur)
        if i < n - 1:
            cur = cur + timedelta(seconds=gaps[i])
    # Scale into window if we drift past END
    if out[-1] > END:
        span = (out[-1] - out[0]).total_seconds() or 1.0
        factor = (END - START).total_seconds() * 0.998 / span
        base = out[0]
        out = [base + timedelta(seconds=(x - base).total_seconds() * factor) for x in out]
    return out


def format_git_date(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d %H:%M:%S") + " " + TZ


def write_env_filter(repo: Path, mapping: dict[str, str]) -> Path:
    lines = ['case "$GIT_COMMIT" in']
    for h, d in mapping.items():
        lines.append(f"  {h})")
        lines.append(f'    export GIT_AUTHOR_DATE="{d}"')
        lines.append(f'    export GIT_COMMITTER_DATE="{d}"')
        lines.append("    ;;")
    lines.append("esac")
    path = repo / "scripts" / "_env_filter_dates.sh"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    return path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Print mapping only")
    args = ap.parse_args()

    repo = Path(__file__).resolve().parents[1]
    hashes = git_rev_list(repo)
    n = len(hashes)
    if n == 0:
        print("No matching commits found.", file=sys.stderr)
        return 1

    dates = uneven_timestamps(n)
    mapping = {h: format_git_date(d) for h, d in zip(hashes, dates)}

    print(f"Commits to rewrite: {n}", file=sys.stderr)
    for h, d in mapping.items():
        print(f"{h[:12]} -> {d}")

    if args.dry_run:
        return 0

    ef = write_env_filter(repo, mapping)
    # Pass the full shell snippet as one argv so Windows does not split on spaces
    # (`. "/path/to/script"` was broken into separate args and only `.` ran).
    filter_body = ef.read_text(encoding="utf-8")
    env = {**os.environ, "FILTER_BRANCH_SQUELCH_WARNING": "1"}
    cmd = [
        "git",
        "-C",
        str(repo),
        "filter-branch",
        "-f",
        "--env-filter",
        filter_body,
        "--",
        "--all",
    ]
    print("Running: git filter-branch -f --env-filter <mapping> -- --all", file=sys.stderr)
    subprocess.check_call(cmd, env=env)
    print(
        "\nDone. Reflog: git reflog show. Backup: refs/original/. "
        "Force-push when ready: git push --force-with-lease --all",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
