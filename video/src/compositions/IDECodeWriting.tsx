import React, { useMemo } from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import { MacBook } from "../components/MacBook";
import { IDE } from "../components/IDE";
import { CodeEditor } from "../components/CodeEditor";
import { Vignette, Spotlight, FilmGrain } from "../components/Particles";
import { Background } from "../components/Background";
import { COLORS, GRADIENTS } from "../utils/colors";
import { DURATIONS, FPS } from "../utils/animations";
import { CHATBOT_CODE } from "../utils/code-samples";
import { useTypingFollowCamera } from "../hooks/useZoom";

export const IDECodeWriting: React.FC = () => {
  const frame = useCurrentFrame();
  const charsPerFrame = 0.35;
  const startTypingFrame = 60;

  // Calculate total characters in code to find typing end frame
  const totalCodeChars = useMemo(() => {
    return CHATBOT_CODE.reduce((acc, line) => {
      return acc + line.text.length + (line.delay || 20);
    }, 0);
  }, []);

  const typingEndFrame = startTypingFrame + Math.ceil(totalCodeChars / charsPerFrame);

  // Calculate current typing position for camera tracking
  const { currentLine, currentChar, totalCharsTyped, isTyping, typingComplete } = useMemo(() => {
    const adjustedFrame = Math.max(0, frame - startTypingFrame);
    let totalChars = Math.floor(adjustedFrame * charsPerFrame);
    let lineIndex = 0;
    let charInLine = 0;

    // Check if typing is complete
    const allTyped = totalChars >= totalCodeChars;

    for (let i = 0; i < CHATBOT_CODE.length; i++) {
      const line = CHATBOT_CODE[i];
      const lineLength = line.text.length;
      const delay = line.delay || 20;
      const totalLineChars = lineLength + delay;

      if (totalChars <= totalLineChars) {
        lineIndex = i;
        charInLine = Math.min(totalChars, lineLength);
        break;
      }

      totalChars -= totalLineChars;
      lineIndex = i + 1;
    }

    return {
      currentLine: Math.min(lineIndex, CHATBOT_CODE.length - 1),
      currentChar: charInLine,
      totalCharsTyped: Math.floor(adjustedFrame * charsPerFrame),
      isTyping: frame >= startTypingFrame && !allTyped,
      typingComplete: allTyped,
    };
  }, [frame, startTypingFrame, charsPerFrame, totalCodeChars]);

  // Professional typing-follow camera - readable text levels
  const camera = useTypingFollowCamera({
    frame,
    fps: FPS,
    isTyping,
    typingComplete,
    currentLine,
    totalLines: CHATBOT_CODE.length,
    currentChar,
    lineLength: CHATBOT_CODE[currentLine]?.text.length || 1,
    typingStartFrame: startTypingFrame,
    typingEndFrame,
    totalDuration: DURATIONS.ideCodeWriting,
    zoomedInScale: 1.6,       // Zoomed in but readable
    zoomedOutScale: 1.4,      // Stay zoomed - don't go small
    lineHeight: 24,
    editorPaddingTop: 60,
    zoomInDuration: 50,
    zoomOutDuration: 90,      // Smooth zoom out
  });

  // Fade transitions
  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(
    frame,
    [DURATIONS.ideCodeWriting - 60, DURATIONS.ideCodeWriting],
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

      {/* Subtle accent lighting */}
      <Spotlight x={30} y={15} size={600} intensity={0.06} color="rgba(88,166,255,0.08)" />
      <Spotlight x={75} y={85} size={500} intensity={0.04} color="rgba(163,113,247,0.06)" />

      {/* MacBook with IDE - professional follow camera with SMOOTH transitions */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: camera.transform,
          transformOrigin: camera.transformOrigin,
          willChange: "transform",
        }}
      >
        <MacBook scale={0.9} animate={false} showReflection={false}>
          <IDE activeFile="chatbot.ts" showSidebar={true}>
            <CodeEditor
              lines={CHATBOT_CODE}
              startFrame={startTypingFrame}
              charsPerFrame={charsPerFrame}
              fontSize={14}
            />
          </IDE>
        </MacBook>
      </div>

      {/* Typing indicator with phase info */}
      <TypingIndicator
        frame={frame}
        currentLine={currentLine}
        totalLines={CHATBOT_CODE.length}
        phase={camera.phase}
        visible={frame > startTypingFrame && frame < DURATIONS.ideCodeWriting - 100}
      />

      {/* Cinematic overlays - softer for colored theme */}
      <Vignette intensity={0.3} />
      <FilmGrain intensity={0.01} />
    </AbsoluteFill>
  );
};

interface TypingIndicatorProps {
  frame: number;
  currentLine: number;
  totalLines: number;
  phase: string;
  visible: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  frame,
  currentLine,
  totalLines,
  phase,
  visible,
}) => {
  if (!visible) return null;

  const opacity = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [0.5, 0.9]
  );

  const progress = ((currentLine + 1) / totalLines) * 100;
  const isTyping = phase === "typing";

  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        right: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
        opacity,
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          width: 120,
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
            transition: "width 0.3s ease-out",
          }}
        />
      </div>

      {/* Line info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Pulsing indicator when typing */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: isTyping ? COLORS.terminal.success : COLORS.primary,
            boxShadow: isTyping
              ? `0 0 8px ${COLORS.terminal.success}`
              : `0 0 6px ${COLORS.primary}`,
          }}
        />
        <span
          style={{
            color: COLORS.white,
            fontSize: 12,
            fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
            fontWeight: 500,
          }}
        >
          {isTyping ? `Line ${currentLine + 1}/${totalLines}` : "Complete"}
        </span>
      </div>
    </div>
  );
};
