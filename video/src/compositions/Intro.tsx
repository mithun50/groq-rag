import React from "react";
import { useCurrentFrame, spring, interpolate, AbsoluteFill } from "remotion";
import { Particles, Spotlight, Vignette, FilmGrain } from "../components/Particles";
import { COLORS, GRADIENTS } from "../utils/colors";
import { SPRING_CONFIGS, FPS, DURATIONS } from "../utils/animations";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade out at the end
  const fadeOut = interpolate(
    frame,
    [DURATIONS.intro - 40, DURATIONS.intro],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut,
      }}
    >
      {/* macOS mesh gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: GRADIENTS.mesh,
          opacity: 0.7,
        }}
      />

      {/* Subtle background effects */}
      <Particles count={20} speed={0.15} minSize={1} maxSize={2} />
      <Spotlight x={50} y={45} size={600} intensity={0.1} color="rgba(88,166,255,0.1)" />
      <Spotlight x={25} y={70} size={400} intensity={0.06} color="rgba(163,113,247,0.08)" />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          zIndex: 10,
        }}
      >
        <LogoMinimal frame={frame} />
        <TaglineMinimal frame={frame} />
      </div>

      {/* Cinematic overlays - softer for colored theme */}
      <Vignette intensity={0.4} />
      <FilmGrain intensity={0.015} />
    </AbsoluteFill>
  );
};

interface LogoMinimalProps {
  frame: number;
}

const LogoMinimal: React.FC<LogoMinimalProps> = ({ frame }) => {
  const springProgress = spring({
    frame: frame - 30,
    fps: FPS,
    config: SPRING_CONFIGS.cinematic,
    durationInFrames: 60,
  });

  const opacity = interpolate(springProgress, [0, 0.5, 1], [0, 0.8, 1]);
  const scale = interpolate(springProgress, [0, 1], [0.9, 1]);
  const translateY = interpolate(springProgress, [0, 1], [20, 0]);

  // Subtle glow pulse
  const glowIntensity = interpolate(
    Math.sin(frame * 0.03),
    [-1, 1],
    [0.3, 0.6]
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
      }}
    >
      {/* Logo Icon with gradient */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: GRADIENTS.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `
            0 0 ${60 * glowIntensity}px rgba(88,166,255,${glowIntensity * 0.4}),
            0 8px 32px rgba(88,166,255,0.25)
          `,
        }}
      >
        <svg
          width={44}
          height={44}
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

      {/* Logo Text */}
      <div
        style={{
          fontSize: 56,
          fontWeight: 600,
          color: COLORS.white,
          fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
          letterSpacing: "-0.03em",
        }}
      >
        groq-rag
      </div>
    </div>
  );
};

interface TaglineMinimalProps {
  frame: number;
}

const TaglineMinimal: React.FC<TaglineMinimalProps> = ({ frame }) => {
  const springProgress = spring({
    frame: frame - 90,
    fps: FPS,
    config: SPRING_CONFIGS.gentle,
    durationInFrames: 45,
  });

  const opacity = interpolate(springProgress, [0, 1], [0, 1]);
  const translateY = interpolate(springProgress, [0, 1], [15, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div
        style={{
          fontSize: 22,
          color: COLORS.gray[400],
          fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
          fontWeight: 400,
          letterSpacing: "0.02em",
        }}
      >
        Build Intelligent AI Apps with RAG, Web & Agents
      </div>

      {/* Minimal badges */}
      <BadgeRow frame={frame} />
    </div>
  );
};

interface BadgeRowProps {
  frame: number;
}

const BadgeRow: React.FC<BadgeRowProps> = ({ frame }) => {
  const springProgress = spring({
    frame: frame - 150,
    fps: FPS,
    config: SPRING_CONFIGS.gentle,
    durationInFrames: 45,
  });

  const opacity = interpolate(springProgress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        opacity,
      }}
    >
      <Badge text="TypeScript" />
      <Badge text="v0.1.2" />
      <Badge text="MIT" />
    </div>
  );
};

interface BadgeProps {
  text: string;
}

const Badge: React.FC<BadgeProps> = ({ text }) => {
  return (
    <div
      style={{
        padding: "8px 16px",
        backgroundColor: "rgba(88,166,255,0.08)",
        border: `1px solid rgba(88,166,255,0.15)`,
        borderRadius: 6,
        color: COLORS.gray[200],
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
        letterSpacing: "0.05em",
      }}
    >
      {text}
    </div>
  );
};
