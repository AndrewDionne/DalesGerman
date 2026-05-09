# Polish Invisible Friend Practice App

A static, GitHub Pages-ready practice app for short Polish description questions about an **invisible friend**.

## Features

- iPhone-friendly layout
- Sticky bottom navigation bar for modules
- Modules contain groups of short question rows
- Compact rows expand on tap
- `Q` button plays the Polish question audio
- `A` button plays the Polish answer audio
- If MP3 files have not been generated yet, the app falls back to browser speech for Polish
- Toggle button flips the displayed text between Polish and English
- Pure static frontend: HTML, CSS, JavaScript, JSON, MP3 files
- `tools/` folder for generating MP3 files into `audio/`

## Repo structure

```text
.
  index.html
  styles.css
  app.js
  data/
    modules.json
  audio/
    *.mp3
  tools/
    generate_audio.py
    run_generate_audio.sh
    requirements.txt
```

## Content model

Each item in `data/modules.json` can use:

- `question_pl`
- `question_en`
- `answer_pl`
- `answer_en`
- optional `q_audio`
- optional `a_audio`

## Generate audio files

From the repo root:

```bash
./tools/run_generate_audio.sh --lang pl --overwrite
```

That command will create MP3 files in `audio/` and update `data/modules.json`.

## Deploy to GitHub Pages

1. Commit and push the repo.
2. In GitHub, open **Settings → Pages**.
3. Set the source to **Deploy from a branch**.
4. Choose your branch and `/root`.
5. Save.

## Study focus

This content is built around short teacher-style questions such as:

- What is your friend's name?
- What colour is his hair?
- Is he tall?
- What does he like doing?
- Where does he live?
- What does he wear?

The model answers are intentionally short and easy to memorise.
