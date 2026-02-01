
## The project plan: “Wallpaper Jukebox” (web app + optional Spotify-reactive mode)

### 1) Core experience (MVP)

A single-page web app you can leave open on a spare monitor / TV:

**UI**

* Full-bleed background image (cover)
* Smooth crossfade on rotation
* Tiny unobtrusive HUD (toggleable):

  * Theme picker (Nature / Space / Cities / Abstract / “Surprise me”)
  * Rotation interval (15s, 30s, 1m, 5m, 15m, “manual only”)
  * Source picker (Pexels / Unsplash / Pixabay / NASA)
  * “Like / Skip / Never show again”
  * Optional clock (because… it’s nice)

**Behavior**

* Preload next image before switching (avoid flash/loading)
* Local cache of recent image URLs to avoid repeats
* Store settings in `localStorage`
* A “kiosk mode” query param like `?hideControls=1`

### 2) Image pipeline (how we fetch and rotate safely)

Create a small “Image Provider” layer so each source plugs into the same interface:

**Provider contract**

* `search(theme, orientation, minWidth, minHeight) -> [ImageResult]`
* `ImageResult = { url, photographerName, photographerUrl, sourceName, sourceUrl, attributionText }`

That makes it trivial to add more sources later.

**Attribution**

* For Unsplash, build attribution into your HUD (even if subtle), because it’s required. ([Unsplash Help Center][5])
* For Pexels/Pixabay, still a good practice to show “Photo by X (Source)” even if your use is personal.

### 3) Spotify integration (2 paths depending on how deep you want to go)

#### Path A — “Match the vibe” (no audio in your app)

Use Spotify purely as a **signal**:

* Poll **Currently Playing**: track, progress, playing state ([developer.spotify.com][9])
* Fetch **Audio Analysis** for the track (tempo, beats/bars/sections, etc.) ([developer.spotify.com][10])
* Optionally fetch **Audio Features** too (energy/valence/danceability — depending on what endpoints you use)

Then map that to visuals:

* **Tempo** → animation speed / rotation pace
* **Section changes** → swap wallpaper or change overlay style
* **Energy/valence** → pick theme buckets (moody = noir city/rain, upbeat = bright nature, etc.)
* **Beats** → subtle scale/pulse/particles timed to beat grid using `(progress_ms / 1000)` + analysis beat timestamps

This is the best “bang for buck” because you don’t need to stream audio.

**OAuth scopes:** you’ll likely need `user-read-currently-playing` and/or playback state scopes (Spotify uses OAuth for these endpoints). ([developer.spotify.com][9])

**Rate limits:** Spotify rate limits are in a rolling 30-second window and will 429 you if you spam. So you’ll want sane polling (e.g., 2–5s while playing, slower when paused). ([developer.spotify.com][11])

#### Path B — Real beat-reactive visuals (audio analysed in-browser)

If you want visuals that *really* feel synced:

* Use the **Web Playback SDK** to play Spotify audio *inside your app* (Premium required). ([developer.spotify.com][12])
* Run the audio through Web Audio API `AnalyserNode` to drive visuals (FFT, amplitude, beat-ish pulses)

This is cooler, but comes with more constraints and policy considerations (and requires Premium). ([developer.spotify.com][12])

---

## Architecture that won’t paint you into a corner

### Frontend

* Vite + React (or Next.js if you want hosted auth callbacks cleanly)
* `Canvas` or WebGL layer for animations (start with Canvas; upgrade later)
* State:

  * `settings` (theme, interval, provider)
  * `playback` (track id, progress, tempo)
  * `imageQueue` (preloaded images)

### Backend (tiny)

You’ll want *some* backend if you do Spotify OAuth properly (and to avoid exposing API keys carelessly):

* `/auth/login` → Spotify authorize redirect
* `/auth/callback` → exchange code for token
* `/api/spotify/*` → proxy calls (optional, but keeps tokens off the client)
* `/api/images/search` → proxy to Pexels/Unsplash/etc (optional)

You *can* do purely client-side for some image providers, but Spotify auth and refresh tokens are much smoother with a small server.

---

## A sensible build order

1. **MVP wallpaper rotator** (local themes + rotation + crossfade + preloading)
2. **Pexels provider** (search + curated) ([Pexels][3])
3. **Unsplash provider + attribution HUD** ([Unsplash Help Center][5])
4. **“Vibe mode” Spotify**: currently playing + audio analysis → visual presets ([developer.spotify.com][9])
5. **Beat visuals**: pulse/particles on beats/bars
6. Optional: Web Playback SDK + real analyser-driven visuals ([developer.spotify.com][12])

---

## Quick decision points (I’ll assume defaults if you don’t care)

* **Where will this run?** 

  * local-first, then host on Vercel once it’s fun.
* **Primary image source:** Pexels-first (easy + free), then add Unsplash for quality variety. ([Pexels][3])
* **Spotify depth:** start with “match vibe” (Path A), then decide if you want in-browser playback later.



[1]: https://chromewebstore.google.com/detail/live-start-page-living-wa/ocggccaacacpienfcgmgcihoombokbbj?utm_source=chatgpt.com "Live Start Page - Living Wallpapers - Chrome Web Store"
[2]: https://lifetips.alibaba.com/tech-efficiency/live-start-page-adds-live-wallpapers-to-new-tabs-in-goo?utm_source=chatgpt.com "Live Start Page Does NOT Add Live Wallpapers to New Tabs ..."
[3]: https://www.pexels.com/api/documentation/?utm_source=chatgpt.com "Pexels API"
[4]: https://pixabay.com/api/docs/?utm_source=chatgpt.com "Pixabay API Documentation"
[5]: https://help.unsplash.com/en/articles/2511315-guideline-attribution?utm_source=chatgpt.com "Guideline: Attribution"
[6]: https://unsplash.com/documentation/changelog?utm_source=chatgpt.com "API Changelog"
[7]: https://api.nasa.gov/?utm_source=chatgpt.com "NASA Open APIs"
[8]: https://picsum.photos/?utm_source=chatgpt.com "Lorem Picsum"
[9]: https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track?utm_source=chatgpt.com "Get Currently Playing Track"
[10]: https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis?utm_source=chatgpt.com "Spotify Audio Analysis API"
[11]: https://developer.spotify.com/documentation/web-api/concepts/rate-limits?utm_source=chatgpt.com "Spotify's rate limit"
[12]: https://developer.spotify.com/documentation/web-playback-sdk?utm_source=chatgpt.com "Web Playback SDK"
