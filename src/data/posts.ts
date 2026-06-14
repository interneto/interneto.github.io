export interface PostItem {
  text: string;
  slug: string;
  icon?: string;
}

export interface PostSection {
  title: string;
  items: PostItem[];
}

export const POST_SECTIONS: PostSection[] = [
  {
    title: 'Comparing',
    items: [
      { text: 'AI Coding Tools', slug: 'ai-coding-tools' },
      { text: 'AI Chatbot Platforms', slug: 'ai-chatbot-platforms' },
      { text: 'Bookmark Managers', slug: 'bookmark-managers' },
      { text: 'Linux Distributions', slug: 'linux-distros' },
    ],
  },
  {
    title: 'Articles',
    items: [
      { text: 'What Is Information?', slug: 'what-is-info' },
    ],
  },
];
