import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import { MacBook } from "../components/MacBook";
import { Terminal, RealisticTerminalOutput } from "../components/Terminal";
import { Vignette, Spotlight, FilmGrain } from "../components/Particles";
import { COLORS, GRADIENTS } from "../utils/colors";
import { DURATIONS } from "../utils/animations";
import { NPM_INSTALL_OUTPUT } from "../utils/code-samples";
import { useKeyframeCamera } from "../hooks/useZoom";

export const TerminalInstall: React.FC = () => {
  const frame = useCurrentFrame();

  // Smooth camera - readable text throughout
  const cameraKeyframes = [
    { frame: 0, scale: 1.0, x: 0, y: 0 },            // Start normal
    { frame: 40, scale: 1.15, x: 0, y: -10 },        // Slight zoom as typing starts
    { frame: 120, scale: 1.3, x: 0, y: -30 },        // Zoom to command area
    { frame: 300, scale: 1.35, x: 0, y: -50 },       // Follow progress
    { frame: 500, scale: 1.2, x: 0, y: -30 },        // Pull back slightly for results
    { frame: DURATIONS.terminalInstall - 60, scale: 1.1, x: 0, y: -15 }, // Ease out
    { frame: DURATIONS.terminalInstall, scale: 1.0, x: 0, y: 0 }, // End normal
  ];

  const { transform } = useKeyframeCamera({ frame, keyframes: cameraKeyframes });

  // Fade transitions
  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(
    frame,
    [DURATIONS.terminalInstall - 40, DURATIONS.terminalInstall],
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
      {/* macOS mesh gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: GRADIENTS.mesh,
          opacity: 0.5,
        }}
      />

      {/* Colored ambient lighting */}
      <Spotlight x={50} y={30} size={600} intensity={0.08} color="rgba(88,166,255,0.1)" />
      <Spotlight x={80} y={70} size={400} intensity={0.05} color="rgba(63,185,80,0.06)" />

      {/* MacBook with cinematic camera */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform,
          transformOrigin: "center center",
        }}
      >
        <MacBook scale={0.9} animate={false} showReflection={false}>
          <Terminal title="Terminal — npm">
            <RealisticTerminalOutput
              lines={NPM_INSTALL_OUTPUT}
              startFrame={60}
              typingSpeed={0.7}
            />
          </Terminal>
        </MacBook>
      </div>

      {/* Cinematic overlays - softer for colored theme */}
      <Vignette intensity={0.35} />
      <FilmGrain intensity={0.012} />
    </AbsoluteFill>
  );
};
