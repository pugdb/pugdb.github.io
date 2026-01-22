/**
 * Zero-Config Demo
 * Shows automatic system detection and configuration
 */

class ZeroConfigDemo {
    async run(terminal) {
        terminal.writeln('\x1b[36m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
        terminal.writeln('\x1b[36m║  Zero-Config Magic - PugDB Auto-Configuration Demo        ║\x1b[0m');
        terminal.writeln('\x1b[36m╚═══════════════════════════════════════════════════════════╝\x1b[0m\n');
        
        terminal.writeln('\x1b[33mWatch PugDB automatically detect your system and configure itself!\x1b[0m\n');
        
        await this.delay(1000);
        
        // Step 1: Show the simple API
        terminal.writeln('\x1b[32mStep 1: Creating PugDB instance...\x1b[0m');
        await terminal.type('let db = await PugDB.new();', 30);
        terminal.writeln('\n');
        await this.delay(500);
        terminal.writeln('\x1b[32m✓ Database created with zero configuration!\x1b[0m\n');
        
        await this.delay(1000);
        
        // Step 2: System resource detection
        terminal.writeln('\x1b[32mStep 2: Detecting system resources...\x1b[0m');
        await this.delay(800);
        
        const resources = window.f4kvsSimulator.getSystemResources();
        terminal.writeln(`  \x1b[36mTotal RAM:\x1b[0m ${resources.totalRam} MB`);
        await this.delay(200);
        terminal.writeln(`  \x1b[36mAvailable RAM:\x1b[0m ${resources.availableRam} MB`);
        await this.delay(200);
        terminal.writeln(`  \x1b[36mCPU Cores:\x1b[0m ${resources.cpuCores}`);
        await this.delay(200);
        terminal.writeln(`  \x1b[36mDisk IOPS:\x1b[0m ${resources.diskIops.toLocaleString()}`);
        await this.delay(200);
        terminal.writeln(`  \x1b[36mDisk Read Speed:\x1b[0m ${resources.diskReadSpeed} MB/s`);
        await this.delay(200);
        terminal.writeln(`  \x1b[36mDisk Write Speed:\x1b[0m ${resources.diskWriteSpeed} MB/s`);
        terminal.writeln('');
        
        await this.delay(1000);
        
        // Step 3: Auto-configuration
        terminal.writeln('\x1b[32mStep 3: Auto-configuring based on detected resources...\x1b[0m');
        await this.delay(800);
        
        const config = window.f4kvsSimulator.autoConfigure();
        terminal.writeln(`  \x1b[36mSelected Backend:\x1b[0m \x1b[33m${config.backend}\x1b[0m`);
        await this.delay(300);
        terminal.writeln(`  \x1b[36mCache Size:\x1b[0m ${config.cacheSize} MB`);
        await this.delay(300);
        terminal.writeln(`  \x1b[36mThread Pool Size:\x1b[0m ${config.threadPoolSize}`);
        await this.delay(300);
        terminal.writeln(`  \x1b[36mBatch Size:\x1b[0m ${config.batchSize}`);
        await this.delay(300);
        terminal.writeln(`  \x1b[36mWAL Enabled:\x1b[0m ${config.walEnabled ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`);
        terminal.writeln('');
        
        await this.delay(1000);
        
        // Step 4: Demonstrate it works
        terminal.writeln('\x1b[32mStep 4: Testing the configured database...\x1b[0m');
        await this.delay(500);
        
        terminal.writeln('  Storing some data...');
        await window.f4kvsSimulator.put('user:1', 'Alice', terminal);
        await this.delay(300);
        await window.f4kvsSimulator.put('user:2', 'Bob', terminal);
        await this.delay(300);
        await window.f4kvsSimulator.put('user:3', 'Charlie', terminal);
        await this.delay(500);
        
        terminal.writeln('\n  Retrieving data...');
        await window.f4kvsSimulator.get('user:1', terminal);
        await this.delay(300);
        await window.f4kvsSimulator.get('user:2', terminal);
        await this.delay(500);
        
        terminal.writeln('\n\x1b[32m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
        terminal.writeln('\x1b[32m║  ✓ Zero-Configuration Complete!                            ║\x1b[0m');
        terminal.writeln('\x1b[32m╚═══════════════════════════════════════════════════════════╝\x1b[0m\n');
        
        terminal.writeln('\x1b[33mKey Takeaway:\x1b[0m');
        terminal.writeln('  • One line of code: \x1b[36mPugDB.new()\x1b[0m');
        terminal.writeln('  • System automatically detects resources');
        terminal.writeln('  • Optimal configuration selected automatically');
        terminal.writeln('  • No manual tuning required!\n');
        
        terminal.prompt();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

window.zeroConfigDemo = new ZeroConfigDemo();
