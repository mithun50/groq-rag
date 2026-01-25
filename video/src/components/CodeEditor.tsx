import React, { useMemo } from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../utils/colors";
import { CodeLine, highlightCode } from "../utils/code-samples";

interface CodeEditorProps {
  lines: CodeLine[];
  startFrame: number;
  charsPerFrame?: number;
  showLineNumbers?: boolean;
  fontSize?: number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  lines,
  startFrame,
  charsPerFrame = 0.6,
  showLineNumbers = true,
  fontSize = 15,
}) => {
  const frame = useCurrentFrame();
  const lineHeight = fontSize * 1.7;
  const indentSize = fontSize * 1.5;

  // Calculate which lines and characters to show
  const { visibleLines, currentLineIndex, cursorPosition } = useMemo(() => {
    const adjustedFrame = Math.max(0, frame - startFrame);
    let totalChars = 0;
    let charsTyped = Math.floor(adjustedFrame * charsPerFrame);
    const visible: Array<{ line: CodeLine; text: string; complete: boolean }> = [];
    let currentLine = 0;
    let cursorPos = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLength = line.text.length;
      const delay = line.delay || 20;

      if (charsTyped <= 0) break;

      if (charsTyped >= lineLength + delay) {
        // Line is complete
        visible.push({ line, text: line.text, complete: true });
        charsTyped -= lineLength + delay;
        currentLine = i + 1;
      } else if (charsTyped > 0) {
        // Partially typed line
        const chars = Math.min(charsTyped, lineLength);
        visible.push({ line, text: line.text.slice(0, chars), complete: false });
        cursorPos = chars;
        currentLine = i;
        break;
      }
    }

    return {
      visibleLines: visible,
      currentLineIndex: currentLine,
      cursorPosition: cursorPos,
    };
  }, [frame, startFrame, lines, charsPerFrame]);

  // Cursor blink
  const cursorVisible = Math.floor((frame - startFrame) / 30) % 2 === 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.ide.bg,
        padding: "16px 0",
        overflow: "hidden",
        display: "flex",
      }}
    >
      {/* Line Numbers */}
      {showLineNumbers && (
        <div
          style={{
            width: 60,
            paddingRight: 16,
            textAlign: "right",
            color: COLORS.ide.lineNumber,
            fontSize,
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: `${lineHeight}px`,
            userSelect: "none",
          }}
        >
          {visibleLines.map((_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
          {visibleLines.length < lines.length && (
            <div>{visibleLines.length + 1}</div>
          )}
        </div>
      )}

      {/* Code Content */}
      <div
        style={{
          flex: 1,
          paddingRight: 20,
          overflow: "hidden",
        }}
      >
        {visibleLines.map(({ line, text, complete }, index) => (
          <div
            key={index}
            style={{
              height: lineHeight,
              display: "flex",
              alignItems: "center",
              paddingLeft: line.indent * indentSize,
            }}
          >
            <HighlightedCode text={text} fontSize={fontSize} />
            {!complete && cursorVisible && (
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: fontSize + 2,
                  backgroundColor: COLORS.ide.cursor,
                  marginLeft: 1,
                  animation: "none",
                }}
              />
            )}
          </div>
        ))}

        {/* Empty line with cursor if at end of visible lines */}
        {visibleLines.length > 0 &&
          visibleLines[visibleLines.length - 1].complete &&
          visibleLines.length < lines.length && (
            <div
              style={{
                height: lineHeight,
                display: "flex",
                alignItems: "center",
                paddingLeft: (lines[visibleLines.length]?.indent || 0) * indentSize,
              }}
            >
              {cursorVisible && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: fontSize + 2,
                    backgroundColor: COLORS.ide.cursor,
                  }}
                />
              )}
            </div>
          )}
      </div>

      {/* Minimap */}
      <div
        style={{
          width: 60,
          backgroundColor: COLORS.ide.bgLight,
          padding: 8,
          opacity: 0.5,
        }}
      >
        {lines.slice(0, 30).map((line, index) => (
          <div
            key={index}
            style={{
              height: 3,
              marginBottom: 1,
              backgroundColor:
                index < visibleLines.length
                  ? COLORS.gray[500]
                  : COLORS.gray[800],
              width: `${Math.min(100, line.text.length * 2)}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface HighlightedCodeProps {
  text: string;
  fontSize: number;
}

const HighlightedCode: React.FC<HighlightedCodeProps> = ({ text, fontSize }) => {
  const tokens = useMemo(() => highlightCode(text), [text]);

  return (
    <span
      style={{
        fontSize,
        fontFamily: "'JetBrains Mono', monospace",
        whiteSpace: "pre",
      }}
    >
      {tokens.map((token, index) => (
        <span key={index} style={{ color: token.color }}>
          {token.text}
        </span>
      ))}
    </span>
  );
};

interface AutoCompletePopupProps {
  items: string[];
  selectedIndex?: number;
  visible: boolean;
  x: number;
  y: number;
}

export const AutoCompletePopup: React.FC<AutoCompletePopupProps> = ({
  items,
  selectedIndex = 0,
  visible,
  x,
  y,
}) => {
  const frame = useCurrentFrame();
  const opacity = visible ? 1 : 0;

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        backgroundColor: COLORS.ide.bgLight,
        border: `1px solid ${COLORS.gray[700]}`,
        borderRadius: 4,
        padding: 4,
        minWidth: 200,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        opacity,
        zIndex: 100,
      }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            padding: "6px 12px",
            backgroundColor:
              index === selectedIndex ? COLORS.ide.selection : "transparent",
            color: COLORS.white,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            borderRadius: 2,
          }}
        >
          <span style={{ color: COLORS.ide.function }}>{item}</span>
        </div>
      ))}
    </div>
  );
};
