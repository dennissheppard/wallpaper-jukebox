# Wallpaper Jukebox

A beautiful, full-screen wallpaper rotator with smooth crossfades and optional Spotify integration for music-reactive visuals.

## Features

- **Rotating Wallpapers**: Smooth crossfade transitions between high-quality images
- **Multiple Sources**: Pexels, Unsplash, Pixabay, and NASA imagery
- **Theme Selection**: Nature, Space, Cities, Abstract, or Random
- **Customizable Intervals**: From 15 seconds to manual-only control
- **Like/Skip System**: Save favorites and skip unwanted images
- **Kiosk Mode**: URL parameter to hide controls (`?hideControls=1`)
- **Keyboard Shortcuts**: Ctrl+H to toggle controls
- **Spotify Integration** (coming soon): Match wallpaper rotation to your music

## Project Structure

```
wallpaper-jukebox/
├── client/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── providers/   # Image provider implementations
│   │   ├── types/       # TypeScript type definitions
│   │   └── styles/      # Global styles
│   └── index.html
├── server/              # Express backend
│   └── src/
│       ├── routes/      # API routes
│       ├── services/    # Business logic
│       └── index.ts
└── public/              # Static assets
```

## Setup

### Prerequisites

- Node.js 18+ and npm
- API keys for image providers (optional, uses Picsum fallback)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env` file from the example:

```bash
cp .env.example .env
```

3. Add your API keys to `.env` (optional):

```env
PEXELS_API_KEY=your_pexels_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

### Getting API Keys

- **Pexels**: Free at https://www.pexels.com/api/
- **Unsplash**: Free at https://unsplash.com/developers
- **Pixabay**: Free at https://pixabay.com/api/docs/
- **NASA**: Use `DEMO_KEY` or get your own at https://api.nasa.gov/

### Development

Start both client and server in development mode:

```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3002
- Backend: http://localhost:3003

Or run them separately:

```bash
npm run dev:client  # Vite dev server
npm run dev:server  # Express API server
```

### Build for Production

```bash
npm run build
```

Then run:

```bash
npm start
```

## Usage

### Basic Controls

- **Theme Picker**: Select from Nature, Space, Cities, Abstract, or Random
- **Rotation Interval**: Choose how often images rotate
- **Source Picker**: Select which API to use for images
- **Like**: Save images to your favorites
- **Skip**: Immediately switch to the next image

### Keyboard Shortcuts

- `Ctrl+H` (or `Cmd+H` on Mac): Toggle controls visibility

### Kiosk Mode

Add `?hideControls=1` to the URL to hide controls on page load:

```
http://localhost:3002?hideControls=1
```

## Implementation Phases

### Phase 1: Core Wallpaper Rotator ✅
- Basic rotating wallpaper viewer
- Smooth crossfade transitions
- Image preloading
- UI controls and settings
- localStorage persistence

### Phase 2: Image Provider System ✅
- Pluggable provider architecture
- Pexels and Unsplash integration
- Image queue and caching
- Like/skip functionality

### Phase 3: Additional Sources (Coming Soon)
- Pixabay provider
- NASA imagery provider
- Enhanced attribution display

### Phase 4: Backend & Auth (Coming Soon)
- Express backend setup
- Spotify OAuth integration
- Token management
- API proxying

### Phase 5: Spotify "Vibe Mode" (Coming Soon)
- Currently Playing integration
- Audio Analysis parsing
- Music-to-theme mapping
- Dynamic rotation based on tempo

### Phase 6: Beat-Reactive Visuals (Coming Soon)
- Canvas overlay effects
- Beat-synchronized animations
- Section-based wallpaper changes

### Phase 7: Polish (Coming Soon)
- Additional keyboard shortcuts
- Favorites collection
- Shareable configurations
- Performance optimizations

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**: Express + TypeScript
- **Styling**: CSS Modules
- **APIs**: Pexels, Unsplash, Pixabay, NASA, Spotify (planned)

## Contributing

This is a personal project, but suggestions and ideas are welcome! Feel free to open an issue.

## License

ISC

---

Built with 🎵 for those who love beautiful wallpapers and music.
