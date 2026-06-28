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
      { text: 'Generative AI Tools', slug: 'gen-ai-tools' },
      { text: 'AI Chatbot Platforms', slug: 'ai-chatbot-platforms' },
      { text: 'Bookmark Managers', slug: 'bookmark-managers' },
      { text: 'Operating Systems', slug: 'operating-systems' },
    ],
  },
  {
    title: 'Articles',
    items: [
      { text: 'What Is Information?', slug: 'what-is-info' },
    ],
  },
];
