// preinstall guard: this repo is installed from native Windows (or CI's Ubuntu), never WSL.
// A WSL install records the store as /mnt/d/... and the next Windows `pnpm` run then
// wants to purge node_modules and fails without a TTY (and vice versa).
import os from 'node:os'

if (process.platform === 'linux' && /microsoft|wsl/i.test(os.release())) {
  console.error('❌ Do not install from WSL: run pnpm from Windows (PowerShell). See CLAUDE.md -> Commands.')
  process.exit(1)
}
