/**
 * InlineImage — Image with fullscreen preview.
 */

import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import type { ThemeColors } from '../../utils/theme';
import { ImageModal } from './ImageModal';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  url: string;
  alt: string;
  colors: ThemeColors;
}

export const InlineImage = React.memo(function InlineImage({ url, alt, colors }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <View style={[styles.error, { borderColor: colors.separator }]}>
        <Text style={{ color: colors.textTertiary }}>🖼️ Image failed to load</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity onPress={() => setFullscreen(true)} activeOpacity={0.85}>
        <Image
          source={{ uri: url }}
          style={styles.image}
          resizeMode="contain"
          onError={() => setError(true)}
        />
        {alt ? <Text style={[styles.caption, { color: colors.textTertiary }]}>{alt}</Text> : null}
      </TouchableOpacity>
      <ImageModal visible={fullscreen} uri={url} onClose={() => setFullscreen(false)} />
    </>
  );
});

const styles = StyleSheet.create({
  image: {
    width: SCREEN_WIDTH * 0.7,
    height: 200,
    borderRadius: 8,
    marginVertical: 4,
    alignSelf: 'flex-start',
  },
  caption: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  error: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginVertical: 4,
  },
});
