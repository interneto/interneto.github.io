export interface Package {
  name: string;
  description?: string;
  icon?: string;
  foss?: boolean;
  windows_winget?: string;
  macos_brew?: string;
  linux_arch_pacman?: string;
  linux_debian_apt?: string;
  linux_fedora_rpm?: string;
  linux_gentoo_emerge?: string;
  linux_flatpak?: string;
  linux_snap?: string;
  unix_nix_env?: string;
  freebsd_pkg?: string;
  android_pkg?: string;
  ios_pkg?: string;
  [key: string]: string | boolean | undefined;
}

export interface PackageCategory {
  category: string;
  packages: Package[];
}

export interface ThemeConfig {
  STORAGE_KEY: string;
  DARK: string;
  LIGHT: string;
  BUTTON_ID: string;
  EMOJIS: { DARK: string; LIGHT: string };
  ARIA_LABELS: { DARK: string; LIGHT: string };
  TITLES: { DARK: string; LIGHT: string };
}

export type OS = 'windows' | 'macos' | 'linux' | 'freebsd' | 'android' | 'ios';
