---
title: Linux Distributions Overview
description: A guide to the main Linux distros, their families, package managers, and how to choose one
date: 2026-05-06
next: true
prev: true
footer: true
---


## Overview

Linux is not a single operating system — it is a kernel around which thousands of distributions have been built. A **distribution** (or *distro*) bundles the Linux kernel with a package manager, init system, desktop environment, and default software to create a complete, usable OS.

Choosing a distro means choosing a philosophy: rolling releases or stable snapshots, binary packages or source compilation, curated defaults or complete freedom. Understanding the family tree helps navigate those choices, since most distros inherit tools, repositories, and conventions from a common ancestor.

---

## Distribution Families

The table below covers the distributions present in the family diagram above.

|     Family      | Distros                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |               Package Manager                |
|:---------------:|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:--------------------------------------------:|
|    **Arch**     | <a href="https://archlinux.org/" title="Arch Linux"><img src="/img/assets/linux-distros/arch-linux.svg" width="24" height="24" alt="Arch Linux" /></a> <a href="https://manjaro.org/" title="Manjaro"><img src="/img/assets/linux-distros/manjaro.svg" width="24" height="24" alt="Manjaro" /></a> <a href="https://garudalinux.org/" title="Garuda Linux"><img src="/img/assets/linux-distros/garuda-linux.svg" width="24" height="24" alt="Garuda Linux" /></a> <a href="https://endeavouros.com/" title="EndeavourOS"><img src="/img/assets/linux-distros/endeavour-os.svg" width="24" height="24" alt="EndeavourOS" /></a> <a href="https://cachyos.org/" title="CachyOS"><img src="/img/assets/linux-distros/cachy-os.svg" width="24" height="24" alt="CachyOS" /></a> <a href="https://artixlinux.org/" title="Artix Linux"><img src="/img/assets/linux-distros/artix.svg" width="24" height="24" alt="Artix Linux" /></a> |          `pacman` / `.pkg.tar.zst`           |
|   **Debian**    | <a href="https://www.debian.org/" title="Debian"><img src="/img/assets/linux-distros/debian.svg" width="24" height="24" alt="Debian" /></a> <a href="https://ubuntu.com/" title="Ubuntu"><img src="/img/assets/linux-distros/ubuntu.svg" width="24" height="24" alt="Ubuntu" /></a> <a href="https://zorin.com/os/" title="Zorin OS"><img src="/img/assets/linux-distros/zorin.svg" width="24" height="24" alt="Zorin OS" /></a> <a href="https://www.kali.org/" title="Kali Linux"><img src="/img/assets/linux-distros/kali-linux.svg" width="24" height="24" alt="Kali Linux" /></a> <a href="https://tails.net/" title="Tails"><img src="/img/assets/linux-distros/tails.svg" width="24" height="24" alt="Tails" /></a> <a href="https://www.qubes-os.org/" title="Qubes OS"><img src="/img/assets/linux-distros/qubes-os.svg" width="24" height="24" alt="Qubes OS" /></a>                                                   |                `apt` / `.deb`                |
|   **Fedora**    | <a href="https://fedoraproject.org/" title="Fedora"><img src="/img/assets/linux-distros/fedora.svg" width="24" height="24" alt="Fedora" /></a> <a href="https://rockylinux.org/" title="Rocky Linux"><img src="/img/assets/linux-distros/rocky-linux.svg" width="24" height="24" alt="Rocky Linux" /></a> <a href="https://almalinux.org/" title="AlmaLinux"><img src="/img/assets/linux-distros/alma-linux.svg" width="24" height="24" alt="AlmaLinux" /></a> <a href="https://nobaraproject.org/" title="Nobara"><img src="/img/assets/linux-distros/nobara.svg" width="24" height="24" alt="Nobara" /></a>                                                                                                                                                                                                                                                                                             |                `dnf` / `.rpm`                |
|    **SUSE**     | <a href="https://www.suse.com/" title="SUSE Linux Enterprise"><img src="/img/assets/linux-distros/arch-linux.svg" width="24" height="24" alt="SUSE Linux Enterprise" /></a> <a href="https://www.opensuse.org/" title="openSUSE"><img src="/img/assets/linux-distros/opensuse.svg" width="24" height="24" alt="openSUSE" /></a>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |              `zypper` / `.rpm`               |
|   **Gentoo**    | <a href="https://www.gentoo.org/" title="Gentoo"><img src="/img/assets/linux-distros/gentoo.svg" width="24" height="24" alt="Gentoo" /></a> <a href="https://chromeos.google/" title="ChromeOS"><img src="/img/assets/linux-distros/chrome-os.svg" width="24" height="24" alt="ChromeOS" /></a>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |             `emerge` / `EBUILD`              |
| **Independent** | <a href="https://www.alpinelinux.org/" title="Alpine Linux"><img src="/img/assets/linux-distros/alpine-linux.svg" width="24" height="24" alt="Alpine Linux" /></a> <a href="https://nixos.org/" title="NixOS"><img src="/img/assets/linux-distros/nixos.svg" width="24" height="24" alt="NixOS" /></a> <a href="https://getsol.us/" title="Solus"><img src="/img/assets/linux-distros/solus.svg" width="24" height="24" alt="Solus" /></a>  <a href="http://www.slackware.com/" title="Slackware"><img src="/img/assets/linux-distros/slackware.svg" width="24" height="24" alt="Slackware" /></a> <a href="https://voidlinux.org/" title="Void Linux"><img src="/img/assets/linux-distros/void-linux.svg" width="24" height="24" alt="Void Linux" /></a>                                                                                                                                                                  | `pkgtool` / `apk` / `nix` / `xbps` / `eopkg` |


### Debian

The oldest actively maintained major distro (1993). Renowned for rock-solid stability, the largest community-maintained package archive (~60,000 packages), and its strict free-software policy. Uses **APT** with `.deb` packages.

The Debian family is the most widely used base on servers, desktops, embedded systems, and live/security distros alike.

### Arch Linux

A rolling-release distro that ships the latest stable software the moment it is packaged. No installer GUI, no predefined desktop — users build exactly what they need. Uses **pacman** with `.pkg.tar.zst` packages and the **AUR** (Arch User Repository), the largest community software source on Linux.

Derivatives typically add graphical installers and curated defaults on top of the Arch base.

### Red Hat / Fedora

Red Hat (founded 1993) pioneered commercial Linux. **Fedora** is the upstream community release where new features land before they stabilise into **RHEL** (Red Hat Enterprise Linux). Both use **DNF** with `.rpm` packages. Rocky Linux and AlmaLinux are RHEL-compatible rebuilds maintained by the community after CentOS was discontinued.

### SUSE

Originating in Germany (1992), SUSE produces both **SUSE Linux Enterprise (SLE)** for enterprise workloads and the community **openSUSE** project. The flagship tool is **YaST**, a comprehensive system management suite. Package manager: **zypper** with `.rpm`.

### Gentoo

A source-based distro where every package is compiled locally from source using the **Portage** build system and **emerge** command. Extreme customisation and performance optimisation at the cost of build time. Derivatives like Redcore add binary caching to lower the barrier.

### Independent

Some distributions reject inheritance entirely and establish their own tooling:

- **Alpine Linux** — ultra-lightweight (~5 MB base), built on **musl libc** and **BusyBox** instead of the GNU toolchain. Favoured for container images and embedded systems due to its minimal attack surface. Package manager: **apk**.
- **NixOS** — declarative, reproducible system configuration via the **Nix** package manager. The entire OS is described in `.nix` files; rollback to any previous state is always possible.
- **Slackware** — the oldest surviving Linux distribution (1993, Patrick Volkerding). Deliberately minimal: no automatic dependency resolution, no complex tooling; uses **pkgtool** with `.tgz` packages.
- **Solus** — desktop-first independent distro, historically known for the **Budgie** desktop and the **eopkg** package manager.
- **Void Linux** — independent, rolling, using the **XBPS** package manager and the **runit** init system instead of systemd.

---

## Further Reading

- [DistroWatch](https://distrowatch.com/) — rankings, news, and reviews for hundreds of distributions
- [Linux Comparison (eylenburg)](https://eylenburg.github.io/linux_comparison.htm) — detailed feature comparison across hundreds of distros
- [Linux Journey](https://linuxjourney.com/) — free interactive guide to learning Linux from scratch

<style>
.vp-doc table td:nth-child(2) {
  white-space: nowrap;
}
.vp-doc table td:nth-child(2) a {
  margin: 0 4px;
}
</style>

