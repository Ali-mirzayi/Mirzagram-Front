import React, { useEffect } from 'react';
import Animated, { cancelAnimation, Easing, StyleProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

type MovingTextureTypes = {
    children: string
    animationThreshold: number
    style?: StyleProps
    disable?: boolean
};

const MovingText = ({ children: text, animationThreshold, style, disable }: MovingTextureTypes) => {
    const translateX = useSharedValue(0);
    const shouldAnimate = text.length >= animationThreshold;
    const textWidth = text.length * 3;
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: disable ? 0 : translateX.value }],
        }
    });

    useEffect(() => {
        if (!shouldAnimate) return;

        translateX.value = withDelay(1000, withRepeat(withTiming(-textWidth, { duration: 3000, easing: Easing.linear }), -1, true));

        return () => {
            cancelAnimation(translateX);
            translateX.value = 0;
        }
    }, [translateX, text, animationThreshold, shouldAnimate]);

    return (
        <Animated.Text
            numberOfLines={1}
            style={[
                animatedStyle,
                shouldAnimate && { width: 9999, paddingLeft: 16, margin: 0 },
                style,
                {paddingLeft:0,fontFamily: "Vazirmatn-SemiBold"}
            ]}
        >
            {text}
        </Animated.Text>
    )
}

export default MovingText;