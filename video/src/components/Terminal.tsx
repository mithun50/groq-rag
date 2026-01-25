import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../utils/colors";
import { useTypewriter } from "../hooks/useTypewriter";

interface TerminalProps {
  children?: React.ReactNode;
  title?: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  children,
  title = "Terminal"
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.terminal.bg,
        fontFamily: "'SF Mono', 'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Title Bar - minimal macOS style */}
      <div
        style={{
          height: 32,
          backgroundColor: COLORS.backgroundMedium,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 8,
          borderBottom: `1px solid ${COLORS.gray[800]}`,
        }}
      >
        {/* Traffic Lights */}
        <div style={{ display: "flex", gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#ff5f57",
              opacity: 0.9,
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#febc2e",
              opacity: 0.9,
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#28c840",
              opacity: 0.9,
            }}
          />
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            color: COLORS.gray[500],
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {title}
        </div>
        <div style={{ width: 52 }} /> {/* Balance the traffic lights */}
      </div>

      {/* Terminal Content */}
      <div
        style={{
          flex: 1,
          padding: 16,
          overflow: "hidden",
          lineHeight: 1.5,
        }}
      >
        {children}
      </div>
    </div>
  );
};

interface TerminalPromptProps {
  path?: string;
}

export const TerminalPrompt: React.FC<TerminalPromptProps> = ({
  path = "~/project"
}) => {
  return (
    <span style={{ color: COLORS.terminal.textDim }}>
      <span style={{ color: COLORS.gray[500] }}>$</span>{" "}
    </span>
  );
};

interface TerminalLineProps {
  prompt?: boolean;
  children: React.ReactNode;
  color?: string;
}

export const TerminalLine: React.FC<TerminalLineProps> = ({
  prompt = false,
  children,
  color = COLORS.terminal.text,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        marginBottom: 2,
        minHeight: 21,
      }}
    >
      {prompt && <TerminalPrompt />}
      <span style={{ color }}>{children}</span>
    </div>
  );
};

interface TypedTerminalLineProps {
  text: string;
  startFrame: number;
  prompt?: boolean;
  charsPerFrame?: number;
  color?: string;
}

export const TypedTerminalLine: React.FC<TypedTerminalLineProps> = ({
  text,
  startFrame,
  prompt = true,
  charsPerFrame = 0.6,
  color = COLORS.terminal.text,
}) => {
  const frame = useCurrentFrame();
  const { displayText, cursorVisible } = useTypewriter({
    text,
    frame,
    startFrame,
    charsPerFrame,
  });

  return (
    <TerminalLine prompt={prompt} color={color}>
      {displayText}
      {cursorVisible && <Cursor />}
    </TerminalLine>
  );
};

interface CursorProps {
  color?: string;
}

export const Cursor: React.FC<CursorProps> = ({ color = COLORS.terminal.cursor }) => {
  const frame = useCurrentFrame();
  const visible = Math.floor(frame / 30) % 2 === 0;

  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 16,
        backgroundColor: visible ? color : "transparent",
        marginLeft: 1,
        verticalAlign: "text-bottom",
      }}
    />
  );
};

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const filled = Math.floor((progress / 100) * 40);
  const empty = 40 - filled;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "monospace" }}>
      <span style={{ color: COLORS.gray[600] }}>[</span>
      <span style={{ color: COLORS.gray[400] }}>{"#".repeat(filled)}</span>
      <span style={{ color: COLORS.gray[700] }}>{"-".repeat(empty)}</span>
      <span style={{ color: COLORS.gray[600] }}>]</span>
      <span style={{ color: COLORS.gray[500] }}>{Math.floor(progress)}%</span>
    </div>
  );
};

interface AnimatedProgressBarProps {
  startFrame: number;
  durationFrames?: number;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  startFrame,
  durationFrames = 120,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 100],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  return <ProgressBar progress={progress} />;
};

// Realistic terminal output with proper styling per line type
interface TerminalOutputLine {
  text: string;
  type: string;
  delay: number;
}

interface RealisticTerminalOutputProps {
  lines: TerminalOutputLine[];
  startFrame: number;
  typingSpeed?: number;
}

export const RealisticTerminalOutput: React.FC<RealisticTerminalOutputProps> = ({
  lines,
  startFrame,
  typingSpeed = 0.8,
}) => {
  const frame = useCurrentFrame();

  const getLineStyle = (type: string): React.CSSProperties => {
    switch (type) {
      case "command":
        return { color: COLORS.white };
      case "success":
        return { color: COLORS.terminal.success };
      case "info":
        return { color: COLORS.white };
      case "dim":
        return { color: COLORS.white, opacity: 0.8 };
      case "error":
        return { color: COLORS.terminal.error };
      case "tool":
        return { color: COLORS.white, paddingLeft: 8 };
      case "toolcall":
        return { color: COLORS.terminal.info };
      case "tooldetail":
        return { color: COLORS.white, paddingLeft: 16 };
      case "toolresult":
        return { color: COLORS.white, paddingLeft: 16 };
      case "toolused":
        return { color: COLORS.terminal.info, paddingLeft: 3 };
      case "agent":
        return { color: COLORS.white };
      case "response":
        return { color: COLORS.white };
      case "divider":
        return { color: COLORS.white, opacity: 0.5 };
      case "stats":
        return { color: COLORS.terminal.info };
      // Chatbot-style types - all visible
      case "box":
        return { color: COLORS.terminal.prompt, fontWeight: 500 };
      case "user":
        return { color: COLORS.terminal.success, fontWeight: 600 };
      case "thinking":
        return { color: COLORS.terminal.warning };
      case "assistant":
        return { color: COLORS.white };
      default:
        return { color: COLORS.white };
    }
  };

  // Calculate cumulative frame for each line
  let cumulativeFrame = startFrame;
  const lineTimings: { start: number; end: number }[] = [];

  for (const line of lines) {
    const typingDuration = line.type === "command"
      ? Math.ceil(line.text.length / typingSpeed)
      : 5; // Non-command lines appear quickly

    lineTimings.push({
      start: cumulativeFrame,
      end: cumulativeFrame + typingDuration,
    });

    cumulativeFrame += typingDuration + line.delay;
  }

  return (
    <div>
      {lines.map((line, index) => {
        const timing = lineTimings[index];

        if (frame < timing.start) return null;

        const isCommand = line.type === "command";
        const style = getLineStyle(line.type);

        if (isCommand) {
          // Type out command character by character
          const charsToShow = Math.min(
            Math.floor((frame - timing.start) * typingSpeed),
            line.text.length
          );
          const displayText = line.text.slice(0, charsToShow);
          const isComplete = charsToShow >= line.text.length;
          const cursorVisible = !isComplete || Math.floor(frame / 30) % 2 === 0;

          return (
            <div key={index} style={{ minHeight: 21, ...style }}>
              <TerminalPrompt />
              {displayText}
              {!isComplete && cursorVisible && <Cursor />}
            </div>
          );
        }

        // Non-command lines fade in
        const opacity = interpolate(
          frame,
          [timing.start, timing.start + 8],
          [0, 1],
          { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
        );

        return (
          <div key={index} style={{ minHeight: line.text ? 21 : 10, opacity, ...style }}>
            {line.text}
          </div>
        );
      })}
    </div>
  );
};
