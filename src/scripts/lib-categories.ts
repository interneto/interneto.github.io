export const BASE_LIB_CATEGORIES = [
    'Backend Framework',
    'HTTP Client',
    'ORM / Database',
    'Testing',
    'Logging',
    'Validation',
    'Auth / Security',
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
    'Backend Framework': 'server',
    'HTTP Client': 'globe',
    'ORM / Database': 'database',
    'Testing': 'flask-conical',
    'Logging': 'scroll-text',
    'Validation': 'shield-check',
    'Auth / Security': 'lock-keyhole',
    'UI Framework': 'layout-panel-left',
    'Meta-Framework': 'layers',
    'State Management': 'git-branch',
    'Data Fetching': 'refresh-cw',
    'Styling': 'palette',
    'UI Components': 'component',
    'Build Tools': 'wrench',
};
