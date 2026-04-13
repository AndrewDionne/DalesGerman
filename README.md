# German Q&A Practice App

A static, GitHub Pages-ready practice app for German question-and-answer drills.

## Features

- iPhone-friendly layout
- Sticky bottom navigation bar for modules
- Modules contain groups of question rows
- Compact rows expand on tap
- `Q` button plays the German question audio
- `A` button plays the German answer audio
- Toggle button flips the displayed text between German and English
- Pure static frontend: HTML, CSS, JavaScript, JSON, MP3 files

## Repo structure

```text
static_app/
  index.html
  styles.css
  app.js
  data/
    modules.json
  audio/
    *.mp3
```

## Content model

Each item in `data/modules.json` needs:

- `question_de`
- `question_en`
- `answer_de`
- `answer_en`
- `q_audio`
- `a_audio`

## Deploy to GitHub Pages

1. Create a GitHub repo.
2. Copy the contents of `static_app/` into the repo root.
3. Commit and push.
4. In GitHub, open **Settings → Pages**.
5. Set the source to **Deploy from a branch**.
6. Choose your branch and `/root`.
7. Save.

## Add your own content

Use the generator app in the sibling `generator/` folder to create:

- `data/modules.json`
- German MP3 files in `audio/`

Then copy those generated files into this static repo and push again.
