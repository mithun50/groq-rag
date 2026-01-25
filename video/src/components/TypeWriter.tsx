import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS } from "../utils/colors";
import { useTypewriter, useMultiLineTypewriter } from "../hooks/useTypewriter";

interface TypeWriterProps {
  text: string;
  startFrame?: number;
  charsPerFrame?: number;
  fontSize?: number;
  color?: string;
  showCursor?: boolean;
  fontFamily?: string;
}

export const TypeWriter: React.FC<TypeWriterProps> = ({
  text,
  startFrame = 0,
  charsPerFrame = 0.5,
  fontSize = 16,
  color = COLORS.white,
  showCursor = true,
  fontFamily = "'JetBrains Mono', monospace",
}) => {
  const frame = useCurrentFrame();
  const { displayText, cursorVisible, isComplete } = useTypewriter({
    text,
    frame,
    startFrame,
    charsPerFrame,
  });

  return (
    <span
      style={{
        fontSize,
        color,
        fontFamily,
        whiteSpace: "pre-wrap",
      }}
    >
      {displayText}
      {showCursor && cursorVisible && (
        <span
          style={{
            display: "inline-block",
            width: fontSize * 0.5,
            height: fontSize,
            backgroundColor: color,
            marginLeft: 2,
            verticalAlign: "text-bottom",
          }}
        />
      )}
    </span>
  );
};

interface MultiLineTypeWriterProps {
  lines: string[];
  startFrame?: number;
  charsPerFrame?: number;
  delayBetweenLines?: number;
  fontSize?: number;
  color?: string;
  showCursor?: boolean;
  lineHeight?: number;
}

export const MultiLineTypeWriter: React.FC<MultiLineTypeWriterProps> = ({
  lines,
  startFrame = 0,
  charsPerFrame = 0.5,
  delayBetweenLines = 15,
  fontSize = 16,
  color = COLORS.white,
  showCursor = true,
  lineHeight = 1.6,
}) => {
  const frame = useCurrentFrame();
  const { displayLines, cursorVisible, isComplete, currentLineIndex } =
    useMultiLineTypewriter({
      lines,
      frame,
      startFrame,
      charsPerFrame,
      delayBetweenLines,
    });

  return (
    <div
      style={{
        fontSize,
        color,
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight,
      }}
    >
      {displayLines.map((line, index) => (
        <div key={index} style={{ minHeight: fontSize * lineHeight }}>
          {line}
          {showCursor &&
            cursorVisible &&
            index === displayLines.length - 1 &&
            !isComplete && (
              <span
                style={{
                  display: "inline-block",
                  width: fontSize * 0.5,
                  height: fontSize,
                  backgroundColor: color,
                  marginLeft: 2,
                  verticalAlign: "text-bottom",
                }}
              />
            )}
        </div>
      ))}
    </div>
  );
};

interface TypingCursorProps {
  color?: string;
  size?: number;
  blinkRate?: number;
}

export const TypingCursor: React.FC<TypingCursorProps> = ({
  color = COLORS.white,
  size = 16,
  blinkRate = 30,
}) => {
  const frame = useCurrentFrame();
  const visible = Math.floor(frame / blinkRate) % 2 === 0;

  return (
    <span
      style={{
        display: "inline-block",
        width: size * 0.5,
        height: size,
        backgroundColor: visible ? color : "transparent",
        marginLeft: 2,
        verticalAlign: "text-bottom",
      }}
    />
  );
};
