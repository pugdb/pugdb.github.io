# PugDB Website Content

This directory contains the introductory content for the PugDB website.

## About PugDB

**PugDB** (formerly F4KVS) is a privacy-first, Rust-native key-value store designed for high-performance applications. Built with modern Rust and optimized for speed, reliability, and data sovereignty.

## Website Pages

### Core Introduction Pages

1. **[What is PugDB?](what-is-pugdb.md)**
   - Introduction to PugDB
   - Key characteristics and features
   - Performance highlights
   - What PugDB is and isn't

2. **[Why PugDB?](why-pugdb.md)**
   - Performance advantages
   - Key differentiators
   - Target use cases
   - Problems PugDB solves

3. **[How PugDB Works](how-pugdb-works.md)**
   - Technical architecture
   - Layered architecture overview
   - Core components
   - How operations work
   - Architecture principles

## Content Guidelines

All content in this directory:

- Uses Markdown format suitable for static site generators (Jekyll, Hugo, Next.js, etc.)
- Includes frontmatter with title, description, and date
- Maintains technical accuracy based on actual project documentation
- Sets honest expectations about current capabilities
- Focuses on verified performance metrics

## Status Information

The content reflects the current state of PugDB:

- **Production Ready**: Core features (memory storage, basic operations)
- **Beta**: Multi-node clustering infrastructure (needs production validation)
- **Alpha**: LSM-Tree and File System storage engines
- **In Development**: Query language, cloud integration, enterprise features

## Note on Naming

PugDB is the new name for F4KVS. All references to F4KVS in documentation and code will gradually transition to PugDB. The website content uses "PugDB" as the primary name while acknowledging the F4KVS heritage where relevant.

## Related Documentation

For more detailed information:

- **Main README**: [../README.md](../README.md) - Project overview and quick start
- **Architecture**: [../docs/F4KVS_LAYERED_ARCHITECTURE.md](../docs/F4KVS_LAYERED_ARCHITECTURE.md) - Detailed architecture documentation
- **Feature Status**: [../docs/FEATURE_STATUS_MATRIX.md](../docs/FEATURE_STATUS_MATRIX.md) - Complete feature status
- **Positioning**: [../docs/marketing/HONEST_POSITIONING.md](../docs/marketing/HONEST_POSITIONING.md) - Honest positioning and marketing

