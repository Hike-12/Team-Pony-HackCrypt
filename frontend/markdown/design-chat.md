# design.md

> The Architect's Constitution for Component-first, Inclusive, and Scalable UI

This file is the single source of truth for Copilot to consult whenever it scaffolds, updates, or generates UI code in this repository. Always obey these rules exactly. If any generated UI violates an accessibility, spacing, or token rule below, treat it as a bug and change the code.

---

## 1. Purpose and how to use this file

- Purpose: Provide immutable, machine-readable design rules and human explanations so Copilot, maintainers, and designers create interfaces that are inclusive, consistent, accessible, and performant.
- Scope: Next.js or React projects using Tailwind CSS and Framer Motion. Theme switching via a `ThemeContext`. Icons via `react-icons`.
- How to use: Keep this file in the project root. When prompting Copilot to generate components, include `design.md` in the prompt context. Every component must reference tokens and the accessibility checklist below.

---

## 2. High level principles to enforce (always)

- Inclusive by default: Provide equivalent experiences for alternate modalities. Do not rely on color alone. Respect reduced-motion and prefers-contrast.
- Minimize cognitive load: follow Hick's Law and Miller's Law. Default controls must be simple with progressive disclosure for complexity.
- Standardize patterns: Jakob's Law. Use platform patterns for core controls. Innovate in content, not controls.
- Respect human attention: prefer finite flows, explicit user controls, and anti-dark-pattern rules.
- Grid and rhythm: 8-point spacing system for layout. Use a 4pt baseline for type line-heights.
- Semantic tokens: use functional names not color names. Declare tokens once and map to Tailwind variables.
- Performance aware: prefer variable fonts, single font-family variable files, optimized images and responsive loading patterns.

---

## 3. Design tokens

These tokens must be present as CSS variables and mapped to Tailwind theme tokens. Keep tokens semantic.

### 3.1 Color tokens

- Surface-Base: `--color-surface-base: #F5F5F5`  // Neutral 1
- Surface-Emphasis: `--color-surface-emphasis: #FFFFFF` // a slightly brighter neutral if needed
- Text-Primary: `--color-text-primary: #2C2C2C` // Neutral 2
- Brand-Base: `--color-brand-base: #1A73E8` // Base
- Accent-Interactive: `--color-accent: #F2C94C` // Accent
- Semantic-Error: `--color-error: #EB5757` // Contrast
- Border-Subtle: `--color-border-subtle: rgba(44,44,44,0.08)`
- Overlay: `--color-overlay: rgba(12,12,12,0.6)`

Notes:
- Never use a hex literal in components. Always use a semantic token name.
- For dark mode aliases, re-map the same semantic tokens to dark values in the dark theme (see Theme section).
- Dual coding: always pair color changes with an icon, text, or shape change for state.

### 3.2 Spacing tokens (8pt system)

- space-0: 0px
- space-1: 8px
- space-2: 16px
- space-3: 24px
- space-4: 32px
- space-5: 40px
- space-6: 48px
- space-7: 64px
- space-8: 80px

Implementation note: Use Tailwind spacing scale mapping to these tokens. For component internal padding prefer space-1 or space-2 depending on density.

### 3.3 Type scale (golden ratio base)

Base assumptions:
- Body (base): 16px
- Major scale ratio: 1.618 for desktop
- Mobile ratio: 1.25 for compact displays

Type tokens (rounded to nearest 4px when necessary):
- type-xs: 12px
- type-sm: 14px
- type-body: 16px
- type-h6: 18px
- type-h5: 21px
- type-h4: 26px
- type-h3: 42px
- type-h2: 68px
- type-h1: 110px (use sparingly for hero headlines; consider 64px or 68px for most sites)

Line height rules:
- Body line-height: 1.5 -> round to multiples of 4 or 8. Eg body 16px -> leading 24px.
- Headline leading should snap to 4px baseline: e.g H3 26px -> leading 32px.

Fluid typography example:
```
html { font-size: 100%; }
h1 { font-size: clamp(32px, 3.8vw, 68px); }
p  { font-size: clamp(14px, 1.6vw, 16px); }
```

### 3.4 Motion tokens

- motion-duration-fast: 150ms
- motion-duration-medium: 280ms
- motion-duration-slow: 450ms
- motion-ease-default: cubic-bezier(0.2, 0.8, 0.2, 1)
- motion-ease-spring: use framer spring with stiffness 320, damping 30

Guidelines: All interactive transitions should fall within 100ms to 400ms. Respect `prefers-reduced-motion`.

---

## 4. Tailwind integration and example tailwind.config.js

Put token mapping in `tailwind.config.js` and also expose CSS variables so that runtime theme switches are possible.

```js
// tailwind.config.js
const withOpacity = (variableName) => ({
  opacityValue,
}) => {
  if (opacityValue === undefined) return `var(${variableName})`;
  return `rgba(var(${variableName}-rgb), ${opacityValue})`;
};

module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'surface-base': 'var(--color-surface-base)',
        'text-primary': 'var(--color-text-primary)',
        'brand-base': 'var(--color-brand-base)',
        'accent': 'var(--color-accent)',
        'error': 'var(--color-error)'
      },
      spacing: {
        1: '8px',
        2: '16px',
        3: '24px',
        4: '32px',
        5: '40px',
        6: '48px',
        7: '64px'
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        h4: ['26px', '32px'],
        h3: ['42px', '48px']
      }
    }
  },
  plugins: [],
}
```

Notes:
- Also set up a `:root` CSS block that exposes the RGB components of brand colors for rgba usage, for example `--color-brand-base-rgb: 26,115,232`.
- Keep Tailwind's JIT enabled and avoid creating large unused styles.

---

## 5. ThemeContext example and runtime tokens

- Principle: Use CSS variables for token values. Toggle a `data-theme` attribute on `<html>` or `<body>` and map variables in CSS.

Example ThemeContext implementation briefly:

```jsx
import { createContext, useEffect, useState } from 'react';

export const ThemeContext = createContext({ theme: 'light', toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  function toggle() { setTheme(t => (t === 'light' ? 'dark' : 'light')); }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}
```

Example CSS mapping (global.css):

```css
:root {
  --color-surface-base: #F5F5F5;
  --color-text-primary: #2C2C2C;
  --color-brand-base: #1A73E8;
  --color-accent: #F2C94C;
  --color-error: #EB5757;
  --color-brand-base-rgb: 26,115,232;
}

[data-theme='dark'] {
  --color-surface-base: #121212;
  --color-text-primary: #F5F5F5;
  --color-brand-base: #1A73E8; /* optionally tune for dark */
}
```

Notes:
- Tailwind classes reference CSS vars. This allows runtime theme changes without re-rendering heavy components.
- Persist user theme to localStorage for cross-session consistency.

---

## 6. Component guidelines and mandatory checks (atoms and molecules)

All components must include these items before being merged into the main branch.

Checklist for every component:
- Semantic HTML tags used. No div-only skeletons for interactive elements.
- ARIA attributes where needed. Interactive elements must be keyboard accessible.
- Focus states visible and meet contrast rules.
- Color tokens used via variables, not hex literals.
- Unit tests and accessibility tests included.
- Storybook story or MDX demo with knobs for states.

### 6.1 Button component rules

- Anatomy: container, label, optional icon slot.
- Sizes: small, medium, large mapped to spacing tokens (e.g., medium = padding-y: space-1, padding-x: space-2).
- One primary button per view. Secondary and tertiary exist for alternatives.
- Click area must meet 44px minimum. If visual height is smaller, add invisible padding for hit area.
- Keyboard: Enter and Space should activate. Focus ring must be visible.
- States: default, hover, focus, active, disabled.
- Motion: use framer-motion variant for press animation and hover subtle scale. Respect reduced-motion.

Tiny example using framer-motion and tailwind:

```jsx
import { motion } from 'framer-motion';

const variants = {
  hover: { scale: 1.02, transition: { duration: 0.16 } },
  tap: { scale: 0.98 }
}

export function Button({ children, variant = 'primary', ...props }) {
  return (
    <motion.button
      variants={variants}
      whileHover="hover"
      whileTap="tap"
      className="inline-flex items-center justify-center px-4 py-2 rounded focus:outline-none focus:ring-2"
      {...props}
    >
      {children}
    </motion.button>
  )
}
```

### 6.2 Input field rules

- Labels top-aligned by default. Floating labels allowed only if implemented with accessible aria attributes and no content loss.
- Validate onBlur or onSubmit. Do not validate while typing, unless the field has finished and the user paused for 600ms.
- Show clear helper text. Error text must include actionable remediation.
- Error state includes: border color token, error icon, and helper text.
- Keyboard: ensure `aria-invalid` and `aria-describedby` link to helper/error text.

### 6.3 Card rules

- Card sections: optional media, title, body, actions.
- Use line-clamp for body preview. Provide explicit 'Read more' link if content truncates.
- If the entire card is clickable, keep inner buttons as separate accessible elements and ensure screen reader users can reach both actions.

### 6.4 Navigation rules

- Desktop navigation follows a left-to-right flow. Use mega menus for more than 7 items.
- Mobile primary nav should be a bottom nav with 3-5 primary destinations or a drawer that traps focus when open.
- Provide skip links for keyboard users to jump to page content.

### 6.5 Modal rules

- Use only for essential confirmations or transient tasks.
- Programmatically trap focus on open and restore focus on close.
- Escape closes modal. Backdrop click closes modal but confirm flow may require explicit action.

---

## 7. Form and flow rules (Onboarding, Checkout, Auth)

- Onboarding: use progressive disclosure. Avoid tooltips bombardment. Use empty states to teach.
- Authentication: provide social sign-in, magic links, and biometric options on mobile. Use show password toggle. No confirm password required.
- Checkout: allow guest checkout. For multi-step flows show progress with clear step numbers. Inline validation for payment details using Luhn check.

---

## 8. Layout system and Bento Grid

- Base grid: 12-column responsive CSS Grid with gutters that align to the 8pt spacing tokens.
- Bento grid: build modular cells that snap to the 8pt grid. Each cell defines an internal padding token.
- Use CSS Grid `grid-template-columns: repeat(12, 1fr)` and place items across columns. For responsive control use container queries where possible.

Example Bento CSS snippet:

```css
.grid-bento {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-2);
}

.cell--2x { grid-column: span 6; }
.cell--1x { grid-column: span 3; }

@container (max-width: 420px) {
  .grid-bento { grid-template-columns: 1fr; }
  .cell--2x, .cell--1x { grid-column: auto; }
}
```

---

## 9. Motion system and best practices

- Respect `prefers-reduced-motion`.
- Use motion tokens for durations and easings.
- Micro-interactions should be meaningful and short. Provide an option to disable non-essential motion in user settings.
- Use framer-motion variants for unified control. Share variants across components.

Example shared variant:

```js
export const interaction = {
  hover: { scale: 1.02, transition: { duration: 0.16 } },
  tap: { scale: 0.98 },
  focus: { boxShadow: '0 0 0 4px rgba(26,115,232,0.12)' }
}
```

---

## 10. Accessibility checklist (must pass before merge)

- Keyboard navigation:
  - All interactive elements reachable by Tab.
  - Interactive components activate with Enter or Space.
- Focus management:
  - Focus visible and meets contrast.
  - Focus trapped in modals and drawers.
- Screen readers:
  - Landmarks present: `nav`, `main`, `header`, `footer`.
  - Content order in DOM matches visual order.
- Color and contrast:
  - Text contrast 4.5:1 for body text and 3:1 for large text.
  - No information solely conveyed by color.
- Forms:
  - Labels programatically associated with controls.
  - Errors use `aria-describedby` and `aria-invalid`.
- Images:
  - Meaningful images have descriptive alt text.
  - Decorative images use empty alt.

Automated tests to run:
- axe-core or jest-axe for components
- Lighthouse CI on staging
- Keyboard-only smoke tests with Playwright or Cypress

---

## 11. Performance and resilience

- Images: use responsive `srcset`, `loading="lazy"` for below the fold, and modern formats (AVIF/WebP) where possible.
- Fonts: prefer variable fonts and font-display: swap. Subset critical character sets.
- JS: code-split heavy components, avoid large DOM trees, keep animations on the compositor by transforming and opacity only.
- Network resilience: show offline states and local caching for critical data.

---

## 12. Testing and QA

- Unit tests for component logic.
- Visual regression tests with Chromatic or Playwright snapshots.
- Accessibility tests with axe and manual checks.
- Performance budgets: page load, first contentful paint, time to interactive.

---

## 13. Governance, versioning and contribution

- Contribution model:
  - Add new component to `packages/ui/src/new-component` with story and tests.
  - Submit PR with `Design Review` and `Accessibility Review` labels.
- Promotion threshold: pattern must be used in 3+ product apps or be required by the brand to be promoted to `core` status.
- Semantic versioning for tokens and components. Breaking changes must include migration guide.

---

## 14. Copilot prompt template

When asking Copilot to generate any UI file, include these lines at the top of the prompt exactly:

```
Use design.md from the project root. Enforce tokens, 8pt spacing, type scale, accessibility checklist, and theme context. Map colors to semantic tokens and refer to Tailwind classes configured in tailwind.config.js. Create Storybook stories and unit tests for components. Do not output any hex color literals in component files. Respect reduced-motion and prefers-contrast.
```

Always include a short usage example and at least one storybook or test snippet.

---

## 15. Example component scaffolds and quick snippets

- Canonical Icon wrapper (React + react-icons):

```jsx
import { IconType } from 'react-icons';

export function Icon({ as: As, size = 20, title, ...props }) {
  return (
    <As size={size} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...props} />
  );
}
```

- Accessible input with validation flow:

```jsx
export function TextInput({ id, label, value, onChange, error, hint }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm">{label}</label>
      <input id={id} value={value} onChange={onChange} className="mt-1 block w-full" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} />
      {hint && !error && <p id={`${id}-hint`} className="text-xs">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
```

---

## 16. Designer notes and rationale

- Equivalent Experience: treat alternate modalities as first class citizens.
- Tokenization: semantic tokens allow theming and maintainable design systems.
- Grid and rhythm: 8pt + 4pt baseline produces predictable, crisp layouts.
- Psychology: always justify design decisions with the cognitive law that motivated them.

---

## 17. Quick check pre-merge checklist (copy into PR template)

- [ ] Uses tokenized colors and spacing
- [ ] Passes accessibility checklist and automated axe tests
- [ ] Focus states visible and keyboard friendly
- [ ] Motion respects reduced-motion
- [ ] Storybook stories present all states
- [ ] Unit tests included and passing
- [ ] Visual regression snapshot updated

---

## 18. Appendix and references

Keep these links in the repo README for team study:
- Humane by Design principles
- Laws of UX
- Checklist.design
- WCAG reference



End of design.md

