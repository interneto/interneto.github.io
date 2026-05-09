export interface RawBookmarkNode {
  title?: string;
  type?: string;
  uri?: string;
  tags?: string;
  children?: RawBookmarkNode[];
}

export interface BookmarkRecord {
  id: string;
  title: string;
  uri: string;
  host: string;
  scheme: string;
  tags: string[];
  tagCategories: string[];
  isFavorite: boolean;
  folderPath: string[];
}

export type VizNodeType = 'root' | 'group' | 'bookmark';

export interface VizNode {
  id: string;
  name: string;
  type: VizNodeType;
  children?: VizNode[];
  record?: BookmarkRecord;
  count?: number;
}
