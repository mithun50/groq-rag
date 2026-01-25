import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { Intro } from "./compositions/Intro";
import { TerminalInstall } from "./compositions/TerminalInstall";
import { IDECodeWriting } from "./compositions/IDECodeWriting";
import { RunningApp } from "./compositions/RunningApp";
import { FeaturesShowcase } from "./compositions/FeaturesShowcase";
import { Outro } from "./compositions/Outro";
import {
  DURATIONS,
  FPS,
  WIDTH,
  HEIGHT,
} from "./utils/animations";

// New total duration without MacBookReveal
const VIDEO_DURATION =
  DURATIONS.intro +
  DURATIONS.terminalInstall +
  DURATIONS.ideCodeWriting +
  DURATIONS.runningApp +
  DURATIONS.featuresShowcase +
  DURATIONS.outro;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Main Video Composition */}
      <Composition
        id="Video"
        component={Video}
        durationInFrames={VIDEO_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* Individual Scene Compositions for Preview */}
      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={DURATIONS.intro}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      <Composition
        id="TerminalInstall"
        component={TerminalInstall}
        durationInFrames={DURATIONS.terminalInstall}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      <Composition
        id="IDECodeWriting"
        component={IDECodeWriting}
        durationInFrames={DURATIONS.ideCodeWriting}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      <Composition
        id="RunningApp"
        component={RunningApp}
        durationInFrames={DURATIONS.runningApp}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      <Composition
        id="FeaturesShowcase"
        component={FeaturesShowcase}
        durationInFrames={DURATIONS.featuresShowcase}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      <Composition
        id="Outro"
        component={Outro}
        durationInFrames={DURATIONS.outro}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
