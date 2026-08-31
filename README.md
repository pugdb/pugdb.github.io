# PugDB Website

<div align="center">
  <img src="public/logos/pug-logo.jpg" alt="PugDB Mascot" width="200" />
  
  # PugDB
  
  **Blazing-fast modular key-value store that adapts to anything.**
  
  [🌐 Visit Website](https://pugdb.github.io) | [📚 Documentation](https://pugdb.github.io/docs) | [💻 GitHub](https://github.com/pugdb)
</div>

## TL;DR

**PugDB** (the public name of **F4KVS**) is a **Rust-native LSM** you can embed — built so a real corpus survives restarts.

- 🛡 **Crash-loop 50× SIGKILL, 0 loss** · soak 1.66M cache ops, 10/10 restart anchors (Aug 2026)
- 📦 **100k RAG-shaped chunks** held after reopen (meso, 100,050 / 100,050)
- 🔌 **Embed path**: f4kvs-ffi **v0.2.5** + f4kvs-lsm **v0.3.6** (C / Go). Cluster stays lab.
- 🦀 **Built in Rust** with async/await and a modular engine (Memory, LSM-Tree, Partitioned)
- ✅ **5,597** automated tests on the server monorepo (nextest)
- 📊 **SQL query language** (beta) with window functions and JOINs
- We do **not** pitch “faster than RocksDB”. YCSB tables live on [/bench](https://pugdb.github.io/bench).

## About

PugDB is a modular key-value store built with Rust. The public artefact is the **embed train** (LSM + FFI). The server is the soak/crash-loop harness.

### Key Features

- 🛡 **Survives restarts** — crash-loop and soak with post-restart anchors
- 🔌 **Embed in C/Go** — tagged FFI over the canonical LSM
- 🧩 **Modular engines** — memory, LSM-tree, partitioned

## 🚀 Project Structure

This is the official website for PugDB, built with [Astro](https://astro.build).

```text
/
├── public/          # Static assets (images, logos, showcase)
├── src/
│   ├── components/  # Astro components
│   ├── layouts/    # Page layouts
│   ├── pages/      # Route pages
│   ├── styles/     # Global styles
│   └── config/     # Site configuration
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

## 🚢 Deployment

This website is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

- **Live Site**: https://pugdb.github.io
- **Repository**: https://github.com/pugdb/pugdb.github.io

## 📚 Learn More

- [PugDB Website](https://pugdb.github.io)
- [Documentation](https://pugdb.github.io/docs)
- [GitHub Repository](https://github.com/pugdb)
- [Astro Documentation](https://docs.astro.build)
