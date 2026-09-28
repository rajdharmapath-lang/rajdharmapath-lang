import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

/**
 * Wraps a screen component so it respects the device's actual safe areas
 * (status bar, notch, home-indicator/gesture-nav bar) instead of relying on
 * a fixed paddingTop that only happens to look right on one device.
 *
 * Applied once per screen registration in App.js rather than edited into
 * every individual screen file.
 */
export function withSafeArea(ScreenComponent) {
  function WrappedScreen(props) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <ScreenComponent {...props} />
      </SafeAreaView>
    );
  }
  WrappedScreen.displayName = `withSafeArea(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;
  return WrappedScreen;
}

export default withSafeArea;
