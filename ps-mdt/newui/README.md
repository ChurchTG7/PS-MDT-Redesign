# PS-MDT New UI - React Redesign

A modern, redesigned React-based UI for ps-mdt that's easy to install and can be toggled on/off.

## ✨ Features

- **Modern React UI** with TypeScript
- **Responsive Design** using TailwindCSS
- **Smooth Animations** with Framer Motion
- **Interactive Map** with Leaflet
- **Real-time Updates** via Zustand state management
- **Modular Architecture** - Easy to maintain and extend
- **Drag & Drop Installation** - Just copy the folder!

## 🚀 Quick Installation (Drag & Drop)

### Option 1: For New Installations

1. **Copy the entire ps-mdt folder** to your `resources/[PS]/` directory
2. The `newui` folder is already included!
3. Open `shared/config.lua` and set:
   ```lua
   Config.UseNewUI = true
   ```
4. Build the UI (see Build Instructions below)
5. Add to your `server.cfg`:
   ```cfg
   ensure ps-mdt
   ```
6. Restart your server!

### Option 2: For Existing ps-mdt Installations

1. **Copy the `newui` folder** from this repository into your existing `ps-mdt` folder:
   ```
   resources/[PS]/ps-mdt/
   ├── client/
   ├── server/
   ├── shared/
   ├── ui/
   └── newui/          <-- Copy this folder here
       ├── web/
       ├── client.lua
       └── server.lua
   ```

2. **Update your `fxmanifest.lua`** by replacing it with the one from this repository, OR manually add these lines:

   ```lua
   -- Add to server_scripts
   server_script 'newui/server.lua'
   
   -- Add to client_scripts
   client_script 'newui/client.lua'
   
   -- Change ui_page to:
   ui_page 'newui/web/dist/index.html'
   
   -- Add to files section:
   files {
       'ui/img/*.png',
       'ui/img/*.webp',
       'ui/dashboard.html',
       'ui/app.js',
       'ui/style.css',
       
       -- New React UI files
       'newui/web/dist/index.html',
       'newui/web/dist/assets/*',
   }
   ```

3. **Update `shared/config.lua`** - Add this at the top:
   ```lua
   Config.UseNewUI = true
   Config.Debug = false  -- Set to true for debugging
   ```

4. **Build the UI** (see instructions below)

5. **Restart the resource:**
   ```
   restart ps-mdt
   ```

## 🔨 Building the UI

The React UI needs to be built before use. Follow these steps:

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Build Steps

1. Navigate to the web directory:
   ```bash
   cd resources/[PS]/ps-mdt/newui/web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build for production:
   ```bash
   npm run build
   ```

   This will create a `dist` folder with the compiled UI.

### Development Mode (Optional)

If you want to work on the UI with hot reload:

```bash
cd resources/[PS]/ps-mdt/newui/web
npm run dev
```

This will start a development server at `http://localhost:5173`

## ⚙️ Configuration

### Enabling/Disabling the New UI

In `shared/config.lua`:

```lua
-- Use new React UI
Config.UseNewUI = true

-- Use original UI
Config.UseNewUI = false
```

### Debug Mode

Enable debug logging for troubleshooting:

```lua
Config.Debug = true
```

### Switching Back to Original UI

To revert to the original ps-mdt UI:

1. Set `Config.UseNewUI = false` in `shared/config.lua`
2. In `fxmanifest.lua`, change the `ui_page` line to:
   ```lua
   ui_page 'ui/dashboard.html'
   ```
3. Restart the resource

## 📁 Folder Structure

```
newui/
├── web/                    # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Dashboard, Reports, etc.)
│   │   ├── store/         # Zustand state management
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions and hooks
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── dist/              # Built files (generated after npm run build)
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.cjs
├── client.lua             # Translation layer for client
├── server.lua             # Translation layer for server
└── README.md              # This file
```

## 🔄 How It Works

The new UI system uses a **translation layer** approach:

1. **client.lua** - Bridges between the old ps-mdt client and the new React UI
   - Intercepts NUI messages
   - Translates data formats
   - Handles NUI callbacks

2. **server.lua** - Provides additional server callbacks needed by the new UI
   - Dashboard statistics
   - Real-time updates
   - Enhanced data queries

3. **web/** - The React application
   - Modern, responsive UI
   - Component-based architecture
   - State management with Zustand

The translation layer ensures **100% compatibility** with the existing ps-mdt backend while providing a fresh new interface.

## 🎨 Customization

### Changing Theme Colors

1. Navigate to `newui/web/tailwind.config.cjs`
2. Modify the color scheme in the `theme.extend.colors` section
3. Rebuild the UI: `npm run build`

### Adding Custom Pages

1. Create a new component in `newui/web/src/pages/`
2. Add routing in `newui/web/src/App.tsx`
3. Add the page to the navigation menu

### Modifying Components

All UI components are in `newui/web/src/components/`
- Edit existing components to change appearance or behavior
- Create new components for custom features

## 🐛 Troubleshooting

### UI Not Loading

1. Check that `Config.UseNewUI = true` in `shared/config.lua`
2. Verify the UI was built: check for `newui/web/dist/` folder
3. Check F8 console for errors
4. Try `refresh` then `ensure ps-mdt` in server console

### Build Errors

1. Delete `node_modules` and `dist` folders
2. Run `npm install` again
3. Run `npm run build` again

### Black Screen

1. Check browser console (F12) for errors
2. Verify all files in `fxmanifest.lua` are correct
3. Ensure `dist/` folder exists and contains `index.html`

### Data Not Loading

1. Enable debug mode: `Config.Debug = true`
2. Check server console for callback errors
3. Verify database tables exist
4. Check that your job is configured in `Config.PoliceJobs` or `Config.AmbulanceJobs`

## 📋 Requirements

- **QBCore Framework** (qb-core or qbx_core)
- **oxmysql** for database
- **Node.js v16+** (for building the UI)
- Original **ps-mdt dependencies**:
  - ox_inventory (optional)
  - qbx_evidence (optional)

## 🔗 Links

- [PS-MDT Original](https://github.com/Project-Sloth/ps-mdt)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)

## 🤝 Contributing

This is a modular UI replacement designed to be easily updated and maintained. 

### Development Workflow

1. Make changes in `newui/web/src/`
2. Test with `npm run dev`
3. Build for production: `npm run build`
4. Test in-game
5. Commit changes

## 📝 License

This project inherits the license from the original ps-mdt project.

## ⚡ Performance

The new React UI is optimized for performance:
- **Lazy loading** of pages
- **Memoized components** to prevent unnecessary re-renders
- **Optimized bundle size** with Vite
- **Efficient state management** with Zustand

## 🎯 Compatibility

- ✅ Compatible with original ps-mdt backend
- ✅ Works with qb-core and qbx_core
- ✅ Supports all ps-mdt features
- ✅ Can be toggled on/off without losing data
- ✅ No database changes required

## 📞 Support

For issues and questions:
1. Check the Troubleshooting section above
2. Enable `Config.Debug = true` for detailed logs
3. Check server and client console for errors
4. Review the original ps-mdt documentation

---

**Made with ❤️ for the FiveM Community**

*This is a UI redesign/replacement for ps-mdt. All credit for the original ps-mdt goes to Project Sloth.*
