/**
 * Zero-Config Demo with Real WASM
 * This replaces the simulated demo with real f4kvs execution
 */

class ZeroConfigWASMDemo {
    async run(terminal) {
        terminal.writeln('\x1b[36m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
        terminal.writeln('\x1b[36m║  Zero-Config Magic - Real PugDB WASM Execution           ║\x1b[0m');
        terminal.writeln('\x1b[36m╚═══════════════════════════════════════════════════════════╝\x1b[0m\n');
        
        terminal.writeln('\x1b[33mLoading real PugDB WASM module...\x1b[0m\n');
        
        // Try to load WASM
        if (!window.initWASM) {
            terminal.writeln('\x1b[33mWASM loader not available. Falling back to simulation mode.\x1b[0m\n');
            
            // Fallback to simulated demo
            if (window.zeroConfigDemo) {
                await window.zeroConfigDemo.run(terminal);
            }
            return;
        }
        
        try {
            terminal.writeln('  Loading WASM module...');
            const wasmModule = await window.initWASM();
            
            if (!wasmModule || !wasmModule.F4KVS) {
                throw new Error('WASM module failed to load or F4KVS class not found');
            }
            
            terminal.writeln('  \x1b[32m✓ WASM module loaded successfully!\x1b[0m');
            terminal.writeln('  \x1b[36mUsing real Rust-compiled WebAssembly\x1b[0m\n');
            await this.delay(500);
            
            // Create PugDB instance
            terminal.writeln('\x1b[32mStep 1: Creating PugDB instance with real WASM...\x1b[0m');
            await terminal.type('let db = new F4KVS();', 30);
            terminal.writeln('\n');
            
            const db = await window.createWASMInstance();
            if (!db) {
                throw new Error('Failed to create F4KVS instance');
            }
            
            terminal.writeln('  \x1b[32m✓ Database created with zero configuration!\x1b[0m');
                terminal.writeln('  \x1b[36mThis is REAL PugDB running in your browser via WASM!\x1b[0m\n');
            
            await this.delay(1000);
            
            // Test operations
            terminal.writeln('\x1b[32mStep 2: Testing real PugDB operations...\x1b[0m');
            await this.delay(500);
            
            terminal.writeln('  Storing data with real WASM...');
            db.put('test:1', 'Hello from WASM!');
            terminal.writeln('  \x1b[32m✓ Stored: test:1 = "Hello from WASM!"\x1b[0m');
            await this.delay(300);
            
            db.put('test:2', 'Real WASM execution!');
            terminal.writeln('  \x1b[32m✓ Stored: test:2 = "Real WASM execution!"\x1b[0m');
            await this.delay(500);
            
            terminal.writeln('\n  Retrieving data with real WASM...');
            const value1 = db.get('test:1');
            if (value1) {
                terminal.writeln(`  \x1b[36mtest:1\x1b[0m: \x1b[33m${value1}\x1b[0m`);
            }
            await this.delay(300);
            
            const value2 = db.get('test:2');
            if (value2) {
                terminal.writeln(`  \x1b[36mtest:2\x1b[0m: \x1b[33m${value2}\x1b[0m`);
            }
            await this.delay(500);
            
            terminal.writeln('\n\x1b[32m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
            terminal.writeln('\x1b[32m║  ✓ Real WASM Execution Complete!                         ║\x1b[0m');
            terminal.writeln('\x1b[32m╚═══════════════════════════════════════════════════════════╝\x1b[0m\n');
            
            terminal.writeln('\x1b[33mKey Achievement:\x1b[0m');
            terminal.writeln('  • Rust compiled to WebAssembly successfully');
            terminal.writeln('  • Running in your browser (no backend!)');
            terminal.writeln('  • Actual key-value operations, not simulation');
            terminal.writeln('  • This proves WASM feasibility!\n');
            terminal.writeln('\x1b[35mNote:\x1b[0m This is a minimal POC implementation.');
            terminal.writeln('      Full pugdb-core integration requires resolving Tokio/WASM compatibility.\n');
            
        } catch (error) {
            terminal.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
            terminal.writeln('\nFalling back to simulation mode...\n');
            
            // Fallback to simulated demo
            if (window.zeroConfigDemo) {
                await window.zeroConfigDemo.run(terminal);
            }
        }
        
        terminal.prompt();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

window.zeroConfigWASMDemo = new ZeroConfigWASMDemo();
