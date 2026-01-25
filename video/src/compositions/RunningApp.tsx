import React, { useMemo } from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import { MacBook } from "../components/MacBook";
import { Terminal, RealisticTerminalOutput } from "../components/Terminal";
import { Vignette, Spotlight, FilmGrain } from "../components/Particles";
import { Background } from "../components/Background";
import { COLORS } from "../utils/colors";
import { DURATIONS, easeInOutCubic } from "../utils/animations";
import { BOT_OUTPUT } from "../utils/code-samples";

export const RunningApp: React.FC = () => {
  const frame = useCurrentFrame();
  const startFrame = 40;

  // Calculate current output line for camera tracking
  const currentOutputLine = useMemo(() => {
    let cumulativeFrame = startFrame;

    for (let i = 0; i < BOT_OUTPUT.length; i++) {
      const line = BOT_OUTPUT[i];
      const typingDuration = line.type === "command"
        ? Math.ceil(line.text.length / 0.8)
        : 5;

      if (frame < cumulativeFrame + typingDuration + line.delay) {
        return i;
      }

      cumulativeFrame += typingDuration + line.delay;
    }

    return BOT_OUTPUT.length - 1;
  }, [frame, startFrame]);

  // Round helper to avoid blurry text from fractional transforms
  const round = (n: number) => Math.round(n * 1000) / 1000;
  const PERSPECTIVE = "perspective(1000px)";

  // Cinematic camera - STAY ZOOMED IN, follow output smoothly (NO breathing)
  const camera = useMemo(() => {
    const totalLines = BOT_OUTPUT.length;
    const lineProgress = currentOutputLine / Math.max(1, totalLines - 1);

    // Keep scale readable - don't zoom out too much!
    const baseScale = 1.4;     // Start zoomed
    const minScale = 1.25;     // Stay zoomed even at end
    const scaleProgress = easeInOutCubic(Math.min(1, lineProgress));
    const scale = round(baseScale - (baseScale - minScale) * scaleProgress);

    // Follow the content vertically - smooth scrolling
    const lineHeight = 21;
    const currentY = currentOutputLine * lineHeight;
    // Keep current line in upper portion of screen
    const targetY = round(Math.max(-300, -currentY * 0.6));

    return {
      scale,
      x: 0,
      y: targetY,
      transform: `${PERSPECTIVE} scale(${scale}) translate(0px, ${targetY}px)`,
    };
  }, [frame, currentOutputLine]);

  // Fade transitions
  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(
    frame,
    [DURATIONS.runningApp - 60, DURATIONS.runningApp],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        opacity: fadeIn * fadeOut,
      }}
    >
      {/* Professional background */}
      <Background opacity={1} />

      {/* Subtle lighting */}
      <Spotlight x={50} y={40} size={500} intensity={0.06} color="rgba(88,166,255,0.08)" />
      <Spotlight x={20} y={70} size={400} intensity={0.04} color="rgba(63,185,80,0.05)" />

      {/* MacBook with Terminal - SMOOTH camera transitions */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: camera.transform,
          transformOrigin: "center 30%",
          willChange: "transform",
        }}
      >
        <MacBook scale={0.9} animate={false} showReflection={false}>
          <Terminal title="Terminal — node">
            <RealisticTerminalOutput
              lines={BOT_OUTPUT}
              startFrame={startFrame}
              typingSpeed={0.8}
            />
          </Terminal>
        </MacBook>
      </div>

      {/* Status indicator */}
      <StatusIndicator frame={frame} currentLine={currentOutputLine} />

      {/* Cinematic overlays - softer */}
      <Vignette intensity={0.3} />
      <FilmGrain intensity={0.01} />
    </AbsoluteFill>
  );
};

interface StatusIndicatorProps {
  frame: number;
  currentLine: number;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ frame, currentLine }) => {
  // Determine what phase we're in based on current line
  const getStatus = () => {
    if (currentLine < 15) return { text: "Initializing", color: COLORS.terminal.info };
    if (currentLine < 20) return { text: "Processing Query", color: COLORS.terminal.warning };
    if (currentLine < 35) return { text: "Executing Tools", color: COLORS.primary };
    if (currentLine < 45) return { text: "Generating Response", color: COLORS.secondary };
    return { text: "Complete", color: COLORS.terminal.success };
  };

  const status = getStatus();
  const pulse = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.5, 1]);

  const opacity = interpolate(
    frame,
    [40, 80, DURATIONS.runningApp - 100, DURATIONS.runningApp - 60],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 50,
        left: 50,
        display: "flex",
        alignItems: "center",
        gap: 10,
        opacity,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: status.color,
          opacity: pulse,
        }}
      />
      <span
        style={{
          color: status.color,
          fontSize: 13,
          fontFamily: "'SF Mono', monospace",
          letterSpacing: "0.05em",
        }}
      >
        {status.text}
      </span>
    </div>
  );
};
