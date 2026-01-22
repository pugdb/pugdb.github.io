# PugDB Website

<div align="center">
  <img src="public/logos/pug-logo.jpg" alt="PugDB Mascot" width="200" />
  
  # PugDB
  
  **Blazing-fast modular key-value store that adapts to anything.**
  
  [🌐 Visit Website](https://pugdb.github.io) | [📚 Documentation](https://pugdb.github.io/docs) | [💻 GitHub](https://github.com/pugdb)
</div>

## TL;DR

**PugDB** (formerly F4KVS) is a **privacy-first, Rust-native key-value store** designed for high-performance applications. 

- ⚡ **5.8x faster than PostgreSQL, 3.5x faster than ScyllaDB** (verified YCSB benchmarks)
- 🦀 **Built in Rust** with async/await, memory safety, and modern patterns
- 🧩 **Modular architecture** with pluggable storage engines (Memory, LSM-Tree, Partitioned)
- ✅ **Production-ready core** with 5,454 tests passing and 63%+ code coverage
- 🔒 **Privacy-first design** with encryption support, audit logging, and offline-first capabilities
- 📊 **SQL query language** (beta) with window functions, JOINs, and transactions
- 📈 **Sub-millisecond latency**: P50 0.029-0.072ms, P99 0.076-0.272ms

Perfect for applications that need **blazing-fast performance**, **data sovereignty**, and **modular extensibility**.

## About

PugDB is a blazing-fast, modular key-value store built with Rust. It delivers exceptional performance with a modular architecture that adapts to your needs.

### Key Features

- ⚡ **Lightning Fast** - 5.8x faster than PostgreSQL, 3.5x faster than ScyllaDB
- 🔌 **Infinitely Extensible** - Modular architecture with pluggable storage engines
- 🧩 **Modular Design** - Choose the right components for your needs

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
