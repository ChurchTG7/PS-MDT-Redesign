# PS-MDT Database Auto-Installer Fix

## Problem
The ps-mdt resource was missing database tables (`mdt_clocking` and `mdt_convictions`), causing errors on server start.

## Solution
Created a comprehensive auto-installer that automatically checks and creates **ALL** ps-mdt tables on resource start.

## What Was Changed

### 1. Created New Auto-Installer
**File:** `resources/[PS]/ps-mdt/server/database_installer.lua`
- Automatically creates all base ps-mdt tables (11 tables)
- Automatically creates new UI tables if `Config.UseNewUI = true` (5 additional tables)
- Runs on resource start and reports status
- Uses `CREATE TABLE IF NOT EXISTS` to avoid conflicts

### 2. Updated FXManifest
**File:** `resources/[PS]/ps-mdt/fxmanifest.lua`
- Changed to load the new comprehensive installer instead of the old newui-only installer
- Moved database installer to load first (before other server scripts)

## Tables Automatically Created

### Base Tables (Always Created)
1. `mdt_data` - Profile information
2. `mdt_bulletin` - Bulletin board posts
3. `mdt_reports` - Police reports
4. `mdt_bolos` - Be On the Lookout alerts
5. `mdt_convictions` - Criminal convictions/warrants ✅ (was missing)
6. `mdt_incidents` - Incident reports
7. `mdt_logs` - Activity logs
8. `mdt_vehicleinfo` - Vehicle database
9. `mdt_weaponinfo` - Weapon registry
10. `mdt_impound` - Impound records
11. `mdt_clocking` - Clock in/out records ✅ (was missing)

### New UI Tables (Only if Config.UseNewUI = true)
12. `mdt_applications` - Job applications
13. `mdt_discipline` - Disciplinary actions
14. `mdt_commendations` - Officer commendations
15. `mdt_chat_messages` - Department chat
16. `mdt_staff_meetings` - Meeting scheduler

## How to Use

### Automatic Installation (Recommended)
1. Restart the `ps-mdt` resource: `restart ps-mdt`
2. Watch the console for installation messages
3. Tables will be created automatically if missing

### Expected Console Output
```
[PS-MDT] ═══════════════════════════════════════════
[PS-MDT] DATABASE AUTO-INSTALLER
[PS-MDT] ═══════════════════════════════════════════
[PS-MDT] Mode: New UI (Base + Chief Menu tables)
[PS-MDT] Checking database tables...
[PS-MDT] Missing 2 tables, creating now...
[PS-MDT] Creating table: mdt_clocking
[PS-MDT] ✓ Table created: mdt_clocking
[PS-MDT] Creating table: mdt_convictions
[PS-MDT] ✓ Table created: mdt_convictions
[PS-MDT] Database: Created 2 new tables
[PS-MDT] ✓ Database initialization complete!
[PS-MDT] Status: 16/16 tables ready
[PS-MDT] ═══════════════════════════════════════════
```

### Manual Installation (Not Needed)
If you prefer manual installation, use: `ps-mdt-tables.sql` (in server root)

## Benefits
- ✅ No more missing table errors
- ✅ Automatic setup on resource start
- ✅ Safe to run multiple times (uses IF NOT EXISTS)
- ✅ Supports both classic and new UI modes
- ✅ Clear console feedback about what was created

## Notes
- The old `newui/database_installer.lua` is no longer used
- All table schemas match the official ps-mdt SQL files
- Compatible with both QBCore and QBox frameworks
