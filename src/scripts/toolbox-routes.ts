function withBase(base: string, segment: string): string {
  const normalizedBase = base.replace(/\/?$/, '/');
  return `${normalizedBase}${segment}`;
}

export function isToolboxRoute(pathname: string, base: string): boolean {
  return (
    pathname.startsWith(withBase(base, 'toolbox')) ||
    pathname.startsWith(withBase(base, 'toolbox-installer'))
  );
}
