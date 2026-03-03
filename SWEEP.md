# SWEEP.md - NexusGuard Project Guide

## 🚀 Common Commands

### Development
```bash
# Start development server (runs on http://localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Package Management
```bash
# Install dependencies
npm install

# Add a new package
npm install <package-name>

# Add a dev dependency
npm install -D <package-name>

# Update packages
npm update
```

## 📁 Project Structure

### Key Directories
- `src/components/` - React components
- `src/components/ui/` - shadcn/ui components (don't modify directly)
- `src/pages/` - Page components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions
- `src/assets/` - Static assets (images, etc.)
- `public/` - Public static files (favicon, robots.txt, etc.)

### Important Files
- `src/App.tsx` - Main application component
- `src/main.tsx` - Application entry point
- `src/index.css` - Global styles and CSS variables
- `tailwind.config.ts` - Tailwind CSS configuration
- `vite.config.ts` - Vite build configuration
- `components.json` - shadcn/ui configuration

## 🎨 Code Style & Conventions

### Component Structure
```typescript
// Prefer named exports for components
export function ComponentName() {
  return <div>...</div>
}

// Use default export only for pages
export default function PageName() {
  return <div>...</div>
}
```

### Imports
```typescript
// Use @ alias for imports
import { Component } from '@/components/Component'
import { cn } from '@/lib/utils'
```

### Styling
- Use Tailwind CSS classes for styling
- Use CSS variables for colors (defined in index.css)
- Use `cn()` utility for conditional classes
- Custom animations defined in index.css

### TypeScript
- Avoid `any` types when possible
- Use interfaces for props
- Use type for simple type aliases

## 🎨 Design System

### Color Variables (CSS)
```css
--background: #0a0a0a
--foreground: #f0f0f0
--primary: #4285F4
--accent-blue: #4285F4
--accent-purple: #AA00FF
--accent-emerald: #00E676
--accent-pink: #EA4335
```

### Tailwind Color Classes
```tsx
className="bg-primary text-primary-foreground"
className="text-accent-blue"
className="border-accent-emerald"
```

### Custom CSS Classes
```css
.gradient-text - Gradient text effect
.glass-effect - Glass morphism
.glass-navbar - Navbar glass effect
.cyber-glow - Cybersecurity glow
.gentle-animation - Smooth transitions
.subtle-shadow - Light shadow
.elevated-shadow - Prominent shadow
```

### Animations
```css
.float-gentle - Vertical floating (6s)
.drift-left - Horizontal drift left (8s)
.drift-right - Horizontal drift right (8s)
.photo-sway-1 - Rotation sway (4s)
.pulse-glow - Pulsing glow (3s)
```

## 🧩 Component Patterns

### Using shadcn/ui Components
```typescript
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

<Button variant="default">Click me</Button>
<Card className="p-6">Content</Card>
```

### Framer Motion Animations
```typescript
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### Icons
```typescript
import { Shield, Brain, Lock } from 'lucide-react'

<Shield className="w-6 h-6 text-primary" />
```

## 🔧 Configuration

### Path Aliases
- `@/` maps to `./src/`
- Configured in `tsconfig.json` and `vite.config.ts`

### Environment Variables
- Create `.env` file for environment variables
- Access with `import.meta.env.VITE_*`

### Vite Server
- Default port: 8080
- Host: `::`  (IPv6, also accepts IPv4)

## 📝 Adding New Components

### shadcn/ui Components
```bash
# Add a new shadcn component
npx shadcn-ui@latest add <component-name>
```

### Custom Components
1. Create file in `src/components/`
2. Use PascalCase for component names
3. Export as named export
4. Add TypeScript types for props

## 🐛 Debugging

### Common Issues

**Build Errors**
- Run `npm run build` to check for TypeScript errors
- Check console for specific error messages

**Styling Issues**
- Verify Tailwind classes are correct
- Check if custom CSS is in index.css
- Ensure CSS variables are defined

**Import Errors**
- Use `@/` alias for imports
- Check file extensions (.tsx, .ts)
- Verify file exists in correct location

**TypeScript Errors**
- Run `npm run lint` to see all errors
- Check tsconfig.json for configuration
- Some errors may be false positives from language server

## 📦 Dependencies

### Core
- React 18.3.1
- TypeScript 5.9.3
- Vite 5.4.21

### UI & Styling
- Tailwind CSS 3.4.19
- shadcn/ui (Radix UI primitives)
- Framer Motion 12.34.3
- Lucide React (icons)

### Forms & Validation
- React Hook Form 7.71.2
- Zod 3.25.76
- @hookform/resolvers

### Utilities
- @tanstack/react-query
- react-router-dom
- clsx, tailwind-merge

## 🎯 Project-Specific Notes

### NexusGuard Branding
- Name: **NexusGuard**
- Tagline: "AI-Powered UPI Fraud Detection"
- Logo: Shield with circuit pattern
- Colors: Blue (#4285F4), Purple (#AA00FF), Emerald (#00E676)

### Key Features
1. Real-time fraud detection (1D CNN)
2. Google Gemini AI explanations
3. MongoDB integration
4. Admin dashboard
5. Secure architecture

### Component Sections
- Hero - Video background with navigation
- Portfolio - Features grid (6 features)
- Awards - Statistics (6 metrics)
- About - How it works (5 steps)
- Services - Technology stack (3 categories)
- Team - Team members (6 people)
- Contact - Calendly integration
- Footer - Links and tech stack

## 🔐 Security Notes

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Keep dependencies updated
- Follow security best practices

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lovable Project](https://lovable.dev/projects/1169db3a-30f3-49bc-bd0b-9cda42ae0ebe)

---

**Last Updated**: 2025
**Maintained by**: NexusGuard Team
