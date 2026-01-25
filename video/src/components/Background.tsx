import React from "react";
import { Img, staticFile } from "remotion";
import { COLORS, GRADIENTS } from "../utils/colors";

// Set to true and add background.jpg to public folder to use image
const USE_IMAGE = false;
const BG_IMAGE = staticFile("background.jpg");

interface BackgroundProps {
  opacity?: number;
}

export const Background: React.FC<BackgroundProps> = ({ opacity = 1 }) => {
  if (USE_IMAGE) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
        }}
      >
        <Img
          src={BG_IMAGE}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: opacity * 0.3, // Dim the image
          }}
        />
        {/* Dark overlay for text readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
          }}
        />
      </div>
    );
  }

  // Default: Pure black with subtle color accents
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: COLORS.background,
      }}
    >
      {/* Subtle colored gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: GRADIENTS.mesh,
          opacity: opacity * 0.8,
        }}
      />
      {/* Corner accent glows */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,168,255,0.2) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -200,
          right: -200,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(191,90,242,0.15) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />
    </div>
  );
};
