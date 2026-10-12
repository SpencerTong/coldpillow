@AGENTS.md

# ColdPillow

Nightly voice journal. You talk (or type) at night; the app reflects back and builds insights over time. Expo SDK 57 + React Native + TypeScript + Expo Router; Firebase Cloud Functions for AI. Phase 1: a personal TestFlight build for one user (the owner), no accounts, no cloud sync.

## Where things are
- docs/mvp.md: Phase 1 scope, screens, data model and the 11-step build order. Read it before starting a step.
- docs/mockups/: the approved screen designs (HTML, 390pt wide). Match their layout and copy, but take every value from src/theme.ts.
- src/theme.ts: the only source of colors, fonts, spacing and radii.
- prompts/coldpillow-prompts.md: the nightly and weekly prompts, JSON schemas and test transcripts.

## Rules
These project rules take precedence over AGENTS.md if they ever conflict. AGENTS.md is Expo's SDK 57 guidance; follow it for how to use the SDK.
- The user only talks or types. No to-do management: no checkboxes, no task state, no worry buttons.
- Local-first: every night is saved to SQLite before any network call.
- Soft delete only (deletedAt).
- All colors, fonts and spacing come from src/theme.ts. No hardcoded styles.
- AI calls only from Cloud Functions (anonymous auth + App Check); no API keys in the app.
- Never ask for, print, read or write the Anthropic API key. The owner sets it himself with `firebase functions:secrets:set ANTHROPIC_API_KEY`; code reads it with defineSecret.
- One AI call per night; store the read. Screens only read stored results.
- Weekly insights are built from stored reads on first open after Sunday, then saved. No scheduled jobs.
- Prompts live in prompts/coldpillow-prompts.md. Save promptVersion and model on every result.
- Send the AI only transcript text, never user identifiers. Delete audio after transcription.
- If the crisis flag or the keyword check fires, show the crisis screen instead of the read.
- No streak rules or guilt: show nights this week and totals. Never a mental-health score.
- Stay inside the Phase 1 scope in docs/mvp.md. Ask before adding anything else.

## How to work
- One build step at a time. Plan first, wait for my OK, then build. Stop when the step is done.
- Expo SDK 57: add packages with `npx expo install` so versions match the SDK. Check the current Expo docs for an API rather than relying on older SDK patterns.
- Native modules (speech recognition, App Check) need a development build, not Expo Go. Say so when a step crosses that line.
- Keep `npx tsc --noEmit` and `npx expo lint` passing.
- End each step with how to test it on my phone, and a suggested commit message. I commit myself.
