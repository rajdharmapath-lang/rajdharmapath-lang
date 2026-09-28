import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { logoXml } from '../assets/logoXml';

// Native aspect ratio of your logo file (305.56 x 319.42) — height is derived
// from whatever width is requested so it never looks stretched.
const NATIVE_ASPECT = 305.56 / 319.42;

export default function LogoMark({ size = 160 }) {
  const width = size;
  const height = size / NATIVE_ASPECT;

  return (
    <View style={{ width, height }}>
      <SvgXml xml={logoXml} width={width} height={height} />
    </View>
  );
}
