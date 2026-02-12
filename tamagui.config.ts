/**
 * Tamagui configuration — maps existing theme tokens to Tamagui system.
 * Uses our ChatGPT-inspired design language.
 */

import { createTamagui } from 'tamagui';
import { config as defaultConfig } from '@tamagui/config/v3';
import { createAnimations } from '@tamagui/animations-react-native';

const animations = createAnimations({
  fast: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  medium: {
    type: 'spring',
    damping: 15,
    mass: 0.9,
    stiffness: 150,
  },
  slow: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  tooltip: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
});

const config = createTamagui({
  ...defaultConfig,
  animations,
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      background: '#FFFFFF',
      color: '#374151',
      borderColor: '#D9D9E3',
      // Brand
      primary: '#10A37F',
      primaryMuted: 'rgba(16,163,127,0.10)',
      // Surfaces
      surface: '#FFFFFF',
      cardBackground: '#FFFFFF',
      separator: 'rgba(0,0,0,0.06)',
      // Text
      textSecondary: '#374151',
      textTertiary: '#6B7280',
      // Chat
      userMessageBg: '#F7F7F8',
      assistantMessageBg: '#FFFFFF',
      inputBackground: '#FFFFFF',
      inputBorder: '#D9D9E3',
      // Code
      codeBackground: '#F7F7F8',
      codeText: '#1F2937',
      // Send button
      sendButtonBg: '#000000',
      sendButtonIcon: '#FFFFFF',
      sendButtonDisabledBg: '#D9D9E3',
      contrastText: '#FFFFFF',
    },
    dark: {
      ...defaultConfig.themes.dark,
      background: '#212121',
      color: '#ECECEC',
      borderColor: '#424242',
      // Brand
      primary: '#10A37F',
      primaryMuted: 'rgba(16,163,127,0.15)',
      // Surfaces
      surface: '#212121',
      cardBackground: '#2F2F2F',
      separator: 'rgba(255,255,255,0.08)',
      // Text
      textSecondary: '#D1D5DB',
      textTertiary: '#8E8EA0',
      // Chat
      userMessageBg: '#2F2F2F',
      assistantMessageBg: '#212121',
      inputBackground: '#2F2F2F',
      inputBorder: '#424242',
      // Code
      codeBackground: '#2F2F2F',
      codeText: '#ECECEC',
      // Send button
      sendButtonBg: '#FFFFFF',
      sendButtonIcon: '#000000',
      sendButtonDisabledBg: '#424242',
      contrastText: '#FFFFFF',
    },
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
