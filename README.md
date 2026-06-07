# Royal Time Traders

A premium e-commerce platform for luxury watches built with React, Vite, TailwindCSS, and Supabase.

## Features

- 🏠 Beautiful hero slider with auto-rotating banners
- 🛍️ Product browsing with search and category filters
- 🛒 Shopping cart with persistent storage
- 💳 Checkout flow with cash on delivery
- 🔐 User authentication (signup/login)
- 👨‍💼 Admin panel for product management (CRUD operations)
- 📱 Fully responsive design
- ✨ Smooth animations and premium UI

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS with custom theme
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Routing**: React Router v6
- **Icons**: React Icons
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 16+ installed
- A Supabase account and project

### Installation

1. Clone the repository or navigate to the project directory

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `supabase/schema.sql`
   - This will create tables, set up RLS policies, and add sample products

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and visit `http://localhost:3000`

## Admin Access

The admin panel is accessible only to the designated admin user:
- **Email**: snakeyes358@gmail.com
- **Password**: Useless19112004

You'll need to create this account via the signup page first, then you can access `/admin` route.

## Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components
├── context/         # React Context providers
├── supabase/        # Supabase client configuration
├── App.jsx          # Main app component with routes
├── main.jsx         # Application entry point
└── index.css        # Global styles and Tailwind imports
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Features Breakdown

### Public Features
- Browse products with search and filters
- View detailed product information
- Add products to cart
- Complete checkout with shipping information
- User registration and authentication

### Admin Features (Admin only)
- View all products in a table
- Create new products
- Edit existing products
- Delete products
- Manage product status (featured, top product)

## Database Schema

### Products Table
- id, name, description, price, category
- rating, stock, featured, top_product
- image, created_at

### Orders Table
- id, user_id, order_items (JSON)
- total_price, status, shipping_info (JSON)
- created_at

## License

This project is created for educational purposes.
