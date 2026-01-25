import React from "react";
import { Sequence, AbsoluteFill, Audio, staticFile } from "remotion";
import { Intro } from "./compositions/Intro";
import { TerminalInstall } from "./compositions/TerminalInstall";
import { IDECodeWriting } from "./compositions/IDECodeWriting";
import { RunningApp } from "./compositions/RunningApp";
import { FeaturesShowcase } from "./compositions/FeaturesShowcase";
import { Outro } from "./compositions/Outro";
import { DURATIONS } from "./utils/animations";
import { COLORS } from "./utils/colors";

// Background music file - place your music file in public/music.mp3
const MUSIC_FILE = staticFile("music.mp3");
const USE_MUSIC = false; // Set to true when you add music.mp3 to public folder

// Calculate scene start times
const STARTS = {
  intro: 0,
  terminal: DURATIONS.intro,
  ide: DURATIONS.intro + DURATIONS.terminalInstall,
  running: DURATIONS.intro + DURATIONS.terminalInstall + DURATIONS.ideCodeWriting,
  features: DURATIONS.intro + DURATIONS.terminalInstall + DURATIONS.ideCodeWriting + DURATIONS.runningApp,
  outro: DURATIONS.intro + DURATIONS.terminalInstall + DURATIONS.ideCodeWriting + DURATIONS.runningApp + DURATIONS.featuresShowcase,
};

export const Video: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      {/* Background Music - ambient tech/cinematic */}
      {USE_MUSIC && (
        <Audio
          src={MUSIC_FILE}
          volume={0.3}
          startFrom={0}
        />
      )}

      {/* Scene 1: Intro - 7s */}
      <Sequence from={STARTS.intro} durationInFrames={DURATIONS.intro}>
        <Intro />
      </Sequence>

      {/* Scene 2: Terminal Install - 12s */}
      <Sequence from={STARTS.terminal} durationInFrames={DURATIONS.terminalInstall}>
        <TerminalInstall />
      </Sequence>

      {/* Scene 3: IDE Code Writing - 40s */}
      <Sequence from={STARTS.ide} durationInFrames={DURATIONS.ideCodeWriting}>
        <IDECodeWriting />
      </Sequence>

      {/* Scene 4: Running App (Chatbot Testing) - 30s */}
      <Sequence from={STARTS.running} durationInFrames={DURATIONS.runningApp}>
        <RunningApp />
      </Sequence>

      {/* Scene 5: Features Showcase - 10s */}
      <Sequence from={STARTS.features} durationInFrames={DURATIONS.featuresShowcase}>
        <FeaturesShowcase />
      </Sequence>

      {/* Scene 6: Outro - 8s */}
      <Sequence from={STARTS.outro} durationInFrames={DURATIONS.outro}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
