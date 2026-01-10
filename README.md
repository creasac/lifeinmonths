# Life in Months

A visual representation of your life as a grid of months. Each circle represents one month, helping you visualize time in a meaningful way.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Turso](https://img.shields.io/badge/Database-Turso-teal)

## Features

- **Visual Life Grid**: 80 years × 12 months displayed as a grid of circular cells
- **Month Tracking**: Rows start from your birth month with full month labels
- **Current Month Indicator**: Clock-style animation highlights the current month
- **Color & Label Cells**: Click any cell to add colors and labels for life events
- **Smart Color Selection**: Automatically suggests unused colors, then generates new harmonious colors
- **Personal Messages**: Add motivational messages that display randomly on each visit
- **Guest Mode**: Try without an account - data persists in your session
- **User Accounts**: Sign up to save your life grid permanently

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Turso (SQLite edge database)
- **ORM**: Drizzle ORM
- **Auth**: Custom session-based authentication with bcryptjs

## Deploy Your Own

### One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftimsinadipesh%2Flifeinweeks&env=TURSO_DATABASE_URL,TURSO_AUTH_TOKEN&envDescription=Turso%20database%20credentials&envLink=https%3A%2F%2Fturso.tech)

1. Click the button above
2. Create a free [Turso](https://turso.tech) database
3. Add your Turso credentials as environment variables
4. Deploy!

### Manual Deployment

#### 1. Set up Turso Database (Free)

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create lifeinweeks

# Get your database URL
turso db show lifeinweeks --url

# Create auth token
turso db tokens create lifeinweeks
```

#### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables when prompted or via dashboard:
# - TURSO_DATABASE_URL
# - TURSO_AUTH_TOKEN
```

#### 3. Push Database Schema

After deployment, run migrations:
```bash
npm run db:push
```

## Local Development

### Prerequisites

- Node.js 18+
- A Turso database (free tier available at [turso.tech](https://turso.tech))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/timsinadipesh/lifeinweeks.git
   cd lifeinweeks
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Turso credentials:
   ```
   TURSO_DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your-auth-token
   ```

4. Push database schema:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter your birth year and month to see your life grid
2. Click any circle to open the color picker
3. Choose a color and optionally add a label (e.g., "College", "First Job")
4. Sign up to save your data permanently
5. Access settings via the gear icon to update your birth date or add personal messages

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio for database management

## License

MIT License - see [LICENSE](LICENSE) file for details.
