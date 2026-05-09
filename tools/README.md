# Tools

This folder contains local scripts for generating question and answer audio files for the static study app.

## What it does

- reads `data/modules.json`
- creates MP3 files in `audio/`
- writes the matching `q_audio` and `a_audio` paths back into `data/modules.json`

## Files

- `generate_audio.py` — main generator script using gTTS
- `requirements.txt` — Python dependency list
- `run_generate_audio.sh` — Mac/Linux helper launcher

## Quick start

From the repo root:

```bash
./tools/run_generate_audio.sh --lang pl --overwrite
```

That command will:

1. create `.venv/` if needed
2. install the required package
3. generate Polish MP3 files into `audio/`
4. update `data/modules.json`

## Direct Python usage

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r tools/requirements.txt
python tools/generate_audio.py --lang pl --overwrite
```

## Default behavior

The script tries to auto-detect question and answer fields in each item using this order:

- `question_pl` / `answer_pl`
- `question_de` / `answer_de`
- `question` / `answer`

That means it can work with your current repo and also with a later Polish-content repo.

## Useful options

Generate Polish audio and replace any existing files:

```bash
python tools/generate_audio.py --lang pl --overwrite
```

Generate German audio instead:

```bash
python tools/generate_audio.py --lang de --overwrite
```

If your JSON uses custom field names:

```bash
python tools/generate_audio.py --lang pl --question-key question_pl --answer-key answer_pl
```

Use slower speech:

```bash
python tools/generate_audio.py --lang pl --slow --overwrite
```

## Notes

- gTTS needs an internet connection while generating the MP3 files.
- Audio files are named from the module id, group title, and item index.
- Existing files are kept unless you pass `--overwrite`.
