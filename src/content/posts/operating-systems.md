---
title: Operating Systems Overview
description: A guide to the major operating systems — Linux, Windows, macOS, BSD, Android, iOS — their kernels, families, package managers, and how to choose
date: 2026-05-06
next: true
prev: true
footer: true
category: OS & Utilities
tags:
  - comparison
  - software
---


## Overview

An operating system sits between the hardware and your apps. Two things define one: the **kernel** (the core that talks to hardware) and the **userland** around it (package manager, init system, UI, and default software).

Most OSes are a single, vendor-controlled product. **Linux** is the exception — it's only a kernel, around which thousands of **distributions** bundle their own userland into complete systems. The mobile OSes aren't new kernels either: **Android** is built on Linux, and **iOS** shares the **Darwin** core with macOS.

| OS                                                                                                                                              | Kernel                    | Vendor / model              | Packaging (manager · format)                     | File system (default)  | Desktop (default)            | CPU architectures      | License                   | Primary domain              |
|:------------------------------------------------------------------------------------------------------------------------------------------------|:--------------------------|:----------------------------|:-------------------------------------------------|:-----------------------|:-----------------------------|:-----------------------|:--------------------------|:----------------------------|
| <img src="/img/assets/operating-systems/linux.svg" width="20" height="20" alt="" style="vertical-align:middle;margin-right:6px" />**Linux**     | Linux (monolithic)        | Community — many distros    | apt · dnf · pacman / `.deb` `.rpm` `.pkg`        | ext4 (Btrfs, XFS, ZFS) | GNOME / KDE (distro choice)  | x86-64, ARM, RISC-V, … | FOSS (GPL)                | Servers, desktop, embedded  |
| <img src="/img/assets/operating-systems/windows.svg" width="20" height="20" alt="" style="vertical-align:middle;margin-right:6px" />**Windows** | NT (hybrid)               | Microsoft (proprietary)     | winget · exe/MSI · Store / `.exe` `.msi` `.appx` | NTFS (ReFS)            | Windows shell (Explorer)     | x86-64, ARM64          | Proprietary               | Desktop, gaming, enterprise |
| <img src="/img/assets/operating-systems/macos.svg" width="20" height="20" alt="" style="vertical-align:middle;margin-right:6px" />**macOS**     | XNU / Darwin (Mach + BSD) | Apple (proprietary)         | Homebrew · App Store / `.app` `.dmg` `.pkg`      | APFS (HFS+)            | Aqua (Finder)                | ARM64 (Apple Silicon)  | Proprietary (Darwin open) | Desktop, creative           |
| <img src="/img/assets/operating-systems/freebsd.svg" width="20" height="20" alt="" style="vertical-align:middle;margin-right:6px" />**FreeBSD** | BSD (monolithic)          | Community (FreeBSD Project) | pkg · ports / `.pkg` (txz)                       | UFS, ZFS               | None default (X11 + DE opt.) | x86-64, ARM, RISC-V    | BSD (permissive)          | Servers, networking, NAS    |
| <img src="/img/assets/operating-systems/android.svg" width="20" height="20" alt="" style="vertical-align:middle;margin-right:6px" />**Android** | Linux                     | Google + OEMs (AOSP open)   | Play Store · APK / `.apk`                        | ext4 / F2FS            | Android UI (OEM skins)       | ARM64, x86             | Apache / FOSS core        | Mobile, embedded, TV        |
| <img src="/img/assets/operating-systems/ios.svg" width="20" height="20" alt="" style="vertical-align:middle;margin-right:6px" />**iOS**       | XNU / Darwin              | Apple (proprietary)         | App Store / `.ipa`                               | APFS                   | SpringBoard                  | ARM64 (Apple)          | Proprietary               | Mobile (iPhone/iPad)        |

> Kernels cluster into a few lineages: **Linux** (Linux, Android), **Darwin/BSD** (macOS, iOS, FreeBSD/OpenBSD/NetBSD), and **NT** (Windows). Much of what feels different between systems is the userland and ecosystem, not the kernel.

---

## <img src="/img/assets/operating-systems/linux.svg" width="28" height="28" alt="" style="vertical-align:middle;margin-right:8px" />Linux Distributions

A distribution bundles the Linux kernel with a package manager, init system, desktop environment, and default software. Choosing one means choosing a philosophy: rolling releases or stable snapshots, binary packages or source compilation, curated defaults or complete freedom. Most distros inherit tooling and repositories from a common ancestor — the family tree below.

|     Family      | Distros                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |         Packaging (manager · format)         |
|:---------------:|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:--------------------------------------------:|
|    **Arch**     | <a href="https://archlinux.org/" title="Arch Linux"><img src="/img/assets/operating-systems/arch-linux.svg" width="24" height="24" alt="Arch Linux" /></a> <a href="https://manjaro.org/" title="Manjaro"><img src="/img/assets/operating-systems/manjaro.svg" width="24" height="24" alt="Manjaro" /></a> <a href="https://garudalinux.org/" title="Garuda Linux"><img src="/img/assets/operating-systems/garuda-linux.svg" width="24" height="24" alt="Garuda Linux" /></a> <a href="https://endeavouros.com/" title="EndeavourOS"><img src="/img/assets/operating-systems/endeavour-os.svg" width="24" height="24" alt="EndeavourOS" /></a> <a href="https://cachyos.org/" title="CachyOS"><img src="/img/assets/operating-systems/cachy-os.svg" width="24" height="24" alt="CachyOS" /></a> <a href="https://artixlinux.org/" title="Artix Linux"><img src="/img/assets/operating-systems/artix.svg" width="24" height="24" alt="Artix Linux" /></a> |          `pacman` / `.pkg.tar.zst`           |
|   **Debian**    | <a href="https://www.debian.org/" title="Debian"><img src="/img/assets/operating-systems/debian.svg" width="24" height="24" alt="Debian" /></a> <a href="https://ubuntu.com/" title="Ubuntu"><img src="/img/assets/operating-systems/ubuntu.svg" width="24" height="24" alt="Ubuntu" /></a> <a href="https://zorin.com/os/" title="Zorin OS"><img src="/img/assets/operating-systems/zorin.svg" width="24" height="24" alt="Zorin OS" /></a> <a href="https://www.kali.org/" title="Kali Linux"><img src="/img/assets/operating-systems/kali-linux.svg" width="24" height="24" alt="Kali Linux" /></a> <a href="https://tails.net/" title="Tails"><img src="/img/assets/operating-systems/tails.svg" width="24" height="24" alt="Tails" /></a> <a href="https://www.qubes-os.org/" title="Qubes OS"><img src="/img/assets/operating-systems/qubes-os.svg" width="24" height="24" alt="Qubes OS" /></a>                                                   |                `apt` / `.deb`                |
|   **Fedora**    | <a href="https://fedoraproject.org/" title="Fedora"><img src="/img/assets/operating-systems/fedora.svg" width="24" height="24" alt="Fedora" /></a> <a href="https://rockylinux.org/" title="Rocky Linux"><img src="/img/assets/operating-systems/rocky-linux.svg" width="24" height="24" alt="Rocky Linux" /></a> <a href="https://almalinux.org/" title="AlmaLinux"><img src="/img/assets/operating-systems/alma-linux.svg" width="24" height="24" alt="AlmaLinux" /></a> <a href="https://nobaraproject.org/" title="Nobara"><img src="/img/assets/operating-systems/nobara.svg" width="24" height="24" alt="Nobara" /></a>                                                                                                                                                                                                                                                                                                                            |                `dnf` / `.rpm`                |
|    **SUSE**     | <a href="https://www.suse.com/" title="SUSE Linux Enterprise"><img src="/img/assets/operating-systems/suse.svg" width="24" height="24" alt="SUSE Linux Enterprise" /></a> <a href="https://www.opensuse.org/" title="openSUSE"><img src="/img/assets/operating-systems/opensuse.svg" width="24" height="24" alt="openSUSE" /></a>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |              `zypper` / `.rpm`               |
|   **Gentoo**    | <a href="https://www.gentoo.org/" title="Gentoo"><img src="/img/assets/operating-systems/gentoo.svg" width="24" height="24" alt="Gentoo" /></a> <a href="https://chromeos.google/" title="ChromeOS"><img src="/img/assets/operating-systems/chrome-os.svg" width="24" height="24" alt="ChromeOS" /></a>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |             `emerge` / `EBUILD`              |
| **Independent** | <a href="https://www.alpinelinux.org/" title="Alpine Linux"><img src="/img/assets/operating-systems/alpine-linux.svg" width="24" height="24" alt="Alpine Linux" /></a> <a href="https://nixos.org/" title="NixOS"><img src="/img/assets/operating-systems/nixos.svg" width="24" height="24" alt="NixOS" /></a> <a href="https://getsol.us/" title="Solus"><img src="/img/assets/operating-systems/solus.svg" width="24" height="24" alt="Solus" /></a>  <a href="http://www.slackware.com/" title="Slackware"><img src="/img/assets/operating-systems/slackware.svg" width="24" height="24" alt="Slackware" /></a> <a href="https://voidlinux.org/" title="Void Linux"><img src="/img/assets/operating-systems/void-linux.svg" width="24" height="24" alt="Void Linux" /></a>                                                                                                                                                                            | `pkgtool` / `apk` / `nix` / `xbps` / `eopkg` |

- **Debian** (1993) — rock-solid stability, the largest community package archive (~60,000), strict free-software policy. The most widely used base for servers and derivatives. **APT** / `.deb`.
- **Arch** — rolling release, latest software, no installer GUI or default desktop; you build exactly what you need. **pacman** / `.pkg.tar.zst` + the **AUR**, the largest community software source.
- **Red Hat / Fedora** — Fedora is the leading-edge upstream of **RHEL**; Rocky and AlmaLinux are community RHEL rebuilds. **DNF** / `.rpm`.
- **SUSE** — German enterprise (SLE) + community **openSUSE**; flagship **YaST** system management. **zypper** / `.rpm`.
- **Gentoo** — source-based, everything compiled via **Portage** / **emerge**; extreme customization at the cost of build time.
- **Independent** — reject inheritance: **Alpine** (musl + BusyBox, tiny, container-favourite, `apk`), **NixOS** (declarative, reproducible, rollbackable), **Slackware** (oldest, minimal, no auto-deps), **Solus** (desktop-first, `eopkg`), **Void** (rolling, `xbps`, `runit` instead of systemd).

For a deep distro-by-distro feature matrix, see the eylenburg comparisons under [Further Reading](#further-reading).

---

## <img src="/img/assets/operating-systems/windows.svg" width="28" height="28" alt="" style="vertical-align:middle;margin-right:8px" />Windows

Microsoft's **NT** kernel (hybrid design), the dominant desktop and gaming OS. Proprietary, tightly integrated with Office and the enterprise/Active Directory world. Software arrives as `.exe`/`.msi` installers, increasingly via **winget** (CLI) and the **Microsoft Store**. Editions range from Home/Pro to Server and the stripped-down **LTSC**. **WSL** runs a real Linux userland inside Windows.

## <img src="/img/assets/operating-systems/macos.svg" width="28" height="28" alt="" style="vertical-align:middle;margin-right:8px" />macOS

Apple's desktop OS, built on **XNU/Darwin** — a hybrid of the **Mach** microkernel and a **BSD** userland (so it's Unix-certified). Proprietary and tied to Apple hardware (Apple Silicon). Apps ship as `.app` bundles via drag-install, the **App Store**, or **Homebrew** for the command line. Shares its Darwin core with iOS.

## <img src="/img/assets/operating-systems/freebsd.svg" width="28" height="28" alt="" style="vertical-align:middle;margin-right:8px" />BSD

The other Unix lineage, permissively licensed (BSD), prized for coherence and networking. **FreeBSD** (servers, storage/NAS, the base of PlayStation and Netflix's CDN), **OpenBSD** (security-first, firewalls), **NetBSD** (portability), **DragonFly BSD**. Software via **ports** (source) and **pkg** (binary). macOS's userland and many tools descend from BSD.

## <img src="/img/assets/operating-systems/android.svg" width="28" height="28" alt="" style="vertical-align:middle;margin-right:4px" /><img src="/img/assets/operating-systems/ios.svg" width="28" height="28" alt="" style="vertical-align:middle;margin-right:8px" />Mobile: Android & iOS

- **Android** — a Linux kernel plus Google's **AOSP** userland. Open at the core, but most phones ship an OEM skin (One UI, etc.); custom **ROMs** like LineageOS or GrapheneOS replace it. Apps are **APK**s via the Play Store or sideloading. Also powers Wear OS, Android TV, and Android Automotive.
- **iOS** — Apple's mobile OS on the same **Darwin** core as macOS. Closed and curated: apps only through the **App Store** (IPA), strict sandboxing. Variants: iPadOS, watchOS, tvOS.

---

## Choosing

- **Desktop, just works** — Windows or macOS (macOS needs Apple hardware).
- **Desktop, control & FOSS** — a Linux distro: Debian/Ubuntu or Fedora to start, Arch for hands-on, NixOS for reproducibility.
- **Servers / infrastructure** — Debian, RHEL-family, or FreeBSD; Alpine for containers.
- **Mobile** — Android for openness and choice, iOS for a locked, polished ecosystem.

---

## Further Reading

**OS classification (eylenburg)** — the best concise comparison tables for sorting operating systems:

- [OS Comparison](https://eylenburg.github.io/os_comparison.htm) — Comparison of all major Operating Systems (Windows, macOS, Linux, Android, iOS, BSD, Illmus, Haiku, Risc OS, Amiga OS, etc.)
- [OS Family Tree](https://eylenburg.github.io/os_familytree.htm) — Genealogy of operating systems and their kernels
- [Linux Comparison](https://eylenburg.github.io/linux_comparison.htm) — Detailed feature matrix across hundreds of distros
- [Android Comparison](https://eylenburg.github.io/android_comparison.htm) — Android versions and custom ROMs
- [Desktop Environment Defaults](https://eylenburg.github.io/de_default.htm) — What each DE ships out of the box
- [Desktop Environment Comparison](https://eylenburg.github.io/de_comparison.htm) — GNOME, KDE, and the rest compared

**General**

- [DistroWatch](https://distrowatch.com/) — Rankings, news, and reviews for hundreds of distributions
- [Linux Journey](https://linuxjourney.com/) — Free interactive guide to learning Linux from scratch

<style>
.vp-doc table th {
  text-align: center;
}
.vp-doc table:nth-of-type(2) td:nth-child(2) {
  white-space: nowrap;
}
.vp-doc table:nth-of-type(2) td:nth-child(2) a {
  margin: 0 4px;
}
</style>
