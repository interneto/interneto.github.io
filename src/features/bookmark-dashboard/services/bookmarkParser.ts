import type { BookmarkRecord, RawBookmarkNode } from '../types/bookmarks';

interface ParsedTags {
  tags: string[];
  categories: string[];
  isFavorite: boolean;
}

function parseTags(rawTags?: string): ParsedTags {
  if (!rawTags) {
    return { tags: [], categories: [], isFavorite: false };
  }

  const parts = rawTags
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const tags: string[] = [];
  const categories = new Set<string>();
  let isFavorite = false;

  for (const part of parts) {
    tags.push(part);
    if (part.includes('❤') || part.includes('❤️')) {
      isFavorite = true;
    }

    if (part.includes(':')) {
      const [left, right] = part.split(':').map((value) => value.trim());
      if (left) {
        categories.add(left);
      }
      if (right) {
        categories.add(`${left}/${right}`);
      }
    }
  }

  return {
    tags,
    categories: Array.from(categories),
    isFavorite
  };
}

function safeTitle(node: RawBookmarkNode): string {
  return node.title?.trim() || '(untitled)';
}

function safeFolderName(node: RawBookmarkNode): string {
  return node.title?.trim() || '';
}

function parseUri(uri: string): { uri: string; host: string; scheme: string } | null {
  try {
    const url = new URL(uri);
    return {
      uri,
      host: url.hostname,
      scheme: url.protocol.replace(':', '')
    };
  } catch {
    return null;
  }
}

function bookmarkId(currentPath: string[], title: string, uri: string): string {
  return `${currentPath.join('/') || 'root'}::${title}::${uri}`;
}

export function flattenBookmarks(root: RawBookmarkNode): BookmarkRecord[] {
  const records: BookmarkRecord[] = [];
  const currentPath: string[] = [];

  function walk(node: RawBookmarkNode): void {
    if (node.type === 'text/x-moz-place-container') {
      const folderName = safeFolderName(node);
      if (folderName) {
        currentPath.push(folderName);
      }

      for (const child of node.children ?? []) {
        walk(child);
      }

      if (folderName) {
        currentPath.pop();
      }

      return;
    }

    if (node.type !== 'text/x-moz-place' || !node.uri) {
      return;
    }

    const parsedUri = parseUri(node.uri);
    if (!parsedUri) {
      return;
    }

    const parsedTags = parseTags(node.tags);
    const title = safeTitle(node);

    records.push({
      id: bookmarkId(currentPath, title, parsedUri.uri),
      title,
      uri: parsedUri.uri,
      host: parsedUri.host,
      scheme: parsedUri.scheme,
      tags: parsedTags.tags,
      tagCategories: parsedTags.categories,
      isFavorite: parsedTags.isFavorite,
      folderPath: [...currentPath]
    });
  }

  walk(root);
  return records;
}
