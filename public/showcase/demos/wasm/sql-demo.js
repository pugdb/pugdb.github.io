/**
 * SQL Demo
 * Shows SQL query capabilities on key-value store
 */

class SQLDemo {
    async run(terminal) {
        terminal.writeln('\x1b[36m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
        terminal.writeln('\x1b[36m║  SQL on Key-Value Store - Query Language Demo             ║\x1b[0m');
        terminal.writeln('\x1b[36m╚═══════════════════════════════════════════════════════════╝\x1b[0m\n');
        
        terminal.writeln('\x1b[33mExperience SQL queries, JOINs, and window functions on PugDB!\x1b[0m\n');
        
        terminal.writeln('\x1b[35mHow SQL works with Key-Value Store:\x1b[0m');
        terminal.writeln('  PugDB stores data as key-value pairs (e.g., "user:1" = \'{"name":"Alice"}\')');
        terminal.writeln('  The QL (Query Language) automatically interprets these pairs as SQL tables.');
        terminal.writeln('  You can query your KVS data using standard SQL syntax!\n');
        terminal.writeln('\x1b[33mNote:\x1b[0m In the real QL engine, you need to CREATE TABLE first:');
        terminal.writeln('  \x1b[36msql CREATE TABLE users (id INTEGER PRIMARY KEY, name STRING, age INTEGER, dept STRING);\x1b[0m');
        terminal.writeln('  This demo uses simplified simulation that auto-creates tables.\n');
        
        await this.delay(1500);
        
        // Setup sample data
        terminal.writeln('\x1b[32mStep 1: Setting up sample data...\x1b[0m');
        await this.delay(500);
        
        const sampleData = [
            { key: 'user:1', value: JSON.stringify({ id: 1, name: 'Alice', age: 30, dept: 'Engineering' }) },
            { key: 'user:2', value: JSON.stringify({ id: 2, name: 'Bob', age: 25, dept: 'Sales' }) },
            { key: 'user:3', value: JSON.stringify({ id: 3, name: 'Charlie', age: 35, dept: 'Engineering' }) },
            { key: 'user:4', value: JSON.stringify({ id: 4, name: 'Diana', age: 28, dept: 'Marketing' }) },
            { key: 'user:5', value: JSON.stringify({ id: 5, name: 'Eve', age: 32, dept: 'Engineering' }) }
        ];
        
        for (const item of sampleData) {
            await window.f4kvsSimulator.put(item.key, item.value, terminal);
            await this.delay(100);
        }
        
        terminal.writeln('');
        await this.delay(1000);
        
        // Show the connection between KVS and SQL
        terminal.writeln('\x1b[35mNote:\x1b[0m Data stored as key-value pairs:');
        terminal.writeln('  \x1b[36mKey:\x1b[0m "user:1"  \x1b[36mValue:\x1b[0m \'{"name":"Alice","age":30,...}\'');
        terminal.writeln('  \x1b[36mKey:\x1b[0m "user:2"  \x1b[36mValue:\x1b[0m \'{"name":"Bob","age":25,...}\'');
        terminal.writeln('  ...');
        terminal.writeln('');
        terminal.writeln('  PugDB QL automatically interprets these as SQL table rows!');
        terminal.writeln('');
        await this.delay(1500);
        
        // Example 1: Simple SELECT
        terminal.writeln('\x1b[32mStep 2: Simple SELECT Query\x1b[0m');
        await this.delay(500);
        await terminal.type('SELECT * FROM users WHERE age > 30;', 30);
        terminal.writeln('\n');
        await this.delay(500);
        
        terminal.writeln('\x1b[36mResults:\x1b[0m');
        terminal.writeln('  id | name    | age | dept');
        terminal.writeln('  ---|---------|-----|------------');
        terminal.writeln('   3 | Charlie |  35 | Engineering');
        terminal.writeln('   5 | Eve     |  32 | Engineering');
        terminal.writeln('');
        
        await this.delay(1500);
        
        // Example 2: Aggregation
        terminal.writeln('\x1b[32mStep 3: Aggregation Query\x1b[0m');
        await this.delay(500);
        await terminal.type('SELECT dept, COUNT(*) as count, AVG(age) as avg_age FROM users GROUP BY dept;', 30);
        terminal.writeln('\n');
        await this.delay(500);
        
        terminal.writeln('\x1b[36mResults:\x1b[0m');
        terminal.writeln('  dept        | count | avg_age');
        terminal.writeln('  ------------|-------|--------');
        terminal.writeln('  Engineering |     3 |   32.33');
        terminal.writeln('  Sales       |     1 |   25.00');
        terminal.writeln('  Marketing   |     1 |   28.00');
        terminal.writeln('');
        
        await this.delay(1500);
        
        // Example 3: JOIN (simulated)
        terminal.writeln('\x1b[32mStep 4: JOIN Query\x1b[0m');
        await this.delay(500);
        await terminal.type('SELECT u.name, d.budget FROM users u JOIN departments d ON u.dept = d.name;', 30);
        terminal.writeln('\n');
        await this.delay(500);
        
        terminal.writeln('\x1b[36mResults:\x1b[0m');
        terminal.writeln('  name    | budget');
        terminal.writeln('  --------|--------');
        terminal.writeln('  Alice   | 500000');
        terminal.writeln('  Charlie | 500000');
        terminal.writeln('  Eve     | 500000');
        terminal.writeln('  Bob     | 300000');
        terminal.writeln('  Diana   | 200000');
        terminal.writeln('');
        
        await this.delay(1500);
        
        // Example 4: Window Functions
        terminal.writeln('\x1b[32mStep 5: Window Functions\x1b[0m');
        await this.delay(500);
        await terminal.type('SELECT name, age, RANK() OVER (ORDER BY age DESC) as age_rank FROM users;', 30);
        terminal.writeln('\n');
        await this.delay(500);
        
        terminal.writeln('\x1b[36mResults:\x1b[0m');
        terminal.writeln('  name    | age | age_rank');
        terminal.writeln('  --------|-----|---------');
        terminal.writeln('  Charlie |  35 |       1');
        terminal.writeln('  Eve     |  32 |       2');
        terminal.writeln('  Alice   |  30 |       3');
        terminal.writeln('  Diana   |  28 |       4');
        terminal.writeln('  Bob     |  25 |       5');
        terminal.writeln('');
        
        await this.delay(1000);
        
        terminal.writeln('\x1b[32m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
        terminal.writeln('\x1b[32m║  ✓ SQL Demo Complete!                                      ║\x1b[0m');
        terminal.writeln('\x1b[32m╚═══════════════════════════════════════════════════════════╝\x1b[0m\n');
        
        terminal.writeln('\x1b[33mKey Features:\x1b[0m');
        terminal.writeln('  • Full SQL support on key-value store');
        terminal.writeln('  • Automatic KVS → SQL table mapping');
        terminal.writeln('  • JOINs, aggregations, window functions');
        terminal.writeln('  • Subqueries and complex queries');
        terminal.writeln('  • Optimized query execution');
        terminal.writeln('');
        terminal.writeln('\x1b[35mTry it yourself:\x1b[0m');
        terminal.writeln('  \x1b[36msql CREATE TABLE users (id INTEGER PRIMARY KEY, name STRING, age INTEGER, dept STRING);\x1b[0m');
        terminal.writeln('  \x1b[36msql INSERT INTO users (name, age, dept) VALUES (\'Alice\', 30, \'Engineering\');\x1b[0m');
        terminal.writeln('  \x1b[36msql SELECT * FROM users WHERE age > 25;\x1b[0m');
        terminal.writeln('  \x1b[36msql SELECT * FROM users u JOIN departments d ON u.dept = d.name;\x1b[0m');
        terminal.writeln('');
        
        terminal.prompt();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

window.sqlDemo = new SQLDemo();
