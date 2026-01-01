# The Book

A comprehensive part-time work tracking application designed to calculate weekly hours, pay, and manage work schedules with precision.

## Project Overview

The Book is a modern web application built to help part-time workers accurately track their work hours and calculate earnings. It features intelligent overtime calculations, break deductions, tax considerations (Irish PRSI), and a complete roster management system. The application provides a dashboard-based interface for managing work schedules and monitoring financial data.

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **Radix UI** - Headless UI primitives
- **Framer Motion** - Animation library

### Backend & Services
- **Supabase** - Authentication and PostgreSQL database
- **Google OAuth** - Third-party authentication
- **Vercel** - Deployment platform

### Design System
- **Comic Neue** - Custom typography
- **next-themes** - Dark/light mode theming
- Glassmorphic design patterns

## Features

### Authentication
- Email/password authentication
- Google OAuth integration
- Secure session management with Supabase
- User profile management

### Roster Management
- Create and manage work shifts
- Track hours across multiple days
- Automatic date handling and validation
- Per-user roster data persistence

### Pay Calculation System
- Configurable hourly rates
- Overtime rate calculations (weekly threshold-based)
- Sunday premium rate tracking
- Break time deductions
- Irish PRSI tax calculations
- Weekly and total earnings tracking

### Dashboard
- Comprehensive overview of work data
- Wallet page with detailed pay breakdowns
- User profile management
- Responsive design for mobile and desktop

### UI/UX
- Interactive welcome page with animated book concept
- Smooth page transitions and animations
- Glassmorphic card designs
- Consistent blue/indigo color scheme
- Dark/light mode support

## Architecture

### Application Structure
```
Component-based architecture with individual files
- Pages: Authentication, Dashboard, Roster, Wallet, Profile
- Modular component organization
- Separation of concerns between UI and business logic
```

### Database Schema
- **user_profiles**: User data and authentication details
- **roster_entries**: Work shift records with timestamps and pay data
- Row Level Security (RLS) policies for data protection

### State Management
- React hooks (useState, useEffect, useCallback)
- Optimized re-renders with proper hook dependencies
- Session-based user state

### Performance Optimization
- Optimized database queries (selective column fetching)
- Efficient React component rendering
- Proper TypeScript integration with libraries

### Authentication Flow
- Sophisticated business logic for login vs. signup
- Google OAuth callback handling
- Session persistence and validation
- Automatic user profile creation

---
