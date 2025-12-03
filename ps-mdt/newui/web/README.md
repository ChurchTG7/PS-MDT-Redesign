# ps-mdt web

Modern React + TypeScript + Tailwind rebuild of the ps-mdt UI with a realistic tablet frame.

## Features

- **Realistic Tablet Frame**: Includes bezel, camera notch, power/volume buttons, and screen glow effects
- **Resolution Toggle**: Switch between 1080p and 720p modes (persisted in localStorage)
- **Peek Mode**: Slide the tablet down to see the game world behind it
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **TypeScript**: Full type safety throughout the codebase
- **Tailwind CSS**: Utility-first styling with MDT-inspired design tokens
- **Hot Module Reload**: Instant feedback during development

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Dev server runs at http://localhost:5174

### Build for Production

```bash
npm run build
```

Output goes to `dist/` folder.

### Type Check

```bash
npm run typecheck
```

## Project Structure

```
src/
├── components/
│   ├── TabletFrame/       # Main tablet frame with bezel, buttons, animations
│   └── NavItem.tsx        # Navigation menu item component
├── pages/
│   ├── Dashboard.tsx      # Dashboard page (placeholder)
│   ├── Reports.tsx        # Reports page (placeholder)
│   └── Map.tsx           # Map/live feed page (placeholder)
├── store/
│   └── useAppStore.ts    # Zustand store for global state
├── App.tsx               # Main app component
├── main.tsx              # React entry point
├── index.css             # Global styles + Tailwind imports
└── vite-env.d.ts         # Vite TypeScript definitions
```

## Design Tokens

The UI uses MDT-inspired CSS variables defined in `index.css`:

- `--surface-primary-rgb`: Main surface color (18, 25, 43)
- `--surface-secondary-rgb`: Secondary surface (15, 23, 42)
- `--accent-rgb`: Accent color (56, 189, 248) - cyan blue
- `--outline-rgb`: Border/outline color (36, 72, 176)

## Next Steps

- [ ] Wire NUI messaging bridge for game communication
- [ ] Implement page routing/navigation
- [ ] Build out remaining pages (Incidents, Bolos, Penalcode, etc.)
- [ ] Create shared UI primitives (Button, Card, Modal, Input, Table)
- [ ] Add data fetching and state management
- [ ] Implement search and filtering
- [ ] Add keyboard shortcuts and accessibility features

## Notes

- This is a scaffold extracted from the legacy `ps-mdt/ui` and rebuilt with modern tooling
- The tablet frame includes debug info in development builds (top-left corner)
- Resolution and peek settings are persisted in browser localStorage

