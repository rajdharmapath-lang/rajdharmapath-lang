import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function StaggeredSlideItem({ children, index = 0, style }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    });
    const timer = setTimeout(() => animation.start(), index * 120);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [index, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-24, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}