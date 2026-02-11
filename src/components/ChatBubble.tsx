/**
 * Chat message component — ChatGPT style: full-width blocks, no bubbles.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Image,
  Dimensions,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { ChatMessage, MessageSegment, Attachment, Artifact, ArtifactType } from '../acp/models/types';
import { useTheme, FontSize, Spacing, Radius, ThemeColors } from '../utils/theme';

interface Props {
  message: ChatMessage;
}

export function ChatBubble({ message }: Props) {
  const { colors } = useTheme();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const mdStyles = markdownStyles(colors);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isUser ? colors.userMessageBg : colors.assistantMessageBg,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        isSystem && styles.systemContainer,
      ]}
    >
      <View style={styles.messageRow}>
        {/* Assistant avatar */}
        {!isUser && !isSystem && (
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarIcon}>✦</Text>
            </View>
          </View>
        )}

        <View style={[styles.contentContainer, isUser && styles.userContentContainer]}>
          {/* User attachments */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <AttachmentPreview attachments={message.attachments} colors={colors} />
          )}

          {/* Reasoning / Thinking section */}
          {!isUser && !isSystem && message.reasoning && (
            <ReasoningView reasoning={message.reasoning} colors={colors} isStreaming={!!message.isStreaming && !message.content} />
          )}

          {message.segments && message.segments.length > 0 ? (
            <>
              {message.segments.map((segment, index) => (
                <SegmentView key={index} segment={segment} colors={colors} isUser={isUser} mdStyles={mdStyles} />
              ))}
              {/* Text content after tool calls (model's summary/explanation) */}
              {message.content ? (
                <MarkdownWithArtifacts content={message.content} mdStyles={mdStyles} colors={colors} artifacts={message.artifacts} />
              ) : null}
            </>
          ) : isUser ? (
            <Text
              style={[styles.messageText, { color: colors.userBubbleText }]}
              selectable
            >
              {message.content}
            </Text>
          ) : isSystem ? (
            <Text
              style={[styles.systemText, { color: colors.textTertiary }]}
              selectable
            >
              {message.content}
            </Text>
          ) : (
            <MarkdownWithArtifacts content={message.content} mdStyles={mdStyles} colors={colors} artifacts={message.artifacts} />
          )}
          {message.isStreaming && (
            <ActivityIndicator
              size="small"
              color={colors.textTertiary}
              style={styles.streamingIndicator}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ── Attachment preview for user messages ──────────────────────────────────────

const screenWidth = Dimensions.get('window').width;

function AttachmentPreview({ attachments, colors }: { attachments: Attachment[]; colors: ThemeColors }) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  return (
    <View style={styles.attachmentContainer}>
      {attachments.map(att => {
        const isImage = att.mediaType.startsWith('image/');
        if (isImage) {
          return (
            <TouchableOpacity
              key={att.id}
              onPress={() => setPreviewImage(att.uri)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: att.uri }}
                style={styles.inlineImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          );
        }
        return (
          <View key={att.id} style={[styles.fileChip, { backgroundColor: colors.codeBackground }]}>
            <Text style={styles.fileChipIcon}>{getFileIcon(att.mediaType)}</Text>
            <Text style={[styles.fileChipName, { color: colors.text }]} numberOfLines={1}>{att.name}</Text>
          </View>
        );
      })}

      {/* Fullscreen image preview modal */}
      {previewImage && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
          <Pressable style={styles.imageModal} onPress={() => setPreviewImage(null)}>
            <Image
              source={{ uri: previewImage }}
              style={styles.imageModalFull}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.imageModalClose} onPress={() => setPreviewImage(null)}>
              <Text style={styles.imageModalCloseText}>✕</Text>
            </TouchableOpacity>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

function getFileIcon(mediaType: string): string {
  if (mediaType.startsWith('image/')) return '🖼️';
  if (mediaType === 'application/pdf') return '📄';
  if (mediaType.includes('spreadsheet') || mediaType.includes('excel') || mediaType === 'text/csv') return '📊';
  if (mediaType.includes('word') || mediaType.includes('document')) return '📝';
  if (mediaType.startsWith('text/')) return '📃';
  return '📎';
}

// ── Markdown with inline images and artifacts ─────────────────────────────────

function MarkdownWithArtifacts({
  content,
  mdStyles,
  colors,
  artifacts,
}: {
  content: string;
  mdStyles: ReturnType<typeof markdownStyles>;
  colors: ThemeColors;
  artifacts?: Artifact[];
}) {
  // Extract image URLs from markdown ![alt](url) patterns
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const parts: Array<{ type: 'text'; text: string } | { type: 'image'; url: string; alt: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'image', url: match[2], alt: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.slice(lastIndex) });
  }

  // If no images found, just render markdown
  if (parts.length <= 1 && parts[0]?.type === 'text') {
    return (
      <>
        <Markdown style={mdStyles}>{content}</Markdown>
        {artifacts && artifacts.length > 0 && (
          <ArtifactList artifacts={artifacts} colors={colors} />
        )}
      </>
    );
  }

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'text' && part.text.trim()) {
          return <Markdown key={i} style={mdStyles}>{part.text}</Markdown>;
        }
        if (part.type === 'image') {
          return <InlineImage key={i} url={part.url} alt={part.alt} colors={colors} />;
        }
        return null;
      })}
      {artifacts && artifacts.length > 0 && (
        <ArtifactList artifacts={artifacts} colors={colors} />
      )}
    </>
  );
}

function InlineImage({ url, alt, colors }: { url: string; alt: string; colors: ThemeColors }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <View style={[styles.imageError, { borderColor: colors.separator }]}>
        <Text style={{ color: colors.textTertiary }}>🖼️ Image failed to load</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity onPress={() => setFullscreen(true)} activeOpacity={0.85}>
        <Image
          source={{ uri: url }}
          style={styles.assistantInlineImage}
          resizeMode="contain"
          onError={() => setError(true)}
        />
        {alt ? <Text style={[styles.imageCaption, { color: colors.textTertiary }]}>{alt}</Text> : null}
      </TouchableOpacity>
      {fullscreen && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setFullscreen(false)}>
          <Pressable style={styles.imageModal} onPress={() => setFullscreen(false)}>
            <Image source={{ uri: url }} style={styles.imageModalFull} resizeMode="contain" />
            <TouchableOpacity style={styles.imageModalClose} onPress={() => setFullscreen(false)}>
              <Text style={styles.imageModalCloseText}>✕</Text>
            </TouchableOpacity>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

// ── Artifact display ──────────────────────────────────────────────────────────

function ArtifactList({ artifacts, colors }: { artifacts: Artifact[]; colors: ThemeColors }) {
  return (
    <View style={styles.artifactList}>
      {artifacts.map(art => (
        <ArtifactCard key={art.id} artifact={art} colors={colors} />
      ))}
    </View>
  );
}

function ArtifactCard({ artifact, colors }: { artifact: Artifact; colors: ThemeColors }) {
  const [expanded, setExpanded] = useState(false);

  const typeIcon: Record<ArtifactType, string> = {
    code: '💻',
    html: '🌐',
    svg: '🎨',
    mermaid: '📊',
    csv: '📋',
    markdown: '📝',
    image: '🖼️',
  };

  return (
    <TouchableOpacity
      style={[styles.artifactCard, { borderColor: colors.separator, backgroundColor: colors.codeBackground }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.artifactHeader}>
        <Text style={styles.artifactIcon}>{typeIcon[artifact.type] ?? '📎'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.artifactTitle, { color: colors.text }]}>{artifact.title}</Text>
          {artifact.language && (
            <Text style={[styles.artifactLang, { color: colors.textTertiary }]}>{artifact.language}</Text>
          )}
        </View>
        <Text style={[styles.chevron, { color: colors.textTertiary }]}>
          {expanded ? '▾' : '▸'}
        </Text>
      </View>
      {expanded && (
        <ScrollView horizontal style={styles.artifactContent}>
          <Text
            style={[styles.artifactCode, { color: colors.codeText }]}
            selectable
          >
            {artifact.content}
          </Text>
        </ScrollView>
      )}
    </TouchableOpacity>
  );
}

function SegmentView({
  segment,
  colors,
  isUser,
  mdStyles,
}: {
  segment: MessageSegment;
  colors: ThemeColors;
  isUser: boolean;
  mdStyles: ReturnType<typeof markdownStyles>;
}) {
  const [expanded, setExpanded] = useState(false);

  switch (segment.type) {
    case 'text':
      return isUser ? (
        <Text style={[styles.messageText, { color: colors.userBubbleText }]} selectable>
          {segment.content}
        </Text>
      ) : (
        <Markdown style={mdStyles}>{segment.content}</Markdown>
      );

    case 'toolCall':
      return (
        <TouchableOpacity
          style={[styles.toolCallContainer, { borderColor: colors.separator }]}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <View style={styles.toolCallHeader}>
            <Text style={[styles.toolCallIcon, { color: colors.textTertiary }]}>
              {segment.isComplete ? '🔧' : '⏳'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toolCallName, { color: colors.textSecondary }]}>{segment.toolName}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 11 }}>
                {segment.isComplete ? 'Completed' : 'Running…'}
              </Text>
            </View>
            {!segment.isComplete && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
            {segment.isComplete && (
              <Text style={{ color: colors.healthyGreen, fontSize: 14 }}>✓</Text>
            )}
            <Text style={[styles.chevron, { color: colors.textTertiary }]}>
              {expanded ? '▾' : '▸'}
            </Text>
          </View>
          {expanded && (
            <View style={styles.toolCallDetails}>
              <Text style={[styles.toolCallLabel, { color: colors.textTertiary }]}>Input:</Text>
              <Text style={[styles.toolCallCode, { color: colors.codeText, backgroundColor: colors.codeBackground }]} selectable>
                {segment.input}
              </Text>
              {segment.result && (
                <>
                  <Text style={[styles.toolCallLabel, { color: colors.textTertiary }]}>Result:</Text>
                  <Text style={[styles.toolCallCode, { color: colors.codeText, backgroundColor: colors.codeBackground }]} selectable>
                    {segment.result.substring(0, 1000)}
                    {segment.result.length > 1000 ? '…' : ''}
                  </Text>
                </>
              )}
            </View>
          )}
        </TouchableOpacity>
      );

    case 'thought':
      return (
        <TouchableOpacity
          style={styles.thoughtContainer}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={[styles.thoughtHeader, { color: colors.textTertiary }]}>
            {expanded ? '▾ Thinking' : '▸ Thinking…'}
          </Text>
          {expanded && (
            <Text style={[styles.thoughtContent, { color: colors.textTertiary }]} selectable>
              {segment.content}
            </Text>
          )}
        </TouchableOpacity>
      );

    default:
      return null;
  }
}

function ReasoningView({
  reasoning,
  colors,
  isStreaming,
}: {
  reasoning: string;
  colors: ThemeColors;
  isStreaming: boolean;
}) {
  const [expanded, setExpanded] = useState(isStreaming);
  const lines = reasoning.split('\n').length;
  const preview = reasoning.length > 120 ? reasoning.substring(0, 120) + '…' : reasoning;

  return (
    <TouchableOpacity
      style={[styles.reasoningContainer, { borderColor: colors.separator, backgroundColor: colors.codeBackground }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.reasoningHeader}>
        <Text style={[styles.reasoningIcon, { color: colors.primary }]}>🧠</Text>
        <Text style={[styles.reasoningTitle, { color: colors.textSecondary }]}>
          {isStreaming ? 'Thinking…' : `Thought for ${lines} lines`}
        </Text>
        {isStreaming && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
        <Text style={[styles.chevron, { color: colors.textTertiary }]}>
          {expanded ? '▾' : '▸'}
        </Text>
      </View>
      {expanded ? (
        <Text style={[styles.reasoningContent, { color: colors.textTertiary }]} selectable>
          {reasoning}
        </Text>
      ) : !isStreaming ? (
        <Text style={[styles.reasoningPreview, { color: colors.textTertiary }]} numberOfLines={2}>
          {preview}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

function markdownStyles(colors: ThemeColors) {
  return {
    body: {
      color: colors.assistantBubbleText,
      fontSize: FontSize.body,
      lineHeight: 24,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 6,
    },
    heading1: {
      color: colors.text,
      fontSize: FontSize.title2,
      fontWeight: '700' as const,
      marginTop: 8,
      marginBottom: 4,
    },
    heading2: {
      color: colors.text,
      fontSize: FontSize.title3,
      fontWeight: '600' as const,
      marginTop: 6,
      marginBottom: 4,
    },
    heading3: {
      color: colors.text,
      fontSize: FontSize.headline,
      fontWeight: '600' as const,
      marginTop: 4,
      marginBottom: 2,
    },
    strong: {
      fontWeight: '600' as const,
    },
    em: {
      fontStyle: 'italic' as const,
    },
    code_inline: {
      backgroundColor: colors.codeBackground,
      color: colors.codeText,
      fontSize: FontSize.footnote,
      fontFamily: 'monospace',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4,
    },
    fence: {
      backgroundColor: colors.codeBackground,
      color: colors.codeText,
      fontSize: FontSize.caption,
      fontFamily: 'monospace',
      padding: Spacing.md,
      borderRadius: Radius.sm,
      marginVertical: 4,
      overflow: 'hidden' as const,
    },
    code_block: {
      backgroundColor: colors.codeBackground,
      color: colors.codeText,
      fontSize: FontSize.caption,
      fontFamily: 'monospace',
      padding: Spacing.md,
      borderRadius: Radius.sm,
      marginVertical: 4,
    },
    link: {
      color: colors.primary,
      textDecorationLine: 'underline' as const,
    },
    list_item: {
      marginVertical: 2,
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    blockquote: {
      borderLeftColor: colors.textTertiary,
      borderLeftWidth: 3,
      paddingLeft: Spacing.md,
      marginVertical: 4,
      opacity: 0.8,
    },
    hr: {
      backgroundColor: colors.separator,
      height: 1,
      marginVertical: 8,
    },
  };
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  systemContainer: {
    paddingVertical: Spacing.xs,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: 768,
    alignSelf: 'center',
    width: '100%',
  },
  avatarContainer: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIcon: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
  },
  userContentContainer: {
    paddingLeft: 40,
  },
  messageText: {
    fontSize: FontSize.body,
    lineHeight: 24,
  },
  systemText: {
    fontSize: FontSize.footnote,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  streamingIndicator: {
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  toolCallContainer: {
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  toolCallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  toolCallIcon: {
    fontSize: 13,
  },
  toolCallName: {
    fontSize: FontSize.footnote,
    fontWeight: '500',
    flex: 1,
  },
  chevron: {
    fontSize: 12,
  },
  toolCallDetails: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  toolCallLabel: {
    fontSize: FontSize.caption,
    fontWeight: '600',
  },
  toolCallCode: {
    fontSize: FontSize.caption,
    fontFamily: 'monospace',
    borderRadius: 4,
    padding: Spacing.xs,
    overflow: 'hidden',
  },
  thoughtContainer: {
    paddingVertical: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  thoughtHeader: {
    fontSize: FontSize.footnote,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  thoughtContent: {
    fontSize: FontSize.footnote,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  reasoningContainer: {
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reasoningIcon: {
    fontSize: 14,
  },
  reasoningTitle: {
    fontSize: FontSize.footnote,
    fontWeight: '600',
    flex: 1,
  },
  reasoningContent: {
    fontSize: FontSize.footnote,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  reasoningPreview: {
    fontSize: FontSize.caption,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
    lineHeight: 18,
    opacity: 0.7,
  },
  // Attachment styles
  attachmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  inlineImage: {
    width: Math.min(screenWidth * 0.5, 240),
    height: Math.min(screenWidth * 0.5, 240),
    borderRadius: Radius.md,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: 4,
  },
  fileChipIcon: {
    fontSize: 16,
  },
  fileChipName: {
    fontSize: FontSize.caption,
    maxWidth: 150,
  },
  // Image modal
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalFull: {
    width: '100%',
    height: '80%',
  },
  imageModalClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Inline images in assistant responses
  assistantInlineImage: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
    marginVertical: Spacing.sm,
  },
  imageCaption: {
    fontSize: FontSize.caption,
    fontStyle: 'italic',
    marginTop: 2,
  },
  imageError: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    alignItems: 'center',
  },
  // Artifact styles
  artifactList: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  artifactCard: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  artifactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  artifactIcon: {
    fontSize: 16,
  },
  artifactTitle: {
    fontSize: FontSize.footnote,
    fontWeight: '600',
  },
  artifactLang: {
    fontSize: FontSize.caption,
    marginTop: 1,
  },
  artifactContent: {
    maxHeight: 300,
    padding: Spacing.sm,
  },
  artifactCode: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});
