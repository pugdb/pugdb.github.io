/**
 * Terminal Emulator for PugDB Showcase
 * Uses xterm.js for terminal functionality
 */

class F4KVSTerminal {
    constructor(containerId) {
        this.terminal = new Terminal({
            theme: {
                background: '#1e293b',
                foreground: '#f1f5f9',
                cursor: '#10b981',
                selection: '#334155',
                black: '#0f172a',
                red: '#ef4444',
                green: '#10b981',
                yellow: '#f59e0b',
                blue: '#3b82f6',
                magenta: '#8b5cf6',
                cyan: '#06b6d4',
                white: '#f1f5f9',
                brightBlack: '#475569',
                brightRed: '#f87171',
                brightGreen: '#34d399',
                brightYellow: '#fbbf24',
                brightBlue: '#60a5fa',
                brightMagenta: '#a78bfa',
                brightCyan: '#22d3ee',
                brightWhite: '#ffffff'
            },
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            cursorBlink: true,
            cursorStyle: 'block',
            lineHeight: 1.2,
            letterSpacing: 0.5
        });

        // Use FitAddon if available, otherwise skip
        if (window.FitAddon) {
            this.fitAddon = new window.FitAddon.FitAddon();
        } else {
            // Fallback if FitAddon not loaded
            this.fitAddon = null;
            console.warn('FitAddon not available, terminal resize disabled');
        }
        if (this.fitAddon) {
            this.terminal.loadAddon(this.fitAddon);
        }
        
        this.terminal.open(document.getElementById(containerId));
        if (this.fitAddon) {
            this.fitAddon.fit();
        }
        
        this.currentLine = '';
        this.cursorPosition = 0; // Cursor position within currentLine
        this.history = [];
        this.historyIndex = -1;
        this.currentDemo = null;
        this.isProcessingPaste = false; // Flag to prevent double-processing paste
        
        this.setupEventHandlers();
        this.printWelcome();
    }

    setupEventHandlers() {
        // Handle paste events using browser paste event
        const terminalElement = this.terminal.element;
        terminalElement.addEventListener('paste', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            // Get pasted text from clipboard
            const pastedText = (event.clipboardData || window.clipboardData).getData('text');
            
            if (pastedText) {
                // Set flag to prevent onData from processing these characters
                this.isProcessingPaste = true;
                
                // Process the entire pasted text at once
                this.processPaste(pastedText);
                
                // Reset flag after a short delay to allow paste processing to complete
                setTimeout(() => {
                    this.isProcessingPaste = false;
                }, 100);
            }
        });

        this.terminal.onData((data) => {
            // Skip processing if we're handling a paste event
            if (this.isProcessingPaste) {
                return;
            }
            
            if (data === '\r') {
                // Enter pressed - add newline before executing command
                this.terminal.writeln(''); // Add carriage return/newline
                this.handleCommand(this.currentLine);
                this.currentLine = '';
                this.cursorPosition = 0;
                this.historyIndex = -1;
            } else if (data === '\x7f') {
                // Backspace - delete character before cursor
                if (this.cursorPosition > 0) {
                    this.currentLine = this.currentLine.slice(0, this.cursorPosition - 1) + 
                                     this.currentLine.slice(this.cursorPosition);
                    this.cursorPosition--;
                    this.refreshLine();
                }
            } else if (data === '\x1b[D') {
                // Left arrow - move cursor left
                if (this.cursorPosition > 0) {
                    this.cursorPosition--;
                    this.terminal.write('\x1b[D'); // Move cursor left
                }
            } else if (data === '\x1b[C') {
                // Right arrow - move cursor right
                if (this.cursorPosition < this.currentLine.length) {
                    this.cursorPosition++;
                    this.terminal.write('\x1b[C'); // Move cursor right
                }
            } else if (data === '\x1b[A') {
                // Up arrow - history
                if (this.history.length > 0 && this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.currentLine = this.history[this.history.length - 1 - this.historyIndex];
                    this.cursorPosition = this.currentLine.length;
                    this.refreshLine();
                }
            } else if (data === '\x1b[B') {
                // Down arrow - history
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    if (this.historyIndex >= 0) {
                        this.currentLine = this.history[this.history.length - 1 - this.historyIndex];
                    } else {
                        this.currentLine = '';
                    }
                    this.cursorPosition = this.currentLine.length;
                    this.refreshLine();
                }
            } else if (data === '\x1b[3~') {
                // Delete key - delete character at cursor
                if (this.cursorPosition < this.currentLine.length) {
                    this.currentLine = this.currentLine.slice(0, this.cursorPosition) + 
                                     this.currentLine.slice(this.cursorPosition + 1);
                    this.refreshLine();
                }
            } else if (data === '\x1b[H' || data === '\x1b[1~') {
                // Home key - move cursor to beginning
                this.cursorPosition = 0;
                this.refreshLine();
            } else if (data === '\x1b[F' || data === '\x1b[4~') {
                // End key - move cursor to end
                this.cursorPosition = this.currentLine.length;
                this.refreshLine();
            } else if (data >= ' ') {
                // Printable character - insert at cursor position
                this.currentLine = this.currentLine.slice(0, this.cursorPosition) + 
                                 data + 
                                 this.currentLine.slice(this.cursorPosition);
                this.cursorPosition++;
                this.refreshLine();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.fitAddon) {
                this.fitAddon.fit();
            }
        });
    }

    /**
     * Process pasted text - insert all at once and position cursor at end
     */
    processPaste(pastedText) {
        // Remove newlines and carriage returns from pasted text
        const cleaned = pastedText.replace(/[\r\n]/g, '');
        
        if (cleaned.length === 0) {
            return;
        }

        // Insert all pasted characters at current cursor position
        this.currentLine = this.currentLine.slice(0, this.cursorPosition) + 
                          cleaned + 
                          this.currentLine.slice(this.cursorPosition);
        
        // Move cursor to end of pasted text
        this.cursorPosition += cleaned.length;
        
        // Refresh the line display
        this.refreshLine();
    }
    
    /**
     * Refresh the current line display with cursor at correct position
     */
    refreshLine() {
        // Move to beginning of line, clear it, rewrite prompt and line
        const prompt = '\x1b[32m$\x1b[0m ';
        const fullLine = prompt + this.currentLine;
        
        // Move cursor to start of line, clear to end, write new content
        this.terminal.write('\r\x1b[K' + fullLine);
        
        // Move cursor to correct position (after prompt + cursorPosition)
        if (this.cursorPosition < this.currentLine.length) {
            const moveBack = this.currentLine.length - this.cursorPosition;
            this.terminal.write(`\x1b[${moveBack}D`);
        }
    }

    printWelcome() {
        // Box is 55 characters wide (53 content + 2 borders)
        const title = 'PugDB Interactive Terminal Emulator';
        const titleLength = title.length; // 37 chars
        const contentWidth = 53; // Box width minus borders
        const padding = Math.floor((contentWidth - titleLength) / 2);
        const leftPad = ' '.repeat(padding);
        const rightPad = ' '.repeat(contentWidth - titleLength - padding);
        
        this.terminal.writeln('\x1b[32m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
        this.terminal.writeln(`\x1b[32m║\x1b[0m${leftPad}\x1b[1;36m${title}\x1b[0m${rightPad}      \x1b[32m║\x1b[0m`);
        this.terminal.writeln('\x1b[32m╚═══════════════════════════════════════════════════════════╝\x1b[0m');
        this.terminal.writeln('');
        this.terminal.writeln('\x1b[33mWelcome to PugDB!\x1b[0m');
        this.terminal.writeln('');
        this.terminal.writeln('Type \x1b[36mhelp\x1b[0m to see available commands.');
        this.terminal.writeln('Type \x1b[36mdemo <name>\x1b[0m to run a demo (zero-config, performance, sql).');
        this.terminal.writeln('Type \x1b[36msql <query>\x1b[0m to execute SQL queries on the key-value store.');
        this.terminal.writeln('');
        this.prompt();
    }

    prompt() {
        this.currentLine = '';
        this.cursorPosition = 0;
        this.terminal.write('\x1b[32m$\x1b[0m ');
    }

    async handleCommand(line) {
        const trimmed = line.trim();
        if (!trimmed) {
            this.prompt();
            return;
        }

        this.history.push(trimmed);
        if (this.history.length > 50) {
            this.history.shift();
        }

        const [cmd, ...args] = trimmed.split(' ');

        switch (cmd.toLowerCase()) {
            case 'help':
                this.showHelp();
                break;
            case 'demo':
                await this.runDemo(args[0]);
                break;
            case 'clear':
            case 'cls':
                this.terminal.clear();
                this.printWelcome();
                break;
            default:
                // Try to execute as f4kvs command
                await this.executeF4KVSCommand(trimmed);
        }
    }

    showHelp() {
        // Write help in sections to avoid formatting issues
        const title = 'PugDB Terminal - Help';
        const titleLength = title.length; // 20 chars
        const contentWidth = 53; // Box width minus borders
        const padding = Math.floor((contentWidth - titleLength) / 2);
        const leftPad = ' '.repeat(padding);
        const rightPad = ' '.repeat(contentWidth - titleLength - padding);
        
        this.terminal.writeln('');
        this.terminal.writeln('\x1b[36m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
        this.terminal.writeln(`\x1b[36m║\x1b[0m${leftPad}\x1b[1;36m${title}\x1b[0m${rightPad}\x1b[36m║\x1b[0m`);
        this.terminal.writeln('\x1b[36m╚═══════════════════════════════════════════════════════════╝\x1b[0m');
        this.terminal.writeln('');
        
        // Demo Commands
        this.terminal.writeln('\x1b[33mDemo Commands:\x1b[0m');
        this.terminal.writeln('  \x1b[36mdemo <name>\x1b[0m          Run an interactive demo');
        this.terminal.writeln('                      Available: zero-config, performance, sql, architecture');
        this.terminal.writeln('  \x1b[36mhelp\x1b[0m                 Show this help message');
        this.terminal.writeln('  \x1b[36mclear\x1b[0m                Clear the terminal');
        this.terminal.writeln('');
        
        // Key-Value Store Commands
        this.terminal.writeln('\x1b[33mKey-Value Store Commands:\x1b[0m');
        this.terminal.writeln('  \x1b[36mput <key> <value>\x1b[0m    Store a key-value pair');
        this.terminal.writeln('  \x1b[36mget <key>\x1b[0m            Retrieve a value by key');
        this.terminal.writeln('  \x1b[36mdelete <key>\x1b[0m         Delete a key');
        this.terminal.writeln('  \x1b[36mexists <key>\x1b[0m         Check if a key exists');
        this.terminal.writeln('  \x1b[36mscan <prefix>\x1b[0m        Scan keys with prefix');
        this.terminal.writeln('  \x1b[36mstats\x1b[0m                Show database statistics');
        this.terminal.writeln('  \x1b[36mclear-persistence\x1b[0m    Clear all persisted data from IndexedDB');
        this.terminal.writeln('  \x1b[36msave-persistence\x1b[0m      Manually save current data to IndexedDB');
        this.terminal.writeln('');
        this.terminal.writeln('  \x1b[33mBatch Operations:\x1b[0m');
        this.terminal.writeln('    \x1b[36mbatch put <json>\x1b[0m   Store multiple key-value pairs');
        this.terminal.writeln('                      Example: batch put \'[["key1","val1"],["key2","val2"]]\'');
        this.terminal.writeln('    \x1b[36mbatch get <json>\x1b[0m   Retrieve multiple values');
        this.terminal.writeln('                      Example: batch get \'["key1","key2"]\'');
        this.terminal.writeln('    \x1b[36mbatch delete <json>\x1b[0m Delete multiple keys');
        this.terminal.writeln('                      Example: batch delete \'["key1","key2"]\'');
        this.terminal.writeln('');
        
        // SQL Query Language
        this.terminal.writeln('\x1b[33mSQL Query Language (QL):\x1b[0m');
        this.terminal.writeln('  \x1b[36msql <query>\x1b[0m          Execute a SQL query on the key-value store');
        this.terminal.writeln('');
        this.terminal.writeln('  \x1b[35mHow SQL works with KVS:\x1b[0m');
        this.terminal.writeln('    PugDB stores data as key-value pairs, but you can query it using SQL!');
        this.terminal.writeln('    The QL (Query Language) automatically interprets your key-value data');
        this.terminal.writeln('    as tables and allows you to use standard SQL operations.');
        this.terminal.writeln('');
        this.terminal.writeln('  \x1b[35mExamples:\x1b[0m');
        this.terminal.writeln('    \x1b[36msql INSERT INTO users (name, age) VALUES (\'Alice\', 30);\x1b[0m');
        this.terminal.writeln('    \x1b[36msql SELECT * FROM users WHERE age > 30;\x1b[0m');
        this.terminal.writeln('    \x1b[36msql SELECT dept, COUNT(*) FROM users GROUP BY dept;\x1b[0m');
        this.terminal.writeln('    \x1b[36msql SELECT u.name, d.name FROM users u JOIN groups d ON u.g = d.g;\x1b[0m');
        this.terminal.writeln('');
        this.terminal.writeln('  \x1b[35mSupported SQL Features:\x1b[0m');
        this.terminal.writeln('    • SELECT, INSERT, UPDATE, DELETE');
        this.terminal.writeln('    • JOINs (INNER, LEFT, RIGHT, FULL OUTER, CROSS)');
        this.terminal.writeln('    • Aggregations (COUNT, SUM, AVG, MIN, MAX)');
        this.terminal.writeln('    • Window functions (ROW_NUMBER, RANK, LAG, LEAD)');
        this.terminal.writeln('    • Subqueries (scalar, EXISTS, IN, correlated)');
        this.terminal.writeln('');
        this.terminal.writeln('  \x1b[33mTip:\x1b[0m Run \x1b[36mdemo sql\x1b[0m to see SQL in action!');
        this.terminal.writeln('');
        
        this.prompt();
    }

    async runDemo(demoName) {
        if (!demoName) {
            this.terminal.writeln('\x1b[31mError: Please specify a demo name\x1b[0m');
            this.terminal.writeln('Available demos: zero-config, performance, sql, architecture');
            this.prompt();
            return;
        }

        this.currentDemo = demoName;
        
        // Dispatch to demo handler
        const event = new CustomEvent('demo-request', {
            detail: { demo: demoName }
        });
        window.dispatchEvent(event);
    }

    async executeF4KVSCommand(line) {
        // Check if it's a SQL query
        const trimmed = line.trim();
        if (trimmed.toLowerCase().startsWith('sql ')) {
            const query = trimmed.substring(4).trim();
            await this.executeSQLQuery(query);
            return;
        }

        // Parse f4kvs commands
        const parts = line.split(' ');
        const cmd = parts[0].toLowerCase();

        // Dispatch to simulation layer
        const event = new CustomEvent('f4kvs-command', {
            detail: { command: cmd, args: parts.slice(1), fullLine: line }
        });
        window.dispatchEvent(event);
    }

    async executeSQLQuery(query) {
        // Dispatch to SQL handler
        const event = new CustomEvent('sql-query', {
            detail: { query: query }
        });
        window.dispatchEvent(event);
    }

    write(data) {
        this.terminal.write(data);
    }

    writeln(data) {
        this.terminal.writeln(data);
    }

    clear() {
        this.terminal.clear();
    }

    type(text, speed = 20) {
        return new Promise((resolve) => {
            let index = 0;
            const interval = setInterval(() => {
                if (index < text.length) {
                    this.terminal.write(text[index]);
                    index++;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, speed);
        });
    }

    /**
     * Insert a command into the terminal input line
     */
    insertCommand(command) {
        this.currentLine = command;
        this.cursorPosition = command.length;
        this.refreshLine();
    }
}

// Export for use in other modules
window.F4KVSTerminal = F4KVSTerminal;
