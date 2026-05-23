// Convenience aggregator for os-compat scripts.
// Combines paths + DOM constants. WINDOWS_NON_WINGET comes from JSON at runtime.

import { OS_COMPAT_PATHS } from '../shared/paths';
import { OS_COMPAT_CONSTANTS } from '../shared/dom-constants';
import { getWindowsNonWinget } from '../shared/data-loader';

export const OS_COMPAT_CONFIG = {
    ...OS_COMPAT_PATHS,
    ...OS_COMPAT_CONSTANTS,
    get WINDOWS_NON_WINGET() {
        return getWindowsNonWinget();
    },
};
