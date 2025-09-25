#!/bin/bash

# ZKQuest Database Setup Script
echo "🚀 Setting up ZKQuest Database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo "📦 Installing PostgreSQL using Homebrew..."
    
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew is not installed. Please install it first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    brew install postgresql@15
    brew services start postgresql@15
else
    echo "✅ PostgreSQL is installed"
fi

# Start PostgreSQL service
echo "🔄 Starting PostgreSQL service..."
brew services start postgresql@15

# Wait a moment for service to start
sleep 2

# Create database
echo "📊 Creating zkquest database..."
createdb zkquest 2>/dev/null || echo "Database zkquest already exists"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.template .env
    
    # Update DATABASE_URL in .env
    sed -i '' 's|postgresql://username:password@localhost:5432/zkquest|postgresql://localhost:5432/zkquest|g' .env
    echo "✅ Updated DATABASE_URL in .env file"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init

# Check if migrations were successful
if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully!"
    
    # Seed the database
    echo "🌱 Seeding database with sample data..."
    npx prisma db seed
    
    echo ""
    echo "🎉 Database setup complete!"
    echo "📊 You can view your database with: npx prisma studio"
    echo "🚀 Start your Next.js app with: npm run dev"
else
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi
