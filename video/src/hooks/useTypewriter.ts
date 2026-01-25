import { useMemo } from "react";

interface TypewriterOptions {
  text: string;
  frame: number;
  startFrame?: number;
  charsPerFrame?: number;
  cursorBlink?: boolean;
  fps?: number;
}

interface TypewriterResult {
  displayText: string;
  isComplete: boolean;
  cursorVisible: boolean;
  progress: number;
}

export const useTypewriter = ({
  text,
  frame,
  startFrame = 0,
  charsPerFrame = 0.5,
  cursorBlink = true,
  fps = 60,
}: TypewriterOptions): TypewriterResult => {
  return useMemo(() => {
    const adjustedFrame = Math.max(0, frame - startFrame);
    const totalChars = text.length;
    const charsToShow = Math.min(
      Math.floor(adjustedFrame * charsPerFrame),
      totalChars
    );
    const displayText = text.slice(0, charsToShow);
    const isComplete = charsToShow >= totalChars;

    // Cursor blinks every 30 frames (0.5 seconds at 60fps)
    const blinkCycle = Math.floor(adjustedFrame / 30) % 2 === 0;
    const cursorVisible = cursorBlink ? blinkCycle || !isComplete : !isComplete;

    return {
      displayText,
      isComplete,
      cursorVisible,
      progress: totalChars > 0 ? charsToShow / totalChars : 1,
    };
  }, [text, frame, startFrame, charsPerFrame, cursorBlink, fps]);
};

interface MultiLineTypewriterOptions {
  lines: string[];
  frame: number;
  startFrame?: number;
  charsPerFrame?: number;
  delayBetweenLines?: number;
}

interface MultiLineTypewriterResult {
  displayLines: string[];
  currentLineIndex: number;
  isComplete: boolean;
  cursorVisible: boolean;
}

export const useMultiLineTypewriter = ({
  lines,
  frame,
  startFrame = 0,
  charsPerFrame = 0.5,
  delayBetweenLines = 15,
}: MultiLineTypewriterOptions): MultiLineTypewriterResult => {
  return useMemo(() => {
    const adjustedFrame = Math.max(0, frame - startFrame);
    const displayLines: string[] = [];
    let currentLineIndex = 0;
    let frameCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLength = line.length;
      const framesForLine = Math.ceil(lineLength / charsPerFrame);

      if (adjustedFrame >= frameCounter + framesForLine + delayBetweenLines) {
        displayLines.push(line);
        frameCounter += framesForLine + delayBetweenLines;
        currentLineIndex = i + 1;
      } else if (adjustedFrame >= frameCounter) {
        const lineFrame = adjustedFrame - frameCounter;
        const charsToShow = Math.min(
          Math.floor(lineFrame * charsPerFrame),
          lineLength
        );
        displayLines.push(line.slice(0, charsToShow));
        currentLineIndex = i;
        break;
      } else {
        break;
      }
    }

    const isComplete = currentLineIndex >= lines.length;
    const blinkCycle = Math.floor(adjustedFrame / 30) % 2 === 0;
    const cursorVisible = blinkCycle || !isComplete;

    return {
      displayLines,
      currentLineIndex,
      isComplete,
      cursorVisible,
    };
  }, [lines, frame, startFrame, charsPerFrame, delayBetweenLines]);
};
