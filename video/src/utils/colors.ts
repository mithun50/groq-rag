// Clean Dark Theme with High Contrast Text
export const COLORS = {
  // Base colors - Pure dark
  background: "#000000",        // Pure black for contrast
  backgroundLight: "#0a0a0a",
  backgroundMedium: "#111111",

  // Primary accent - Bright blue
  primary: "#00a8ff",           // Bright cyan blue
  primaryDim: "#0095e0",
  primaryMuted: "#0077b6",

  // Secondary - Bright purple
  secondary: "#bf5af2",         // Bright purple
  secondaryLight: "#da8fff",

  // Accent for highlights
  accent: "#ff9f0a",            // Bright orange

  // All text should be WHITE
  white: "#ffffff",
  gray: {
    50: "#ffffff",
    100: "#ffffff",
    200: "#f5f5f5",
    300: "#e0e0e0",
    400: "#c0c0c0",
    500: "#909090",
    600: "#606060",
    700: "#303030",
    800: "#1a1a1a",
    900: "#0a0a0a",
    950: "#000000",
  },

  // Terminal colors - HIGH CONTRAST WHITE TEXT
  terminal: {
    bg: "#000000",
    bgDark: "#000000",
    text: "#ffffff",            // Pure white
    textDim: "#ffffff",         // Also white
    prompt: "#00a8ff",          // Bright blue prompt
    promptSymbol: "#bf5af2",    // Purple $
    success: "#30d158",         // Bright green
    error: "#ff453a",           // Bright red
    warning: "#ffd60a",         // Bright yellow
    info: "#64d2ff",            // Bright cyan
    cursor: "#ffffff",
  },

  // IDE colors - HIGH CONTRAST syntax highlighting
  ide: {
    bg: "#000000",
    bgLight: "#0a0a0a",
    sidebar: "#000000",
    sidebarActive: "#1a1a1a",
    lineNumber: "#808080",
    lineNumberActive: "#ffffff",
    selection: "#264f78",
    cursor: "#ffffff",
    // BRIGHT syntax colors for visibility
    keyword: "#ff6b6b",         // Bright red - import, const, await
    string: "#98ec65",          // Bright green - strings
    function: "#da8fff",        // Bright purple - function names
    comment: "#ffffff",         // WHITE - comments (VISIBLE!)
    type: "#ffb84d",            // Bright orange - types
    variable: "#ffffff",        // White - variables
    number: "#64d2ff",          // Bright cyan - numbers
    operator: "#ff6b6b",        // Bright red - operators
    bracket: "#ffffff",         // White - brackets
    property: "#98ec65",        // Bright green - properties
    punctuation: "#ffffff",     // White - punctuation
    class: "#ffb84d",           // Bright orange - class names
    decorator: "#da8fff",       // Bright purple - decorators
    regex: "#64d2ff",           // Bright cyan - regex
    tag: "#98ec65",             // Bright green - JSX tags
    attribute: "#64d2ff",       // Bright cyan - attributes
  },

  // Window UI colors
  macos: {
    trafficRed: "#ff5f57",
    trafficYellow: "#febc2e",
    trafficGreen: "#28c840",
    titleBar: "#1a1a1a",
    menuBar: "#0a0a0a",
    dock: "#000000",
    spotlight: "#1a1a1a",
  },
} as const;

export const GRADIENTS = {
  // Clean gradient styles
  primary: `linear-gradient(135deg, #00a8ff 0%, #bf5af2 100%)`,
  glow: `radial-gradient(ellipse at center, rgba(0,168,255,0.15) 0%, transparent 70%)`,
  background: `linear-gradient(135deg, #0a0a0a 0%, #000000 100%)`,
  vignette: `radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)`,
  spotlight: `radial-gradient(ellipse at center, rgba(0,168,255,0.08) 0%, transparent 50%)`,
  text: `linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)`,
  // Background with subtle color accents
  mesh: `
    radial-gradient(at 0% 0%, rgba(0,168,255,0.15) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(191,90,242,0.12) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(48,209,88,0.08) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(255,159,10,0.08) 0px, transparent 50%)
  `,
} as const;
