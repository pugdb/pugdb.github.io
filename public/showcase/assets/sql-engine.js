/**
 * Enhanced SQL Query Engine for WASM PugDB
 * Supports SELECT, WHERE, ORDER BY, LIMIT, aggregations, and JOINs
 */

class SQLQueryEngine {
    /**
     * Map table name to key prefix
     * e.g., "users" -> "user:", "group" -> "group:"
     */
    tableNameToPrefix(tableName) {
        // Remove trailing 's' for plural tables (users -> user)
        const singular = tableName.toLowerCase().replace(/s$/, '');
        return singular + ':';
    }
    
    /**
     * Filter data by key prefix
     */
    filterByPrefix(data, prefix) {
        return data.filter(row => row.key && row.key.startsWith(prefix));
    }
    
    /**
     * Parse and execute SQL query
     */
    execute(query, data) {
        const queryUpper = query.toUpperCase().trim();
        
        if (!queryUpper.startsWith('SELECT')) {
            return { error: 'Only SELECT queries are supported' };
        }
        
        // Parse SELECT clause
        const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM/i);
        if (!selectMatch) {
            return { error: 'Invalid SELECT syntax. Expected: SELECT ... FROM ...' };
        }
        
        const selectClause = selectMatch[1].trim();
        const isAggregation = this.isAggregation(selectClause);
        const hasWindowFuncs = this.hasWindowFunctions(selectClause);
        const columns = this.parseSelectColumns(selectClause);
        
        // Check for JOIN - match: FROM table1 [alias1] JOIN table2 [alias2] ON condition
        const joinMatch = query.match(/FROM\s+(\w+)(?:\s+(\w+))?\s+JOIN\s+(\w+)(?:\s+(\w+))?\s+ON\s+(.+?)(?:\s+WHERE|\s+ORDER\s+BY|\s+LIMIT|\s*;|\s*$)/i);
        
        if (joinMatch) {
            // Handle JOIN query
            return this.executeJoin(query, data, joinMatch, selectClause, columns, isAggregation);
        }
        
        // Parse FROM clause (single table)
        // Match: FROM table [alias] - be flexible about what follows
        const fromMatch = query.match(/FROM\s+(\w+)(?:\s+(\w+))?(?=\s+(?:WHERE|GROUP\s+BY|ORDER\s+BY|LIMIT|JOIN)|\s*;|$)/i);
        if (!fromMatch) {
            return { error: 'Invalid FROM clause' };
        }
        
        const tableName = fromMatch[1];
        const tableAlias = fromMatch[2] || tableName;
        
        // Filter data by table prefix
        const prefix = this.tableNameToPrefix(tableName);
        let filteredData = this.filterByPrefix(data, prefix);
        
        // Apply WHERE clause
        filteredData = this.applyWhereClause(query, filteredData);
        
        // Apply aggregations if present
        if (isAggregation) {
            return this.applyAggregation(query, selectClause, filteredData, columns);
        }
        
        // Apply window functions if present (before projection so ranks are available)
        if (hasWindowFuncs) {
            // Apply window functions to the filtered data
            // This modifies rows in place, adding rank values
            filteredData = this.applyWindowFunctions(selectClause, filteredData);
        }
        
        // Select specific columns (handle table aliases and window functions)
        let projectedData = this.projectColumns(filteredData, columns, tableAlias);
        
        // Apply ORDER BY from query (may be different from window function ORDER BY)
        projectedData = this.applyOrderBy(query, projectedData);
        
        // Apply LIMIT
        projectedData = this.applyLimit(query, projectedData);
        
        return {
            data: projectedData,
            columns: columns.length > 0 ? this.resolveColumnNames(columns, tableAlias) : Object.keys(projectedData[0] || {}).filter(k => k !== 'key'),
            rowCount: projectedData.length
        };
    }
    
    /**
     * Execute JOIN query
     */
    executeJoin(query, allData, joinMatch, selectClause, columns, isAggregation) {
        const table1Name = joinMatch[1];
        const table1Alias = joinMatch[2] || table1Name;
        const table2Name = joinMatch[3];
        const table2Alias = joinMatch[4] || table2Name;
        const joinCondition = joinMatch[5].trim();
        
        // Parse join condition: e.g., "u.g = d.g"
        const conditionMatch = joinCondition.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
        if (!conditionMatch) {
            return { error: 'Invalid JOIN condition. Expected: table1.column = table2.column' };
        }
        
        const leftTableRef = conditionMatch[1].toLowerCase();
        const leftColumn = conditionMatch[2].toLowerCase();
        const rightTableRef = conditionMatch[3].toLowerCase();
        const rightColumn = conditionMatch[4].toLowerCase();
        
        // Determine which table is which based on alias or name match
        const prefix1 = this.tableNameToPrefix(table1Name);
        const prefix2 = this.tableNameToPrefix(table2Name);
        
        let leftData, rightData, leftAlias, rightAlias;
        
        // Check if left side of condition refers to table1
        if (leftTableRef === table1Alias.toLowerCase() || leftTableRef === table1Name.toLowerCase()) {
            leftData = this.filterByPrefix(allData, prefix1);
            leftAlias = table1Alias;
            rightData = this.filterByPrefix(allData, prefix2);
            rightAlias = table2Alias;
        } else {
            // Left side refers to table2
            leftData = this.filterByPrefix(allData, prefix2);
            leftAlias = table2Alias;
            rightData = this.filterByPrefix(allData, prefix1);
            rightAlias = table1Alias;
        }
        
        // Perform INNER JOIN
        const joinedData = [];
        for (const leftRow of leftData) {
            const leftValue = leftRow[leftColumn];
            if (leftValue === undefined) continue;
            
            for (const rightRow of rightData) {
                const rightValue = rightRow[rightColumn];
                if (rightValue === undefined) continue;
                
                // Match on join condition
                if (String(leftValue) === String(rightValue)) {
                    // Merge rows with table aliases as prefixes
                    const merged = {};
                    // Add all columns from left table with alias prefix
                    for (const key in leftRow) {
                        if (key !== 'key') {
                            merged[`${leftAlias}.${key}`] = leftRow[key];
                            // Also add without alias if not conflicting
                            if (!(key in merged)) {
                                merged[key] = leftRow[key];
                            }
                        }
                    }
                    // Add all columns from right table with alias prefix
                    for (const key in rightRow) {
                        if (key !== 'key') {
                            merged[`${rightAlias}.${key}`] = rightRow[key];
                            // Also add without alias if not conflicting
                            if (!(key in merged)) {
                                merged[key] = rightRow[key];
                            }
                        }
                    }
                    merged.key = `${leftRow.key || ''}|${rightRow.key || ''}`;
                    joinedData.push(merged);
                }
            }
        }
        
        // Apply WHERE clause on joined data
        let filteredData = this.applyWhereClause(query, joinedData);
        
        // Apply aggregations if present
        if (isAggregation) {
            return this.applyAggregation(query, selectClause, filteredData, columns);
        }
        
        // Project columns (handle table aliases)
        let projectedData = this.projectColumns(filteredData, columns, null, [leftAlias, rightAlias]);
        
        // Apply ORDER BY
        projectedData = this.applyOrderBy(query, projectedData);
        
        // Apply LIMIT
        projectedData = this.applyLimit(query, projectedData);
        
        return {
            data: projectedData,
            columns: columns.length > 0 ? this.resolveColumnNames(columns, null, [leftAlias, rightAlias]) : Object.keys(projectedData[0] || {}).filter(k => k !== 'key'),
            rowCount: projectedData.length
        };
    }
    
    /**
     * Resolve column names, handling table aliases and window function aliases
     */
    resolveColumnNames(columns, tableAlias, aliases = null) {
        return columns.map(col => {
            // Check if this is a window function with an alias
            const windowFuncMatch = col.match(/\b(RANK|DENSE_RANK|ROW_NUMBER|NTILE)\s*\(\s*\)\s+OVER\s*\([^)]+\)\s+AS\s+(\w+)/i);
            if (windowFuncMatch) {
                return windowFuncMatch[2]; // Return the alias
            }
            
            // If column already has alias (e.g., "u.name"), return as is
            if (col.includes('.')) {
                return col;
            }
            // Otherwise, try to find it in the data
            return col;
        });
    }
    
    /**
     * Check if SELECT clause contains aggregations
     */
    isAggregation(selectClause) {
        const aggPatterns = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i;
        return aggPatterns.test(selectClause);
    }
    
    /**
     * Check if SELECT clause contains window functions
     */
    hasWindowFunctions(selectClause) {
        return /\b(RANK|DENSE_RANK|ROW_NUMBER|NTILE)\s*\(\s*\)\s+OVER\s*\(/i.test(selectClause);
    }
    
    /**
     * Parse window function expressions from SELECT clause
     * Returns array of { function, orderBy, alias }
     */
    parseWindowFunctions(selectClause) {
        const windowFunctions = [];
        // Match: RANK() OVER (ORDER BY column [ASC|DESC]) [AS alias]
        const windowRegex = /\b(RANK|DENSE_RANK|ROW_NUMBER|NTILE)\s*\(\s*\)\s+OVER\s*\(\s*ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?\s*\)(?:\s+AS\s+(\w+))?/gi;
        
        let match;
        while ((match = windowRegex.exec(selectClause)) !== null) {
            windowFunctions.push({
                function: match[1].toUpperCase(),
                orderBy: match[2].toLowerCase(),
                direction: (match[3] || 'ASC').toUpperCase(),
                alias: match[4] ? match[4].toLowerCase() : null,
                fullExpression: match[0]
            });
        }
        
        return windowFunctions;
    }
    
    /**
     * Parse SELECT columns
     */
    parseSelectColumns(selectClause) {
        if (selectClause === '*') {
            return []; // Empty means all columns
        }
        
        // Parse column list (may include both regular columns and aggregations)
        // Need to be careful with commas inside function calls like COUNT(*), AVG(age)
        const cols = [];
        let current = '';
        let depth = 0; // Track parentheses depth
        
        for (let i = 0; i < selectClause.length; i++) {
            const char = selectClause[i];
            
            if (char === '(') {
                depth++;
                current += char;
            } else if (char === ')') {
                depth--;
                current += char;
            } else if (char === ',' && depth === 0) {
                // Comma at top level - split here
                if (current.trim()) {
                    cols.push(current.trim());
                }
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add last column
        if (current.trim()) {
            cols.push(current.trim());
        }
        
        return cols;
    }
    
    /**
     * Apply WHERE clause filtering
     */
    applyWhereClause(query, data) {
        const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|\s*;|\s*$)/i);
        if (!whereMatch) {
            return data;
        }
        
        const whereClause = whereMatch[1].trim();
        return data.filter(row => this.evaluateCondition(whereClause, row));
    }
    
    /**
     * Get field value from row, handling table aliases
     */
    getFieldValue(row, field) {
        const fieldLower = field.toLowerCase();
        
        // Try direct field name
        if (fieldLower in row) {
            return row[fieldLower];
        }
        
        // Try with table alias (e.g., "u.name" or "users.name")
        if (field.includes('.')) {
            const parts = field.split('.');
            const aliasOrTable = parts[0].toLowerCase();
            const columnName = parts[1].toLowerCase();
            const aliasKey = `${aliasOrTable}.${columnName}`;
            
            if (aliasKey in row) {
                return row[aliasKey];
            }
            // Fallback to column name without alias
            if (columnName in row) {
                return row[columnName];
            }
        }
        
        return undefined;
    }
    
    /**
     * Evaluate a WHERE condition
     */
    evaluateCondition(condition, row) {
        // Handle AND/OR
        if (condition.includes(' AND ')) {
            const parts = condition.split(/\s+AND\s+/i);
            return parts.every(part => this.evaluateCondition(part.trim(), row));
        }
        
        if (condition.includes(' OR ')) {
            const parts = condition.split(/\s+OR\s+/i);
            return parts.some(part => this.evaluateCondition(part.trim(), row));
        }
        
        // Parse comparison operators: =, !=, <>, >, <, >=, <=, LIKE
        // Support both "field = value" and "table.field = value" and "table.field = table.field"
        const patterns = [
            { regex: /([\w.]+)\s*(>=|<=|!=|<>|>|<|=)\s*([\w.'"]+)/i, handler: (match) => {
                const leftField = match[1].trim();
                const operator = match[2];
                let rightValue = match[3].trim();
                
                // Get left side value
                const leftValue = this.getFieldValue(row, leftField);
                if (leftValue === undefined) return false;
                
                // Check if right side is a field reference (e.g., "d.name")
                let rightFieldValue = null;
                if (/^[\w.]+$/.test(rightValue) && rightValue.includes('.')) {
                    rightFieldValue = this.getFieldValue(row, rightValue);
                }
                
                // If right side is a field reference, use that value
                if (rightFieldValue !== undefined && rightFieldValue !== null) {
                    rightValue = rightFieldValue;
                } else {
                    // Remove quotes if present
                    if ((rightValue.startsWith("'") && rightValue.endsWith("'")) || 
                        (rightValue.startsWith('"') && rightValue.endsWith('"'))) {
                        rightValue = rightValue.slice(1, -1);
                    }
                }
                
                // Try numeric comparison
                const numValue = parseFloat(rightValue);
                const numRowValue = parseFloat(leftValue);
                if (!isNaN(numValue) && !isNaN(numRowValue)) {
                    switch (operator) {
                        case '>': return numRowValue > numValue;
                        case '<': return numRowValue < numValue;
                        case '>=': return numRowValue >= numValue;
                        case '<=': return numRowValue <= numValue;
                        case '=': return numRowValue === numValue;
                        case '!=':
                        case '<>': return numRowValue !== numValue;
                    }
                }
                
                // String comparison
                const strValue = String(rightValue);
                const strRowValue = String(leftValue);
                switch (operator) {
                    case '=': return strRowValue === strValue;
                    case '!=':
                    case '<>': return strRowValue !== strValue;
                    case 'LIKE': return this.likeMatch(strRowValue, strValue);
                    default: return false;
                }
            }},
            { regex: /([\w.]+)\s+LIKE\s+(.+)/i, handler: (match) => {
                const field = match[1].trim();
                let pattern = match[2].trim();
                if ((pattern.startsWith("'") && pattern.endsWith("'")) || 
                    (pattern.startsWith('"') && pattern.endsWith('"'))) {
                    pattern = pattern.slice(1, -1);
                }
                const rowValue = String(this.getFieldValue(row, field) || '');
                return this.likeMatch(rowValue, pattern);
            }}
        ];
        
        for (const { regex, handler } of patterns) {
            const match = condition.match(regex);
            if (match) {
                return handler(match);
            }
        }
        
        return true; // Default to true if can't parse
    }
    
    /**
     * LIKE pattern matching (simple implementation)
     */
    likeMatch(text, pattern) {
        // Convert SQL LIKE pattern to regex
        const regexPattern = pattern
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
            .replace(/%/g, '.*')  // % matches any sequence
            .replace(/_/g, '.');  // _ matches any single char
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(text);
    }
    
    /**
     * Project specific columns
     */
    projectColumns(data, columns, tableAlias = null, aliases = null) {
        if (columns.length === 0) {
            return data; // SELECT * - return all columns
        }
        
        return data.map(row => {
            const projected = {};
            columns.forEach(col => {
                // Check if this is a window function expression
                if (/\b(RANK|DENSE_RANK|ROW_NUMBER|NTILE)\s*\(\s*\)\s+OVER\s*\(/i.test(col)) {
                    // Try to find the window function result by alias or expression
                    const windowFuncs = this.parseWindowFunctions(col);
                    if (windowFuncs.length > 0) {
                        const wf = windowFuncs[0];
                        let found = false;
                        
                        // Try multiple keys in order of preference
                        // 1. Alias (most common and reliable)
                        if (wf.alias && wf.alias in row) {
                            projected[col] = row[wf.alias];
                            found = true;
                        }
                        
                        // 2. Original case alias from query
                        if (!found) {
                            const aliasMatch = col.match(/\s+AS\s+(\w+)/i);
                            if (aliasMatch && aliasMatch[1] in row) {
                                projected[col] = row[aliasMatch[1]];
                                found = true;
                            }
                        }
                        
                        // 3. Normalized full expression (lowercase)
                        if (!found) {
                            const normalizedExpr = wf.fullExpression.replace(/\s+/g, ' ').trim().toLowerCase();
                            if (normalizedExpr in row) {
                                projected[col] = row[normalizedExpr];
                                found = true;
                            }
                        }
                        
                        // 4. Original case full expression
                        if (!found) {
                            const originalExpr = wf.fullExpression.replace(/\s+/g, ' ').trim();
                            if (originalExpr in row) {
                                projected[col] = row[originalExpr];
                                found = true;
                            }
                        }
                        
                        // 5. Column expression as-is
                        if (!found && col in row) {
                            projected[col] = row[col];
                            found = true;
                        }
                        
                        // 6. Generated key as last resort
                        if (!found) {
                            const outputKey = `${wf.function.toLowerCase()}_over_order_by_${wf.orderBy}`;
                            if (outputKey in row) {
                                projected[col] = row[outputKey];
                                found = true;
                            }
                        }
                        
                        // If still not found, leave undefined (will show as empty)
                        if (!found) {
                            projected[col] = undefined;
                        }
                        
                        return;
                    }
                }
                
                // Handle table alias: e.g., "u.name" or "users.name"
                if (col.includes('.')) {
                    const parts = col.split('.');
                    const aliasOrTable = parts[0].toLowerCase();
                    const columnName = parts[1].toLowerCase();
                    
                    // Try with alias prefix first (e.g., "u.name")
                    const aliasKey = `${aliasOrTable}.${columnName}`;
                    if (aliasKey in row) {
                        projected[col] = row[aliasKey];
                    } else if (columnName in row) {
                        // Fallback to column name without alias
                        projected[col] = row[columnName];
                    }
                } else {
                    // No alias, try direct column name
                    const colLower = col.toLowerCase();
                    if (colLower in row) {
                        projected[col] = row[colLower];
                    } else if (tableAlias) {
                        // Try with table alias prefix
                        const aliasKey = `${tableAlias}.${colLower}`;
                        if (aliasKey in row) {
                            projected[col] = row[aliasKey];
                        }
                    } else if (aliases) {
                        // Try with each alias
                        for (const alias of aliases) {
                            const aliasKey = `${alias}.${colLower}`;
                            if (aliasKey in row) {
                                projected[col] = row[aliasKey];
                                break;
                            }
                        }
                        // If still not found, try without alias
                        if (!(col in projected) && colLower in row) {
                            projected[col] = row[colLower];
                        }
                    }
                }
            });
            return projected;
        });
    }
    
    /**
     * Apply ORDER BY clause
     */
    applyOrderBy(query, data) {
        const orderMatch = query.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?(?:\s+LIMIT|\s*;|\s*$)/i);
        if (!orderMatch) {
            return data;
        }
        
        const column = orderMatch[1].toLowerCase();
        const direction = (orderMatch[2] || 'ASC').toUpperCase();
        
        return [...data].sort((a, b) => {
            const aVal = a[column];
            const bVal = b[column];
            
            // Numeric comparison
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return direction === 'DESC' ? bNum - aNum : aNum - bNum;
            }
            
            // String comparison
            const aStr = String(aVal || '');
            const bStr = String(bVal || '');
            const cmp = aStr.localeCompare(bStr);
            return direction === 'DESC' ? -cmp : cmp;
        });
    }
    
    /**
     * Apply LIMIT clause
     */
    applyLimit(query, data) {
        const limitMatch = query.match(/LIMIT\s+(\d+)/i);
        if (!limitMatch) {
            return data;
        }
        
        const limit = parseInt(limitMatch[1]);
        return data.slice(0, limit);
    }
    
    /**
     * Apply window functions to data
     */
    applyWindowFunctions(selectClause, data) {
        const windowFunctions = this.parseWindowFunctions(selectClause);
        if (windowFunctions.length === 0) {
            return data;
        }
        
        // Apply each window function
        for (const wf of windowFunctions) {
            // Create a copy with indices to track original positions
            // We need to preserve the original data order, so we'll sort a copy
            const indexedData = data.map((row, idx) => ({ row, idx }));
            
            // Sort by the ORDER BY column in the window function
            indexedData.sort((a, b) => {
                const aVal = this.getFieldValue(a.row, wf.orderBy);
                const bVal = this.getFieldValue(b.row, wf.orderBy);
                
                // Handle undefined/null values
                if (aVal === undefined || aVal === null) return 1;
                if (bVal === undefined || bVal === null) return -1;
                
                // Numeric comparison
                const aNum = parseFloat(aVal);
                const bNum = parseFloat(bVal);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return wf.direction === 'DESC' ? bNum - aNum : aNum - bNum;
                }
                
                // String comparison
                const aStr = String(aVal);
                const bStr = String(bVal);
                const cmp = aStr.localeCompare(bStr);
                return wf.direction === 'DESC' ? -cmp : cmp;
            });
            
            // Calculate ranks
            let rank = 1;
            let previousValue = null;
            let denseRank = 1;
            let rowNumber = 1;
            
            for (let i = 0; i < indexedData.length; i++) {
                const { row } = indexedData[i];
                const currentValue = this.getFieldValue(row, wf.orderBy);
                
                // Calculate rank based on function type
                let rankValue;
                if (wf.function === 'RANK') {
                    if (i > 0 && previousValue !== null) {
                        const comparison = this.compareValues(currentValue, previousValue, wf.direction);
                        if (comparison !== 0) {
                            rank = i + 1;
                        }
                    }
                    rankValue = rank;
                    previousValue = currentValue;
                } else if (wf.function === 'DENSE_RANK') {
                    if (i > 0 && previousValue !== null) {
                        const comparison = this.compareValues(currentValue, previousValue, wf.direction);
                        if (comparison !== 0) {
                            denseRank++;
                        }
                    }
                    rankValue = denseRank;
                    previousValue = currentValue;
                } else if (wf.function === 'ROW_NUMBER') {
                    rankValue = rowNumber++;
                } else {
                    // NTILE not implemented yet
                    rankValue = null;
                }
                
                // Store rank value with multiple keys to ensure we can find it during projection
                // Primary key: use alias if available (most reliable)
                if (wf.alias) {
                    row[wf.alias] = rankValue;
                    // Also store with original case from query
                    const aliasMatch = wf.fullExpression.match(/\s+AS\s+(\w+)/i);
                    if (aliasMatch) {
                        const originalAlias = aliasMatch[1];
                        if (originalAlias.toLowerCase() !== wf.alias) {
                            row[originalAlias] = rankValue; // Store with original case
                        }
                    }
                }
                
                // Fallback key: generated key
                const outputKey = wf.alias || `${wf.function.toLowerCase()}_over_order_by_${wf.orderBy}`;
                row[outputKey] = rankValue;
                
                // Also add with full expression variations for matching in projection
                const normalizedExpr = wf.fullExpression.replace(/\s+/g, ' ').trim().toLowerCase();
                row[normalizedExpr] = rankValue;
                
                const originalExpr = wf.fullExpression.replace(/\s+/g, ' ').trim();
                row[originalExpr] = rankValue;
            }
        }
        
        return data;
    }
    
    /**
     * Compare two values for sorting
     */
    compareValues(a, b, direction) {
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        if (!isNaN(aNum) && !isNaN(bNum)) {
            const diff = direction === 'DESC' ? bNum - aNum : aNum - bNum;
            return diff < 0 ? -1 : (diff > 0 ? 1 : 0);
        }
        
        const aStr = String(a || '');
        const bStr = String(b || '');
        const cmp = direction === 'DESC' ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
        return cmp < 0 ? -1 : (cmp > 0 ? 1 : 0);
    }
    
    /**
     * Parse GROUP BY clause
     */
    parseGroupBy(query) {
        const groupByMatch = query.match(/GROUP\s+BY\s+([\w,\s]+?)(?:\s+ORDER\s+BY|\s+LIMIT|\s*;|\s*$)/i);
        if (!groupByMatch) {
            return null;
        }
        // Return both original and lowercase for matching
        return groupByMatch[1].split(',').map(col => ({
            original: col.trim(),
            lower: col.trim().toLowerCase()
        }));
    }
    
    /**
     * Apply aggregation functions
     */
    applyAggregation(query, selectClause, data, columns) {
        const groupByColumns = this.parseGroupBy(query);
        
        // If GROUP BY is present, group the data
        if (groupByColumns && groupByColumns.length > 0) {
            return this.applyGroupedAggregation(query, selectClause, data, columns, groupByColumns);
        }
        
        // No GROUP BY - single aggregation result
        const results = {};
        
        // Parse all aggregation functions in SELECT
        const aggPatterns = [
            { name: 'COUNT', regex: /COUNT\s*\(\s*\*\s*\)/i, func: (rows) => rows.length },
            { name: 'COUNT', regex: /COUNT\s*\(\s*(\w+)\s*\)/i, func: (rows, col) => {
                return rows.filter(r => {
                    const val = this.getFieldValue(r, col);
                    return val !== undefined && val !== null;
                }).length;
            }},
            { name: 'SUM', regex: /SUM\s*\(\s*(\w+)\s*\)/i, func: (rows, col) => {
                return rows.reduce((sum, r) => {
                    const val = parseFloat(this.getFieldValue(r, col));
                    return sum + (isNaN(val) ? 0 : val);
                }, 0);
            }},
            { name: 'AVG', regex: /AVG\s*\(\s*(\w+)\s*\)/i, func: (rows, col) => {
                const values = rows.map(r => parseFloat(this.getFieldValue(r, col))).filter(v => !isNaN(v));
                return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            }},
            { name: 'MIN', regex: /MIN\s*\(\s*(\w+)\s*\)/i, func: (rows, col) => {
                const values = rows.map(r => parseFloat(this.getFieldValue(r, col))).filter(v => !isNaN(v));
                return values.length > 0 ? Math.min(...values) : null;
            }},
            { name: 'MAX', regex: /MAX\s*\(\s*(\w+)\s*\)/i, func: (rows, col) => {
                const values = rows.map(r => parseFloat(this.getFieldValue(r, col))).filter(v => !isNaN(v));
                return values.length > 0 ? Math.max(...values) : null;
            }}
        ];
        
        // Extract all aggregations from selectClause
        for (const col of columns) {
            for (const pattern of aggPatterns) {
                const match = col.match(pattern.regex);
                if (match) {
                    const aggCol = match[1] ? match[1].toLowerCase() : null;
                    const value = pattern.func(data, aggCol);
                    // Handle aliases (e.g., "COUNT(*) as count")
                    const aliasMatch = col.match(/\s+AS\s+(\w+)/i);
                    const aggName = aliasMatch ? aliasMatch[1] : `${pattern.name}(${aggCol || '*'})`;
                    results[aggName] = value;
                    break;
                }
            }
        }
        
        return {
            data: [results],
            columns: Object.keys(results),
            rowCount: 1,
            isAggregation: true
        };
    }
    
    /**
     * Apply grouped aggregation (with GROUP BY)
     */
    applyGroupedAggregation(query, selectClause, data, columns, groupByColumns) {
        // Group data by the specified columns
        const groups = new Map();
        
        for (const row of data) {
            // Create group key from grouping columns
            const groupKey = groupByColumns.map(colInfo => {
                const val = this.getFieldValue(row, colInfo.lower);
                return val !== undefined && val !== null ? String(val) : '';
            }).join('|');
            
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(row);
        }
        
        // Calculate aggregations for each group
        const results = [];
        const aggPatterns = [
            { name: 'COUNT', regex: /COUNT\s*\(\s*\*\s*\)/i, func: (rows) => rows.length },
            { name: 'COUNT', regex: /COUNT\s*\(\s*(\w+)\s*\)/i, func: (rows, col) => {
                return rows.filter(r => {
                    const val = this.getFieldValue(r, col);
                    return val !== undefined && val !== null;
                }).length;
            }},
            { name: 'SUM', regex: /SUM\s*\(\s*(\w+)\s*\)/i, func: (rows, col) => {
                return rows.reduce((sum, r) => {
                    const val = parseFloat(this.getFieldValue(r, col));
                    return sum + (isNaN(val) ? 0 : val);
                }, 0);
            }},
            { name: 'AVG', regex: /AVG\s*\(\s*(\w+)\s*\)/i, func: (rows, col) => {
                const values = rows.map(r => parseFloat(this.getFieldValue(r, col))).filter(v => !isNaN(v));
                return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            }},
            { name: 'MIN', regex: /MIN\s*\(\s*(\w+)\s*\)/i, func: (rows, col) => {
                const values = rows.map(r => parseFloat(this.getFieldValue(r, col))).filter(v => !isNaN(v));
                return values.length > 0 ? Math.min(...values) : null;
            }},
            { name: 'MAX', regex: /MAX\s*\(\s*(\w+)\s*\)/i, func: (rows, col) => {
                const values = rows.map(r => parseFloat(this.getFieldValue(r, col))).filter(v => !isNaN(v));
                return values.length > 0 ? Math.max(...values) : null;
            }}
        ];
        
        // Process each group
        for (const [groupKey, groupRows] of groups) {
            const groupValues = groupKey.split('|');
            const resultRow = {};
            
            // Add grouping column values (use original column name from SELECT)
            for (let i = 0; i < groupByColumns.length; i++) {
                const colInfo = groupByColumns[i];
                // Find matching column in SELECT clause (case-insensitive)
                const matchingCol = columns.find(c => {
                    const cBase = c.toLowerCase().trim().split(/\s+as\s+/i)[0].trim();
                    return cBase === colInfo.lower || c.toLowerCase().trim() === colInfo.lower;
                });
                // Use the exact column name from SELECT (preserve case, but lowercase for consistency)
                const colName = matchingCol ? matchingCol.toLowerCase().trim().split(/\s+as\s+/i)[0].trim() : colInfo.lower;
                resultRow[colName] = groupValues[i];
            }
            
            // Calculate aggregations for this group
            for (const col of columns) {
                const colLower = col.toLowerCase().trim();
                // Check if it's a grouping column (already added)
                // Need to check the base column name, not the full expression
                const isGroupCol = groupByColumns.some(gc => {
                    // Check if the column string matches the grouping column name exactly
                    // (ignoring any "as" alias)
                    const baseCol = colLower.split(/\s+as\s+/i)[0].trim();
                    return baseCol === gc.lower || colLower === gc.lower;
                });
                if (isGroupCol) {
                    continue;
                }
                
                // Check if it's an aggregation
                for (const pattern of aggPatterns) {
                    const match = col.match(pattern.regex);
                    if (match) {
                        const aggCol = match[1] ? match[1].toLowerCase() : null;
                        const value = pattern.func(groupRows, aggCol);
                        // Handle aliases (e.g., "COUNT(*) as count")
                        const aliasMatch = col.match(/\s+AS\s+(\w+)/i);
                        // Use lowercase alias to match output column names
                        const aggName = aliasMatch ? aliasMatch[1].toLowerCase() : `${pattern.name.toLowerCase()}(${aggCol || '*'})`;
                        resultRow[aggName] = value;
                        break;
                    }
                }
            }
            
            results.push(resultRow);
        }
        
        // Apply ORDER BY if present
        const orderedResults = this.applyOrderBy(query, results);
        
        // Apply LIMIT if present
        const limitedResults = this.applyLimit(query, orderedResults);
        
        // Determine output columns (match SELECT clause order)
        const outputColumns = [];
        for (const col of columns) {
            const colLower = col.toLowerCase().trim();
            // Check if it's a grouping column (check base name, ignoring "as" alias)
            const baseCol = colLower.split(/\s+as\s+/i)[0].trim();
            // Find the matching group column
            const matchingGroupCol = groupByColumns.find(gc => baseCol === gc.lower || colLower === gc.lower);
            if (matchingGroupCol) {
                // Use the original column name from SELECT (preserve case if possible)
                const matchingCol = columns.find(c => {
                    const cBase = c.toLowerCase().trim().split(/\s+as\s+/i)[0].trim();
                    return cBase === matchingGroupCol.lower || c.toLowerCase().trim() === matchingGroupCol.lower;
                });
                // Use the base column name (without alias) to match resultRow keys
                const baseColName = matchingCol ? matchingCol.toLowerCase().trim().split(/\s+as\s+/i)[0].trim() : colLower.split(/\s+as\s+/i)[0].trim();
                outputColumns.push(baseColName);
            } else {
                // Check for alias
                const aliasMatch = col.match(/\s+AS\s+(\w+)/i);
                if (aliasMatch) {
                    // Use lowercase to match resultRow keys
                    outputColumns.push(aliasMatch[1].toLowerCase());
                } else {
                    // Use aggregation name as it appears in result
                    const aggMatch = col.match(/(COUNT|SUM|AVG|MIN|MAX)\s*\(/i);
                    if (aggMatch) {
                        const aggColMatch = col.match(/\((\w+|\*)\)/i);
                        const aggCol = aggColMatch ? aggColMatch[1] : '*';
                        outputColumns.push(`${aggMatch[1].toLowerCase()}(${aggCol})`);
                    } else {
                        outputColumns.push(col.toLowerCase());
                    }
                }
            }
        }
        
        return {
            data: limitedResults,
            columns: outputColumns.length > 0 ? outputColumns : Object.keys(results[0] || {}),
            rowCount: limitedResults.length,
            isAggregation: true
        };
    }
}

// Export for use
window.SQLQueryEngine = SQLQueryEngine;
