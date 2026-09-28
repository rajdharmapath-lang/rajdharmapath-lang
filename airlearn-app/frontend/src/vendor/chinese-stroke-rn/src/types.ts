export type StrokeTheme = {
  background?: string;
  guide?: string;
  outline?: string;
  stroke?: string;
  highlight?: string;
  drawing?: string;
};

export type StrokeEvent = {
  character: string;
  mistakes: number;
  strokesCompleted: number;
  totalStrokes: number;
};

export type ChineseStrokeWriterProps = {
  character: string;
  size?: number;
  mode?: 'animate' | 'trace';
  autoStart?: boolean;
  showOutline?: boolean;
  showGuide?: boolean;
  strokeAnimationSpeed?: number;
  delayBetweenStrokes?: number;
  leniency?: number;
  theme?: StrokeTheme;
  onReady?: (totalStrokes: number) => void;
  onProgress?: (event: StrokeEvent) => void;
  onMistake?: (event: StrokeEvent) => void;
  onComplete?: (event: StrokeEvent) => void;
  onError?: (message: string) => void;
};
