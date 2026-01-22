# PugDB WASM POC

Minimal WebAssembly Proof of Concept for PugDB showcase.

## Purpose

This POC validates that pugdb-core can be compiled to WASM and executed in the browser with minimal changes.

## Prerequisites

### macOS ARM (Apple Silicon) Setup

If you're using Homebrew-installed Rust, you need to switch to rustup for WASM support:

```bash
# Install rustup (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Set rustup as default (this will use rustup's Rust instead of Homebrew's)
rustup default stable

# Install wasm32-unknown-unknown target
rustup target add wasm32-unknown-unknown

# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

**Note**: After installing rustup, you may need to restart your terminal or run `source ~/.cargo/env` to use rustup's Rust instead of Homebrew's.

### Verify Setup

```bash
# Check which Rust is being used (should show rustup path)
which rustc

# Verify wasm32 target is installed
rustup target list --installed | grep wasm32-unknown-unknown
```

## Building

```bash
cd showcase/wasm-poc

# Use the build script (handles prerequisites automatically)
./build.sh

# Or manually:
wasm-pack build --target web --release
```

This will create a `pkg/` directory with:
- `f4kvs_wasm_poc.js` - JavaScript bindings (legacy filename, PugDB WASM)
- `f4kvs_wasm_poc_bg.wasm` - Compiled WASM binary (legacy filename)
- TypeScript definitions

## Testing

The POC will be integrated into the web showcase to replace one simulated demo with real WASM execution.

## Known Limitations (POC)

- Only core operations: new, put, get, delete, exists
- String values only (no other Value types)
- No batch operations
- No scan operations
- No SQL support
- May have Tokio dependency issues (to be validated)

## Next Steps

After POC validation:
- Fix any Tokio dependency issues
- Add more operations if feasible
- Replace simulation in one demo
- Measure performance and bundle size
- Proceed to full WASM implementation if successful
