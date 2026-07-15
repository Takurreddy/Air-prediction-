#!/usr/bin/env python3
"""
sync_ml_artifacts.py
--------------------
Copies the trained ML artifacts from the project root into the backend's
ml/ directory so they are available to `docker build`.

Usage (from the repo root or the backend directory):
    python scripts/sync_ml_artifacts.py [--dry-run] [--verbose]
"""

import argparse
import hashlib
import shutil
import sys
from pathlib import Path

SCRIPT_DIR   = Path(__file__).resolve().parent
BACKEND_ROOT = SCRIPT_DIR.parent
PROJECT_ROOT = BACKEND_ROOT.parent

SRC_MODEL  = PROJECT_ROOT / "lstm_air_quality_model.keras"
SRC_SCALER = PROJECT_ROOT / "time_scaler.pkl"

DST_ML_DIR = BACKEND_ROOT / "ml"
DST_MODEL  = DST_ML_DIR / "lstm_air_quality_model.keras"
DST_SCALER = DST_ML_DIR / "time_scaler.pkl"

DOCKERFILE = BACKEND_ROOT / "Dockerfile"


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _dir_sha256(directory: Path) -> str:
    h = hashlib.sha256()
    for p in sorted(directory.rglob("*")):
        if p.is_file():
            h.update(str(p.relative_to(directory)).encode())
            h.update(_sha256(p).encode())
    return h.hexdigest()


def _needs_update(src: Path, dst: Path) -> bool:
    if not dst.exists():
        return True
    if src.is_dir():
        return _dir_sha256(src) != _dir_sha256(dst)
    return _sha256(src) != _sha256(dst)


def _copy(src: Path, dst: Path, dry_run: bool, verbose: bool) -> bool:
    if not _needs_update(src, dst):
        if verbose:
            print(f"  [skip]  {dst.relative_to(BACKEND_ROOT)}  (up-to-date)")
        return False
    if dry_run:
        print(f"  [dry]   would copy {src.name} → {dst.relative_to(BACKEND_ROOT)}")
        return True
    if dst.exists():
        shutil.rmtree(dst) if dst.is_dir() else dst.unlink()
    shutil.copytree(src, dst) if src.is_dir() else shutil.copy2(src, dst)
    if verbose:
        print(f"  [copy]  {src.name} → {dst.relative_to(BACKEND_ROOT)}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run",  action="store_true")
    parser.add_argument("--verbose",  action="store_true")
    args = parser.parse_args()

    errors = [f"Source artifact not found: {s}" for s in (SRC_MODEL, SRC_SCALER) if not s.exists()]
    if errors:
        for e in errors:
            print(f"ERROR: {e}", file=sys.stderr)
        return 1

    print("Syncing ML artifacts …")
    DST_ML_DIR.mkdir(parents=True, exist_ok=True)
    changed  = _copy(SRC_MODEL,  DST_MODEL,  args.dry_run, args.verbose)
    changed |= _copy(SRC_SCALER, DST_SCALER, args.dry_run, args.verbose)
    if not changed:
        print("  All artifacts already up-to-date.")
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
