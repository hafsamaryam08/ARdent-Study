# ARdent Study - Modern Design System

**Project:** AR-Powered Contextual Learning Companion  
**Brand Name:** ARdent Study  
**Design Philosophy:** Clean, modern, focused learning experience with premium typography and spacious layouts.

---

## Color Palette

### Primary Colors
- **Primary Blue:** `hsl(217 91% 52%)` - Primary actions, headings, navigation focus
- **Purple Accent:** `hsl(262 80% 50%)` - Secondary CTAs, highlights, data visualization
- **Neutrals:**
  - Background: `hsl(0 0% 98.4%)` (light), `hsl(0 0% 7%)` (dark)
  - Text: `hsl(0 0% 3.6%)` (light), `hsl(0 0% 98%)` (dark)
  - Borders: `hsl(0 0% 88%)` (light), `hsl(0 0% 20%)` (dark)
  - Cards: `hsl(0 0% 100%)` (light), `hsl(0 0% 10%)` (dark)

### Supporting Colors
- **Success:** `hsl(173 58% 39%)`
- **Warning:** `hsl(39 84% 53%)`
- **Error:** `hsl(0 84% 45%)`
- **Muted:** `hsl(0 0% 92%)` (light), `hsl(0 0% 28%)` (dark)

### Dark Mode
Automatically adapts all colors with proper contrast ratios. Light text on dark backgrounds, dark text on light backgrounds.

---

## Typography System

### Font Families
- **Display:** Space Grotesk (600, 700) - Headings, branded elements
- **Body:** Inter (300-800) - UI, body text, all functional elements

### Type Scale
- **H1:** `text-4xl` - Page titles, hero sections
- **H2:** `text-3xl` - Major section headings
- **H3:** `text-2xl` - Subsection headings
- **H4:** `text-xl` - Card titles
- **Body:** `text-base` - Standard text, leading-7
- **Small:** `text-sm` - Metadata, hints
- **Tiny:** `text-xs` - Captions, badges

### Font Weights
- Display fonts: 600-700 (semibold, bold)
- Body: 400-600 depending on hierarchy
- Emphasis: 600+ for important UI elements

---

## Spacing & Layout

### Spacing Scale
Use Tailwind units: **2, 4, 6, 8, 12, 16, 20, 24, 32**

### Core Applications
- **Component Padding:** `p-4` (mobile), `p-6` (tablet), `p-8` (desktop)
- **Section Spacing:** `mb-12` to `mb-16` between major sections
- **Card Spacing:** `p-6` internal, `gap-6` between cards
- **Form Elements:** `space-y-4` between inputs, `mb-6` between groups
- **Icon-Text:** `gap-2` to `gap-3`
- **Navigation Items:** `px-4 py-3`

### Container Max-Widths
- **Full:** No constraint
- **Content:** `max-w-7xl` - Main dashboard
- **Focused:** `max-w-4xl` - Settings, detailed views
- **Card-based:** `max-w-2xl` - Single column content
- **Auth:** `max-w-md` - Login/signup pages

### Grid Layouts
- **Feature Cards:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- **Concept Cards:** `grid-cols-1 lg:grid-cols-2 gap-8`
- **Stats:** `grid-cols-2 md:grid-cols-4 gap-6`
- **Quiz Options:** Single column (optimal readability)

---

## Component System

### Cards & Containers
- **Background:** `bg-card` with `border border-card-border`
- **Padding:** `p-6` standard, `p-8` spacious
- **Radius:** `rounded-md` (8px)
- **Shadow:** `shadow-sm` to `shadow-md`
- **Hover:** Subtle elevation with `hover-elevate`

### Buttons
- **Default:** Primary blue background, white text
- **Outline:** Border only, transparent background
- **Ghost:** No background or border
- **Sizes:** `h-9` (default), `h-8` (sm), `h-10` (lg)
- **Radius:** `rounded-md` (8px)
- **Hover/Active:** Built-in elevation effects

### Inputs & Forms
- **Styling:** `border border-input bg-background text-foreground`
- **Padding:** `px-3 py-2`
- **Radius:** `rounded-md`
- **Focus:** Ring focus state with primary color
- **Placeholder:** Muted text color

### Navigation Sidebar
- **Width:** `w-64` desktop, collapsible mobile
- **Background:** `bg-sidebar`
- **Items:** `px-4 py-3 rounded-md`
- **Active State:** `bg-primary text-primary-foreground font-semibold`
- **Icons:** Lucide React, 20-24px sizes

---

## Interaction & Feedback

### Hover Effects
- Cards: Subtle shadow elevation (`shadow-md`)
- Buttons: Built-in via elevation system
- Links: Color change, no underline unless active

### Loading States
- **Skeleton:** Gray placeholder blocks matching content shape
- **Spinners:** Centered, subtle rotation animation
- **Progress:** Linear progress bars with animated fill

### Toast Notifications
- **Position:** Bottom-right corner
- **Animation:** Slide-in from bottom, fade-out
- **Duration:** 5 seconds default
- **Colors:** Green (success), Red (error), Blue (info)

### Empty States
- **Layout:** Centered, max-w-md
- **Content:** Icon (64px), heading, description, CTA button
- **Spacing:** Generous vertical padding (py-16)

---

## Responsive Design

### Breakpoints
- **Mobile-first approach**
- **sm:** 640px - Small tablets
- **md:** 768px - Tablets
- **lg:** 1024px - Laptops
- **xl:** 1280px - Large screens

### Mobile Adaptations
- Single-column layouts (stack grids)
- Collapsed navigation (hamburger menu)
- Reduced padding: `p-4` instead of `p-6`
- Larger touch targets: minimum 44px height
- Staggered modals and overlays

### Desktop Enhancements
- Multi-column layouts activate at `md` breakpoint
- Sidebars appear at `lg` breakpoint
- Horizontal tabs/navigation at full width

---

## Dark Mode Implementation

### Automatic Theming
- CSS variables automatically switch in `.dark` class
- Tailwind classes with `dark:` prefix for explicit overrides
- All shadows, text, and colors adapt for readability

### Color Contrasts
- **Light Mode:** Dark text (3.6%) on light backgrounds (98%)
- **Dark Mode:** Light text (98%) on dark backgrounds (7-12%)
- **WCAG AA Compliance:** All color combinations meet standards

---

## Modern Design Characteristics

1. **Clean Typography:** Premium font system with clear hierarchy
2. **Generous Spacing:** Breathing room reduces cognitive load
3. **Subtle Interactions:** Smooth transitions, no jarring changes
4. **Consistent Branding:** Primary blue throughout key elements
5. **Accessible Colors:** High contrast, inclusive dark mode
6. **Card-Based Layout:** Organized information architecture
7. **Modern Shadows:** Minimal, natural elevation effects
8. **Premium Feel:** Careful attention to details and micro-interactions

---

## Design Tokens Reference

### Shadows
- `shadow-xs` - Subtle, text/tooltips
- `shadow-sm` - Cards, inputs
- `shadow-md` - Hovered elements, modals
- `shadow-lg` - Floating panels, popovers
- `shadow-xl` - Critical modals, overlays

### Radius
- `rounded-sm` - Small elements (3px)
- `rounded-md` - Standard elements (8px)
- `rounded-lg` - Large containers (12px)
- `rounded-full` - Circular elements

### Transitions
- **Fast:** 150-200ms - Quick feedback
- **Standard:** 300ms - Page transitions
- **Slow:** 500ms - Complex animations

---

This modern design system delivers a **premium, accessible learning experience** that balances visual hierarchy with information clarity. Every design choice supports student focus and achievement tracking.
