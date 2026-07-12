# 🎬 Movie Poster AI

Posters for films that never existed. Claude invents the film and art-directs the
one-sheet; an image model paints it — title lettering and all; the app proofreads
the result.

## How it works

```
Claude (structured output)  →  concept + art direction + title treatment
          ↓
Image model                 →  artwork with the title painted into it
          ↓
Canvas                      →  credits block composited on top
          ↓
Claude (vision)             →  proofreads the title against the ground truth
```

Three ideas do most of the work:

**The title is painted, not pasted.** A 1950s poster title was hand-lettered in
paint as part of the artwork. You cannot get that by stroking Impact over a
canvas — which is what this app used to do for all eight decades. Claude now
specifies the *lettering craft* for the era ("heavy condensed sans, screen-printed
with slight misregistration"), never a font name, and the image model letters it
into the art.

**Except the credits, which are composited.** A billing block is ten lines of 6pt
condensed type — the one thing no current image model renders reliably, and also
the one place where "correct spelling in a boring font" is the whole requirement.
So that, and only that, is drawn on canvas.

**The output is checked.** Because the concept is a structured object, we hold the
exact string the title was supposed to be, so "did the model spell it right?" is a
decidable question. `/api/verify-poster` reads the poster back with Claude vision
and reports what the title *actually* says.

## Setup

```bash
npm install
cp .env.example .env      # add your keys
npm run dev               # http://localhost:3000
```

`ANTHROPIC_API_KEY` is required. For images you need at least one of
`OPENAI_API_KEY` or `GEMINI_API_KEY`; set both and you can switch providers from
the UI to compare them on the same concept.

## Image providers

Both sit behind one interface (`api/lib/image/`), so they're interchangeable.

| | `gpt-image-2` | `gemini-3.1-flash-image` |
|---|---|---|
| In-image text | Best available — #1 on both blind-vote leaderboards | Good; weaker on small type |
| Repair a bad title | Yes — mask-based `/images/edits` | No; requires a re-render |
| Reference images | Yes | Up to 14, character consistency across 4 faces |
| Cost per poster | ~$0.165 (1024×1536, high) | ~$0.101 (2K, 2:3) |

Neither is a clear winner on *poster* text specifically — the leaderboards measure
general preference, and no published benchmark isolates in-image text accuracy.
That's exactly why both are wired up: judge them on your own posters.

## Models

Every model ID lives in `api/lib/models.js`. Nowhere else.

| Job | Model |
|---|---|
| Concept, song, proofreading | `claude-opus-4-8` |
| Image | `gpt-image-2` / `gemini-3.1-flash-image` |

The previous version pinned `claude-3-5-sonnet-20241022` (retired 2025-10-28) and
`gemini-2.0-flash-exp` (retired 2026-06-01) across five files, and *caught the
404s and returned canned fallback data with `success: true`* — so it silently
served hardcoded titles for months. Handlers now fail loudly. If a model dies, you
will know that day.

## Known gaps

- **Title repair is not automatic yet.** `verify-poster` tells you when a title is
  misspelled, and `gpt-image-2`'s edit endpoint can fix it in place, but
  synthesizing the alpha mask for the title region needs an image library
  (`sharp`). Today the fix is a re-render. The `edit()` path in
  `api/lib/image/openai.js` is wired and waiting for the mask.
- **The recurring cast isn't built.** Gemini's reference-image support is plumbed
  through (`referenceImages`), but nothing populates it yet. The idea: pin a house
  style and a repertory company of invented actors who recur across films and
  decades.
- **Gemini's image-config field name is ambiguous.** Google's REST docs and their
  SDK docs disagree (`responseFormat.image` vs `imageConfig`); the client tries one
  and retries with the other, then logs which won. Once you see which it is, delete
  the loser.
