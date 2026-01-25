# groq-rag Video

Professional, cinematic SaaS product video for the groq-rag library, built with Remotion.

## Video Specifications

- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 60fps
- **Duration**: ~113 seconds (6780 frames)
- **Theme**: Professional black & white with subtle monochrome accents
- **Style**: Cinematic with camera movements that follow typing

## Key Features

- **Cinematic Camera**: Camera zooms and pans to follow typing in real-time
- **Realistic Output**: Actual npm install and bot execution output
- **B&W Theme**: Professional monochrome aesthetic
- **Film Effects**: Vignette, subtle film grain, and spotlights
- **Smooth Animations**: Spring-based cinematic animations

## Scenes

1. **Intro** (7s) - Minimal logo reveal with particles
2. **MacBook Reveal** (6s) - Cinematic MacBook slide-in
3. **Terminal Install** (12s) - `npm install groq-rag` with camera zoom
4. **IDE Code Writing** (40s) - Camera follows typing of chatbot.ts
5. **Running App** (30s) - Full bot execution with tool calls
6. **Features Showcase** (10s) - Feature cards grid
7. **Outro** (8s) - Logo, links, call to action

## Getting Started

```bash
# Install dependencies
npm install

# Start Remotion Studio (preview)
npm run dev

# Render full video at 1080p
npm run build

# Render at 720p (faster)
npm run build:720p
```

## Project Structure

```
video/
├── src/
│   ├── Root.tsx              # Main Remotion entry
│   ├── Video.tsx             # Main composition
│   ├── compositions/         # Scene components
│   │   ├── Intro.tsx
│   │   ├── MacBookReveal.tsx
│   │   ├── TerminalInstall.tsx
│   │   ├── IDECodeWriting.tsx
│   │   ├── RunningApp.tsx
│   │   ├── FeaturesShowcase.tsx
│   │   └── Outro.tsx
│   ├── components/           # Reusable UI components
│   │   ├── MacBook.tsx       # MacBook frame
│   │   ├── Terminal.tsx      # Terminal with realistic output
│   │   ├── IDE.tsx           # VS Code-like editor
│   │   ├── CodeEditor.tsx    # Code display with highlighting
│   │   ├── Particles.tsx     # Dust, spotlights, vignette
│   │   └── ...
│   ├── hooks/
│   │   ├── useTypewriter.ts  # Typing animation
│   │   └── useZoom.ts        # Cinematic camera hooks
│   └── utils/
│       ├── colors.ts         # B&W color palette
│       ├── animations.ts     # Timing & spring configs
│       └── code-samples.ts   # Realistic code & output
```

## Camera System

The video features a cinematic camera that:
- Follows typing character by character
- Zooms in/out based on content focus
- Adds subtle breathing motion for organic feel
- Uses eased keyframe transitions

## Customization

### Colors (`src/utils/colors.ts`)
Pure black and white theme with various gray shades for depth.

### Timing (`src/utils/animations.ts`)
Adjust scene durations and spring configs for different pacing.

### Code Samples (`src/utils/code-samples.ts`)
Contains:
- `CHATBOT_CODE` - The TypeScript code being typed
- `NPM_INSTALL_OUTPUT` - Realistic npm output
- `BOT_OUTPUT` - Full agent execution output

## Rendering

```bash
# Full quality 1080p 60fps
npx remotion render Video out/groq-rag-video.mp4

# Quick preview at 720p
npx remotion render Video out/preview.mp4 --height=720 --width=1280

# Render specific scene
npx remotion render IDECodeWriting out/ide-scene.mp4
```

## Adding Music

### Option 1: Built-in (Recommended)

1. Place your music file at `public/music.mp3`
2. Edit `src/Video.tsx` and set `USE_MUSIC = true`
3. Render the video - music will be included!

Recommended: Use ambient tech/cinematic music (royalty-free):
- [Pixabay](https://pixabay.com/music/) - Free music
- [Uppbeat](https://uppbeat.io/) - Free with attribution
- Search for: "tech ambient", "cinematic corporate", "modern technology"

### Option 2: Post-production

```bash
ffmpeg -i out/video.mp4 -i music.mp3 -c:v copy -c:a aac -shortest out/final.mp4
```
