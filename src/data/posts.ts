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
      { text: 'Bookmark Managers', slug: 'bookmark-managers' },
      { text: 'Linux Distributions', slug: 'linux-distros' },
    ],
  },
  {
    title: 'How-To',
    items: [
      { text: 'How To Categorize Links', slug: 'how-to-categorize-links' },
      { text: 'How Files Are Transferred', slug: 'file-sync' },
    ],
  },
  {
    title: 'Articles',
    items: [
      { text: 'History of Computing Timeline', slug: 'history-of-computing' },
      { text: 'Cybersecurity Vulnerabilities', slug: 'cybersecurity-vulnerabilities' },
      { text: 'Operating System Layer Stack', slug: 'os-layer-stack' },
      { text: 'Good Software Manifesto', slug: 'good-software-manifesto' },
      { text: 'What Is Information?', slug: 'what-is-info' },
    ],
  },
  {
    title: 'Philosophy',
    items: [
      { text: 'Turing-Complete: Discovery in Reality', slug: 'turing-complete-reality', icon: 'philosophy' },
    ],
  },
];
