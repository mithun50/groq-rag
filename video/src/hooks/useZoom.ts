import { useMemo } from "react";
import { spring, interpolate, SpringConfig, Easing } from "remotion";
import { SPRING_CONFIGS, easeInOutCubic, easeOutExpo } from "../utils/animations";

// Round to 3 decimal places to avoid blurry text from fractional transforms
const round = (n: number) => Math.round(n * 1000) / 1000;

// Perspective prevents text shaking/subpixel snapping during animations
const PERSPECTIVE = "perspective(1000px)";

interface ZoomOptions {
  frame: number;
  fps: number;
  startFrame: number;
  durationInFrames?: number;
  from?: number;
  to?: number;
  config?: SpringConfig;
}

interface ZoomResult {
  scale: number;
  translateX: number;
  translateY: number;
  transform: string;
}

export const useZoom = ({
  frame,
  fps,
  startFrame,
  durationInFrames = 60,
  from = 1,
  to = 1.5,
  config = SPRING_CONFIGS.cameraZoom,
}: ZoomOptions): ZoomResult => {
  return useMemo(() => {
    if (frame < startFrame) {
      return {
        scale: from,
        translateX: 0,
        translateY: 0,
        transform: `scale(${from})`,
      };
    }

    const progress = spring({
      frame: frame - startFrame,
      fps,
      config,
      durationInFrames,
    });

    const scale = round(interpolate(progress, [0, 1], [from, to]));
    const translateY = round(interpolate(progress, [0, 1], [0, -50]));
    const translateX = 0;

    return {
      scale,
      translateX,
      translateY,
      transform: `${PERSPECTIVE} scale(${scale}) translateY(${translateY}px)`,
    };
  }, [frame, fps, startFrame, durationInFrames, from, to, config]);
};

interface PanZoomOptions {
  frame: number;
  fps: number;
  startFrame: number;
  durationInFrames?: number;
  fromScale?: number;
  toScale?: number;
  fromX?: number;
  toX?: number;
  fromY?: number;
  toY?: number;
  config?: SpringConfig;
}

export const usePanZoom = ({
  frame,
  fps,
  startFrame,
  durationInFrames = 60,
  fromScale = 1,
  toScale = 1.5,
  fromX = 0,
  toX = 0,
  fromY = 0,
  toY = -100,
  config = SPRING_CONFIGS.cameraZoom,
}: PanZoomOptions) => {
  return useMemo(() => {
    if (frame < startFrame) {
      return {
        scale: fromScale,
        translateX: fromX,
        translateY: fromY,
        transform: `scale(${fromScale}) translate(${fromX}px, ${fromY}px)`,
      };
    }

    const progress = spring({
      frame: frame - startFrame,
      fps,
      config,
      durationInFrames,
    });

    const scale = round(interpolate(progress, [0, 1], [fromScale, toScale]));
    const translateX = round(interpolate(progress, [0, 1], [fromX, toX]));
    const translateY = round(interpolate(progress, [0, 1], [fromY, toY]));

    return {
      scale,
      translateX,
      translateY,
      transform: `${PERSPECTIVE} scale(${scale}) translate(${translateX}px, ${translateY}px)`,
    };
  }, [
    frame,
    fps,
    startFrame,
    durationInFrames,
    fromScale,
    toScale,
    fromX,
    toX,
    fromY,
    toY,
    config,
  ]);
};

// Cinematic camera that follows typing with smooth easing
interface CinematicCameraOptions {
  frame: number;
  fps: number;
  // Current line being typed (0-indexed)
  currentLine: number;
  totalLines: number;
  // Current character position in line
  currentChar: number;
  lineLength: number;
  // Camera bounds
  baseScale?: number;
  maxScale?: number;
  // Screen dimensions
  screenWidth?: number;
  screenHeight?: number;
  // Line height in pixels
  lineHeight?: number;
  // Starting Y offset
  startY?: number;
}

export const useCinematicCamera = ({
  frame,
  fps,
  currentLine,
  totalLines,
  currentChar,
  lineLength,
  baseScale = 1.2,
  maxScale = 2.0,
  screenWidth = 1920,
  screenHeight = 1080,
  lineHeight = 28,
  startY = 100,
}: CinematicCameraOptions) => {
  return useMemo(() => {
    // Calculate target position based on current typing position
    const lineProgress = currentLine / Math.max(1, totalLines - 1);
    const charProgress = lineLength > 0 ? currentChar / lineLength : 0;

    // Smooth scale changes - zoom in as we progress, zoom out near end
    const scalePhase = Math.sin(lineProgress * Math.PI);
    const targetScale = baseScale + (maxScale - baseScale) * scalePhase * 0.5;

    // Calculate Y offset to follow the current line
    // We want the current line to be roughly 40% from the top of visible area
    const currentLineY = startY + currentLine * lineHeight;
    const targetY = -currentLineY * (targetScale - 1) + screenHeight * 0.1;

    // Subtle X movement to follow character typing
    const charOffsetX = (charProgress - 0.5) * 100 * (targetScale - 1);

    // Add subtle floating motion for cinematic feel
    const floatX = Math.sin(frame * 0.01) * 5;
    const floatY = Math.cos(frame * 0.008) * 3;

    return {
      scale: round(targetScale),
      translateX: round(charOffsetX),
      translateY: round(targetY),
      transform: `${PERSPECTIVE} scale(${round(targetScale)}) translate(${round(charOffsetX)}px, ${round(targetY)}px)`,
      transformOrigin: "center top",
    };
  }, [frame, currentLine, totalLines, currentChar, lineLength, baseScale, maxScale, screenHeight, lineHeight, startY]);
};

// Professional typing camera - zooms in fully while typing, follows word, zooms out when done
interface TypingFollowCameraOptions {
  frame: number;
  fps: number;
  // Typing state
  isTyping: boolean;
  typingComplete: boolean;
  // Current position
  currentLine: number;
  totalLines: number;
  currentChar: number;
  lineLength: number;
  // Timing
  typingStartFrame: number;
  typingEndFrame: number;
  totalDuration: number;
  // Configuration
  zoomedInScale?: number;      // Scale while typing (very zoomed in)
  zoomedOutScale?: number;     // Scale after typing complete
  lineHeight?: number;
  editorPaddingTop?: number;
  // Transition speeds (in frames)
  zoomInDuration?: number;
  zoomOutDuration?: number;
}

export const useTypingFollowCamera = ({
  frame,
  fps,
  isTyping,
  typingComplete,
  currentLine,
  totalLines,
  currentChar,
  lineLength,
  typingStartFrame,
  typingEndFrame,
  totalDuration,
  zoomedInScale = 2.2,
  zoomedOutScale = 1.0,
  lineHeight = 24,
  editorPaddingTop = 50,
  zoomInDuration = 45,
  zoomOutDuration = 90,
}: TypingFollowCameraOptions) => {
  return useMemo(() => {
    // Phase 1: Before typing - slowly zoom in from center
    if (frame < typingStartFrame) {
      const progress = easeOutExpo(Math.min(1, frame / zoomInDuration));
      const scale = round(1 + (zoomedInScale - 1) * progress);
      const ty = round(-15 * progress);
      return {
        scale,
        translateX: 0,
        translateY: ty,
        transform: `${PERSPECTIVE} scale(${scale}) translateY(${ty}px)`,
        transformOrigin: "50% 40%",
        phase: "intro",
      };
    }

    // Phase 2: While typing - zoomed in, follow the cursor (NO micro-movements)
    if (!typingComplete) {
      const scale = zoomedInScale;

      // Calculate target Y based on current line
      const targetLineY = editorPaddingTop + currentLine * lineHeight;
      const screenCenterY = 540;
      const targetY = round(-(targetLineY * (scale - 1)) + (screenCenterY * 0.2));

      // Calculate X position - center the typing area
      const charWidth = 8.5;
      const editorLeftMargin = 260;
      const currentCharX = editorLeftMargin + currentChar * charWidth;
      const screenCenterX = 960;

      // X movement - minimal, no micro-motion
      const targetX = round(Math.max(-100, Math.min(80, -(currentCharX - screenCenterX) * 0.25)));

      return {
        scale: round(scale),
        translateX: targetX,
        translateY: targetY,
        transform: `${PERSPECTIVE} scale(${round(scale)}) translate(${targetX}px, ${targetY}px)`,
        transformOrigin: "50% 40%",
        phase: "typing",
      };
    }

    // Phase 3: Typing complete - zoom out but STAY READABLE
    const zoomOutStart = typingEndFrame;
    const zoomOutEnd = zoomOutStart + zoomOutDuration;

    if (frame <= zoomOutEnd) {
      const progress = easeInOutCubic(
        Math.min(1, (frame - zoomOutStart) / zoomOutDuration)
      );

      const fromScale = zoomedInScale;
      const toScale = zoomedOutScale;
      const scale = round(fromScale + (toScale - fromScale) * progress);

      // Move to show code nicely centered
      const finalLineY = editorPaddingTop + Math.floor(totalLines * 0.4) * lineHeight;
      const fromY = -(finalLineY * (fromScale - 1)) + (540 * 0.2);
      const toY = -20;
      const translateY = round(fromY + (toY - fromY) * progress);

      return {
        scale,
        translateX: 0,
        translateY,
        transform: `${PERSPECTIVE} scale(${scale}) translate(0px, ${translateY}px)`,
        transformOrigin: "50% 40%",
        phase: "zoomOut",
      };
    }

    // Phase 4: After zoom out - stay at READABLE zoom (NO breathing motion)
    return {
      scale: round(zoomedOutScale),
      translateX: 0,
      translateY: -20,
      transform: `${PERSPECTIVE} scale(${round(zoomedOutScale)}) translate(0px, -20px)`,
      transformOrigin: "50% 40%",
      phase: "complete",
    };
  }, [
    frame,
    fps,
    isTyping,
    typingComplete,
    currentLine,
    totalLines,
    currentChar,
    lineLength,
    typingStartFrame,
    typingEndFrame,
    totalDuration,
    zoomedInScale,
    zoomedOutScale,
    lineHeight,
    editorPaddingTop,
    zoomInDuration,
    zoomOutDuration,
  ]);
};

// Multi-keyframe camera animation
interface KeyFrame {
  frame: number;
  scale: number;
  x: number;
  y: number;
}

interface KeyframeCameraOptions {
  frame: number;
  keyframes: KeyFrame[];
}

export const useKeyframeCamera = ({ frame, keyframes }: KeyframeCameraOptions) => {
  return useMemo(() => {
    if (keyframes.length === 0) {
      return { scale: 1, translateX: 0, translateY: 0, transform: "none" };
    }

    if (keyframes.length === 1 || frame <= keyframes[0].frame) {
      const kf = keyframes[0];
      return {
        scale: round(kf.scale),
        translateX: round(kf.x),
        translateY: round(kf.y),
        transform: `${PERSPECTIVE} scale(${round(kf.scale)}) translate(${round(kf.x)}px, ${round(kf.y)}px)`,
      };
    }

    // Find the two keyframes we're between
    let startKf = keyframes[0];
    let endKf = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (frame >= keyframes[i].frame && frame <= keyframes[i + 1].frame) {
        startKf = keyframes[i];
        endKf = keyframes[i + 1];
        break;
      }
    }

    if (frame >= endKf.frame) {
      return {
        scale: round(endKf.scale),
        translateX: round(endKf.x),
        translateY: round(endKf.y),
        transform: `${PERSPECTIVE} scale(${round(endKf.scale)}) translate(${round(endKf.x)}px, ${round(endKf.y)}px)`,
      };
    }

    // Interpolate with easing
    const t = (frame - startKf.frame) / (endKf.frame - startKf.frame);
    const eased = easeInOutCubic(t);

    const scale = round(startKf.scale + (endKf.scale - startKf.scale) * eased);
    const x = round(startKf.x + (endKf.x - startKf.x) * eased);
    const y = round(startKf.y + (endKf.y - startKf.y) * eased);

    return {
      scale,
      translateX: x,
      translateY: y,
      transform: `${PERSPECTIVE} scale(${scale}) translate(${x}px, ${y}px)`,
    };
  }, [frame, keyframes]);
};
