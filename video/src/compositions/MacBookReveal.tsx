import React from "react";
import { useCurrentFrame, spring, interpolate, AbsoluteFill } from "remotion";
import { MacBook } from "../components/MacBook";
import { Spotlight, Vignette, FilmGrain } from "../components/Particles";
import { COLORS, GRADIENTS } from "../utils/colors";
import { SPRING_CONFIGS, FPS, DURATIONS } from "../utils/animations";

export const MacBookReveal: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade in
  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  // MacBook slide up animation
  const slideProgress = spring({
    frame,
    fps: FPS,
    config: SPRING_CONFIGS.cinematic,
    durationInFrames: 90,
  });

  const translateY = interpolate(slideProgress, [0, 1], [150, 0]);
  const scale = interpolate(slideProgress, [0, 1], [0.9, 0.85]);

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [DURATIONS.macbookReveal - 40, DURATIONS.macbookReveal],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
      <Spotlight x={50} y={60} size={700} intensity={0.08} color="rgba(88,166,255,0.1)" />
      <Spotlight x={20} y={30} size={400} intensity={0.05} color="rgba(163,113,247,0.06)" />

      {/* MacBook */}
      <div
        style={{
          transform: `translateY(${translateY}px) scale(${scale})`,
        }}
      >
        <MacBook scale={1} animate={false} showReflection={false}>
          <LoadingScreen frame={frame} />
        </MacBook>
      </div>

      {/* Cinematic overlays - softer for colored theme */}
      <Vignette intensity={0.35} />
      <FilmGrain intensity={0.012} />
    </AbsoluteFill>
  );
};

interface LoadingScreenProps {
  frame: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ frame }) => {
  const pulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.7, 1]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      {/* Loading indicator with gradient */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: GRADIENTS.primary,
          opacity: pulse,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 8px 32px rgba(88,166,255,0.25)`,
        }}
      >
        <svg
          width={28}
          height={28}
          viewBox="0 0 24 24"
          fill="none"
          stroke={COLORS.white}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>

      <div
        style={{
          color: COLORS.gray[600],
          fontSize: 13,
          fontFamily: "'SF Mono', monospace",
          letterSpacing: "0.1em",
        }}
      >
        INITIALIZING
      </div>

      {/* Loading bar */}
      <LoadingBar frame={frame} />
    </div>
  );
};

interface LoadingBarProps {
  frame: number;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ frame }) => {
  const progress = interpolate(frame, [60, 280], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 200,
        height: 3,
        backgroundColor: COLORS.gray[800],
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: "100%",
          background: GRADIENTS.primary,
          borderRadius: 2,
          transition: "width 0.1s ease-out",
        }}
      />
    </div>
  );
};
