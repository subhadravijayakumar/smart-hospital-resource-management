#!/usr/bin/env node

/**
 * Automated MySQL Setup Script for Smart Hospital System
 * Uses credentials: root:bitsathy@localhost:3306
 * Database: smart_hospital
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'bitsathy',
  database: process.env.DB_NAME || 'smart_hospital'
};

async function setup() {
  console.log('====================================================');
  console.log('   SMART HOSPITAL - LOCAL MYSQL SCHEMA PROVISIONER   ');
  console.log('====================================================');
  console.log(`Connecting to MySQL Server:`);
  console.log(`  Host:     ${config.host}`);
  console.log(`  Port:     ${config.port}`);
  console.log(`  User:     ${config.user}`);
  console.log(`  Database: ${config.database}`);
  console.log('----------------------------------------------------');

  let connection;
  try {
    // 1. Connect to MySQL server without database first
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      multipleStatements: true,
      connectTimeout: 5000
    });

    console.log('Connected to MySQL daemon successfully!');

    // 2. Read schema.sql
    const schemaFile = path.resolve(process.cwd(), 'schema.sql');
    if (!fs.existsSync(schemaFile)) {
      throw new Error(`Schema file not found at ${schemaFile}`);
    }

    const sqlScript = fs.readFileSync(schemaFile, 'utf8');
    console.log(`Applying schema from: ${schemaFile} (${(sqlScript.length / 1024).toFixed(1)} KB)...`);

    // 3. Execute the entire schema script
    await connection.query(sqlScript);
    console.log(`Schema executed successfully!`);

    // 4. Verify created tables in database
    await connection.query(`USE \`${config.database}\`;`);
    const [tables] = await connection.query(`SHOW TABLES;`);
    const tableList = Array.isArray(tables) ? tables.map(r => Object.values(r)[0]) : [];

    console.log('====================================================');
    console.log(` SUCCESS! ${tableList.length} Relational Tables Created in '${config.database}':`);
    console.log('====================================================');

    for (const tableName of tableList) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\`;`);
        const count = rows[0]?.count ?? 0;
        console.log(`  [OK] ${tableName.padEnd(25)} (${count} initial records)`);
      } catch (err) {
        console.log(`  [OK] ${tableName.padEnd(25)}`);
      }
    }

    console.log('----------------------------------------------------');
    console.log('Your local MySQL database is completely initialized and ready for production!');
    await connection.end();
    process.exit(0);

  } catch (err) {
    console.error('\nERROR connecting or executing schema on MySQL:');
    console.error(`  Code:    ${err.code || 'UNKNOWN'}`);
    console.error(`  Message: ${err.message}`);
    console.log('\nDIAGNOSTICS & RESOLUTION:');
    if (err.code === 'ECONNREFUSED') {
      console.log('  1. Please verify that MySQL server is installed and running on your local system:');
      console.log('     Linux:   sudo systemctl start mysql');
      console.log('     macOS:   brew services start mysql');
      console.log('     Windows: net start MySQL80  (or start via XAMPP / WampServer)');
      console.log('     Docker:  docker run --name mysql-hospital -e MYSQL_ROOT_PASSWORD=bitsathy -p 3306:3306 -d mysql:8.0');
      console.log('  2. Or run manually using standard MySQL CLI:');
      console.log(`     mysql -u ${config.user} -p${config.password} < schema.sql`);
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log(`  Access denied for user '${config.user}'. Please ensure password 'bitsathy' is correct.`);
    }
    if (connection) await connection.end().catch(() => {});
    process.exit(1);
  }
}

setup();
