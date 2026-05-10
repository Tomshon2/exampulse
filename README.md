# ExamPulse

ExamPulse is a lightweight web app to analyze past exam materials and help students prioritize what to study first.

It lets you import old exams/exercises, automatically extracts and classifies questions by topic, and ranks the most likely themes to appear again.

## What the App Does

- Imports exam content from pasted text or uploaded files (`.pdf`, `.docx`, `.txt`, `.md`, images).
- Extracts text from documents (including OCR for image-based content).
- Splits documents into individual exercises/questions.
- Classifies each exercise by:
  - topic(s)
  - type
  - difficulty
  - keywords
- Detects document type (exam/test/workbook/notes) to improve weighting.
- Deduplicates repeated questions.
- Calculates topic probability scores using:
  - frequency
  - consistency across years
  - recency
  - source quality/weight
- Generates likely future exercise prompts from historical patterns.
- Supports multiple subjects with independent datasets.
- Stores custom study advice per subject.
- Lets users write and save solutions per exercise.

## Main Views

- **Colar exercicios**: paste or import content and analyze it.
- **Mais provavel**: ranked topic predictions and likely exercise suggestions.
- **Exercicios**: grouped exercise history by document, with solution editors.

## Tech Stack

- Frontend:
  - `index.html`
  - `app.js`
  - `styles.css`
- Text extraction libraries (browser-side):
  - `pdf.js`
  - `mammoth` (DOCX)
  - `tesseract.js` (OCR)
  - `@supabase/supabase-js`
- Local backend options:
  - `server.py` (default in scripts)
  - `server.js` (alternative)

## Data and Persistence

The app uses two persistence layers:

1. **Local storage** (`localStorage`, key: `exampulse.v1`) for immediate offline-like state.
2. **Supabase sync** for cloud persistence when available.

Supabase schema is defined in `supabase_schema.sql` with:

- `subjects`
- `topics`
- `exercises`
- `documents`

Image persistence for exercises is stored as metadata in `exercises.images` and the binary files are uploaded to the public storage bucket `exercise-images`.

## Run Locally

From the project root:

```bash
npm run dev
```

This starts the Python server (`server.py`) on:

- `http://127.0.0.1:4321`

You can also run:

```bash
npm start
```

## Project Notes

- The UI language is Portuguese.
- Topic libraries include predefined subject/topic keyword sets and also support custom topics inferred from imported content.
- The app is intentionally simple and mostly client-driven, with a minimal local server used for static serving and local file import support.
