---
title: "Alpha embed path is ready for memoirs & RAG"
description: "Tagged f4kvs-lsm v0.3.1 and f4kvs-ffi v0.2.2, owner GO for the embed path, and product-scale proof with post-restart integrity at 100k chunks."
pubDate: 2026-07-24
tags:
  - release
  - embed
  - reliability
---

PugDB (F4KVS) is built for teams that need a **modular, Rust-native key-value core** they can embed or self-host — with evidence that real workloads survive restarts, not only micro-benchmarks.

## What’s new

| Component | Release | Highlights |
|-----------|---------|------------|
| **Engine** | f4kvs-lsm v0.3.1 (superseded — current pin is **v0.3.6**) | Durable LSM + WAL hardening for long bulk ingest |
| **Embed API** | f4kvs-ffi v0.2.2 (superseded — current pin is **v0.2.5**) | C / Go bindings pinned to lsm v0.3.1 |
| **Decision** | Alpha embed **GO** (2026-07-23) | Approved for memoirs / RAG **preprod** dogfood |

The production **embed path** is `f4kvs-ffi` + `f4kvs-lsm`. The server monorepo continues to prove distributed ops in staging and lab scenarios.

## Reliability first

Before talking about charts, we care about gates you can re-run:

- **5,500+** automated tests on the server monorepo (nextest workspace)
- Docker **staging** smoke and join/leave
- **Soak** with post-restart anchors and zero health failures on the recorded full tier
- **QL** smoke gate (parser, CRUD, wire path)
- Multi-node **scenario** suite and **hostile** fault injection on the cluster path
- **Alpha embed GO** with pinned tags and a documented checklist

That is the story we want operators to trust: *your keys are still there after restart and after messy cluster faults in lab.*

## Product-shaped scale (100k RAG chunks)

We exercise a **RAG-shaped** flow — tens to hundreds of thousands of ~4 KB chunks, prefix catalog scans, point reads, and a mandatory **post-restart row count**.

On the **native engine** path (no language binding overhead), bulk one-shot ingest of **100 000** chunks lands around **~60k durable ops/s** on a developer workstation, with **prefix scan** of the full key set in a few milliseconds and **integrity OK** after reopen.

The embed harness (Go bindings) tracks the same integrity gate and similar bulk throughput — so what you measure in-process stays close to what Go services see through the FFI.

Explore the summary on [/bench](/bench).

## Who it’s for

- **Embedded** storage for self-hosted RAG and memoirs-style apps (C / Go via FFI)
- **Self-hosted** KV with modular engines and a serious test culture
- Teams that prefer **reproducible proof** over anonymous leaderboard screenshots

Get started from the tagged embed train as of this note: **f4kvs-ffi v0.2.2** + **f4kvs-lsm v0.3.1**. Current pins: see [embed train v0.2.5](/blog/embed-train-v025/).

— The PugDB team
