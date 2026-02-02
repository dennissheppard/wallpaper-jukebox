# Wallpaper Jukebox

A beautiful, full-screen wallpaper rotator with smooth crossfades and weather-reactive image matching. Originally planned for Spotify integration (on hold due to API availability).

## Features

### ✅ Implemented

- **Rotating Wallpapers**: Buttery smooth dual-layer crossfade transitions
- **Multiple Image Sources**: Pexels (with more coming)
- **Theme Selection**: Nature, Space, Cities, Abstract, Random, or Custom Search
- **Custom Search**: Type any keywords to find exactly the vibe you want
- **Weather Integration**: Matches or escapes current weather conditions
  - Smart matching based on temperature, time of day, and conditions
  - "Match Weather" mode: Snowy outside → snowy images
  - "Escape Weather" mode: Snowy outside → tropical beaches
  - IP-based location (with optional GPS precision)
- **Modern UI**:
  - Collapsible accordion sections
  - iOS-style pill toggles
  - Custom animated dropdowns
  - Smooth panel animations
- **Customizable Intervals**: From 15 seconds to manual-only control
- **Like System**: Save your favorite images
- **Kiosk Mode**: URL parameter to hide controls (`?hideControls=1`)
- **Keyboard Shortcuts**: Ctrl+H to toggle controls

### 🚧 Coming Soon

- **Clock Overlay**: Time display with customizable styles
- **Unsplash Integration**: Higher quality curated images
- **NASA Imagery**: Space and astronomy photos
- **Favorites Gallery**: Browse and manage liked images
- **More Keyboard Shortcuts**: Navigate, like, skip via keyboard
- **Shareable Configurations**: Save and share your perfect setup

### ⏸️ On Hold

- **Spotify Integration**: Music-reactive wallpapers (Spotify API currently closed to new apps)

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

**Image Settings:**
- **Theme**: Nature, Space, Cities, Abstract, Random, or Custom Search
- **Custom Search**: Type any keywords (e.g., "morning fog mist atmospheric")
- **Interval**: 15s, 30s, 1m, 5m, 15m, or manual only
- **Source**: Pexels (more coming soon)

**Weather Settings:**
- **Enable Weather**: Toggle weather widget and/or weather-based images
- **Mode**:
  - Display Only: Shows weather without affecting images
  - Match Weather: Images match your current weather
  - Escape Weather: Images are opposite of your weather
- **Temperature**: Fahrenheit or Celsius
- **Location**: Approximate (IP-based) with option for GPS precision

**Clock Settings:**
- **Show Clock**: Toggle clock display (implementation coming soon)

**Actions:**
- **❤️ Like**: Save current image to favorites
- **⏭️ Next**: Skip to next image immediately

### Keyboard Shortcuts

- `Ctrl+H` (or `Cmd+H` on Mac): Toggle controls visibility

### Kiosk Mode

Add `?hideControls=1` to the URL to hide controls on page load:

```
http://localhost:3002?hideControls=1
```

## Implementation Status

### ✅ Phase 1: Core Wallpaper Rotator (Complete)
- Dual-layer crossfade system for seamless transitions
- Image preloading and queue management
- Modern accordion-based UI with pill toggles
- Custom animated dropdowns
- localStorage persistence
- Kiosk mode support
- Settings instantly update images

### ✅ Phase 2: Image Provider System (Complete)
- Pluggable provider architecture
- Pexels integration with free API
- Image queue and caching (max 10 images)
- Like/skip functionality
- Attribution display with photographer credits

### ✅ Weather Integration (Bonus Feature - Complete)
- Open-Meteo API integration (free, no key required)
- IP-based location detection with optional GPS upgrade
- Weather widget with hover expansion
- Smart image matching:
  - Considers temperature, time of day, and conditions
  - "Match" mode for weather-appropriate images
  - "Escape" mode for opposite weather vibes
- Automatic refresh every 30 minutes

### ✅ Custom Search (Bonus Feature - Complete)
- Free-form keyword search
- Debounced input (800ms) for performance
- Works with all image providers
- Instant image updates

### 🚧 Phase 3: Additional Image Sources (In Progress)
- ✅ Pexels provider
- 🚧 Unsplash provider (structure ready, needs API key)
- 📋 Pixabay provider
- 📋 NASA imagery provider

### ⏸️ Phase 4-6: Music Integration (On Hold)
Spotify API is currently closed to new applications. These features are on hold:
- Backend OAuth setup
- "Vibe Mode" music matching
- Beat-reactive visuals

**Alternative:** May implement Apple Music or wait for Spotify API to reopen.

### 📋 Phase 7: Polish & Enhancement (Planned)
- Clock overlay implementation
- Additional keyboard shortcuts (arrows, space, etc.)
- Favorites gallery and management
- Image quality/bandwidth selector
- Shareable configuration URLs
- Time-based auto-theming
- Multiple display support
- Accessibility improvements

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**: Express + TypeScript
- **Styling**: CSS Modules with custom animations
- **APIs**:
  - Open-Meteo (weather, free, no key)
  - ip-api.com (geolocation, free, no key)
  - Pexels (images, free with key)
  - Unsplash (planned)
  - Spotify (on hold - API closed)

## Contributing

This is a personal project, but suggestions and ideas are welcome! Feel free to open an issue.

## License

ISC

---

Built with 🌤️ for those who love beautiful wallpapers and ambient vibes.
