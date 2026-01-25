import React from "react";
import { useCurrentFrame, spring, interpolate } from "remotion";
import { COLORS } from "../utils/colors";
import { SPRING_CONFIGS, FPS } from "../utils/animations";

interface MacBookProps {
  children: React.ReactNode;
  scale?: number;
  animate?: boolean;
  delay?: number;
  showReflection?: boolean;
}

export const MacBook: React.FC<MacBookProps> = ({
  children,
  scale = 1,
  animate = true,
  delay = 0,
  showReflection = false,
}) => {
  const frame = useCurrentFrame();

  const slideProgress = animate
    ? spring({
        frame: frame - delay,
        fps: FPS,
        config: SPRING_CONFIGS.cinematic,
        durationInFrames: 60,
      })
    : 1;

  const translateY = interpolate(slideProgress, [0, 1], [200, 0]);
  const opacity = interpolate(slideProgress, [0, 0.3, 1], [0, 0.5, 1]);

  const screenWidth = 1200 * scale;
  const screenHeight = 750 * scale;
  const bezelWidth = 16 * scale;
  const notchWidth = 160 * scale;
  const notchHeight = 20 * scale;
  const borderRadius = 12 * scale;
  const bottomBezel = 32 * scale;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {/* Screen Assembly */}
      <div
        style={{
          position: "relative",
          backgroundColor: "#0c0c0c",
          borderRadius: `${borderRadius}px ${borderRadius}px 0 0`,
          padding: bezelWidth,
          paddingTop: bezelWidth + notchHeight / 2,
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.05),
            0 25px 80px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.03)
          `,
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: notchWidth,
            height: notchHeight,
            backgroundColor: "#0c0c0c",
            borderRadius: `0 0 ${notchHeight / 2}px ${notchHeight / 2}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Camera */}
          <div
            style={{
              width: 6 * scale,
              height: 6 * scale,
              borderRadius: "50%",
              backgroundColor: "#1a1a1a",
              boxShadow: "inset 0 0 2px rgba(255,255,255,0.1)",
            }}
          />
        </div>

        {/* Screen */}
        <div
          style={{
            width: screenWidth,
            height: screenHeight,
            backgroundColor: COLORS.background,
            borderRadius: 6 * scale,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {children}

          {/* Subtle screen glare */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.015) 0%, transparent 40%)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* Bottom Part (Keyboard base) */}
      <div
        style={{
          width: screenWidth + bezelWidth * 2 + 50 * scale,
          height: bottomBezel,
          background: "linear-gradient(180deg, #181818 0%, #0c0c0c 100%)",
          borderRadius: `0 0 ${borderRadius}px ${borderRadius}px`,
          boxShadow: `
            0 4px 20px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.02)
          `,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Hinge indicator */}
        <div
          style={{
            width: 180 * scale,
            height: 3 * scale,
            backgroundColor: "rgba(255,255,255,0.02)",
            borderRadius: 1.5 * scale,
          }}
        />
      </div>

      {/* Reflection */}
      {showReflection && (
        <div
          style={{
            width: screenWidth + bezelWidth * 2 + 30 * scale,
            height: 40 * scale,
            background: `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)`,
            filter: "blur(15px)",
            marginTop: 15 * scale,
            opacity: 0.4,
          }}
        />
      )}
    </div>
  );
};

interface MacBookScreenProps {
  children: React.ReactNode;
}

export const MacBookScreen: React.FC<MacBookScreenProps> = ({ children }) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};
