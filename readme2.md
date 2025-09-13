# Fixing Database Driver Mismatch for Local PostgreSQL Deployment

## Problem Description

The Windows Server Management application is currently configured to use the **Neon HTTP driver** (`drizzle-orm/neon-http` with `@neondatabase/serverless`), which only works with Neon's cloud database service over HTTP/WebSocket connections. 

When deploying to a local PostgreSQL instance (as described in `DEPLOYMENT.md`), this causes **"cannot connect to database"** errors because:

- **Neon HTTP driver** expects HTTP/WebSocket endpoints (like `https://ep-*.neon.tech`)
- **Local PostgreSQL** only exposes standard PostgreSQL protocol connections (like `postgresql://user:pass@localhost:5432/db`)

## Solution Overview

We need to switch from the **Neon HTTP driver** to the **standard PostgreSQL driver** for local deployments:

- **FROM**: `drizzle-orm/neon-http` + `@neondatabase/serverless`
- **TO**: `drizzle-orm/node-postgres` + `pg`

## Step-by-Step Fix

### Step 1: Install Required Packages

Remove Neon-specific packages and install PostgreSQL drivers:

```bash
# Remove Neon packages
npm uninstall @neondatabase/serverless

# Install PostgreSQL packages
npm install pg @types/pg

# Optional: Install connection pooling for production
npm install pg-pool @types/pg-pool
```

### Step 2: Update Database Connection Code

**File: `server/storage.ts`**

Replace the current Neon HTTP connection with standard PostgreSQL:

**BEFORE** (lines 15-23):
```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import crypto from "crypto";

// Create database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });
```

**AFTER**:
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import crypto from "crypto";

// Create database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  // Optional: Configure connection pool settings
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

const db = drizzle(pool, { schema });
```

### Step 3: Update Environment Variables (if needed)

**File: `.env`**

Ensure your `DATABASE_URL` follows the standard PostgreSQL format:

```env
# Standard PostgreSQL connection string format
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Example for the deployment guide:
DATABASE_URL=postgresql://winserver_app:your_secure_password@localhost:5432/winserver_mgmt
```

**Note**: Remove any Neon-specific URLs that look like:
```env
# ❌ This won't work with local PostgreSQL
DATABASE_URL=https://ep-something.us-east-1.aws.neon.tech/database_name
```

### Step 4: Update Package.json Scripts (if needed)

The database push command should work the same way, but verify your `package.json` has:

```json
{
  "scripts": {
    "db:push": "drizzle-kit push"
  }
}
```

### Step 5: Test the Connection

Start your application and verify the database connection works:

```bash
# Start the application
npm run dev

# Check the logs for successful database connection
# You should see no connection errors in the terminal
```

### Step 6: Run Database Migration

Push your schema to the local PostgreSQL database:

```bash
npm run db:push
```

If you encounter any data loss warnings and this is a fresh installation:
```bash
npm run db:push --force
```

### Step 7: Verify Everything Works

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Test database operations** by visiting:
   - `http://localhost:3000` - Main application
   - Try adding a server configuration
   - Check that data persists between restarts

3. **Check logs** for any database-related errors:
   ```bash
   # Look for any database connection errors
   grep -i "database\|postgres\|connection" logs.txt
   ```

## Alternative: Dual Configuration Support

If you want to support **both** Neon (for development) and local PostgreSQL (for deployment), you can create a conditional setup:

**File: `server/storage.ts`**

```typescript
import * as schema from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import crypto from "crypto";

let db: any;

const databaseUrl = process.env.DATABASE_URL!;

if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
  // Local PostgreSQL connection
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { Pool } = await import("pg");
  
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  db = drizzle(pool, { schema });
} else {
  // Neon HTTP connection (for cloud/development)
  const { drizzle } = await import("drizzle-orm/neon-http");
  const { neon } = await import("@neondatabase/serverless");
  
  const sql = neon(databaseUrl);
  db = drizzle(sql, { schema });
}

export { db };
```

**Note**: If using this approach, keep both package dependencies:
```bash
npm install pg @types/pg @neondatabase/serverless
```

## Troubleshooting

### Error: "Cannot find module 'pg'"
**Solution**: Make sure you installed the pg package:
```bash
npm install pg @types/pg
```

### Error: "Connection terminated unexpectedly"
**Solutions**:
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
3. Check user permissions in PostgreSQL
4. Verify the database exists

### Error: "password authentication failed"
**Solutions**:
1. Double-check username/password in DATABASE_URL
2. Verify PostgreSQL user exists and has correct permissions
3. Check PostgreSQL authentication configuration (`pg_hba.conf`)

### Error: "database does not exist"
**Solutions**:
1. Create the database: `createdb winserver_mgmt`
2. Or use psql: `CREATE DATABASE winserver_mgmt;`

### Error: "drizzle-kit push" fails
**Solutions**:
1. Check database connection first
2. Try: `npm run db:push --force`
3. Verify `drizzle.config.ts` uses correct DATABASE_URL

## Verification Checklist

After completing these steps, verify:

- [ ] Application starts without database connection errors
- [ ] `npm run db:push` completes successfully  
- [ ] You can add/edit server configurations in the UI
- [ ] Data persists between application restarts
- [ ] No "cannot connect to database" errors in logs
- [ ] Socket.IO real-time features work properly

## Performance Notes

The PostgreSQL driver with connection pooling typically provides:
- **Better performance** than HTTP-based connections
- **Lower latency** for database operations
- **Better connection management** with pooling
- **More reliable** connections for production use

Your application should now work correctly with local PostgreSQL deployment!