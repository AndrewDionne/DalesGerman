# Polish Invisible Friend Practice

Static GitHub Pages app for practising short Polish question and answer pairs about an invisible friend.

## What the learner sees

- English question and English answer
- Polish question and Polish answer
- Audio buttons for the Polish question and Polish answer
- English-only interface labels and navigation
- A speed button beside the audio controls: normal speed or 0.8x

## Audio

The intended audio source is pre-generated MP3 using the normal gTTS Polish voice. Generate MP3 files locally into `audio/` with the scripts in `tools/`.

```bash
bash ./tools/run_generate_audio.sh --lang pl --overwrite
```

That command uses the default gTTS voice/speed and writes MP3 references back into `data/modules.json`.

If no MP3 file is present, the app falls back to browser speech synthesis for Polish. The fallback is useful during editing, but the published app should use generated MP3s for the most consistent voice.
