import { useWindowDimensions } from 'react-native';

// Design reference width (from the SVG artboards, halved to a typical phone point-width)
const BASE_WIDTH = 390;

/**
 * Returns scale helpers + a maxContentWidth so screens don't stretch edge-to-edge
 * on tablets/iPad. Use inside components: const { scale, isTablet, maxWidth } = useResponsive();
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const scale = Math.min(width / BASE_WIDTH, 1.35); // cap scaling on very wide screens
  const maxWidth = isTablet ? 480 : width; // center a phone-width column on tablets

  return { width, height, isTablet, scale, maxWidth };
}

export default useResponsive;
