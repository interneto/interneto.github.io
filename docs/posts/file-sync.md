---
title: How Files Are Transferred and Synced Between Devices
description: A practical breakdown of every major file transfer method — wired, wireless, cloud, and secure — and when to use each one.
date: 2026-06-01
next: true
prev: true
footer: true
---

<Post authors="David7ce"/>

Every time you plug in a USB drive, back up your phone, or push files to a remote server, you are using one of several distinct transfer methods — each with different speeds, range, and security trade-offs.

## Wired Transfers

The fastest and most private option. Data travels at the Physical and Data Link layers with no network stack involved. Speeds range from ~60 MB/s on USB 3.0 to over 3 GB/s on Thunderbolt 4. Phone sync tools add a protocol (MTP/AFC) on top of the same cable, while hardware security keys use USB solely for authentication.

## Cloud Sync

A background client watches a local folder, detects changes, and pushes only the delta over HTTPS. The provider holds the encryption keys at rest. **rclone** is the CLI alternative for scripted backups and cross-provider migrations; adding `rclone crypt` keeps the provider from seeing plaintext.

## Local Network Sync

Files move within a LAN using SMB, NFS, or WebDAV without touching the internet. **rsync** and **FreeFileSync** handle one-way sync efficiently; **Syncthing** provides continuous two-way sync with E2E encryption and no cloud dependency; **LocalSend** is for quick one-shot transfers with no account required.

## Secure Remote Transfer

**SSH** is the foundation for moving files to any server you control. **SCP/SFTP** cover one-shot copies and resumable uploads; GUI frontends (FileZilla, Cyberduck, WinSCP) make it accessible. **BorgBackup** adds deduplicated, client-side-encrypted incremental backups over the same SSH tunnel.

## Bluetooth

The OBEX profile tops out around 2–3 Mbit/s over ~10 m — enough for small files when no network is available.

## VPN Overlay

**Tailscale** builds a private WireGuard overlay network across all your devices. Once connected, any protocol (SMB, SFTP, rsync) runs at LAN-like speeds from anywhere in the world.

## Comparison Table

| Method                       | Tools                                                                         | Protocols                     |            OSI layers            | Speed             | Range  | Security    | Use case                  |
|------------------------------|-------------------------------------------------------------------------------|-------------------------------|:--------------------------------:|-------------------|--------|-------------|---------------------------|
| 🔌 Wired (USB / Thunderbolt) | File manager, `dd`                                                            | USB 3.x, Thunderbolt          |       Physical, Data Link        | 60 MB/s – 3+ GB/s | Cable  | High        | Fast bulk transfer        |
| 📱 Phone sync (wired)        | File manager, iTunes, Finder, `adb`                                           | MTP, AFC, ADB                 | Physical, Data Link, Application | 20–100 MB/s       | Cable  | High        | Phone backup & media sync |
| 🔑 Hardware security key     | YubiKey, Nitrokey                                                             | USB HID, CCID                 |       Physical, Data Link        | N/A (auth only)   | 1–2 m  | Very high   | 2FA, key storage          |
| ☁️ Cloud sync                 | Nextcloud, MEGAsync, Dropbox, OneDrive, rclone                                | HTTPS, S3, WebDAV, SFTP       | Network, Transport, Application  | Net-limited       | Global | Medium–high | Sync across devices       |
| 🏠 Local network sync        | File manager (network integration), FreeFileSync, rsync, Syncthing, LocalSend | SMB, NFS, rsync, BEP over TLS | Network, Transport, Application  | 12–100 MB/s       | LAN    | Medium–high | LAN share, private sync   |
| 🔒 Secure remote (SSH)       | `scp`, `sftp`, FileZilla, Cyberduck, WinSCP, BorgBackup                       | SSH (TCP 22)                  |      Transport, Application      | Net-limited       | Global | Very high   | Remote copy, backups      |
| ᚼᛒ Bluetooth                 | OS built-in                                                                   | Bluetooth OBEX                |       Physical, Data Link        | 0.5–3 Mbit/s      | ~10 m  | Medium      | Small files, offline      |
| 🌐 VPN overlay               | Tailscale                                                                     | WireGuard                     |            All layers            | LAN speeds        | Global | Very high   | Secure overlay LAN        |

## How to Choose

1. **Same desk** → USB wired transfer.
2. **Same network** → rsync, Syncthing, or LocalSend.
3. **Anywhere, private** → Syncthing, SFTP/Borg to your own server, or rclone with `crypt`.
4. **Cloud acceptable** → Dropbox, OneDrive, or Nextcloud desktop client.
5. **Need remote LAN** → Tailscale.
