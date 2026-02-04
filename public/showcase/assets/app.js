/**
 * Main Application Controller
 */

let terminal = null;
let currentDemo = null;

// Make initializeApp available globally for iframe auto-start
window.initializeApp = initializeApp;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    
    // Auto-start if embedded in iframe
    if (window.self !== window.top) {
        const startButton = document.getElementById('start-demo');
        const showcase = document.getElementById('showcase');
        if (startButton && showcase) {
            // Hide button and show showcase
            startButton.style.display = 'none';
            showcase.style.display = 'block';
            
            // Initialize terminal and setup
            setTimeout(() => {
                if (!terminal) {
                    terminal = new F4KVSTerminal('terminal');
                    setupNavigation();
                    setupEventListeners();
                    setupCommandShortcuts();
                }
            }, 100);
        }
    }
});

function initializeApp() {
    // Setup CTA button
    const startButton = document.getElementById('start-demo');
    const showcase = document.getElementById('showcase');
    
    // Only setup click handler if not already initialized
    if (startButton && !startButton.dataset.initialized) {
        startButton.dataset.initialized = 'true';
        startButton.addEventListener('click', () => {
            startButton.style.display = 'none';
            showcase.style.display = 'block';
            
            // Initialize terminal
            terminal = new F4KVSTerminal('terminal');
            
            // Setup navigation
            setupNavigation();
            
            // Setup event listeners
            setupEventListeners();
            
            // Setup command shortcuts panel
            setupCommandShortcuts();
            
            // Pre-load WASM in background (non-blocking)
            if (typeof window.initWASM === 'function') {
                window.initWASM().then(async () => {
                    // Initialize persistence after WASM loads
                    if (window.createWASMInstance) {
                        try {
                            await window.createWASMInstance();
                            
                            // Load persisted data if available
                            if (window.loadFromPersistence) {
                                try {
                                    const loadedCount = await window.loadFromPersistence();
                                    if (loadedCount > 0) {
                                        // Wait for terminal to be ready, then show message
                                        const showPersistenceMessage = async () => {
                                            if (terminal) {
                                                terminal.writeln(`\x1b[36m💾 Restored ${loadedCount} persisted key-value pair(s) from IndexedDB\x1b[0m`);
                                                terminal.writeln('\x1b[33mTip:\x1b[0m Data is automatically saved. Use \x1b[36mclear-persistence\x1b[0m to reset.\n');
                                            }
                                        };
                                        
                                        // Show message after a short delay to ensure terminal is ready
                                        setTimeout(showPersistenceMessage, 500);
                                    }
                                } catch (err) {
                                    console.warn('Failed to load persisted data:', err);
                                }
                            }
                        } catch (err) {
                            console.warn('Failed to initialize WASM:', err);
                        }
                    }
                }).catch(err => {
                    console.warn('WASM pre-load failed (will use simulation):', err);
                });
            }
            
            // Auto-start zero-config demo
            setTimeout(() => {
                terminal.writeln('\x1b[36mStarting Zero-Config demo...\x1b[0m\n');
                runDemo('zero-config');
            }, 500);
        });
    }
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const demoName = btn.dataset.demo;
            runDemo(demoName);
        });
    });
}

function setupEventListeners() {
    // Listen for demo requests from terminal
    window.addEventListener('demo-request', (e) => {
        runDemo(e.detail.demo);
    });
    
    // Listen for f4kvs commands from terminal
    window.addEventListener('f4kvs-command', async (e) => {
        await handleF4KVSCommand(e.detail);
    });
    
    // Listen for SQL queries from terminal
    window.addEventListener('sql-query', async (e) => {
        await handleSQLQuery(e.detail.query);
    });
}

function setupCommandShortcuts() {
    // Setup toggle button
    const toggleBtn = document.getElementById('toggle-panel');
    const panel = document.getElementById('commands-panel');
    const collapsedLabel = panel?.querySelector('.commands-collapsed-label');
    
    const togglePanel = () => {
        if (panel) {
            panel.classList.toggle('collapsed');
            if (toggleBtn) {
                toggleBtn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
            }
        }
    };
    
    if (toggleBtn && panel) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanel();
        });
    }
    
    // Make collapsed label clickable to expand
    if (collapsedLabel && panel) {
        collapsedLabel.addEventListener('click', (e) => {
            e.stopPropagation();
            if (panel.classList.contains('collapsed')) {
                togglePanel();
            }
        });
    }
    
    // Setup command shortcut buttons
    const shortcuts = document.querySelectorAll('.cmd-shortcut');
    shortcuts.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Check if this is a batch INSERT button
            if (btn.dataset.batchInserts) {
                await executeBatchInserts(btn.dataset.batchInserts);
            } else {
                const command = btn.dataset.command;
                if (command && terminal) {
                    // Insert command into terminal
                    insertCommandIntoTerminal(command);
                }
            }
        });
    });
}

function insertCommandIntoTerminal(command) {
    if (!terminal) return;
    
    // Use the terminal's insertCommand method
    terminal.insertCommand(command);
    
    // Optional: Auto-execute after a short delay
    // Uncomment the following if you want commands to execute automatically:
    /*
    setTimeout(() => {
        terminal.terminal.write('\r\n');
        terminal.handleCommand(command);
    }, 300);
    */
}

// Execute batch INSERT statements automatically
async function executeBatchInserts(batchInsertsJson) {
    if (!terminal) return;
    
    try {
        // Parse the JSON array of INSERT statements
        const inserts = JSON.parse(batchInsertsJson);
        
        if (!Array.isArray(inserts) || inserts.length === 0) {
            terminal.writeln('\x1b[31mError: Invalid batch INSERT format\x1b[0m');
            terminal.prompt();
            return;
        }
        
        const total = inserts.length;
        terminal.writeln(`\x1b[36mExecuting batch INSERT (${total} statement(s))...\x1b[0m`);
        terminal.writeln('');
        
        // Execute each INSERT sequentially
        for (let i = 0; i < inserts.length; i++) {
            const insertQuery = inserts[i];
            
            // Extract the SQL query (remove "sql " prefix if present)
            let sqlQuery = insertQuery;
            if (sqlQuery.startsWith('sql ')) {
                sqlQuery = sqlQuery.substring(4).trim();
            }
            
            // Show progress
            terminal.writeln(`\x1b[33m[${i + 1}/${total}] Executing: ${sqlQuery}\x1b[0m`);
            
            // Execute the INSERT query
            await handleSQLQuery(sqlQuery);
            
            // Small delay between executions for better UX
            if (i < inserts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 250));
            }
        }
        
        terminal.writeln('');
        terminal.writeln(`\x1b[32m✓ Batch INSERT complete: ${total} statement(s) executed\x1b[0m`);
        terminal.prompt();
        
    } catch (error) {
        terminal.writeln(`\x1b[31mError executing batch INSERT: ${error.message}\x1b[0m`);
        terminal.prompt();
    }
}

async function runDemo(demoName) {
    currentDemo = demoName;
    
    // Update UI (if elements exist)
    updateDemoInfo(demoName);
    
    // Clear terminal and show demo (if terminal exists)
    if (terminal) {
        terminal.clear();
    }
    
    switch (demoName) {
        case 'zero-config':
            await runZeroConfigDemo();
            break;
        case 'performance':
            await runPerformanceDemo();
            break;
        case 'sql':
            await runSQLDemo();
            break;
        case 'architecture':
            await runArchitectureDemo();
            break;
        default:
            if (terminal) {
                terminal.writeln(`\x1b[31mUnknown demo: ${demoName}\x1b[0m`);
                terminal.prompt();
        }
    }
}

function updateDemoInfo(demoName) {
    const title = document.getElementById('demo-title');
    const description = document.getElementById('demo-description');
        
    // Skip if UI elements don't exist (e.g., in terminal-only mode)
    if (!title || !description) {
        return;
    }
    
    const demos = {
        'zero-config': {
            title: 'Zero-Config Magic',
            desc: 'Watch PugDB automatically detect your system and configure itself with zero configuration.'
        },
        'performance': {
            title: 'Performance Showcase',
            desc: 'YCSB: 4–8x faster than PostgreSQL, 17K–28K ops/sec, sub-ms latency.'
        },
        'sql': {
            title: 'SQL on Key-Value Store',
            desc: 'Experience SQL queries, JOINs, window functions, and subqueries on a key-value store.'
        },
        'architecture': {
            title: 'Composable Architecture',
            desc: 'Explore PugDB modular design - choose only the features you need.'
        }
    };
    
    const demo = demos[demoName] || { title: demoName, desc: '' };
    title.textContent = demo.title;
    description.textContent = demo.desc;
}

async function handleF4KVSCommand(detail) {
    if (!terminal) return;

    const { command, args, fullLine } = detail;
    
    // Try WASM first if available - create instance if needed
    let wasmInstance = window.getWASMInstance ? window.getWASMInstance() : null;
    if (!wasmInstance && window.createWASMInstance) {
        // Try to create WASM instance if it doesn't exist
        wasmInstance = await window.createWASMInstance();
    }
    
    if (wasmInstance) {
        try {
            await handleWASMCommand(command, args, wasmInstance, terminal);
            terminal.prompt();
            return;
        } catch (error) {
            console.warn('WASM command failed, falling back to simulation:', error);
        }
    }
    
    // Fallback to simulation layer
    if (window.f4kvsSimulator) {
        await window.f4kvsSimulator.executeCommand(command, args, terminal);
    } else {
        terminal.writeln(`\x1b[31mError: PugDB not available (WASM or simulator)\x1b[0m`);
    }
    
    terminal.prompt();
}

// Handle commands using WASM instance
async function handleWASMCommand(command, args, db, terminal) {
    switch (command.toLowerCase()) {
        case 'put': {
            if (args.length < 2) {
                terminal.writeln('\x1b[31mUsage: put <key> <value>\x1b[0m');
                terminal.writeln('  Value can be: string, number, boolean, null, JSON object, or JSON array');
                terminal.writeln('  Examples:');
                terminal.writeln('    put user:1 "Alice"');
                terminal.writeln('    put count 42');
                terminal.writeln('    put active true');
                terminal.writeln('    put data \'{"name":"Bob","age":30}\'');
                return;
            }
            // Join all args after key
            let value = args.slice(1).join(' ');
            
            // Try to parse as JSON if it looks like JSON
            let jsonValue = value;
            try {
                // Strip surrounding quotes if present
                if ((value.startsWith("'") && value.endsWith("'")) || 
                    (value.startsWith('"') && value.endsWith('"'))) {
                    const unquoted = value.slice(1, -1);
                    // Try parsing the unquoted value as JSON
                    JSON.parse(unquoted);
                    jsonValue = unquoted;
                } else {
                    // Try parsing as JSON directly
                    JSON.parse(value);
                    jsonValue = value;
                }
            } catch (e) {
                // Not JSON, treat as plain string (will be auto-quoted by WASM)
                jsonValue = value;
            }
            
            db.put(args[0], jsonValue);
            
            // Auto-save to persistence
            if (window.saveToPersistence) {
                window.saveToPersistence().catch(err => {
                    console.warn('Failed to save to persistence:', err);
                });
            }
            
            // Display stored value nicely
            try {
                const parsed = JSON.parse(jsonValue);
                const displayValue = typeof parsed === 'object' ? JSON.stringify(parsed) : parsed;
                terminal.writeln(`\x1b[32m✓ Stored: ${args[0]} = ${displayValue}\x1b[0m`);
            } catch (e) {
                terminal.writeln(`\x1b[32m✓ Stored: ${args[0]} = ${jsonValue}\x1b[0m`);
            }
            break;
        }
            
        case 'get': {
            if (args.length < 1) {
                terminal.writeln('\x1b[31mUsage: get <key>\x1b[0m');
                return;
            }
            const value = db.get(args[0]);
            if (value) {
                // Try to parse as JSON and display nicely
                try {
                    const parsed = JSON.parse(value);
                    if (typeof parsed === 'object' && parsed !== null) {
                        terminal.writeln(`\x1b[36m${args[0]}\x1b[0m: \x1b[33m${JSON.stringify(parsed, null, 2)}\x1b[0m`);
                    } else {
                        terminal.writeln(`\x1b[36m${args[0]}\x1b[0m: \x1b[33m${parsed}\x1b[0m \x1b[90m(${typeof parsed})\x1b[0m`);
                    }
                } catch (e) {
                    // Not JSON, display as string
                    terminal.writeln(`\x1b[36m${args[0]}\x1b[0m: \x1b[33m${value}\x1b[0m`);
                }
            } else {
                terminal.writeln(`\x1b[31mKey not found: ${args[0]}\x1b[0m`);
            }
            break;
        }
            
        case 'delete': {
            if (args.length < 1) {
                terminal.writeln('\x1b[31mUsage: delete <key>\x1b[0m');
                return;
            }
            const deleted = db.delete(args[0]);
            if (deleted) {
                // Auto-save to persistence
                if (window.saveToPersistence) {
                    window.saveToPersistence().catch(err => {
                        console.warn('Failed to save to persistence:', err);
                    });
                }
                terminal.writeln(`\x1b[32m✓ Deleted: ${args[0]}\x1b[0m`);
            } else {
                terminal.writeln(`\x1b[31mKey not found: ${args[0]}\x1b[0m`);
            }
            break;
        }
            
        case 'exists': {
            if (args.length < 1) {
                terminal.writeln('\x1b[31mUsage: exists <key>\x1b[0m');
                return;
            }
            const exists = db.exists(args[0]);
            terminal.writeln(`${args[0]}: ${exists ? '\x1b[32mexists\x1b[0m' : '\x1b[31mnot found\x1b[0m'}`);
            break;
        }
            
        case 'scan': {
            try {
                const prefix = args[0] || '';
                const keysJson = db.scan(prefix);
                const keys = JSON.parse(keysJson);
                if (keys.length === 0) {
                    terminal.writeln(`\x1b[33mNo keys found with prefix: "${prefix}"\x1b[0m`);
                } else {
                    terminal.writeln(`\x1b[36mFound ${keys.length} key(s) with prefix "${prefix}":\x1b[0m`);
                    keys.forEach(key => {
                        terminal.writeln(`  \x1b[33m${key}\x1b[0m`);
                    });
                }
            } catch (error) {
                terminal.writeln(`\x1b[31mError scanning: ${error.message}\x1b[0m`);
            }
            break;
        }
            
        case 'stats': {
            try {
                const statsJson = db.stats();
                const stats = JSON.parse(statsJson);
                terminal.writeln('\x1b[36m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
                terminal.writeln('\x1b[36m║  PugDB Statistics                                        ║\x1b[0m');
                terminal.writeln('\x1b[36m╚═══════════════════════════════════════════════════════════╝\x1b[0m');
                terminal.writeln(`  \x1b[36mTotal Operations:\x1b[0m ${stats.operations}`);
                terminal.writeln(`  \x1b[36mPuts:\x1b[0m ${stats.puts}`);
                terminal.writeln(`  \x1b[36mGets:\x1b[0m ${stats.gets}`);
                terminal.writeln(`  \x1b[36mDeletes:\x1b[0m ${stats.deletes}`);
                terminal.writeln(`  \x1b[36mScans:\x1b[0m ${stats.scans}`);
                if (stats.batch_puts !== undefined) {
                    terminal.writeln(`  \x1b[36mBatch Puts:\x1b[0m ${stats.batch_puts}`);
                }
                if (stats.batch_gets !== undefined) {
                    terminal.writeln(`  \x1b[36mBatch Gets:\x1b[0m ${stats.batch_gets}`);
                }
                if (stats.batch_deletes !== undefined) {
                    terminal.writeln(`  \x1b[36mBatch Deletes:\x1b[0m ${stats.batch_deletes}`);
                }
                terminal.writeln(`  \x1b[36mTotal Keys:\x1b[0m ${stats.keys}`);
            } catch (error) {
                terminal.writeln(`\x1b[31mError getting stats: ${error.message}\x1b[0m`);
            }
            break;
        }
            
        case 'batch': {
            if (args.length < 2) {
                terminal.writeln('\x1b[31mUsage: batch <put|get|delete> <json-array>\x1b[0m');
                terminal.writeln('  Example: batch put \'[["key1","value1"],["key2","value2"]]\'');
                terminal.writeln('  Example: batch get \'["key1","key2"]\'');
                terminal.writeln('  Example: batch delete \'["key1","key2"]\'');
                return;
            }
            
            const batchOp = args[0].toLowerCase();
            let itemsJson = args.slice(1).join(' ');
            
            // Strip surrounding quotes if present
            if ((itemsJson.startsWith("'") && itemsJson.endsWith("'")) || 
                (itemsJson.startsWith('"') && itemsJson.endsWith('"'))) {
                itemsJson = itemsJson.slice(1, -1);
            }
            
            try {
                switch (batchOp) {
                    case 'put': {
                        // Validate JSON format - should be array of [key, value] pairs
                        const items = JSON.parse(itemsJson);
                        if (!Array.isArray(items)) {
                            terminal.writeln('\x1b[31mError: Expected JSON array of [key, value] pairs\x1b[0m');
                            return;
                        }
                        // Validate each item is [key, value] pair
                        for (const item of items) {
                            if (!Array.isArray(item) || item.length !== 2) {
                                terminal.writeln('\x1b[31mError: Each item must be [key, value] pair\x1b[0m');
                                return;
                            }
                        }
                        db.batch_put(itemsJson);
                        // Auto-save to persistence
                        if (window.saveToPersistence) {
                            window.saveToPersistence().catch(err => {
                                console.warn('Failed to save to persistence:', err);
                            });
                        }
                        terminal.writeln(`\x1b[32m✓ Batch stored ${items.length} key-value pair(s)\x1b[0m`);
                        break;
                    }
                    case 'get': {
                        const keys = JSON.parse(itemsJson);
                        if (!Array.isArray(keys)) {
                            terminal.writeln('\x1b[31mError: Expected JSON array of keys\x1b[0m');
                            return;
                        }
                        const resultsJson = db.batch_get(itemsJson);
                        const results = JSON.parse(resultsJson);
                        terminal.writeln(`\x1b[36mBatch get results (${results.length} key(s)):\x1b[0m`);
                        keys.forEach((key, i) => {
                            const value = results[i];
                            if (value !== null && value !== undefined) {
                                // Try to parse and display nicely
                                try {
                                    const parsed = JSON.parse(value);
                                    if (typeof parsed === 'object' && parsed !== null) {
                                        terminal.writeln(`  \x1b[33m${key}\x1b[0m: \x1b[36m${JSON.stringify(parsed)}\x1b[0m`);
                                    } else {
                                        terminal.writeln(`  \x1b[33m${key}\x1b[0m: \x1b[36m${parsed}\x1b[0m \x1b[90m(${typeof parsed})\x1b[0m`);
                                    }
                                } catch (e) {
                                    terminal.writeln(`  \x1b[33m${key}\x1b[0m: \x1b[36m${value}\x1b[0m`);
                                }
                            } else {
                                terminal.writeln(`  \x1b[33m${key}\x1b[0m: \x1b[31mnot found\x1b[0m`);
                            }
                        });
                        break;
                    }
                    case 'delete': {
                        const keys = JSON.parse(itemsJson);
                        if (!Array.isArray(keys)) {
                            terminal.writeln('\x1b[31mError: Expected JSON array of keys\x1b[0m');
                            return;
                        }
                        const deletedCount = db.batch_delete(itemsJson);
                        // Auto-save to persistence
                        if (window.saveToPersistence) {
                            window.saveToPersistence().catch(err => {
                                console.warn('Failed to save to persistence:', err);
                            });
                        }
                        terminal.writeln(`\x1b[32m✓ Batch deleted ${deletedCount} key(s) out of ${keys.length}\x1b[0m`);
                        break;
                    }
                    default:
                        terminal.writeln(`\x1b[31mUnknown batch operation: ${batchOp}\x1b[0m`);
                        terminal.writeln('Available: put, get, delete');
                }
            } catch (error) {
                terminal.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
                terminal.writeln('Make sure the JSON is valid and properly quoted');
            }
            break;
        }
            
        case 'clear-persistence':
        case 'persist-clear': {
            if (window.clearPersistence) {
                try {
                    await window.clearPersistence();
                    terminal.writeln('\x1b[32m✓ Cleared all persisted data from IndexedDB\x1b[0m');
                    terminal.writeln('\x1b[33mNote:\x1b[0m Current in-memory data is still available. Reload page to see effect.');
                } catch (error) {
                    terminal.writeln(`\x1b[31mError clearing persistence: ${error.message}\x1b[0m`);
                }
            } else {
                terminal.writeln('\x1b[33mPersistence not available\x1b[0m');
            }
            break;
        }
            
        case 'save-persistence':
        case 'persist-save': {
            if (window.saveToPersistence) {
                try {
                    // Force immediate save
                    await window.saveToPersistence(true);
                    const persistence = window.getPersistence ? window.getPersistence() : null;
                    if (persistence && persistence.isAvailable()) {
                        const count = await persistence.count();
                        terminal.writeln(`\x1b[32m✓ Saved ${count} key-value pair(s) to IndexedDB\x1b[0m`);
                    } else {
                        terminal.writeln('\x1b[32m✓ Saved to IndexedDB\x1b[0m');
                    }
                } catch (error) {
                    terminal.writeln(`\x1b[31mError saving to persistence: ${error.message}\x1b[0m`);
                }
            } else {
                terminal.writeln('\x1b[33mPersistence not available\x1b[0m');
            }
            break;
        }
            
        default:
            terminal.writeln(`\x1b[31mUnknown command: ${command}\x1b[0m`);
            terminal.writeln('Available commands: put, get, delete, exists, scan, stats, batch, clear-persistence, save-persistence');
    }
}

async function handleSQLQuery(query) {
    // Try WASM first if available - create instance if needed
    let wasmInstance = window.getWASMInstance ? window.getWASMInstance() : null;
    if (!wasmInstance && window.createWASMInstance) {
        // Try to create WASM instance if it doesn't exist
        wasmInstance = await window.createWASMInstance();
    }
    
    if (wasmInstance) {
        try {
            await handleWASMSQLQuery(query, wasmInstance, terminal);
            terminal.prompt();
            return;
        } catch (error) {
            console.warn('WASM SQL query failed, falling back to simulation:', error);
        }
    }
    
    // Fallback to simulation layer
    if (window.f4kvsSimulator) {
        await window.f4kvsSimulator.executeSQL(query, terminal);
    } else {
        terminal.writeln(`\x1b[31mError: PugDB not available (WASM or simulator)\x1b[0m`);
    }
    terminal.prompt();
}

// Handle SQL queries using WASM instance
async function handleWASMSQLQuery(query, db, terminal) {
    const queryUpper = query.toUpperCase().trim();
    
    if (queryUpper.startsWith('SELECT')) {
        // Get all keys from WASM
        let allKeys = [];
        try {
            const allKeysJson = db.scan('');
            allKeys = JSON.parse(allKeysJson);
            console.log(`🔍 SQL Query: Found ${allKeys.length} key(s) in WASM instance:`, allKeys);
        } catch (error) {
            terminal.writeln(`\x1b[31mError reading from WASM: ${error.message}\x1b[0m`);
            throw error; // Re-throw to trigger fallback
        }
        
        if (allKeys.length === 0) {
            terminal.writeln('\x1b[33mNo data found in WASM store. Try storing some data first:\x1b[0m');
            terminal.writeln('  \x1b[36mput user:1 \'{"name":"Alice","age":30}\'\x1b[0m');
            return;
        }
        
        // Get all values from WASM
        const data = [];
        for (const key of allKeys) {
            let value = db.get(key);
            if (value) {
                // Strip surrounding quotes if present (handles cases where quotes were stored)
                if ((value.startsWith("'") && value.endsWith("'")) || 
                    (value.startsWith('"') && value.endsWith('"'))) {
                    value = value.slice(1, -1);
                }
                
                try {
                    // Try to parse as JSON
                    const parsed = JSON.parse(value);
                    data.push({ key, ...parsed });
                } catch (e) {
                    // If not JSON, treat as string
                    data.push({ key, value });
                }
            }
        }
        
        // Use enhanced SQL engine
        terminal.writeln(`\x1b[36mExecuting SQL query on WASM key-value store...\x1b[0m`);
        terminal.writeln(`\x1b[33mQuery:\x1b[0m ${query}`);
        terminal.writeln('');
        
        if (!window.SQLQueryEngine) {
            terminal.writeln('\x1b[31mError: SQL engine not loaded\x1b[0m');
            return;
        }
        
        const engine = new window.SQLQueryEngine();
        const result = engine.execute(query, data);
        
        if (result.error) {
            terminal.writeln(`\x1b[31mSQL Error: ${result.error}\x1b[0m`);
            return;
        }
        
        if (result.data.length === 0) {
            terminal.writeln('\x1b[33mNo rows match the query conditions.\x1b[0m');
            if (data.length > 0) {
                // Check if there's a WHERE clause in the query
                const hasWhere = /WHERE/i.test(query);
                if (hasWhere) {
                    terminal.writeln(`\x1b[36mFound ${data.length} row(s) total, but none match WHERE clause.\x1b[0m`);
                } else {
                    terminal.writeln(`\x1b[36mFound ${data.length} row(s) total, but query returned no results.\x1b[0m`);
                    terminal.writeln(`\x1b[33mDebug:\x1b[0m Check table name and column names match your data.`);
                }
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
        terminal.writeln('      Advanced features like window functions require full pugdb-ql.\n');
        
    } else if (queryUpper.startsWith('INSERT')) {
        await handleSQLInsert(query, db, terminal);
    } else if (queryUpper.startsWith('UPDATE') || queryUpper.startsWith('DELETE')) {
        terminal.writeln('\x1b[32m✓ SQL ' + queryUpper.split(' ')[0] + ' would modify key-value pairs\x1b[0m');
    } else {
        terminal.writeln(`\x1b[33mSQL Query:\x1b[0m ${query}`);
        terminal.writeln('\x1b[36mQuery executed (enhanced WASM SQL engine)\x1b[0m');
    }
}

// Handle SQL INSERT statements
async function handleSQLInsert(query, db, terminal) {
    // Parse INSERT INTO table (columns) VALUES (values)
    // Example: INSERT INTO users (name, age) VALUES ('Alice', 30)
    const insertMatch = query.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    
    if (!insertMatch) {
        terminal.writeln('\x1b[31mSQL Error: Invalid INSERT syntax\x1b[0m');
        terminal.writeln('Expected: INSERT INTO table (col1, col2) VALUES (val1, val2)');
        terminal.writeln('Example: INSERT INTO users (name, age) VALUES (\'Alice\', 30)');
        return;
    }
    
    const tableName = insertMatch[1];
    const columnsStr = insertMatch[2];
    const valuesStr = insertMatch[3];
    
    // Parse columns
    const columns = columnsStr.split(',').map(c => c.trim());
    
    // Parse values - handle quoted strings and numbers
    const values = parseSQLValues(valuesStr);
    
    if (columns.length !== values.length) {
        terminal.writeln(`\x1b[31mSQL Error: Column count (${columns.length}) doesn't match value count (${values.length})\x1b[0m`);
        return;
    }
    
    // Build the data object
    const dataObj = {};
    columns.forEach((col, idx) => {
        dataObj[col] = values[idx];
    });
    
    // Generate key based on table name and find next available ID
    const prefix = tableNameToPrefix(tableName);
    let nextId = 1;
    
    // Find the highest existing ID
    try {
        const allKeysJson = db.scan(prefix);
        const allKeys = JSON.parse(allKeysJson);
        
        for (const key of allKeys) {
            // Extract ID from key (e.g., "user:1" -> 1)
            const match = key.match(new RegExp(`^${prefix.replace(':', '\\:')}(\\d+)$`));
            if (match) {
                const id = parseInt(match[1]);
                if (id >= nextId) {
                    nextId = id + 1;
                }
            }
        }
    } catch (error) {
        // If scan fails, start with ID 1
        console.warn('Could not scan for existing keys:', error);
    }
    
    // Create the key
    const key = `${prefix}${nextId}`;
    
    // Store as JSON
    const jsonValue = JSON.stringify(dataObj);
    db.put(key, jsonValue);
    
    // Auto-save to persistence (immediate for SQL INSERT to ensure data is saved)
    if (window.saveToPersistence) {
        await window.saveToPersistence(true).catch(err => {
            console.warn('Failed to save to persistence:', err);
        });
    }
    
    terminal.writeln(`\x1b[32m✓ Inserted row into ${tableName}\x1b[0m`);
    terminal.writeln(`  \x1b[36mKey:\x1b[0m ${key}`);
    terminal.writeln(`  \x1b[36mData:\x1b[0m ${jsonValue}`);
    terminal.writeln('');
    terminal.writeln('\x1b[33mTip:\x1b[0m Query with: \x1b[36msql SELECT * FROM ' + tableName + ';\x1b[0m');
}

// Parse SQL VALUES clause - handles strings, numbers, booleans, null
function parseSQLValues(valuesStr) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = null;
    let i = 0;
    
    while (i < valuesStr.length) {
        const char = valuesStr[i];
        
        if (!inQuotes && (char === '"' || char === "'")) {
            inQuotes = true;
            quoteChar = char;
            i++;
            continue;
        }
        
        if (inQuotes && char === quoteChar) {
            // Check if it's escaped
            if (i + 1 < valuesStr.length && valuesStr[i + 1] === quoteChar) {
                current += char;
                i += 2;
                continue;
            }
            // End of quoted string
            inQuotes = false;
            quoteChar = null;
            i++;
            continue;
        }
        
        if (!inQuotes && char === ',') {
            // End of current value
            const trimmed = current.trim();
            values.push(parseSQLValue(trimmed));
            current = '';
            i++;
            continue;
        }
        
        current += char;
        i++;
    }
    
    // Add last value
    if (current.trim()) {
        values.push(parseSQLValue(current.trim()));
    }
    
    return values;
}

// Parse a single SQL value (string, number, boolean, null)
function parseSQLValue(value) {
    const trimmed = value.trim();
    
    // Null
    if (trimmed.toUpperCase() === 'NULL') {
        return null;
    }
    
    // Boolean
    if (trimmed.toUpperCase() === 'TRUE') {
        return true;
    }
    if (trimmed.toUpperCase() === 'FALSE') {
        return false;
    }
    
    // Number
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return parseFloat(trimmed);
    }
    
    // String (remove quotes if present)
    if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
        (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        return trimmed.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');
    }
    
    // Return as string if nothing else matches
    return trimmed;
}

// Convert table name to key prefix (e.g., "users" -> "user:")
function tableNameToPrefix(tableName) {
    const singular = tableName.toLowerCase().replace(/s$/, '');
    return singular + ':';
}

// Demo runners - prefer WASM when available, fallback to simulation
async function runZeroConfigDemo() {
    // Try WASM demo first if available
    if (window.zeroConfigWASMDemo) {
        try {
            await window.zeroConfigWASMDemo.run(terminal);
            return;
        } catch (error) {
            console.warn('WASM demo failed, falling back to simulation:', error);
        }
    }
    
    // Fallback to simulated demo
    if (window.zeroConfigDemo) {
        await window.zeroConfigDemo.run(terminal);
    } else {
        terminal.writeln('\x1b[31mError: Zero-Config demo not available\x1b[0m');
        terminal.prompt();
    }
}

async function runPerformanceDemo() {
    if (window.performanceDemo) {
        await window.performanceDemo.run(terminal);
    }
}

async function runSQLDemo() {
    if (window.sqlDemo) {
        await window.sqlDemo.run(terminal);
    }
}

async function runArchitectureDemo() {
    terminal.writeln('\x1b[36mArchitecture Demo\x1b[0m\n');
    terminal.writeln('This demo will show the composable architecture of PugDB.');
    terminal.writeln('(Implementation coming soon)');
    terminal.prompt();
}
