import React from 'react';
import { ActivityIndicator, Text, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur';
import useTheme from '../utils/theme';

const LoadingPage = () => {
  const { colors } = useTheme();

  return (<BlurView intensity={4} tint={colors.background === "#212A3E" ? 'dark' : 'light'} style={[styles.container, StyleSheet.absoluteFill]} >
    <Text style={[styles.text, { color: colors.text, fontFamily: "Vazirmatn-SemiBold" }]}>Loading ...</Text>
    <ActivityIndicator size={52} />
  </BlurView >)

}

export default LoadingPage;

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 28,
    marginBottom: 10,
  }
})