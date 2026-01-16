# � Setup Guide

A modern personal portfolio website built with Next.js 15, PostgreSQL, and Better Auth.

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon, Supabase, or local)
- Google OAuth credentials (optional, for Google Sign-In)
- Git installed

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd personal-site
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following variables:

#### Required Variables:

**Database Configuration:**
```env
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```
Get a free PostgreSQL database from [Neon](https://neon.tech) or [Supabase](https://supabase.com)

**Authentication Secrets:**
```env
BETTER_AUTH_SECRET=your-random-secret-key-here-min-32-chars
```
Generate with: `openssl rand -base64 32`

**URLs:**
```env
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Admin Credentials:**
```env
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-strong-password
```

#### Optional Variables:

**Google OAuth (for Google Sign-In):**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```
Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

**Google Analytics:**
```env
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

### 4. Set Up Database

Run database migrations:

```bash
npm run db:push
```

Seed initial data (optional):

```bash
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎯 Features

### Public Pages
- **Home** (`/`) - Hero section with introduction
- **About** (`/about`) - About me page with markdown content
- **Projects** (`/projects`) - Portfolio projects showcase
- **Writing** (`/writing`) - Blog posts listing
- **Resume** (`/resume`) - Interactive resume with skills
- **Contact** (`/contact`) - Contact information and social links
- **Stats** (`/stats`) - Personal statistics

### Admin Dashboard
Access at `/admin` with your admin credentials.

**Manage Content:**
- **About Page** - Edit markdown content for about page
- **Projects** - Create, edit, delete portfolio projects
- **Blog Posts** - Write and publish blog articles with markdown

## 📝 Using the Admin Dashboard

### 1. Login

Navigate to `/admin` and sign in with:
- Email: Your configured `ADMIN_EMAIL`
- Password: Your configured `ADMIN_PASSWORD`

Or use Google Sign-In if configured.

### 2. Manage About Page

- Go to **Dashboard → About**
- Edit markdown content
- Click **Save Changes**
- Changes appear immediately on `/about`

### 3. Manage Projects

- Go to **Dashboard → Projects**
- Click **Create New Project** or **Edit** existing
- Fill in:
  - Title (required)
  - Subtitle (optional)
  - Link URL (optional)
  - Image URL (required)
  - Date (YYYY-MM or YYYY format)
  - Description (required)
  - Technologies (comma-separated)
  - Featured checkbox
- Click **Create/Update Project**
- View on `/projects`

### 4. Manage Blog Posts

- Go to **Dashboard → Writing**
- Click **Create New Post** or **Edit** existing
- Fill in:
  - Title (required)
  - Slug (URL-friendly, e.g., `my-first-post`)
  - Description (required)
  - Cover Image URL (optional)
  - Content (Markdown supported)
  - Publish checkbox
- Click **Create/Update Post**
- Published posts appear on `/writing`

## 🎨 Customization

### Update Personal Information

Edit files in `src/data/`:
- `about.ts` - About page default content
- `contact.ts` - Contact information and social links
- `projects.ts` - Initial projects data
- `routes.ts` - Navigation menu items
- `resume/degrees.ts` - Education history
- `resume/work.ts` - Work experience
- `resume/skills.ts` - Technical skills

### Styling

The site uses CSS custom properties for theming. Edit:
- `app/styles/tokens/colors.css` - Color palette
- `app/styles/dark-mode.css` - Dark mode colors

Theme automatically switches based on user preference.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables in project settings
4. Deploy

### Other Platforms

1. Build the project:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

Set up environment variables in your hosting platform's dashboard.

## 📚 Tech Stack

- **Framework:** Next.js 15 with App Router
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Better Auth with Google OAuth
- **Styling:** Custom CSS with CSS Variables
- **UI Components:** Custom components with Radix UI primitives
- **Toast Notifications:** Sonner
- **Markdown:** markdown-to-jsx

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push database schema changes
npm run db:generate  # Generate database migrations
npm run db:seed      # Seed database with initial data
```

## 🐛 Troubleshooting

**Database Connection Issues:**
- Verify `DATABASE_URL` is correct
- Check if your IP is whitelisted (Neon/Supabase)
- Ensure SSL mode is set correctly

**Authentication Not Working:**
- Regenerate `BETTER_AUTH_SECRET`
- Verify URLs match your domain
- Check admin credentials are correct

**Google OAuth Issues:**
- Verify redirect URI in Google Console
- Ensure OAuth consent screen is configured
- Check client ID and secret are correct

## 📖 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)

## 💡 Tips

- Use strong passwords for admin account in production
- Rotate secrets regularly
- Enable database backups
- Set up monitoring and error tracking
- Use environment-specific secrets for dev/staging/production

---

**Need Help?** Open an issue or check the documentation links above.
