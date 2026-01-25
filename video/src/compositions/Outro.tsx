import React from "react";
import { useCurrentFrame, interpolate, spring, AbsoluteFill } from "remotion";
import { Particles, Spotlight, Vignette, FilmGrain } from "../components/Particles";
import { COLORS } from "../utils/colors";
import { SPRING_CONFIGS, FPS, DURATIONS } from "../utils/animations";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade in
  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        opacity: fadeIn,
      }}
    >
      {/* Background */}
      <Particles count={40} speed={0.25} />
      <Spotlight x={50} y={45} size={600} intensity={0.08} />

      {/* Content */}
      <LogoFinal frame={frame} />
      <Links frame={frame} />
      <ThankYou frame={frame} />
      <CallToAction frame={frame} />

      {/* Overlays */}
      <Vignette intensity={0.5} />
      <FilmGrain intensity={0.02} />
    </AbsoluteFill>
  );
};

interface LogoFinalProps {
  frame: number;
}

const LogoFinal: React.FC<LogoFinalProps> = ({ frame }) => {
  const springProgress = spring({
    frame: frame - 20,
    fps: FPS,
    config: SPRING_CONFIGS.cinematic,
    durationInFrames: 50,
  });

  const opacity = interpolate(springProgress, [0, 1], [0, 1]);
  const scale = interpolate(springProgress, [0, 1], [0.8, 1]);

  const glowPulse = interpolate(
    Math.sin(frame * 0.04),
    [-1, 1],
    [0.4, 0.8]
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 14,
          backgroundColor: COLORS.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 ${50 * glowPulse}px rgba(255,255,255,${glowPulse * 0.3})`,
        }}
      >
        <svg
          width={36}
          height={36}
          viewBox="0 0 24 24"
          fill="none"
          stroke={COLORS.background}
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
          fontSize: 48,
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

interface LinksProps {
  frame: number;
}

const Links: React.FC<LinksProps> = ({ frame }) => {
  const springProgress = spring({
    frame: frame - 80,
    fps: FPS,
    config: SPRING_CONFIGS.gentle,
    durationInFrames: 40,
  });

  const opacity = interpolate(springProgress, [0, 1], [0, 1]);
  const translateY = interpolate(springProgress, [0, 1], [15, 0]);

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <LinkItem icon="github" text="github.com/mithun50/groq-rag" />
      <LinkItem icon="npm" text="npm install groq-rag" />
    </div>
  );
};

interface LinkItemProps {
  icon: "github" | "npm";
  text: string;
}

const LinkItem: React.FC<LinkItemProps> = ({ icon, text }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 18px",
        backgroundColor: COLORS.backgroundLight,
        border: `1px solid ${COLORS.gray[800]}`,
        borderRadius: 8,
      }}
    >
      {icon === "github" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill={COLORS.gray[400]}>
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill={COLORS.gray[400]}>
          <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331z" />
        </svg>
      )}
      <span
        style={{
          color: COLORS.gray[400],
          fontSize: 14,
          fontFamily: "'SF Mono', monospace",
        }}
      >
        {text}
      </span>
    </div>
  );
};

interface ThankYouProps {
  frame: number;
}

const ThankYou: React.FC<ThankYouProps> = ({ frame }) => {
  const springProgress = spring({
    frame: frame - 140,
    fps: FPS,
    config: SPRING_CONFIGS.smooth,
    durationInFrames: 45,
  });

  const opacity = interpolate(springProgress, [0, 1], [0, 1]);
  const scale = interpolate(springProgress, [0, 1], [0.9, 1]);

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        marginTop: 16,
      }}
    >
      <span
        style={{
          fontSize: 48,
          fontWeight: 600,
          color: COLORS.white,
          fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
          letterSpacing: "-0.02em",
        }}
      >
        Thank You
      </span>
    </div>
  );
};

interface CallToActionProps {
  frame: number;
}

const CallToAction: React.FC<CallToActionProps> = ({ frame }) => {
  const springProgress = spring({
    frame: frame - 200,
    fps: FPS,
    config: SPRING_CONFIGS.gentle,
    durationInFrames: 40,
  });

  const opacity = interpolate(springProgress, [0, 1], [0, 1]);
  const translateY = interpolate(springProgress, [0, 1], [15, 0]);

  const pulse = interpolate(
    Math.sin(frame * 0.05),
    [-1, 1],
    [1, 1.02]
  );

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${pulse})`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 28px",
          backgroundColor: COLORS.white,
          borderRadius: 8,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={COLORS.background}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span
          style={{
            color: COLORS.background,
            fontSize: 16,
            fontWeight: 600,
            fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
          }}
        >
          Star on GitHub
        </span>
      </div>
    </div>
  );
};
