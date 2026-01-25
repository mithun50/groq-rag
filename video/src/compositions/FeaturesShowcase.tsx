import React from "react";
import { useCurrentFrame, interpolate, spring, AbsoluteFill } from "remotion";
import { Spotlight, Vignette, FilmGrain, Particles } from "../components/Particles";
import { Background } from "../components/Background";
import { COLORS } from "../utils/colors";
import { SPRING_CONFIGS, FPS, DURATIONS } from "../utils/animations";

export const FeaturesShowcase: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade transitions
  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(
    frame,
    [DURATIONS.featuresShowcase - 40, DURATIONS.featuresShowcase],
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
        opacity: fadeIn * fadeOut,
      }}
    >
      {/* Professional background */}
      <Background opacity={1} />
      <Particles count={20} speed={0.15} />
      <Spotlight x={50} y={50} size={600} intensity={0.05} />

      {/* Content - SCALED UP for better visibility */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 60,
          transform: "scale(1.5)",
        }}
      >
        <SectionTitle frame={frame} />
        <FeaturesGrid frame={frame} />
      </div>

      {/* Overlays */}
      <Vignette intensity={0.5} />
      <FilmGrain intensity={0.02} />
    </AbsoluteFill>
  );
};

interface SectionTitleProps {
  frame: number;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ frame }) => {
  const springProgress = spring({
    frame,
    fps: FPS,
    config: SPRING_CONFIGS.cinematic,
    durationInFrames: 45,
  });

  const opacity = interpolate(springProgress, [0, 1], [0, 1]);
  const translateY = interpolate(springProgress, [0, 1], [-20, 0]);

  return (
    <div
      style={{
        textAlign: "center",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <h2
        style={{
          fontSize: 56,
          fontWeight: 600,
          color: COLORS.white,
          fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
          letterSpacing: "-0.02em",
          marginBottom: 16,
        }}
      >
        Features
      </h2>
      <p
        style={{
          fontSize: 22,
          color: COLORS.white,
          fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
        }}
      >
        Everything you need to build intelligent AI applications
      </p>
    </div>
  );
};

interface FeaturesGridProps {
  frame: number;
}

const FeaturesGrid: React.FC<FeaturesGridProps> = ({ frame }) => {
  const features = [
    {
      title: "RAG",
      description: "Knowledge retrieval",
      icon: "📚",
      delay: 40,
    },
    {
      title: "Web Search",
      description: "Real-time information",
      icon: "🔍",
      delay: 70,
    },
    {
      title: "Agents",
      description: "Multi-step automation",
      icon: "🤖",
      delay: 100,
    },
    {
      title: "Streaming",
      description: "Real-time responses",
      icon: "⚡",
      delay: 130,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 24,
      }}
    >
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          {...feature}
          frame={frame}
          index={index}
        />
      ))}
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  delay: number;
  frame: number;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  delay,
  frame,
  index,
}) => {
  const springProgress = spring({
    frame: frame - delay,
    fps: FPS,
    config: SPRING_CONFIGS.smooth,
    durationInFrames: 40,
  });

  const opacity = interpolate(springProgress, [0, 1], [0, 1]);
  const translateY = interpolate(springProgress, [0, 1], [30, 0]);
  const scale = interpolate(springProgress, [0, 1], [0.9, 1]);

  return (
    <div
      style={{
        width: 200,
        padding: 28,
        backgroundColor: COLORS.backgroundLight,
        border: `1px solid ${COLORS.gray[800]}`,
        borderRadius: 16,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 42,
          marginBottom: 16,
          filter: "grayscale(100%)",
          opacity: 0.9,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: COLORS.white,
          fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
          marginBottom: 8,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 15,
          color: COLORS.white,
          fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
        }}
      >
        {description}
      </p>
    </div>
  );
};
