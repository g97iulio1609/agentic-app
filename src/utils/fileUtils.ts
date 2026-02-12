/**
 * File utility functions — shared across components.
 */

/** Get emoji icon for a file's media type */
export function getFileIcon(mediaType: string): string {
  if (mediaType.startsWith('image/')) return '🖼️';
  if (mediaType === 'application/pdf') return '📄';
  if (mediaType.includes('spreadsheet') || mediaType.includes('excel') || mediaType === 'text/csv') return '📊';
  if (mediaType.includes('word') || mediaType.includes('document')) return '📝';
  if (mediaType === 'application/json') return '{ }';
  if (mediaType.startsWith('audio/')) return '🎵';
  if (mediaType.startsWith('video/')) return '🎬';
  if (mediaType.startsWith('text/')) return '📃';
  return '📎';
}

/** Format byte size to human-readable string */
export function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
