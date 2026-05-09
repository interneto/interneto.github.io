import type { BookmarkRecord, VizNode } from '../types/bookmarks';

function ensureChild(parent: VizNode, name: string): VizNode {
  if (!parent.children) {
    parent.children = [];
  }

  const existing = parent.children.find((child) => child.name === name && child.type === 'group');
  if (existing) {
    return existing;
  }

  const node: VizNode = {
    id: `${parent.id}/${name}`,
    name,
    type: 'group',
    children: []
  };

  parent.children.push(node);
  return node;
}

function addBookmark(parent: VizNode, record: BookmarkRecord): void {
  if (!parent.children) {
    parent.children = [];
  }

  parent.children.push({
    id: record.id,
    name: record.title,
    type: 'bookmark',
    record
  });
}

function collapseNode(node: VizNode, depth: number, maxDepth: number): VizNode {
  if (!node.children || node.children.length === 0) {
    return node;
  }

  if (depth >= maxDepth) {
    const leafCount = countLeafBookmarks(node);
    return {
      id: `${node.id}/aggregate`,
      name: `${leafCount} links`,
      type: 'group',
      count: leafCount
    };
  }

  return {
    ...node,
    children: node.children.map((child) => collapseNode(child, depth + 1, maxDepth))
  };
}

function countLeafBookmarks(node: VizNode): number {
  if (node.type === 'bookmark') {
    return 1;
  }

  if (!node.children || node.children.length === 0) {
    return node.count ?? 0;
  }

  return node.children.reduce((acc, child) => acc + countLeafBookmarks(child), 0);
}

export function buildTree(records: BookmarkRecord[], maxDepth: number): VizNode {
  const root: VizNode = {
    id: 'root',
    name: 'Directory Map',
    type: 'root',
    children: []
  };

  for (const record of records) {
    let cursor = root;

    const path = record.folderPath.length > 0 ? record.folderPath : ['Unfiled'];
    for (const segment of path) {
      cursor = ensureChild(cursor, segment || 'Untitled folder');
    }

    addBookmark(cursor, record);
  }

  return collapseNode(root, 0, maxDepth);
}
