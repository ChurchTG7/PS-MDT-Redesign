-- ============================================
-- PS-MDT COMPLETE DATABASE AUTO-INSTALLER
-- ============================================
-- Automatically checks and creates ALL missing ps-mdt database tables on resource start
-- Validates existing table structures and repairs them if needed
-- This includes both base MDT tables AND new UI tables

local DBInstaller = {}

-- Expected column definitions for each table (for validation)
local EXPECTED_COLUMNS = {
    mdt_data = {
        {name = 'id', type = 'int'},
        {name = 'cid', type = 'varchar'},
        {name = 'information', type = 'mediumtext'},
        {name = 'tags', type = 'text'},
        {name = 'gallery', type = 'text'},
        {name = 'jobtype', type = 'varchar'},
        {name = 'pfp', type = 'text'},
        {name = 'fingerprint', type = 'varchar'}
    },
    mdt_bulletin = {
        {name = 'id', type = 'int'},
        {name = 'title', type = 'text'},
        {name = 'desc', type = 'text'},
        {name = 'author', type = 'varchar'},
        {name = 'time', type = 'varchar'},
        {name = 'jobtype', type = 'varchar'}
    },
    mdt_reports = {
        {name = 'id', type = 'int'},
        {name = 'author', type = 'varchar'},
        {name = 'title', type = 'varchar'},
        {name = 'type', type = 'varchar'},
        {name = 'details', type = 'longtext'},
        {name = 'tags', type = 'text'},
        {name = 'officersinvolved', type = 'text'},
        {name = 'civsinvolved', type = 'text'},
        {name = 'gallery', type = 'text'},
        {name = 'time', type = 'varchar'},
        {name = 'jobtype', type = 'varchar'}
    },
    mdt_bolos = {
        {name = 'id', type = 'int'},
        {name = 'author', type = 'varchar'},
        {name = 'title', type = 'varchar'},
        {name = 'plate', type = 'varchar'},
        {name = 'owner', type = 'varchar'},
        {name = 'individual', type = 'varchar'},
        {name = 'detail', type = 'text'},
        {name = 'tags', type = 'text'},
        {name = 'gallery', type = 'text'},
        {name = 'officersinvolved', type = 'text'},
        {name = 'time', type = 'varchar'},
        {name = 'jobtype', type = 'varchar'}
    },
    mdt_convictions = {
        {name = 'id', type = 'int'},
        {name = 'cid', type = 'varchar'},
        {name = 'linkedincident', type = 'int'},
        {name = 'warrant', type = 'varchar'},
        {name = 'guilty', type = 'varchar'},
        {name = 'processed', type = 'varchar'},
        {name = 'associated', type = 'varchar'},
        {name = 'charges', type = 'text'},
        {name = 'fine', type = 'int'},
        {name = 'sentence', type = 'int'},
        {name = 'recfine', type = 'int'},
        {name = 'recsentence', type = 'int'},
        {name = 'time', type = 'varchar'}
    },
    mdt_incidents = {
        {name = 'id', type = 'int'},
        {name = 'author', type = 'varchar'},
        {name = 'title', type = 'varchar'},
        {name = 'details', type = 'longtext'},
        {name = 'tags', type = 'text'},
        {name = 'officersinvolved', type = 'text'},
        {name = 'civsinvolved', type = 'text'},
        {name = 'evidence', type = 'text'},
        {name = 'time', type = 'varchar'},
        {name = 'jobtype', type = 'varchar'}
    },
    mdt_logs = {
        {name = 'id', type = 'int'},
        {name = 'text', type = 'text'},
        {name = 'time', type = 'varchar'},
        {name = 'jobtype', type = 'varchar'}
    },
    mdt_vehicleinfo = {
        {name = 'id', type = 'int'},
        {name = 'plate', type = 'varchar'},
        {name = 'information', type = 'text'},
        {name = 'stolen', type = 'tinyint'},
        {name = 'code5', type = 'tinyint'},
        {name = 'image', type = 'text'},
        {name = 'points', type = 'int'}
    },
    mdt_weaponinfo = {
        {name = 'id', type = 'int'},
        {name = 'serial', type = 'varchar'},
        {name = 'owner', type = 'varchar'},
        {name = 'information', type = 'text'},
        {name = 'weapClass', type = 'varchar'},
        {name = 'weapModel', type = 'varchar'},
        {name = 'image', type = 'varchar'}
    },
    mdt_impound = {
        {name = 'id', type = 'int'},
        {name = 'vehicleid', type = 'int'},
        {name = 'linkedreport', type = 'int'},
        {name = 'fee', type = 'int'},
        {name = 'time', type = 'varchar'}
    },
    mdt_clocking = {
        {name = 'id', type = 'int'},
        {name = 'user_id', type = 'varchar'},
        {name = 'firstname', type = 'varchar'},
        {name = 'lastname', type = 'varchar'},
        {name = 'clock_in_time', type = 'varchar'},
        {name = 'clock_out_time', type = 'varchar'},
        {name = 'total_time', type = 'int'}
    },
    mdt_applications = {
        {name = 'id', type = 'int'},
        {name = 'citizenid', type = 'varchar'},
        {name = 'name', type = 'varchar'},
        {name = 'job_name', type = 'varchar'},
        {name = 'status', type = 'enum'},
        {name = 'application_data', type = 'text'},
        {name = 'approved_by', type = 'varchar'},
        {name = 'rejected_by', type = 'varchar'},
        {name = 'approved_at', type = 'timestamp'},
        {name = 'rejected_at', type = 'timestamp'},
        {name = 'created_at', type = 'timestamp'}
    },
    mdt_discipline = {
        {name = 'id', type = 'int'},
        {name = 'citizenid', type = 'varchar'},
        {name = 'officer_name', type = 'varchar'},
        {name = 'job_name', type = 'varchar'},
        {name = 'action', type = 'varchar'},
        {name = 'reason', type = 'text'},
        {name = 'severity', type = 'enum'},
        {name = 'issued_by', type = 'varchar'},
        {name = 'created_at', type = 'timestamp'}
    },
    mdt_commendations = {
        {name = 'id', type = 'int'},
        {name = 'citizenid', type = 'varchar'},
        {name = 'reason', type = 'text'},
        {name = 'issued_by', type = 'varchar'},
        {name = 'created_at', type = 'timestamp'}
    },
    mdt_chat_messages = {
        {name = 'id', type = 'int'},
        {name = 'job_type', type = 'varchar'},
        {name = 'citizenid', type = 'varchar'},
        {name = 'author', type = 'varchar'},
        {name = 'message', type = 'text'},
        {name = 'created_at', type = 'timestamp'}
    },
    mdt_staff_meetings = {
        {name = 'id', type = 'int'},
        {name = 'called_by', type = 'varchar'},
        {name = 'caller_name', type = 'varchar'},
        {name = 'meeting_time', type = 'varchar'},
        {name = 'location', type = 'varchar'},
        {name = 'agenda', type = 'text'},
        {name = 'created_at', type = 'datetime'}
    }
}

-- Column addition statements for missing columns
local COLUMN_ADDITIONS = {
    mdt_data = {
        fingerprint = "ALTER TABLE `mdt_data` ADD COLUMN `fingerprint` VARCHAR(50) DEFAULT NULL"
    },
    mdt_reports = {
        type = "ALTER TABLE `mdt_reports` ADD COLUMN `type` VARCHAR(50) DEFAULT NULL AFTER `title`"
    },
    mdt_vehicleinfo = {
        points = "ALTER TABLE `mdt_vehicleinfo` ADD COLUMN `points` INT DEFAULT 0"
    },
    mdt_logs = {
        text = "ALTER TABLE `mdt_logs` ADD COLUMN `text` TEXT NOT NULL",
        time = "ALTER TABLE `mdt_logs` ADD COLUMN `time` VARCHAR(20) DEFAULT NULL",
        jobtype = "ALTER TABLE `mdt_logs` ADD COLUMN `jobtype` VARCHAR(25) DEFAULT 'police'"
    }
}

-- List of ALL tables required by PS-MDT
local ALL_MDT_TABLES = {
    -- Base MDT Tables
    'mdt_data',
    'mdt_bulletin',
    'mdt_reports',
    'mdt_bolos',
    'mdt_convictions',
    'mdt_incidents',
    'mdt_logs',
    'mdt_vehicleinfo',
    'mdt_weaponinfo',
    'mdt_impound',
    'mdt_clocking',
    
    -- New UI Tables (Chief Menu) - Only if Config.UseNewUI is true
    'mdt_applications',
    'mdt_discipline',
    'mdt_commendations',
    'mdt_chat_messages',
    'mdt_staff_meetings'
}

-- SQL schemas for ALL tables
local TABLE_SCHEMAS = {
    -- BASE MDT TABLES
    mdt_data = [[
        CREATE TABLE IF NOT EXISTS `mdt_data` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `cid` VARCHAR(20) DEFAULT NULL,
          `information` MEDIUMTEXT DEFAULT NULL,
          `tags` TEXT NOT NULL,
          `gallery` TEXT NOT NULL,
          `jobtype` VARCHAR(25) DEFAULT 'police',
          `pfp` TEXT DEFAULT NULL,
          `fingerprint` VARCHAR(50) DEFAULT NULL,
          PRIMARY KEY (`cid`),
          KEY `id` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]],
    
    mdt_bulletin = [[
        CREATE TABLE IF NOT EXISTS `mdt_bulletin` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `title` TEXT NOT NULL,
          `desc` TEXT NOT NULL,
          `author` varchar(50) NOT NULL,
          `time` varchar(20)  NOT NULL,
          `jobtype` VARCHAR(25) DEFAULT 'police',
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]],
    
    mdt_reports = [[
        CREATE TABLE IF NOT EXISTS `mdt_reports` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `author` varchar(50) DEFAULT NULL,
          `title` varchar(255) DEFAULT NULL,
          `type` varchar(50) DEFAULT NULL,
          `details` LONGTEXT DEFAULT NULL,
          `tags` text DEFAULT NULL,
          `officersinvolved` text DEFAULT NULL,
          `civsinvolved` text DEFAULT NULL,
          `gallery` text DEFAULT NULL,
          `time` varchar(20) DEFAULT NULL,
          `jobtype` varchar(25) DEFAULT 'police',
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]],
    
    mdt_bolos = [[
        CREATE TABLE IF NOT EXISTS `mdt_bolos` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `author` varchar(50) DEFAULT NULL,
          `title` varchar(50) DEFAULT NULL,
          `plate` varchar(50) DEFAULT NULL,
          `owner` varchar(50) DEFAULT NULL,
          `individual` varchar(50) DEFAULT NULL,
          `detail` text DEFAULT NULL,
          `tags` text DEFAULT NULL,
          `gallery` text DEFAULT NULL,
          `officersinvolved` text DEFAULT NULL,
          `time` varchar(20) DEFAULT NULL,
          `jobtype` varchar(25) NOT NULL DEFAULT 'police',
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]],
    
    mdt_convictions = [[
        CREATE TABLE IF NOT EXISTS `mdt_convictions` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `cid` varchar(50) DEFAULT NULL,
          `linkedincident` int(11) NOT NULL DEFAULT 0,
          `warrant` varchar(50) DEFAULT NULL,
          `guilty` varchar(50) DEFAULT NULL,
          `processed` varchar(50) DEFAULT NULL,
          `associated` varchar(50) DEFAULT '0',
          `charges` text DEFAULT NULL,
          `fine` int(11) DEFAULT 0,
          `sentence` int(11) DEFAULT 0,
          `recfine` int(11) DEFAULT 0,
          `recsentence` int(11) DEFAULT 0,
          `time` varchar(20) DEFAULT NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]],
    
    mdt_incidents = [[
        CREATE TABLE IF NOT EXISTS `mdt_incidents` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `author` varchar(50) NOT NULL DEFAULT '',
          `title` varchar(50) NOT NULL DEFAULT '0',
          `details` LONGTEXT NOT NULL,
          `tags` text NOT NULL,
          `officersinvolved` text NOT NULL,
          `civsinvolved` text NOT NULL,
          `evidence` text NOT NULL,
          `time` varchar(20) DEFAULT NULL,
          `jobtype` varchar(25) NOT NULL DEFAULT 'police',
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]],
    
    mdt_logs = [[
        CREATE TABLE IF NOT EXISTS `mdt_logs` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `text` text NOT NULL,
          `time` varchar(20) DEFAULT NULL,
          `jobtype` varchar(25) DEFAULT 'police',
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]],
    
    mdt_vehicleinfo = [[
        CREATE TABLE IF NOT EXISTS `mdt_vehicleinfo` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `plate` varchar(50) DEFAULT NULL,
          `information` text NOT NULL DEFAULT '',
          `stolen` tinyint(1) NOT NULL DEFAULT 0,
          `code5` tinyint(1) NOT NULL DEFAULT 0,
          `image` text NOT NULL DEFAULT '',
          `points` int(11) DEFAULT 0,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]],
    
    mdt_weaponinfo = [[
        CREATE TABLE IF NOT EXISTS `mdt_weaponinfo` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `serial` varchar(50) DEFAULT NULL,
          `owner` varchar(50) DEFAULT NULL,
          `information` text NOT NULL DEFAULT '',
          `weapClass` varchar(50) DEFAULT NULL,
          `weapModel` varchar(50) DEFAULT NULL,
          `image` varchar(255) DEFAULT NULL,
          PRIMARY KEY (`id`),
          UNIQUE KEY `serial` (`serial`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]],
    
    mdt_impound = [[
        CREATE TABLE IF NOT EXISTS `mdt_impound` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `vehicleid` int(11) NOT NULL,
          `linkedreport` int(11) NOT NULL,
          `fee` int(11) DEFAULT NULL,
          `time` varchar(255) NOT NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ]],
    
    mdt_clocking = [[
        CREATE TABLE IF NOT EXISTS `mdt_clocking` (
          `id` int(10) NOT NULL AUTO_INCREMENT,
          `user_id` varchar(50) NOT NULL DEFAULT '',
          `firstname` varchar(255) NOT NULL DEFAULT '',
          `lastname` varchar(255) NOT NULL DEFAULT '',
          `clock_in_time` varchar(255) NOT NULL DEFAULT '',
          `clock_out_time` varchar(50) DEFAULT NULL,
          `total_time` int(10) NOT NULL DEFAULT '0',
          PRIMARY KEY (`user_id`) USING BTREE,
          KEY `id` (`id`) USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ]],
    
    -- NEW UI TABLES (CHIEF MENU)
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

--- Get actual columns in a table
---@param tableName string The name of the table
---@return table columns List of column names and types
local function GetTableColumns(tableName)
    local result = MySQL.query.await([[
        SELECT COLUMN_NAME, DATA_TYPE
        FROM information_schema.COLUMNS
        WHERE table_schema = DATABASE()
        AND table_name = ?
        ORDER BY ORDINAL_POSITION
    ]], {tableName})
    
    return result or {}
end

--- Validate table structure and identify missing columns
---@param tableName string The name of the table to check
---@return boolean valid, table missingColumns
local function ValidateTableStructure(tableName)
    if not EXPECTED_COLUMNS[tableName] then
        return true, {} -- No validation rules for this table
    end
    
    local actualColumns = GetTableColumns(tableName)
    local actualColumnMap = {}
    
    -- Build map of actual columns
    for _, col in ipairs(actualColumns) do
        actualColumnMap[col.COLUMN_NAME:lower()] = col.DATA_TYPE:lower()
    end
    
    -- Check for missing columns
    local missingColumns = {}
    for _, expectedCol in ipairs(EXPECTED_COLUMNS[tableName]) do
        if not actualColumnMap[expectedCol.name:lower()] then
            table.insert(missingColumns, expectedCol.name)
        end
    end
    
    return #missingColumns == 0, missingColumns
end

--- Add missing column to a table
---@param tableName string The name of the table
---@param columnName string The name of the missing column
---@return boolean success
local function AddMissingColumn(tableName, columnName)
    if not COLUMN_ADDITIONS[tableName] or not COLUMN_ADDITIONS[tableName][columnName] then
        print(('[PS-MDT] ⚠ No ALTER statement defined for %s.%s'):format(tableName, columnName))
        return false
    end
    
    local alterStmt = COLUMN_ADDITIONS[tableName][columnName]
    
    local success, err = pcall(function()
        MySQL.query.await(alterStmt)
    end)
    
    if success then
        print(('[PS-MDT] ✓ Added missing column: %s.%s'):format(tableName, columnName))
        return true
    else
        print(('[PS-MDT] ✗ Failed to add column %s.%s: %s'):format(tableName, columnName, tostring(err)))
        return false
    end
end

--- Create a single table
---@param tableName string The name of the table
---@param schema string The SQL CREATE TABLE statement
---@return boolean success True if created successfully
local function CreateTable(tableName, schema)
    print(('[PS-MDT] Creating table: %s'):format(tableName))
    
    local success, err = pcall(function()
        MySQL.query.await(schema)
    end)
    
    if success then
        print(('[PS-MDT] ✓ Table created: %s'):format(tableName))
        return true
    else
        print(('[PS-MDT] ✗ Failed to create table %s: %s'):format(tableName, tostring(err)))
        return false
    end
end

--- Main installation function
function DBInstaller.CheckAndInstall()
    local missingTables = {}
    local existingTables = {}
    local tablesToCheck = {}
    local createdCount = 0
    local repairedCount = 0
    
    -- Determine which tables to check based on config
    for _, tableName in ipairs(ALL_MDT_TABLES) do
        -- Base tables are always checked
        if tableName == 'mdt_data' or tableName == 'mdt_bulletin' or tableName == 'mdt_reports' or 
           tableName == 'mdt_bolos' or tableName == 'mdt_convictions' or tableName == 'mdt_incidents' or 
           tableName == 'mdt_logs' or tableName == 'mdt_vehicleinfo' or tableName == 'mdt_weaponinfo' or 
           tableName == 'mdt_impound' or tableName == 'mdt_clocking' then
            table.insert(tablesToCheck, tableName)
        -- New UI tables only if UseNewUI is enabled
        elseif Config.UseNewUI then
            table.insert(tablesToCheck, tableName)
        end
    end
    
    -- Check which tables exist and validate structure
    for _, tableName in ipairs(tablesToCheck) do
        if TableExists(tableName) then
            table.insert(existingTables, tableName)
            
            -- Validate existing table structure
            local valid, missingColumns = ValidateTableStructure(tableName)
            if not valid and #missingColumns > 0 then
                print(('[PS-MDT] ⚠ Table %s is missing %d column(s), attempting repair...'):format(tableName, #missingColumns))
                
                for _, columnName in ipairs(missingColumns) do
                    if AddMissingColumn(tableName, columnName) then
                        repairedCount = repairedCount + 1
                    end
                end
            end
        else
            table.insert(missingTables, tableName)
        end
    end
    
    -- Create missing tables
    if #missingTables > 0 then
        print(('[PS-MDT] Missing %d tables, creating now...'):format(#missingTables))
        
        for _, tableName in ipairs(missingTables) do
            if TABLE_SCHEMAS[tableName] then
                if CreateTable(tableName, TABLE_SCHEMAS[tableName]) then
                    createdCount = createdCount + 1
                end
            else
                print(('[PS-MDT] ✗ No schema found for table: %s'):format(tableName))
            end
        end
        
        if createdCount > 0 then
            print(('^2[PS-MDT]^7 Database: Created %d new tables'):format(createdCount))
        end
    else
        if Config.Debug then
            print('^2[PS-MDT]^7 Database: All tables exist')
        end
    end
    
    -- Report repairs
    if repairedCount > 0 then
        print(('^2[PS-MDT]^7 Database: Repaired %d column(s)'):format(repairedCount))
    end
    
    -- Return status
    return {
        total = #tablesToCheck,
        existing = #existingTables,
        created = createdCount,
        repaired = repairedCount,
        success = (#existingTables + createdCount) == #tablesToCheck
    }
end

-- ============================================
-- AUTO-INITIALIZE ON RESOURCE START
-- ============================================
CreateThread(function()
    -- Wait for database connection
    Wait(1000)
    
    print('^3[PS-MDT]^7 ═══════════════════════════════════════════')
    print('^3[PS-MDT]^7 DATABASE AUTO-INSTALLER & VALIDATOR')
    print('^3[PS-MDT]^7 ═══════════════════════════════════════════')
    
    if Config.UseNewUI then
        print('^3[PS-MDT]^7 Mode: New UI (Base + Chief Menu tables)')
    else
        print('^3[PS-MDT]^7 Mode: Classic UI (Base tables only)')
    end
    
    print('^3[PS-MDT]^7 Checking database tables & structure...')
    
    -- Run database check and installation
    local result = DBInstaller.CheckAndInstall()
    
    if result.success then
        print('^2[PS-MDT]^7 ✓ Database initialization complete!')
        
        local statusMsg = ('^2[PS-MDT]^7 Status: %d/%d tables ready'):format(result.existing + result.created, result.total)
        if result.created > 0 then
            statusMsg = statusMsg .. (' (Created: %d)'):format(result.created)
        end
        if result.repaired > 0 then
            statusMsg = statusMsg .. (' (Repaired: %d columns)'):format(result.repaired)
        end
        print(statusMsg)
    else
        print('^1[PS-MDT]^7 ✗ Database initialization failed!')
        print('^3[PS-MDT]^7 Please check SQL errors above')
    end
    
    print('^3[PS-MDT]^7 ═══════════════════════════════════════════')
end)

return DBInstaller
