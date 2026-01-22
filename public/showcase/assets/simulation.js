/**
 * PugDB Simulation Layer
 * Mimics PugDB API with realistic responses for MVP validation
 */

class F4KVSSimulator {
    constructor() {
        this.data = new Map();
        this.stats = {
            operations: 0,
            puts: 0,
            gets: 0,
            deletes: 0,
            startTime: Date.now()
        };
    }

    async executeCommand(command, args, terminal) {
        const cmd = command.toLowerCase();
        
        switch (cmd) {
            case 'put':
                if (args.length < 2) {
                    terminal.writeln('\x1b[31mError: Usage: put <key> <value>\x1b[0m');
                    return;
                }
                await this.put(args[0], args.slice(1).join(' '), terminal);
                break;
            case 'get':
                if (args.length < 1) {
                    terminal.writeln('\x1b[31mError: Usage: get <key>\x1b[0m');
                    return;
                }
                await this.get(args[0], terminal);
                break;
            case 'delete':
                if (args.length < 1) {
                    terminal.writeln('\x1b[31mError: Usage: delete <key>\x1b[0m');
                    return;
                }
                await this.delete(args[0], terminal);
                break;
            case 'exists':
                if (args.length < 1) {
                    terminal.writeln('\x1b[31mError: Usage: exists <key>\x1b[0m');
                    return;
                }
                await this.exists(args[0], terminal);
                break;
            case 'scan':
                await this.scan(args[0] || '', terminal);
                break;
            case 'stats':
                await this.showStats(terminal);
                break;
            case 'clear':
                this.data.clear();
                terminal.writeln('\x1b[32m✓ All data cleared\x1b[0m');
                break;
            case 'sql':
                // SQL queries are handled separately via sql-query event
                terminal.writeln('\x1b[31mError: Use "sql <query>" format\x1b[0m');
                terminal.writeln('Example: \x1b[36msql SELECT * FROM users;\x1b[0m');
                break;
            default:
                terminal.writeln(`\x1b[31mUnknown command: ${command}\x1b[0m`);
                terminal.writeln('Type \x1b[36mhelp\x1b[0m for available commands');
        }
    }

    async executeSQL(query, terminal) {
        // Simulate SQL query execution
        await this.delay(0.8);
        
        this.stats.operations++;
        
        const queryUpper = query.toUpperCase().trim();
        
        // Use SQL engine if available (works with both WASM and simulation)
        if (queryUpper.startsWith('SELECT') && window.SQLQueryEngine) {
            // Check if we have data
            if (this.data.size === 0) {
                terminal.writeln('\x1b[33mNo data found. Try storing some data first:\x1b[0m');
                terminal.writeln('  \x1b[36mput user:1 \'{"name":"Alice","age":30,"dept":"Engineering"}\'\x1b[0m');
                return;
            }
            
            // Convert Map data to array format expected by SQL engine
            const data = [];
            for (const [key, value] of this.data.entries()) {
                try {
                    // Try to parse as JSON
                    const parsed = JSON.parse(value);
                    data.push({ key, ...parsed });
                } catch (e) {
                    // If not JSON, treat as string value
                    data.push({ key, value });
                }
            }
            
            // Execute query using SQL engine
            terminal.writeln(`\x1b[36mExecuting SQL query on key-value store...\x1b[0m`);
            terminal.writeln(`\x1b[33mQuery:\x1b[0m ${query}`);
            terminal.writeln('');
            
            const engine = new window.SQLQueryEngine();
            const result = engine.execute(query, data);
            
            if (result.error) {
                terminal.writeln(`\x1b[31mSQL Error: ${result.error}\x1b[0m`);
                return;
            }
            
            if (result.data.length === 0) {
                terminal.writeln('\x1b[33mNo rows match the query conditions.\x1b[0m');
                if (data.length > 0) {
                    terminal.writeln(`\x1b[36mFound ${data.length} row(s) total, but none match WHERE clause.\x1b[0m`);
                }
                return;
            }
            
            // Display results
            if (result.isAggregation) {
                // Check if it's a GROUP BY query (multiple rows) or single aggregation
                if (result.data.length > 1) {
                    // GROUP BY query - show as table
                    terminal.writeln(`\x1b[36mResults (${result.rowCount} group(s)):\x1b[0m`);
                    
                    const columns = result.columns.length > 0 ? result.columns : Object.keys(result.data[0] || {}).filter(k => k !== 'key');
                    
                    if (columns.length > 0) {
                        // Header
                        const header = columns.join(' | ');
                        terminal.writeln(`  ${header}`);
                        terminal.writeln(`  ${'-'.repeat(header.length)}`);
                        
                        // Rows
                        result.data.forEach(row => {
                            const values = columns.map(col => {
                                const val = row[col];
                                if (val === undefined || val === null) return '';
                                // Format numbers nicely
                                if (typeof val === 'number') {
                                    // Round to 2 decimal places for averages
                                    return val % 1 === 0 ? String(val) : val.toFixed(2);
                                }
                                return String(val);
                            });
                            terminal.writeln(`  ${values.join(' | ')}`);
                        });
                    } else {
                        // Fallback: show as key-value pairs
                        result.data.forEach((row, idx) => {
                            terminal.writeln(`  \x1b[33mGroup ${idx + 1}:\x1b[0m`);
                            Object.keys(row).forEach(key => {
                                if (key !== 'key') {
                                    terminal.writeln(`    ${key}: ${row[key]}`);
                                }
                            });
                        });
                    }
                } else {
                    // Single aggregation result
                    terminal.writeln(`\x1b[36mAggregation Result:\x1b[0m`);
                    result.columns.forEach(col => {
                        const val = result.data[0][col];
                        const displayVal = typeof val === 'number' && val % 1 !== 0 ? val.toFixed(2) : val;
                        terminal.writeln(`  \x1b[33m${col}\x1b[0m: \x1b[36m${displayVal}\x1b[0m`);
                    });
                }
            } else {
                terminal.writeln(`\x1b[36mResults (${result.rowCount} row(s)):\x1b[0m`);
                
                const columns = result.columns.length > 0 ? result.columns : Object.keys(result.data[0] || {}).filter(k => k !== 'key');
                
                if (columns.length > 0) {
                    // Header
                    const header = columns.join(' | ');
                    terminal.writeln(`  ${header}`);
                    terminal.writeln(`  ${'-'.repeat(header.length)}`);
                    
                    // Rows
                    result.data.forEach(row => {
                        const values = columns.map(col => {
                            const val = row[col];
                            return val !== undefined && val !== null ? String(val) : '';
                        });
                        terminal.writeln(`  ${values.join(' | ')}`);
                    });
                } else {
                    // No structured data, show key-value pairs
                    result.data.forEach(row => {
                        terminal.writeln(`  \x1b[33m${row.key}\x1b[0m: ${row.value || 'N/A'}`);
                    });
                }
            }
            
            terminal.writeln('');
            terminal.writeln('\x1b[35mNote:\x1b[0m Enhanced SQL engine with WHERE, ORDER BY, LIMIT, aggregations, and JOINs.');
            
        } else if (queryUpper.startsWith('INSERT')) {
            terminal.writeln('\x1b[32m✓ SQL INSERT would create key-value pairs\x1b[0m');
            terminal.writeln('\x1b[33mTip:\x1b[0m Use \x1b[36mput <key> <value>\x1b[0m for direct KVS operations');
        } else if (queryUpper.startsWith('UPDATE') || queryUpper.startsWith('DELETE')) {
            terminal.writeln('\x1b[32m✓ SQL ' + queryUpper.split(' ')[0] + ' would modify key-value pairs\x1b[0m');
        } else {
            terminal.writeln(`\x1b[33mSQL Query:\x1b[0m ${query}`);
            terminal.writeln('\x1b[36mQuery executed (simulated)\x1b[0m');
        }
    }

    async put(key, value, terminal) {
        // Simulate async operation with realistic delay
        await this.delay(0.5);
        
        this.data.set(key, value);
        this.stats.operations++;
        this.stats.puts++;
        
        terminal.writeln(`\x1b[32m✓ Stored: ${key} = ${value}\x1b[0m`);
    }

    async get(key, terminal) {
        await this.delay(0.3);
        
        this.stats.operations++;
        this.stats.gets++;
        
        const value = this.data.get(key);
        if (value !== undefined) {
            terminal.writeln(`\x1b[36m${key}\x1b[0m: \x1b[33m${value}\x1b[0m`);
        } else {
            terminal.writeln(`\x1b[31mKey not found: ${key}\x1b[0m`);
        }
    }

    async delete(key, terminal) {
        await this.delay(0.4);
        
        this.stats.operations++;
        this.stats.deletes++;
        
        if (this.data.delete(key)) {
            terminal.writeln(`\x1b[32m✓ Deleted: ${key}\x1b[0m`);
        } else {
            terminal.writeln(`\x1b[31mKey not found: ${key}\x1b[0m`);
        }
    }

    async exists(key, terminal) {
        await this.delay(0.2);
        
        this.stats.operations++;
        
        const exists = this.data.has(key);
        terminal.writeln(exists ? '\x1b[32mtrue\x1b[0m' : '\x1b[31mfalse\x1b[0m');
    }

    async scan(prefix, terminal) {
        await this.delay(0.5);
        
        this.stats.operations++;
        
        const matches = Array.from(this.data.keys())
            .filter(key => !prefix || key.startsWith(prefix));
        
        if (matches.length === 0) {
            terminal.writeln('\x1b[33mNo keys found\x1b[0m');
        } else {
            terminal.writeln(`\x1b[36mFound ${matches.length} key(s):\x1b[0m`);
            matches.forEach(key => {
                terminal.writeln(`  - ${key}`);
            });
        }
    }

    async showStats(terminal) {
        const uptime = ((Date.now() - this.stats.startTime) / 1000).toFixed(1);
        const opsPerSec = (this.stats.operations / uptime).toFixed(0);
        
        terminal.writeln('\x1b[36mPugDB Statistics:\x1b[0m');
        terminal.writeln(`  Operations: ${this.stats.operations}`);
        terminal.writeln(`  Puts: ${this.stats.puts}`);
        terminal.writeln(`  Gets: ${this.stats.gets}`);
        terminal.writeln(`  Deletes: ${this.stats.deletes}`);
        terminal.writeln(`  Keys: ${this.data.size}`);
        terminal.writeln(`  Uptime: ${uptime}s`);
        terminal.writeln(`  Ops/sec: ${opsPerSec}`);
    }

    // Simulate realistic async delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms * 10)); // Scale down for demo
    }

    // Get system resources (simulated)
    getSystemResources() {
        return {
            totalRam: navigator.deviceMemory ? navigator.deviceMemory * 1024 : 8192, // GB
            availableRam: navigator.deviceMemory ? navigator.deviceMemory * 1024 * 0.6 : 4915,
            cpuCores: navigator.hardwareConcurrency || 4,
            diskIops: 10000,
            diskReadSpeed: 500, // MB/s
            diskWriteSpeed: 200 // MB/s
        };
    }

    // Simulate auto-configuration
    autoConfigure() {
        const resources = this.getSystemResources();
        
        // Simple backend selection logic
        let backend = 'Memory';
        if (resources.totalRam < 4) {
            backend = 'Memory';
        } else if (resources.totalRam < 16) {
            backend = 'LSM';
        } else {
            backend = 'Partitioned';
        }
        
        return {
            backend,
            cacheSize: Math.floor(resources.availableRam * 0.2), // 20% of available RAM
            threadPoolSize: Math.min(resources.cpuCores, 8),
            batchSize: 500,
            walEnabled: backend !== 'Memory'
        };
    }
}

// Create global instance
window.f4kvsSimulator = new F4KVSSimulator();
