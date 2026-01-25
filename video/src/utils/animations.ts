import { SpringConfig } from "remotion";

// Helper to create spring config with optional overshootClamping
const createSpring = (damping: number, stiffness: number, mass: number): SpringConfig => ({
  damping,
  stiffness,
  mass,
  overshootClamping: false,
});

export const SPRING_CONFIGS: Record<string, SpringConfig> = {
  // Cinematic smooth movements
  gentle: createSpring(200, 100, 1),
  smooth: createSpring(30, 80, 1),
  cinematic: createSpring(40, 60, 1.2),

  // Snappy for UI elements
  snappy: createSpring(20, 200, 0.6),
  bouncy: createSpring(12, 100, 0.5),

  // Camera movements
  cameraFollow: createSpring(50, 40, 1.5),
  cameraZoom: createSpring(60, 50, 1.2),
  cameraPan: createSpring(45, 45, 1.3),

  // Slow dramatic
  dramatic: createSpring(80, 30, 2),
  slow: createSpring(200, 50, 1.5),
};

// Adjusted durations for more cinematic pacing
export const DURATIONS = {
  intro: 420,           // 7 seconds
  macbookReveal: 360,   // 6 seconds
  terminalInstall: 720, // 12 seconds
  ideCodeWriting: 2400, // 40 seconds - longer for camera movements
  runningApp: 1800,     // 30 seconds - show full bot output
  featuresShowcase: 600, // 10 seconds
  outro: 480,           // 8 seconds
} as const;

export const SCENE_STARTS = {
  intro: 0,
  macbookReveal: DURATIONS.intro,
  terminalInstall: DURATIONS.intro + DURATIONS.macbookReveal,
  ideCodeWriting:
    DURATIONS.intro + DURATIONS.macbookReveal + DURATIONS.terminalInstall,
  runningApp:
    DURATIONS.intro +
    DURATIONS.macbookReveal +
    DURATIONS.terminalInstall +
    DURATIONS.ideCodeWriting,
  featuresShowcase:
    DURATIONS.intro +
    DURATIONS.macbookReveal +
    DURATIONS.terminalInstall +
    DURATIONS.ideCodeWriting +
    DURATIONS.runningApp,
  outro:
    DURATIONS.intro +
    DURATIONS.macbookReveal +
    DURATIONS.terminalInstall +
    DURATIONS.ideCodeWriting +
    DURATIONS.runningApp +
    DURATIONS.featuresShowcase,
} as const;

export const TOTAL_DURATION =
  DURATIONS.intro +
  DURATIONS.macbookReveal +
  DURATIONS.terminalInstall +
  DURATIONS.ideCodeWriting +
  DURATIONS.runningApp +
  DURATIONS.featuresShowcase +
  DURATIONS.outro;

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Easing functions for smooth camera movements
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

export const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};
