/**
 * useSpeech — Text-to-Speech hook using expo-speech.
 * Provides speak/stop/isSpeaking for reading AI responses aloud.
 */

import { useCallback, useState, useEffect } from 'react';
import * as Speech from 'expo-speech';

interface UseSpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const { language = 'en-US', pitch = 1.0, rate = 1.0 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const speak = useCallback(async (text: string) => {
    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'code block omitted')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, 'image: $1')
      .replace(/^\s*[-*+]\s/gm, '')
      .replace(/^\s*\d+\.\s/gm, '')
      .trim();

    if (!cleanText) return;

    await Speech.stop();
    setIsSpeaking(true);

    Speech.speak(cleanText, {
      language,
      pitch,
      rate,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  }, [language, pitch, rate]);

  const stop = useCallback(async () => {
    await Speech.stop();
    setIsSpeaking(false);
  }, []);

  const toggle = useCallback(async (text: string) => {
    if (isSpeaking) {
      await stop();
    } else {
      await speak(text);
    }
  }, [isSpeaking, speak, stop]);

  return { speak, stop, toggle, isSpeaking };
}
