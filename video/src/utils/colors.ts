// Unique Modern Dark Theme - "Aurora"
// Clean, professional with subtle color accents
export const COLORS = {
  // Base colors - Deep space dark
  background: "#0d1117",        // GitHub dark
  backgroundLight: "#161b22",
  backgroundMedium: "#21262d",

  // Primary accent - Electric cyan/teal
  primary: "#58a6ff",           // Bright blue
  primaryDim: "#388bfd",
  primaryMuted: "#1f6feb",

  // Secondary - Soft purple
  secondary: "#a371f7",         // Purple
  secondaryLight: "#bc8cff",

  // Accent for highlights
  accent: "#f78166",            // Coral/Orange

  // Gray scale - Cool tones
  white: "#f0f6fc",
  gray: {
    50: "#f0f6fc",
    100: "#c9d1d9",
    200: "#b1bac4",
    300: "#8b949e",
    400: "#6e7681",
    500: "#484f58",
    600: "#30363d",
    700: "#21262d",
    800: "#161b22",
    900: "#0d1117",
    950: "#010409",
  },

  // Terminal colors - All text WHITE for visibility
  terminal: {
    bg: "#0d1117",
    bgDark: "#010409",
    text: "#ffffff",            // Pure white
    textDim: "#e6edf3",         // Light white (was gray)
    prompt: "#58a6ff",          // Blue prompt
    promptSymbol: "#a371f7",    // Purple $
    success: "#3fb950",         // Bright green
    error: "#f85149",           // Bright red
    warning: "#d29922",         // Gold
    info: "#79c0ff",            // Light blue
    cursor: "#58a6ff",
  },

  // IDE colors - Clean syntax highlighting
  ide: {
    bg: "#0d1117",
    bgLight: "#161b22",
    sidebar: "#010409",
    sidebarActive: "#21262d",
    lineNumber: "#6e7681",
    lineNumberActive: "#c9d1d9",
    selection: "#264f78",
    cursor: "#58a6ff",
    // Clean, readable syntax colors
    keyword: "#ff7b72",         // Coral red - import, const, await
    string: "#a5d6ff",          // Light blue - strings
    function: "#d2a8ff",        // Purple - function names
    comment: "#c9d1d9",         // Light gray - comments (VISIBLE)
    type: "#ffa657",            // Orange - types, interfaces
    variable: "#e6edf3",        // White - variables
    number: "#79c0ff",          // Cyan - numbers
    operator: "#ff7b72",        // Coral - operators
    bracket: "#b1bac4",         // Light gray - brackets
    property: "#7ee787",        // Green - properties
    punctuation: "#b1bac4",     // Light gray - punctuation
    class: "#ffa657",           // Orange - class names
    decorator: "#d2a8ff",       // Purple - decorators
    regex: "#a5d6ff",           // Light blue - regex
    tag: "#7ee787",             // Green - JSX tags
    attribute: "#79c0ff",       // Cyan - attributes
  },

  // Window UI colors
  macos: {
    trafficRed: "#ff5f57",
    trafficYellow: "#febc2e",
    trafficGreen: "#28c840",
    titleBar: "#161b22",
    menuBar: "#0d1117",
    dock: "#010409",
    spotlight: "#21262d",
  },
} as const;

export const GRADIENTS = {
  // Clean gradient styles
  primary: `linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)`,
  glow: `radial-gradient(ellipse at center, rgba(88,166,255,0.12) 0%, transparent 70%)`,
  background: `linear-gradient(180deg, #0d1117 0%, #010409 100%)`,
  vignette: `radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.5) 100%)`,
  spotlight: `radial-gradient(ellipse at center, rgba(88,166,255,0.06) 0%, transparent 50%)`,
  text: `linear-gradient(135deg, #f0f6fc 0%, #c9d1d9 100%)`,
  // Subtle ambient gradient
  mesh: `
    radial-gradient(at 20% 20%, rgba(88,166,255,0.08) 0px, transparent 50%),
    radial-gradient(at 80% 10%, rgba(163,113,247,0.06) 0px, transparent 50%),
    radial-gradient(at 10% 80%, rgba(63,185,80,0.05) 0px, transparent 50%),
    radial-gradient(at 90% 80%, rgba(247,129,102,0.05) 0px, transparent 50%)
  `,
} as const;
