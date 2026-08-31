---
title: "Embed train v0.2.5 — crash-loop, soak, pinned LSM"
description: "f4kvs-ffi v0.2.5 pins f4kvs-lsm v0.3.6. Crash-loop 50× SIGKILL with zero loss, two-hour soak with 10/10 restart anchors. Cluster stays lab."
pubDate: 2026-08-22
tags:
  - release
  - embed
  - reliability
---

PugDB is the public name of **F4KVS**: a Rust LSM you embed, not a cloud you rent. The production path is still **FFI + LSM**. The server monorepo is the reliability harness. The cluster is lab.

## Pins (2026-08-22)

| Component | Tag | Role |
|-----------|-----|------|
| **Engine** | f4kvs-lsm **v0.3.6** | Canonical LSM (hot-path merged: prefix scan, SST pin share, compacted SST reclaim) |
| **Embed API** | f4kvs-ffi **v0.2.5** | C ABI + Go wrappers, cursor pages, prefix scan, pin on lsm v0.3.6 |
| **Server** | f4kvs-v2 **v0.2.0** | Staging, soak, hostile suites — not a generic prod cluster GO |

Owner GO for **alpha embed** still stands (2026-07-23): memoirs / RAG preprod. **NO-GO** generic production cluster.

## Reliability, not charts

Re-run on 17–18 August after the LSM hot-path landed:

- **Crash-loop** — 50 rounds × 1,000 ops, killed with SIGKILL, **0 loss** (`soak-20260817T200639Z`).
- **Soak 1h + 1h** — 1,661,444 cache ops at 462/s, **10/10 anchors** after restart, 0 health failures (`soak-20260818T023658Z`).
- **Meso 100k** — 100,000 × 4 KB RAG-shaped chunks, **100,050 / 100,050** keys after reopen (July native engine run; integrity gate unchanged).
- Server 20k microbench @`f52790c`: put 9,070 / get 29,412 / mixed 37,594 ops/s, 0 errors.

We still publish a small YCSB A/B/D 10k table on [/bench](/bench), and a larger 432-cell matrix **by median** (some QL cells lose). We do **not** headline a 25× PostgreSQL average, and we do **not** say “faster than RocksDB”.

## What this is for

- **Embedded** storage under self-hosted RAG and memoirs-style apps (C / Go).
- Teams that want **reproducible gates** (crash-loop, soak, post-restart row count) more than a leaderboard screenshot.
- Not a claim that PugDB powers every Noematic product. Media Cataloger still defaults to Badger for dups/index; PugDB is opt-in there.

Explore the numbers on [/bench](/bench). Previous note: [alpha embed / meso 100k](/blog/alpha-embed-meso-100k/).

— The PugDB team
