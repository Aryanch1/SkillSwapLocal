# SkillSwapLocal

**Trade a skill. Gain a neighbor.**

SkillSwapLocal is a neighborhood skill-swap board: neighbors offer
small skills and help, ask for a hand they need, and the app matches
requests to the nearest offers — with a clear match score and the
reasons it fits. No money ever changes hands. A swap is a trade of
time and skill between people who live a short walk apart.

## Who it helps

- **Neighbors with a small job** — a leaky tap, a wobbly bookshelf, a
  flat bike tire — who would rather ask someone nearby than hire a
  stranger or leave it undone.
- **People with a skill to share** — guitar lessons, Spanish practice,
  garden help, dog walking — who enjoy helping and meeting the people
  on their street.
- **Newcomers to a street** who want a friendly first reason to say
  hello to the people around them.

## Features

- **Swap board** — offers and requests near you, with AI match-% pills
  and "why this matches" lines on every card.
- **AI matching** — every request is ranked against nearby offers by
  skill, distance, rating, experience and timing. Live service when
  the Java backend is deployed; honest on-device demo matcher until
  then (always labelled DEMO vs LIVE AI).
- **"Write my hello"** — pick a tone and the app drafts a friendly
  first message to a neighbor, using only what the listing says.
- **New listing in a minute** — type it in your own words and the app
  suggests the skill category and a title for you.
- **My Swaps** — your listings, the matches for your requests, and a
  history of intros and matches for one-tap re-use.
- **Accounts** — sign in with Google or email, or continue as a guest
  for this visit only. Signed-in users stay signed in; profile picture
  and display name editable in Settings.
- **Safety first** — every detail screen says it plainly: meet in a
  public place for the first swap, and no money ever changes hands.
- **Demo board included** — 6 neighbors, 8 offers and 6 requests so
  you can see matching work on first open; clearable from Settings.

## Live link

Live web app: coming soon (Vercel deploy is a publish step).

## Figma design

https://www.figma.com/design/RsgjgKPe2W4VUYvUziwbnK

## How to run

```sh
npm install
npm start          # Expo dev server (Android / iOS via Expo Go, web with `npm run web`)
npm run web        # web dev server
npx expo export --platform web   # static web build into dist/
```

Backend (Java Spring Boot, `backend/`):

```sh
cd backend
JAVA_HOME=/home/hatch/tools/jdk-17.0.21+9 ./mvnw -o test     # offline in this VM
JAVA_HOME=/home/hatch/tools/jdk-17.0.21+9 ./mvnw -o package
java -jar target/skillswaplocal-backend-1.0.0.jar            # serves on :8080
```

Set `EXPO_PUBLIC_API_URL` to the backend origin for live matching,
intro writing and category suggestions; without it the app uses its
honest on-device demo matcher and says so. The Gemini key lives
server-side only (`GEMINI_API_KEY` env var on the backend) — never in
app code or this repo.

Android APK: `eas.json` ships a preview profile. `npm run android`
for a dev build, or the GitHub workflow builds a release APK.

## Tech stack

- React Native + Expo SDK 58 + TypeScript (one codebase: Android,
  iOS, web), expo-router, Reanimated, expo-blur, expo-haptics
- Display font: Outfit (700/800) via @expo-google-fonts/outfit
- Java Spring Boot 3.3.5 backend (match / intro / suggest endpoints)
- Google Gemini `gemini-3.5-flash-lite` via the OpenAI-compatible
  endpoint, key server-side only
- Firebase Authentication + Firestore (per-user data under
  users/{uid}, owner-only rules) — wiring is a publish step; see
  `lib/firebase.ts` (TODO-SKILLSWAP placeholders)

## License

MIT License — Copyright (c) 2026 Aryanmouli Cherupalli. See LICENSE.
