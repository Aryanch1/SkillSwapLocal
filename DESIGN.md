# SkillSwapLocal — Design

## Identity: "The Neighborhood Swap Board"

A warm, friendly board where neighbors trade skills instead of money.
The home is a **typographic hero** — "Trade a skill. Gain a neighbor."
in huge Outfit ExtraBold, no photo — over a **live data strip**
(neighbors nearby / swaps done / open requests), an **arch-top
neighbor rail** (rounded-arch avatar tiles, one per neighbor), and
**match cards with big match-% numbers** and a "why this matches"
line under each one. Navigation is a **flat white bottom tab bar**
(Board / My Swaps / Profile) with a **raised circular amber "+"**
in the middle for New Listing. The designed data visual is the
**match score itself** — a big leaf-green number on every card, plus
the data strip up top.

Palette: neighbor blue `#1F5FA8` (primary), sunny amber `#F6B73C`
(action accent), warm paper `#FAF6EE` (ground), ink `#1E2A38`, leaf
`#3E9B6A` (match pills), coral `#E4572E` (urgent only). Display font:
**Outfit 700/800** via `@expo-google-fonts/outfit`. Cards 28px radius,
pills fully round, primary CTA a blue gradient with a soft glow, the
amber "+" carries its own amber glow.

## Distinctness vs the previous app (the dusk journal)

| Element | Previous app | SkillSwapLocal |
|---|---|---|
| Display font | Lora serif | Outfit 700/800 (geometric sans) |
| Navigation | Top segmented tabs (Today / Week / Entries) | Flat white bottom tab bar + raised amber "+" center button |
| Hero | Orb hero (color = today's feeling) | Typographic hero, no image, no orb |
| Home structure | River of dated entries | Data strip + arch neighbor rail + match cards |
| Palette | Dusk plum `#5E3A7A` + peach on lavender-white | Neighbor blue `#1F5FA8` + amber on warm paper |
| Refresh motif | Moon rising | Two arrows swapping in a circle |
| Data visual | Weekly arc chart (SVG) | Big match-% numbers + data strip |
| Detail | Entry page with reflection | Listing page with "Write my hello" intro writer |

No screen shares the previous app's home structure, navigation chrome,
or display font. Nothing on the board could be mistaken for a journal.

## Screen inventory + flow

1. **Splash** — warm paper, blue rounded square with the amber swap mark.
2. **Welcome gate** (every open, signed-out non-guest) — blue panel with
   the amber swap loop and "TRADE A SKILL. GAIN A NEIGHBOR."; exactly
   four options: Continue with Google / Create account / Log in (+
   Forgot password) / Continue without an account.
3. **Board (home)** — hero + data strip + neighbor rail + board tabs
   (Top matches / Offers / Requests) + category chips + match cards.
   Tap a card → detail. Tap "+" → New listing. Tab bar → My Swaps /
   Profile.
4. **Listing detail** — neighbor card, when/where, "why this matches"
   box, safety note ("Meet in a public place"), tone chips + "Write my
   hello" intro draft (LIVE AI / DEMO badge), Mark as matched.
5. **New listing** — Offer / Request toggle, free-text description,
   "Suggest from my words" (category + title), title, skill chips,
   when, where, urgent toggle for requests, Post.
6. **My Swaps** — my listings (mark done), matches for my requests,
   history (intros & matches) for one-tap re-use.
7. **Settings / Profile** — avatar (resized base64 on users/{uid}),
   display name, email + sign-in method, password-reset email, sign
   out; history list + clear; services status; demo-data clear; version
   label read from package.json only.
8. **Help & about** — how the board works, privacy, safety note
   ("Meet in a public place", "No money ever changes hands").
9. **Empty states** — no matches / no offers in a skill / no requests /
   nothing posted yet, each with a next step.
10. **Toasts / inline feedback** — "Logged…", "Marked as matched",
    intro-draft and suggestion notices appear where the user is looking.

## Transition + animation plan

- Screen changes: slide from right (expo-router stack), 60fps.
- Cards enter with a staggered spring rise (FadeInDown, 60ms steps).
- Every pressable: Reanimated spring scale to ~0.95 with overshoot
  settle; primary actions add a light haptic tap (mobile only).
- Selector chips POP (scale bounce) when selected.
- Buttons show bouncing dots while loading — never a frozen button.
- **Custom pull-to-refresh ("swap loop")**: the pull is scrubbed by
  finger distance — two arrows chase each other around a circle,
  filling with amber as the user pulls; past the threshold, releasing
  plays the spin loop while data returns, then content settles with a
  spring and cards re-enter staggered. On web the same animation is
  wired to the header refresh button.
- Glass surfaces use the two-layer structure everywhere (outer view:
  background + shadow; inner view with overflow hidden clips the
  BlurView) so Android never paints a white plate.

## Responsive widths (static audit)

Breakpoints driven by `useWindowDimensions` in `lib/theme.ts`:
`<600` single column, full-width cards; `600–840` wider content cap,
larger type; `840–1280` **two-pane** (board left, selected listing
right); `≥1280` centered shell, max 1120px. No fixed-width containers
anywhere: the board, rail, strip and cards all flex or wrap; the
neighbor rail scrolls horizontally; chip rows wrap. Widths checked
by layout audit (static): 360, 390, 430 (5–7 inch phones), 600
(foldable folded), 840 (tablet / foldable unfolded, two-pane on),
1024 and 1440 (PC/desktop). Live-browser visual check is a publish
step, as with the previous apps.

## Self-check scores (quality / distinctness vs previous app)

- Board (home): 90% / 96% — typographic hero, data strip, arch rail
  and big match numbers read as a board at a glance; nothing journal-like.
- Listing detail: 90% / 94% — match box + intro writer + safety note;
  layout is a detail card, not an entry page.
- New listing: 88% / 92% — form is a form, but the suggest-from-words
  flow and amber/blue system keep it in this app's identity.
- My Swaps: 88% / 90% — my listings + match scores + history; distinct
  from any journal list by the match numbers and the swap language.
- Welcome: 88% / 92% — blue panel + swap loop, no orb, no serif.
- Settings / Help: 85% / 88% — standard structure, recolored and
  rewritten in swap language.

## Figma

Design file: https://www.figma.com/design/RsgjgKPe2W4VUYvUziwbnK
("SkillSwapLocal — Daily App"). The file was created, but the canvas
population hit the Figma MCP Starter-plan tool-call limit, so this
document is the design source of truth.
