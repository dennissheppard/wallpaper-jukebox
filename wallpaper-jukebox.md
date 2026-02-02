# Wallpaper Jukebox

A reactive wallpaper web app that listens to your music and rotates backgrounds to match the vibe.

## Features

### 1) Visual Experience
*   **Full-bleed background image** with smooth crossfade rotation.
*   **Automatic Image Rotation**: Cycles through high-quality images from Pexels, Unsplash, and Pixabay.
*   **Smart Image Mixing**: Automatically mixes sources and paginates through results to ensure variety.
*   **Fallback Logic**: If a search query runs dry, it automatically varies the query or falls back to "abstract" themes to keep fresh images coming.

### 2) Music Recognition (Shazam + Last.fm + Lyrics)
*   **Shazam API**: Identifies songs from microphone audio via RapidAPI.
*   **Last.fm API**: Fetches crowd-sourced tags for richer genre and mood metadata.
*   **Lyrics.ovh API**: Fetches lyrics to extract specific visual phrases ("early morning rain") for highly relevant wallpaper searches.
*   **Jukebox Algorithm**:
    *   Prioritizes **Visual Tags** (e.g., "melancholic", "summer") over generic genres.
    *   Extracts **Visual Phrases** from lyrics (e.g., "blue skies", "city lights").
    *   Uses **Title/Artist** visual words as a backup.
    *   **NO Genre Fallback**: Avoids generic "rock" or "pop" searches that return literal band photos.

### 3) UI / UX
*   **Mini-HUDs**: Collapsible controls for Settings, Weather, Now Playing, and Clock.
    *   **Settings**: Customize theme, interval, and toggle features. Defaults to minimized gear icon.
    *   **Now Playing**: Shows track info. Minimizes to a music note with a "Retrying" badge if recognition fails.
    *   **Weather**: Shows current temp/icon. Expands to show details (wind, humidity). Minimized view shows temp + icon.
    *   **Clock**: Elegant digital clock with date. Minimizes to a dynamic analog clock icon (shows real time).
*   **Keyboard Shortcut**: `Ctrl+H` / `Cmd+H` toggles the entire UI visibility.

### 4) Auto-Recognition
*   **Automatic Listening**: Listens for new music on a configurable interval (1, 3, 5, 10 min).
*   **Smart Retry**: If recognition fails, it retries in 10 seconds before falling back to the standard interval.
*   **Initial Check**: Performs a quick check 3 seconds after page load to sync with currently playing music immediately.

## Architecture

### Frontend (Vite + React + TypeScript)
```
client/src/
├── components/
│   ├── WallpaperDisplay.tsx    # Background image rotator
│   ├── WeatherDisplay.tsx      # Weather widget (Open-Meteo)
│   ├── NowPlaying.tsx          # Music recognition status
│   ├── Clock.tsx               # Digital/Analog clock
│   └── ControlsHUD.tsx         # Main settings panel
├── hooks/
│   ├── useWallpaperRotation.ts # Image queue, mix logic, pagination
│   ├── useMusicRecognition.ts  # Audio capture, interval management
│   └── ...
├── services/
│   └── musicService.ts         # API calls
```

### Backend (Express + TypeScript)
```
server/src/
├── routes/
│   ├── images.ts               # Proxy for Pexels/Unsplash/Pixabay
│   ├── music.ts                # Orchestrates Shazam -> Last.fm -> Lyrics -> Query
│   └── ...
├── services/
│   ├── musicRecognitionService.ts   # Shazam & Lyrics.ovh integration
│   ├── musicThemeMappingService.ts  # The "Brain": Maps metadata to search queries
│   └── lastfmService.ts             # Tag fetching & filtering
```

## Setup & Running

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Copy `.env.example` to `.env` and add your keys:
    ```bash
    cp .env.example .env
    ```
    *   `RAPIDAPI_KEY` (Shazam Core via RapidAPI)
    *   `LASTFM_API_KEY` (Last.fm API)
    *   `PEXELS_API_KEY` (Pexels API)
    *   `UNSPLASH_ACCESS_KEY` (Unsplash API)
    *   `PIXABAY_API_KEY` (Pixabay API)

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Opens client at `http://localhost:5173` and server at `http://localhost:3001`.

## Future Ideas
*   **Spotify Integration**: Link Spotify account to get audio features (valence, energy) directly without microphone.
*   **Visualizers**: WebGL beat-reactive visualizers overlay.