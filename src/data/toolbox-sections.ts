// The toolbox's top-level categories/parent groups — installers and the web
// directory alike. Single source of truth for both /toolbox/ (which renders
// these as cards) and the homepage (which just counts them) so the count can
// never drift out of sync with the real card list.
const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

export interface ToolboxSection {
  title: string;
  description: string;
  href: string;
  icon: string;
  platform: string;
}

export const TOOLBOX_SECTIONS: ToolboxSection[] = [
  {
    title: 'OS Installer',
    description: 'Get and install desktop operating systems — Windows, macOS, Linux, and FreeBSD.',
    href: `${BASE}toolbox/os/`,
    icon: '💿',
    platform: 'os',
  },
  {
    title: 'Desktop Installer',
    description: 'Install desktop apps with command generation, filters, and favorites.',
    href: `${BASE}toolbox/desktop/`,
    icon: '🖥️',
    platform: 'desktop',
  },
  {
    title: 'Mobile Installer',
    description: 'Browse mobile packages for Android and iOS workflows.',
    href: `${BASE}toolbox/mobile/`,
    icon: '📱',
    platform: 'mobile',
  },
  {
    title: 'Library Installer',
    description: 'Search software libraries by ecosystem and export selections.',
    href: `${BASE}toolbox/lib/`,
    icon: '📚',
    platform: 'library',
  },
  {
    title: 'Agent Extensions',
    description: 'MCP servers, plugins, and skills that add functionality to Claude Code, Codex CLI, and other AI coding agents.',
    href: `${BASE}toolbox/agent-extensions/`,
    icon: '🤖',
    platform: 'extensions',
  },
  {
    title: 'Browser Extensions',
    description: 'Pick browser add-ons for Firefox and Chromium.',
    href: `${BASE}toolbox/browser/`,
    icon: '🧩',
    platform: 'extensions',
  },
  {
    title: 'VS Code Extensions',
    description: 'Curated editor extensions with import, export, and favorites.',
    href: `${BASE}toolbox/vscode/`,
    icon: '🛠️',
    platform: 'extensions',
  },
  {
    title: 'Web Directory',
    description: 'Every app in one place, tagged by which platforms it also reaches and whether it\'s FOSS. No installer needed — opening the link runs the web app in your browser.',
    href: `${BASE}toolbox/app-directory/`,
    icon: '🌐',
    platform: 'web',
  },
];
