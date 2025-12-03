-- ============================================
-- PS-MDT NEW UI - DATABASE AUTO-INSTALLER
-- ============================================
-- Automatically checks and creates missing database tables on resource start
-- Only runs when Config.UseNewUI = true

if not Config.UseNewUI then
    return -- Exit if new UI is disabled
end

local DBInstaller = {}

-- List of additional tables required by New UI (Chief Menu)
local NEWUI_TABLES = {
    'mdt_applications',
    'mdt_discipline',
    'mdt_commendations',
    'mdt_logs',
    'mdt_chat_messages',
    'mdt_staff_meetings'
}

-- SQL schema for New UI tables
local TABLE_SCHEMAS = {
    mdt_applications = [[
        CREATE TABLE IF NOT EXISTS `mdt_applications` (
          `id` INT NOT NULL AUTO_INCREMENT,
          `citizenid` VARCHAR(50) DEFAULT NULL,
          `name` VARCHAR(255) NOT NULL,
          `job_name` VARCHAR(50) NOT NULL,
          `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          `application_data` TEXT DEFAULT NULL,
          `approved_by` VARCHAR(50) DEFAULT NULL,
          `rejected_by` VARCHAR(50) DEFAULT NULL,
          `approved_at` TIMESTAMP NULL DEFAULT NULL,
          `rejected_at` TIMESTAMP NULL DEFAULT NULL,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `job_name` (`job_name`),
          KEY `status` (`status`),
          KEY `created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ]],
    
    mdt_discipline = [[
        CREATE TABLE IF NOT EXISTS `mdt_discipline` (
          `id` INT NOT NULL AUTO_INCREMENT,
          `citizenid` VARCHAR(50) NOT NULL,
          `officer_name` VARCHAR(255) NOT NULL,
          `job_name` VARCHAR(50) NOT NULL,
          `action` VARCHAR(100) NOT NULL,
          `reason` TEXT NOT NULL,
          `severity` ENUM('Minor', 'Major') DEFAULT 'Minor',
          `issued_by` VARCHAR(50) NOT NULL,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `citizenid` (`citizenid`),
          KEY `job_name` (`job_name`),
          KEY `created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ]],
    
    mdt_commendations = [[
        CREATE TABLE IF NOT EXISTS `mdt_commendations` (
          `id` INT NOT NULL AUTO_INCREMENT,
          `citizenid` VARCHAR(50) NOT NULL,
          `reason` TEXT NOT NULL,
          `issued_by` VARCHAR(50) NOT NULL,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `citizenid` (`citizenid`),
          KEY `created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ]],
    
    mdt_logs = [[
        CREATE TABLE IF NOT EXISTS `mdt_logs` (
          `id` INT NOT NULL AUTO_INCREMENT,
          `job_name` VARCHAR(50) NOT NULL,
          `action` VARCHAR(100) NOT NULL,
          `details` TEXT DEFAULT NULL,
          `citizenid` VARCHAR(50) NOT NULL,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `job_name` (`job_name`),
          KEY `action` (`action`),
          KEY `created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ]],
    
    mdt_chat_messages = [[
        CREATE TABLE IF NOT EXISTS `mdt_chat_messages` (
          `id` INT NOT NULL AUTO_INCREMENT,
          `job_type` VARCHAR(50) NOT NULL,
          `citizenid` VARCHAR(50) NOT NULL,
          `author` VARCHAR(255) NOT NULL,
          `message` TEXT NOT NULL,
          `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `job_type` (`job_type`),
          KEY `created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ]],
    
    mdt_staff_meetings = [[
        CREATE TABLE IF NOT EXISTS `mdt_staff_meetings` (
          `id` INT NOT NULL AUTO_INCREMENT,
          `called_by` VARCHAR(50) NOT NULL COMMENT 'CitizenID of officer who called meeting',
          `caller_name` VARCHAR(100) NOT NULL,
          `meeting_time` VARCHAR(100) NOT NULL,
          `location` VARCHAR(100) NOT NULL,
          `agenda` TEXT NOT NULL,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `called_by` (`called_by`),
          KEY `created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ]]
}

--- Check if a table exists in the database
---@param tableName string The name of the table to check
---@return boolean exists True if table exists, false otherwise
local function TableExists(tableName)
    local result = MySQL.scalar.await([[
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = ?
    ]], {tableName})
    
    return result and result > 0
end

--- Create a single table
---@param tableName string The name of the table
---@param schema string The SQL CREATE TABLE statement
---@return boolean success True if created successfully
local function CreateTable(tableName, schema)
    print(('[PS-MDT NewUI] Creating table: %s'):format(tableName))
    
    local success, err = pcall(function()
        MySQL.query.await(schema)
    end)
    
    if success then
        print(('[PS-MDT NewUI] ✓ Table created: %s'):format(tableName))
        return true
    else
        print(('[PS-MDT NewUI] ✗ Failed to create table %s: %s'):format(tableName, tostring(err)))
        return false
    end
end

--- Main installation function
function DBInstaller.CheckAndInstall()
    local missingTables = {}
    local existingTables = {}
    
    -- Check which tables exist
    for _, tableName in ipairs(NEWUI_TABLES) do
        if TableExists(tableName) then
            table.insert(existingTables, tableName)
        else
            table.insert(missingTables, tableName)
        end
    end
    
    if #missingTables > 0 then
        print(('[PS-MDT NewUI] Missing %d tables, creating now...'):format(#missingTables))
        
        local createdCount = 0
        for _, tableName in ipairs(missingTables) do
            if TABLE_SCHEMAS[tableName] then
                if CreateTable(tableName, TABLE_SCHEMAS[tableName]) then
                    createdCount = createdCount + 1
                end
            else
                print(('[PS-MDT NewUI] ✗ No schema found for table: %s'):format(tableName))
            end
        end
        
        if createdCount > 0 then
            print(('^2[PS-MDT NewUI]^7 Database: Created %d new tables'):format(createdCount))
        end
    else
        if Config.Debug then
            print('^2[PS-MDT NewUI]^7 Database: All tables verified ✓')
        end
    end
    
    -- Return status
    return {
        total = #NEWUI_TABLES,
        existing = #existingTables,
        created = #missingTables,
        success = #missingTables == 0 or #existingTables + #missingTables == #NEWUI_TABLES
    }
end

-- ============================================
-- AUTO-INITIALIZE ON RESOURCE START
-- ============================================
CreateThread(function()
    -- Wait for database connection
    Wait(1000)
    
    print('^3[PS-MDT NewUI]^7 ═══════════════════════════════════════════')
    print('^3[PS-MDT NewUI]^7 DATABASE AUTO-INSTALLER')
    print('^3[PS-MDT NewUI]^7 ═══════════════════════════════════════════')
    print('^3[PS-MDT NewUI]^7 Checking Chief Menu database tables...')
    
    -- Run database check and installation
    local result = DBInstaller.CheckAndInstall()
    
    if result.success then
        print('^2[PS-MDT NewUI]^7 ✓ Database initialization complete!')
        print(('^2[PS-MDT NewUI]^7 Status: %d/%d tables ready'):format(result.existing + result.created, result.total))
    else
        print('^1[PS-MDT NewUI]^7 ✗ Database initialization failed!')
        print('^3[PS-MDT NewUI]^7 Please check SQL errors above')
    end
    
    print('^3[PS-MDT NewUI]^7 ═══════════════════════════════════════════')
end)

return DBInstaller
