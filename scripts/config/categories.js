/**
 * Category Configuration
 *
 * Single source of truth for the 19 web categories.
 * Maps 1:1 to Raindrop.io folder structure.
 *
 * Canonical reference: docs/taxonomy.md
 */

export const CATEGORY_CONFIG = [
  {
    folder: 'AI Tools & Services',
    displayName: 'AI Tools & Services',
    file: 'ai-tools-and-services.md',
    description: 'Chatbots, GenAI, model platforms, and AI rankings',
    icon: '🤖'
  },
  {
    folder: 'Business & Commerce',
    displayName: 'Business & Commerce',
    file: 'business-and-commerce.md',
    description: 'Stores, marketplaces, product research, and resale',
    icon: '🏪'
  },
  {
    folder: 'Development',
    displayName: 'Development',
    file: 'development.md',
    description: 'Code editors, IDEs, hosting, frameworks, CMS, docs, and converters',
    icon: '💻'
  },
  {
    folder: 'Education & Reference',
    displayName: 'Education & Reference',
    file: 'education-and-reference.md',
    description: 'Courses, tutorials, dictionaries, encyclopedias, research papers, and note systems',
    icon: '📚'
  },
  {
    folder: 'File Management',
    displayName: 'File Management',
    file: 'file-management.md',
    description: 'File sharing, downloaders, torrents, and cloud storage',
    icon: '📁'
  },
  {
    folder: 'Gaming',
    displayName: 'Gaming',
    file: 'gaming.md',
    description: 'Games, launchers, emulators, and gaming utilities',
    icon: '🎮'
  },
  {
    folder: 'Health & Fitness',
    displayName: 'Health & Fitness',
    file: 'health-and-fitness.md',
    description: 'Workouts, wellness, and health tracking',
    icon: '💪'
  },
  {
    folder: 'Home & Family',
    displayName: 'Home & Family',
    file: 'home-and-family.md',
    description: 'Home automation, recipes, and family services',
    icon: '🏠'
  },
  {
    folder: 'Money & Finance',
    displayName: 'Money & Finance',
    file: 'money-and-finance.md',
    description: 'Banking, cryptocurrency, and financial tracking',
    icon: '💰'
  },
  {
    folder: 'Multimedia',
    displayName: 'Multimedia',
    file: 'multimedia.md',
    description: 'Audio & Music, Photos & Graphics, and Video & Movies',
    icon: '🎬'
  },
  {
    folder: 'News & Books',
    displayName: 'News & Books',
    file: 'news-and-books.md',
    description: 'News, blogs, digital gardens, libraries, and magazines',
    icon: '📰'
  },
  {
    folder: 'Office & Productivity',
    displayName: 'Office & Productivity',
    file: 'office-and-productivity.md',
    description: 'Note-taking, task management, bookmarking, calculators, translators, and time tracking',
    icon: '📊'
  },
  {
    folder: 'Online Services',
    displayName: 'Online Services',
    file: 'online-services.md',
    description: 'Search engines, web directories, software directories, corporations, and organizations',
    icon: '🌐'
  },
  {
    folder: 'OS & Utilities',
    displayName: 'OS & Utilities',
    file: 'os-and-utilities.md',
    description: 'Operating systems, OS components, WMs, system tools, hardware utilities, and CD/DVD tools',
    icon: '⚙️'
  },
  {
    folder: 'Security & Privacy',
    displayName: 'Security & Privacy',
    file: 'security-and-privacy.md',
    description: 'Password managers, cybersecurity, and web privacy',
    icon: '🔒'
  },
  {
    folder: 'Social & Communications',
    displayName: 'Social & Communications',
    file: 'social-and-communications.md',
    description: 'Email, messaging, forums, social networks, and video conferencing',
    icon: '💬'
  },
  {
    folder: 'System Administration',
    displayName: 'System Administration',
    file: 'system-administration.md',
    description: 'Servers, networking, terminals, virtualization, and remote desktop',
    icon: '🖥️'
  },
  {
    folder: 'Travel & Location',
    displayName: 'Travel & Location',
    file: 'travel-and-location.md',
    description: 'Maps, weather, travel agencies, and flights',
    icon: '✈️'
  },
  {
    folder: 'Web Browsers',
    displayName: 'Web Browsers',
    file: 'web-browsers.md',
    description: 'Browsers and browser-related tools',
    icon: '🌍'
  }
]

/**
 * Detailed UI descriptions for categories
 * Used in frontmatter when generating markdown files
 */
export const CATEGORY_DESCRIPTIONS = {
  'AI Tools & Services': 'Practical AI tools, assistants, and services for daily workflows.',
  'Business & Commerce': 'Online stores, marketplaces, product research, and resale platforms.',
  'Development': 'Development tools, docs, hosting, and programming resources.',
  'Education & Reference': 'Courses, references, and learning platforms across topics.',
  'File Management': 'File tools for storage, sharing, transfer, and organization.',
  'Gaming': 'Games, emulation, launchers, and gaming utilities.',
  'Health & Fitness': 'Resources for workouts, wellness, and healthy habits.',
  'Home & Family': 'Everyday home, parenting, and family-focused resources.',
  'Money & Finance': 'Financial platforms, banking, crypto, and money-related resources.',
  'Multimedia': 'Audio, photos, video, and creative media tools and sources.',
  'News & Books': 'News sources, blogs, digital gardens, libraries, and magazines.',
  'Office & Productivity': 'Productivity suites, note-taking, planning, and office tools.',
  'Online Services': 'Useful web services and cloud-based utilities.',
  'OS & Utilities': 'Operating systems, system tools, hardware utilities, and CD/DVD tools.',
  'Security & Privacy': 'Privacy-focused services, security tools, and safe practices.',
  'Social & Communications': 'Communication tools for messaging, calls, and collaboration.',
  'System Administration': 'Admin tooling for servers, networking, and infrastructure.',
  'Travel & Location': 'Maps, transport, travel planning, and location services.',
  'Web Browsers': 'Browsers and browser-related tools and extensions.'
}

export const PATHS = {
  OUTPUT_DIR: 'src/content/categories',
  INPUT_CSV_CANDIDATES: [
    'links/interneto-links.csv',
    'interneto-links.csv'
  ]
}
