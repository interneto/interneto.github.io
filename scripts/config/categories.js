/**
 * Category Configuration
 * Maps Raindrop.io folder structure to markdown files and UI metadata
 */

export const CATEGORY_CONFIG = [
  {
    folder: 'by-Company',
    displayName: 'By Company',
    file: 'by-company.md',
    description: 'Useful services organized by company',
    icon: '🏢'
  },
  {
    folder: 'OS',
    displayName: 'OS',
    file: 'os.md',
    description: 'Operating systems and tools',
    icon: '💻'
  },
  {
    folder: 'AI Tools & Services',
    displayName: 'AI Tools & Services',
    file: 'ai-tools-and-services.md',
    description: 'Artificial Intelligence tools and services',
    icon: '🤖'
  },
  {
    folder: 'Dev',
    displayName: 'Dev',
    file: 'dev.md',
    description: 'Development tools and resources',
    icon: '⚙️'
  },
  {
    folder: 'Education',
    displayName: 'Education',
    file: 'education.md',
    description: 'Educational resources and platforms',
    icon: '📚'
  },
  {
    folder: 'File Management',
    displayName: 'File Management',
    file: 'file-management.md',
    description: 'File storage and management solutions',
    icon: '📁'
  },
  {
    folder: 'Financial assets',
    displayName: 'Financial Assets',
    file: 'financial-assets.md',
    description: 'Financial and investment tools',
    icon: '💰'
  },
  {
    folder: 'Gaming',
    displayName: 'Gaming',
    file: 'gaming.md',
    description: 'Gaming platforms and services',
    icon: '🎮'
  },
  {
    folder: 'Health & Fitness',
    displayName: 'Health & Fitness',
    file: 'health-and-fitness.md',
    description: 'Health and fitness applications',
    icon: '💪'
  },
  {
    folder: 'Home & Family',
    displayName: 'Home & Family',
    file: 'home-and-family.md',
    description: 'Home automation and family services',
    icon: '🏠'
  },
  {
    folder: 'InterComm',
    displayName: 'Internet Communication',
    file: 'intercomm.md',
    description: 'Communication and collaboration tools',
    icon: '💬'
  },
  {
    folder: 'Multimedia',
    displayName: 'Multimedia',
    file: 'multimedia.md',
    description: 'Multimedia and content creation tools',
    icon: '🎬'
  },
  {
    folder: 'News Media',
    displayName: 'News Media',
    file: 'news-media.md',
    description: 'News and media platforms',
    icon: '📰'
  },
  {
    folder: 'Office & Productivity',
    displayName: 'Office & Productivity',
    file: 'office-and-productivity.md',
    description: 'Office and productivity applications',
    icon: '📊'
  },
  {
    folder: 'Online Services',
    displayName: 'Online Services',
    file: 'online-services.md',
    description: 'Online services and utilities',
    icon: '🌐'
  },
  {
    folder: 'Security & Privacy',
    displayName: 'Security & Privacy',
    file: 'security-and-privacy.md',
    description: 'Security and privacy tools',
    icon: '🔒'
  },
  {
    folder: 'Sys Admin',
    displayName: 'Sys Admin',
    file: 'sys-admin.md',
    description: 'System administration tools',
    icon: '🛠️'
  },
  {
    folder: 'Time',
    displayName: 'Time',
    file: 'time.md',
    description: 'Time management and scheduling tools',
    icon: '⏰'
  },
  {
    folder: 'Travel & Location',
    displayName: 'Travel & Location',
    file: 'travel-and-location.md',
    description: 'Travel and location services',
    icon: '✈️'
  },
  {
    folder: 'Utility',
    displayName: 'Utility',
    file: 'utility.md',
    description: 'Utility tools and applications',
    icon: '🔧'
  }
]

/**
 * Detailed UI descriptions for categories
 * Used in frontmatter when generating markdown files
 */
export const CATEGORY_DESCRIPTIONS = {
  'by-Company': 'Browse services grouped by parent company and ecosystem.',
  'OS': 'Tools, apps, and resources organized by operating system.',
  'AI Tools & Services': 'Practical AI tools, assistants, and services for daily workflows.',
  'Dev': 'Development tools, docs, hosting, and programming resources.',
  'Gaming': 'Games, emulation, launchers, and gaming utilities.',
  'Education': 'Courses, references, and learning platforms across topics.',
  'File Management': 'File tools for storage, sharing, transfer, and organization.',
  'Financial assets': 'Financial platforms, tracking tools, and money-related resources.',
  'Health & Fitness': 'Resources for workouts, wellness, and healthy habits.',
  'Home & Family': 'Everyday home, parenting, and family-focused resources.',
  'InterComm': 'Communication tools for messaging, calls, and collaboration.',
  'Multimedia': 'Audio, video, and creative media tools and sources.',
  'News Media': 'News sources, media outlets, and current-events platforms.',
  'Office & Productivity': 'Productivity suites, note-taking, planning, and office tools.',
  'Online Services': 'Useful web services and cloud-based utilities.',
  'Security & Privacy': 'Privacy-focused services, security tools, and safe practices.',
  'Sys Admin': 'Admin tooling for servers, networking, and infrastructure.',
  'Time': 'Scheduling, time tracking, and calendar-related tools.',
  'Travel & Location': 'Maps, transport, travel planning, and location services.',
  'Utility': 'General-purpose utilities and handy tools for quick tasks.'
}

export const PATHS = {
  OUTPUT_DIR: 'src/content/categories',
  INPUT_CSV_CANDIDATES: [
    'links/interneto-links.csv',
    'interneto-links.csv'
  ]
}
