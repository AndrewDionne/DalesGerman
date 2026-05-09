# Polish Invisible Friend Practice

Static GitHub Pages app for practising short Polish question and answer pairs about an invisible friend.

## What the learner sees

- English question and English answer
- Polish question and Polish answer
- Audio buttons for the Polish question and Polish answer
- English-only interface labels and navigation

## Audio

Generate MP3 files locally into `audio/` with the scripts in `tools/`.

```bash
bash ./tools/run_generate_audio.sh --lang pl --overwrite
```

If no MP3 file is present, the app falls back to browser speech synthesis for Polish.
