# 🗄️ ZKQuest Database Setup Guide

This guide will help you set up the PostgreSQL database for your ZKQuest application.

## Quick Setup (Recommended)

Run the automated setup script:

```bash
./setup-db.sh
```

This script will:

-   Install PostgreSQL (if not already installed)
-   Start the PostgreSQL service
-   Create the `zkquest` database
-   Set up your `.env` file
-   Run Prisma migrations
-   Seed the database with sample data

## Manual Setup

If you prefer to set up the database manually:

### 1. Install PostgreSQL

**macOS (using Homebrew):**

```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Create the database
createdb zkquest

# Or using psql
psql -c "CREATE DATABASE zkquest;"
```

### 3. Configure Environment

Copy the environment template and update the database URL:

```bash
cp env.template .env
```

Update the `DATABASE_URL` in your `.env` file:

```
DATABASE_URL="postgresql://localhost:5432/zkquest"
```

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Run Migrations

```bash
npm run db:migrate
```

### 6. Seed Database (Optional)

```bash
npm run db:seed
```

## Database Schema

The database includes the following main tables:

-   **Users** - Wallet addresses, usernames, XP, levels
-   **Quests** - Quest details, rewards, expiry dates
-   **Claims** - Quest claim submissions and statuses
-   **Tags** - Quest categorization tags
-   **TagOnQuest** - Many-to-many relationship between quests and tags

## Useful Commands

```bash
# View database in browser
npm run db:studio

# Reset database (WARNING: This will delete all data)
npm run db:reset

# Push schema changes without migrations
npm run db:push

# Generate Prisma client after schema changes
npm run db:generate
```

## Troubleshooting

### Database Connection Issues

If you see errors like "Can't reach database server":

1. **Check if PostgreSQL is running:**

    ```bash
    brew services list | grep postgresql
    # or
    sudo systemctl status postgresql
    ```

2. **Start PostgreSQL:**

    ```bash
    brew services start postgresql@15
    # or
    sudo systemctl start postgresql
    ```

3. **Check database exists:**
    ```bash
    psql -l | grep zkquest
    ```

### Migration Issues

If migrations fail:

1. **Check database connection:**

    ```bash
    npx prisma db pull
    ```

2. **Reset and re-migrate:**
    ```bash
    npm run db:reset
    npm run db:migrate
    ```

### Permission Issues

If you get permission errors:

```bash
# Fix PostgreSQL permissions (macOS)
sudo chown -R $(whoami) /usr/local/var/postgresql@15/

# Or create a PostgreSQL user
createuser --interactive
```

## Production Setup

For production deployment, consider:

1. **Use a managed database service** (AWS RDS, Google Cloud SQL, etc.)
2. **Set up connection pooling** with PgBouncer
3. **Configure SSL connections**
4. **Set up automated backups**
5. **Monitor database performance**

## Next Steps

Once your database is set up:

1. Start your Next.js application: `npm run dev`
2. Visit http://localhost:3000/quests to see your quests
3. Visit http://localhost:3000/create to create new quests
4. Use `npm run db:studio` to manage data visually

Happy coding! 🚀
