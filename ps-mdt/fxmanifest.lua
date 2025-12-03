fx_version 'cerulean'
game 'gta5'

author 'Flawws, Flakey, Idris and the Project Sloth team'
description 'EchoRP MDT Rewrite for QBCore'
version '2.7.3'

lua54 'yes'

shared_script 'shared/config.lua'

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/database_installer.lua',  -- Auto-creates ALL ps-mdt tables (base + new UI)
    'server/utils.lua',
    'server/dbm.lua',
    'server/main.lua'
}

client_scripts{
    'client/main.lua',
    'client/cl_impound.lua',
    'client/cl_mugshot.lua'
}

-- Conditionally load new UI files if Config.UseNewUI is true
-- Note: This is checked at runtime by the scripts themselves
server_script 'newui/server.lua'
client_script 'newui/client.lua'

-- UI page selection based on Config.UseNewUI
-- When Config.UseNewUI = true, loads the React build
-- When Config.UseNewUI = false, loads the original UI
ui_page 'newui/web/dist/index.html' -- New React UI (set Config.UseNewUI = false to use original)
-- ui_page 'ui/dashboard.html' -- Original UI (uncomment and comment above to use original)

files {
    -- Original UI files (still needed for fallback)
    'ui/img/*.png',
    'ui/img/*.webp',
    'ui/dashboard.html',
    'ui/app.js',
    'ui/style.css',
    
    -- New React UI files
    'newui/web/dist/index.html',
    'newui/web/dist/assets/*',
}
