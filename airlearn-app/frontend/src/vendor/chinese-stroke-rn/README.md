# Chinese Stroke React Native — Offline HSK500 Bundle

This package contains exactly 500 unique Chinese characters and 500 matching local stroke-data files. Animation, tracing, scoring events, and character loading work without an internet connection.

## Included

- `data/`: 500 Make Me a Hanzi JSON stroke-data files
- `frontend/src/data/characterMetadata.json`: app-level pinyin, English, and Tamil captions for the same 500 characters
- `src/hanziWriterSource.ts`: Hanzi Writer 3.7.3 bundled locally
- `src/offlineCharacterData.ts`: static Metro-compatible imports for all 500 JSON files
- `src/hsk500.ts`: deterministic 500-character learning sequence
- `src/ChineseStrokeWriter.tsx`: offline React Native WebView component
- `example/StrokePracticeScreen.tsx`: integration example
- `VALIDATION.json`: machine-readable completeness report

No CDN, API, fetch, or runtime network request is used.

## Install

Copy this folder into your application, then install the only native dependency:

```bash
npm install react-native-webview
```

Your TypeScript configuration must allow JSON imports:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

## Use

```tsx
import {ChineseStrokeWriter} from './packages/chinese-stroke-rn-offline-hsk500/src';

<ChineseStrokeWriter
  character="你"
  mode="trace"
  size={320}
  onProgress={event => console.log(event.strokesCompleted)}
  onMistake={event => console.log(event.mistakes)}
  onComplete={event => console.log(event)}
/>
```

Use `mode="animate"` for stroke-order demonstration. Import `HSK500_CHARACTERS` to build the 500-character selection grid.

## Public properties

- `character`: one character included in `HSK500_CHARACTERS`
- `size`: square canvas size; default `320`
- `mode`: `trace` or `animate`
- `autoStart`: start immediately; default `true`
- `showOutline` and `showGuide`: visual guides
- `strokeAnimationSpeed` and `delayBetweenStrokes`: animation timing
- `leniency`: tracing tolerance
- `theme`: background, guide, outline, stroke, highlight, and drawing colours
- `onReady`, `onProgress`, `onMistake`, and `onComplete`: app callbacks

The ref exposes `start()` and `reset()`.

## Validation

Run `npm run check`. Validation fails unless the list contains 500 unique Han characters, all 500 matching JSON files exist, every JSON file has strokes and medians, and the component contains no remote URL.

## Data attribution

Stroke data comes from Make Me a Hanzi through the `hanzi-writer-data` package. The relevant upstream licence files are included in `LICENSES/`. Hanzi Writer is included under its MIT licence.
