# PugDB Interactive Showcase - MVP

This is the MVP (Phase 1) of the PugDB Interactive Showcase, featuring simulated demos for UX validation.

## Quick Start

### Option 1: Simple HTTP Server

```bash
cd showcase/web
python3 -m http.server 8000
# or
python -m SimpleHTTPServer 8000
```

Then open `http://localhost:8000` in your browser.

### Option 2: Node.js HTTP Server

```bash
cd showcase/web
npx http-server -p 8000
```

### Option 3: VS Code Live Server

If you have VS Code with the Live Server extension, simply right-click on `index.html` and select "Open with Live Server".

## Features

- **Interactive Terminal**: Full terminal emulator using xterm.js
- **Zero-Config Demo**: Shows automatic system detection and configuration
- **Performance Demo**: Simulated benchmarks with realistic numbers. Real server benchmarks (YCSB) show PugDB 4–8x faster than PostgreSQL with sub-millisecond P95; see repository docs for methodology.
- **SQL Demo**: Demonstrates SQL queries on key-value store
- **Simulated PugDB**: JavaScript simulation layer that mimics PugDB API

## Available Demos

1. **Zero-Config**: Run `demo zero-config` or click the "Zero-Config" button
2. **Performance**: Run `demo performance` or click the "Performance" button
3. **SQL**: Run `demo sql` or click the "SQL" button
4. **Architecture**: Run `demo architecture` or click the "Architecture" button

## PugDB Commands

You can also use PugDB commands directly in the terminal:

- `put <key> <value>` - Store a key-value pair
- `get <key>` - Retrieve a value
- `delete <key>` - Delete a key
- `exists <key>` - Check if key exists
- `scan <prefix>` - Scan keys with prefix
- `stats` - Show statistics
- `help` - Show help

## Next Steps

This is Phase 1 (MVP) with simulated demos. After UX validation:

- **Phase 2**: WASM POC - Replace simulation with real WASM execution
- **Phase 3**: Full implementation with API backend and CLI tool

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Notes

- All demos are currently simulated for MVP validation
- Real PugDB execution will be added in Phase 2 (WASM POC)
- Performance numbers are simulated but realistic
