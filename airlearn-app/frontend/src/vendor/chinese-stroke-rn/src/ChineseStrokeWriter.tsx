import React, {useMemo, useRef} from 'react';
import {View, StyleSheet} from 'react-native';
import WebView, {WebViewMessageEvent} from 'react-native-webview';
import type {ChineseStrokeWriterProps, StrokeEvent} from './types';
import {OFFLINE_CHARACTER_DATA} from './offlineCharacterData';
import {HANZI_WRITER_SOURCE} from './hanziWriterSource';

const DEFAULT_THEME = {
  background: '#FFFDF8', guide: '#D8D2C8', outline: '#D8D2C8',
  stroke: '#202020', highlight: '#E53935', drawing: '#2563EB',
};

const html = (p: Required<Pick<ChineseStrokeWriterProps, 'character'|'size'|'mode'|'autoStart'|'showOutline'|'showGuide'|'strokeAnimationSpeed'|'delayBetweenStrokes'|'leniency'>> & {theme: typeof DEFAULT_THEME}, characterData: unknown) => `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<style>*{box-sizing:border-box}html,body,#target{margin:0;width:100%;height:100%;overflow:hidden;background:${p.theme.background};touch-action:none}</style>
<script>${HANZI_WRITER_SOURCE}</script></head>
<body><div id="target"></div><script>
const send=(type,payload={})=>window.ReactNativeWebView.postMessage(JSON.stringify({type,...payload}));
let mistakes=0, completed=0, total=0, writer=null;
const characterData=${JSON.stringify(characterData)};
${p.showGuide ? `const box=document.getElementById('target');box.style.backgroundImage='linear-gradient(${p.theme.guide} 1px,transparent 1px),linear-gradient(90deg,${p.theme.guide} 1px,transparent 1px)';box.style.backgroundSize='50% 50%';` : ''}
function event(){return {character:${JSON.stringify(p.character)},mistakes,strokesCompleted:completed,totalStrokes:total}}
function start(){
 if(!writer)return;
 ${p.mode === 'trace' ? `writer.quiz({leniency:${p.leniency},onMistake:()=>{mistakes++;send('mistake',event())},onCorrectStroke:()=>{completed++;send('progress',event())},onComplete:()=>send('complete',event())});` : `writer.animateCharacter({onComplete:()=>{completed=total;send('complete',event())}});`}
}
window.addEventListener('message',e=>{try{const m=JSON.parse(e.data);if(m.command==='start')start();if(m.command==='reset'){mistakes=0;completed=0;writer.cancelQuiz();writer.hideCharacter();}}catch(_){}});
Promise.resolve(characterData).then(data=>{
 total=data.strokes.length;
 writer=HanziWriter.create('target',${JSON.stringify(p.character)},{width:${p.size},height:${p.size},padding:10,showOutline:${p.showOutline},showCharacter:false,strokeColor:'${p.theme.stroke}',outlineColor:'${p.theme.outline}',highlightColor:'${p.theme.highlight}',drawingColor:'${p.theme.drawing}',strokeAnimationSpeed:${p.strokeAnimationSpeed},delayBetweenStrokes:${p.delayBetweenStrokes},charDataLoader:()=>Promise.resolve(data)});
 send('ready',{totalStrokes:total});
 ${p.autoStart ? 'start();' : ''}
}).catch(error=>send('error',{message:String(error)}));
</script></body></html>`;

export const ChineseStrokeWriter = React.forwardRef<{start:()=>void;reset:()=>void}, ChineseStrokeWriterProps>((props, ref) => {
  const web = useRef<WebView>(null);
  const theme = {...DEFAULT_THEME, ...props.theme};
  const config = {
    character: props.character, size: props.size ?? 320, mode: props.mode ?? 'trace',
    autoStart: props.autoStart ?? true, showOutline: props.showOutline ?? true,
    showGuide: props.showGuide ?? true, strokeAnimationSpeed: props.strokeAnimationSpeed ?? 1,
    delayBetweenStrokes: props.delayBetweenStrokes ?? 500, leniency: props.leniency ?? 1,
    theme,
  } as const;
  const characterData = OFFLINE_CHARACTER_DATA[props.character];
  if (!characterData) {
    throw new Error(`Offline stroke data is not included for character: ${props.character}`);
  }
  const source = useMemo(() => ({html: html(config, characterData)}), [JSON.stringify(config), characterData]);
  React.useImperativeHandle(ref, () => ({
    start: () => web.current?.postMessage(JSON.stringify({command:'start'})),
    reset: () => web.current?.postMessage(JSON.stringify({command:'reset'})),
  }));
  const onMessage = (e: WebViewMessageEvent) => {
    const m = JSON.parse(e.nativeEvent.data);
    if (m.type === 'ready') props.onReady?.(m.totalStrokes);
    else if (m.type === 'progress') props.onProgress?.(m as StrokeEvent);
    else if (m.type === 'mistake') props.onMistake?.(m as StrokeEvent);
    else if (m.type === 'complete') props.onComplete?.(m as StrokeEvent);
    else if (m.type === 'error') {
      // Previously swallowed silently, which is exactly why a failure here
      // just looked like an empty box with no indication anything was wrong.
      console.warn('[ChineseStrokeWriter] WebView reported an error:', m.message);
      props.onError?.(m.message);
    }
  };
  return (
    <View style={[styles.frame,{width:config.size,height:config.size,backgroundColor:theme.background}]}>
      <WebView
        ref={web}
        source={source}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        // Android's hardware-accelerated WebView compositor has a well-known
        // issue where dynamically-created SVG content (exactly what HanziWriter
        // draws) can render as fully blank/invisible, even though the same HTML
        // renders correctly on iOS or in a desktop browser. Forcing software
        // rendering on Android is the standard fix for this class of bug.
        androidLayerType="software"
        // Previously restricted to originWhitelist={['about:blank']} with a
        // matching onShouldStartLoadWithRequest check. That's an unusually
        // tight restriction for fully-local, trusted HTML with no navigation
        // needs, and different Android WebView builds/OEM skins don't always
        // report the initial local-content load as exactly "about:blank" —
        // so on some devices this could silently block the page (or parts of
        // it) from loading at all. Loosened since there's nothing here that
        // benefits from restricting navigation this tightly.
        originWhitelist={['*']}
        onError={(syntheticEvent) => {
          console.warn('[ChineseStrokeWriter] WebView native error:', syntheticEvent.nativeEvent);
          props.onError?.(String(syntheticEvent.nativeEvent?.description || 'WebView failed to load'));
        }}
        style={styles.web}
      />
    </View>
  );
});
const styles = StyleSheet.create({frame:{overflow:'hidden'},web:{flex:1,backgroundColor:'transparent'}});
