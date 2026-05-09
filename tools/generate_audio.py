#!/usr/bin/env python3
"""Generate audio MP3 files from data/modules.json and write them to /audio.

Default behavior:
- Reads repo-root/data/modules.json
- Writes MP3s into repo-root/audio/
- Updates each item with q_audio and a_audio paths
- Skips files that already exist unless --overwrite is provided

The script is intentionally tolerant of different content keys so it can work with:
- question_pl / answer_pl
- question_de / answer_de
- question / answer
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any, Tuple

from gtts import gTTS

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATA_PATH = REPO_ROOT / "data" / "modules.json"
DEFAULT_AUDIO_DIR = REPO_ROOT / "audio"

QUESTION_KEY_CANDIDATES = (
    "question_pl",
    "question_de",
    "question",
)
ANSWER_KEY_CANDIDATES = (
    "answer_pl",
    "answer_de",
    "answer",
)


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_value = ascii_value.lower().strip()
    ascii_value = re.sub(r"[^a-z0-9]+", "_", ascii_value)
    ascii_value = re.sub(r"_+", "_", ascii_value).strip("_")
    return ascii_value or "item"


def choose_keys(item: dict[str, Any], question_key: str | None, answer_key: str | None) -> Tuple[str, str]:
    q_key = question_key
    a_key = answer_key

    if q_key is None:
        q_key = next((candidate for candidate in QUESTION_KEY_CANDIDATES if item.get(candidate)), None)
    if a_key is None:
        a_key = next((candidate for candidate in ANSWER_KEY_CANDIDATES if item.get(candidate)), None)

    if not q_key or not a_key:
        raise KeyError(
            "Could not determine question/answer keys for item. "
            "Use --question-key and --answer-key if your JSON uses custom field names."
        )

    return q_key, a_key


def build_file_names(module_id: str, group_title: str, global_index: int) -> Tuple[str, str]:
    base = slugify(group_title)
    q_filename = f"{module_id}_{base}_{global_index:03d}_q.mp3"
    a_filename = f"{module_id}_{base}_{global_index:03d}_a.mp3"
    return q_filename, a_filename


def generate_mp3(text: str, lang: str, target_path: Path, slow: bool = False) -> None:
    tts = gTTS(text=text, lang=lang, slow=slow)
    tts.save(str(target_path))


def process_modules(
    payload: dict[str, Any],
    audio_dir: Path,
    lang: str,
    overwrite: bool,
    question_key: str | None,
    answer_key: str | None,
    slow: bool,
) -> tuple[int, int]:
    written_count = 0
    skipped_count = 0

    modules = payload.get("modules", [])
    if not isinstance(modules, list):
        raise ValueError("JSON payload must contain a top-level 'modules' list.")

    for module in modules:
        module_id = str(module.get("id", "module"))
        groups = module.get("groups", [])
        if not isinstance(groups, list):
            continue

        global_index = 0
        for group in groups:
            group_title = str(group.get("title", "group"))
            items = group.get("items", [])
            if not isinstance(items, list):
                continue

            for item in items:
                global_index += 1
                if not isinstance(item, dict):
                    continue

                q_key, a_key = choose_keys(item, question_key, answer_key)
                question_text = str(item.get(q_key, "")).strip()
                answer_text = str(item.get(a_key, "")).strip()

                if not question_text or not answer_text:
                    skipped_count += 1
                    print(f"Skipping item {module_id}/{group_title} #{global_index}: missing text")
                    continue

                q_filename, a_filename = build_file_names(module_id, group_title, global_index)
                q_path = audio_dir / q_filename
                a_path = audio_dir / a_filename

                if overwrite or not q_path.exists():
                    print(f"Generating {q_filename}")
                    generate_mp3(question_text, lang, q_path, slow=slow)
                    written_count += 1
                else:
                    print(f"Keeping existing {q_filename}")

                if overwrite or not a_path.exists():
                    print(f"Generating {a_filename}")
                    generate_mp3(answer_text, lang, a_path, slow=slow)
                    written_count += 1
                else:
                    print(f"Keeping existing {a_filename}")

                item["q_audio"] = f"audio/{q_filename}"
                item["a_audio"] = f"audio/{a_filename}"

    return written_count, skipped_count


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate MP3 audio files from modules.json.")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_PATH, help="Path to modules.json")
    parser.add_argument("--audio-dir", type=Path, default=DEFAULT_AUDIO_DIR, help="Directory to write MP3 files into")
    parser.add_argument("--lang", default="pl", help="gTTS language code, e.g. pl or de")
    parser.add_argument("--question-key", default=None, help="Explicit JSON key for question text")
    parser.add_argument("--answer-key", default=None, help="Explicit JSON key for answer text")
    parser.add_argument("--overwrite", action="store_true", help="Regenerate files even if they already exist")
    parser.add_argument("--slow", action="store_true", help="Use slower speech")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    data_path = args.data.resolve()
    audio_dir = args.audio_dir.resolve()

    if not data_path.exists():
        print(f"Data file not found: {data_path}", file=sys.stderr)
        return 1

    audio_dir.mkdir(parents=True, exist_ok=True)

    with data_path.open("r", encoding="utf-8") as f:
        payload = json.load(f)

    written_count, skipped_count = process_modules(
        payload=payload,
        audio_dir=audio_dir,
        lang=args.lang,
        overwrite=args.overwrite,
        question_key=args.question_key,
        answer_key=args.answer_key,
        slow=args.slow,
    )

    with data_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print()
    print(f"Audio generation complete. Wrote {written_count} MP3 files.")
    if skipped_count:
        print(f"Skipped {skipped_count} items with missing text.")
    print(f"Updated JSON: {data_path}")
    print(f"Audio directory: {audio_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
