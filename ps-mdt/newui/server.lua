-- ============================================
-- PS-MDT NEW UI - SERVER TRANSLATION LAYER
-- ============================================
-- This file bridges the old ps-mdt server logic
-- with the new React-based UI system.
--
-- It provides additional callbacks and handlers
-- needed by the new UI while maintaining
-- compatibility with the existing ps-mdt backend.
-- ============================================

local QBCore = exports['qb-core']:GetCoreObject()

-- Check if new UI is enabled in config
if not Config.UseNewUI then
    return -- Exit if new UI is disabled
end

print('[PS-MDT NewUI] Server translation layer loaded')

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

local function GetPlayer(source)
    return QBCore.Functions.GetPlayer(source)
end

local function GetJobType(job)
    if Config.PoliceJobs[job] then
        return 'police'
    elseif Config.AmbulanceJobs[job] then
        return 'ambulance'
    end
    return nil
end

-- Check if player has Chief Menu access (uses isboss flag from qbx_management)
local function HasChiefAccess(Player)
    if not Player then return false end
    return Player.PlayerData.job.isboss == true
end

-- ============================================
-- ADDITIONAL CALLBACKS FOR NEW UI
-- ============================================

-- Dashboard Stats Callback
QBCore.Functions.CreateCallback('ps-mdt:server:getDashboardStats', function(source, cb)
    local Player = GetPlayer(source)
    if not Player then cb({success = false, error = 'player_not_found'}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false, error = 'unauthorized'}) return end
    
    -- Get stats from database
    local stats = {
        activeOfficers = 0,
        activeCalls = 0,
        activeWarrants = 0,
        recentReports = 0,
        recentIncidents = 0,
        activeBolos = 0
    }
    
    -- Count active officers
    local players = QBCore.Functions.GetQBPlayers()
    for _, v in pairs(players) do
        if v.PlayerData.job.type == jobType and v.PlayerData.job.onduty then
            stats.activeOfficers = stats.activeOfficers + 1
        end
    end
    
    -- Count active calls (from ps-dispatch if available)
    -- This is a placeholder - implement based on your dispatch system
    stats.activeCalls = 0
    
    -- Count active warrants (from mdt_convictions with warrant = 'yes')
    local warrants = MySQL.query.await('SELECT COUNT(*) as count FROM mdt_convictions WHERE warrant = "yes"', {})
    if warrants and warrants[1] then
        stats.activeWarrants = warrants[1].count or 0
    end
    
    -- Count recent reports (last 24 hours) - use 'time' column which stores date strings
    local reports = MySQL.query.await('SELECT COUNT(*) as count FROM mdt_reports WHERE time IS NOT NULL', {})
    if reports and reports[1] then
        stats.recentReports = reports[1].count or 0
    end
    
    -- Count recent incidents (last 24 hours) - use 'time' column
    local incidents = MySQL.query.await('SELECT COUNT(*) as count FROM mdt_incidents WHERE time IS NOT NULL', {})
    if incidents and incidents[1] then
        stats.recentIncidents = incidents[1].count or 0
    end
    
    -- Count active BOLOs (all BOLOs are considered active in this schema)
    local bolos = MySQL.query.await('SELECT COUNT(*) as count FROM mdt_bolos', {})
    if bolos and bolos[1] then
        stats.activeBolos = bolos[1].count or 0
    end
    
    cb({success = true, data = stats})
end)

-- Recent Activity Callback
QBCore.Functions.CreateCallback('ps-mdt:server:getRecentActivity', function(source, cb)
    local Player = GetPlayer(source)
    if not Player then cb({success = false, error = 'player_not_found'}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false, error = 'unauthorized'}) return end
    
    -- Get recent activity (last 50 items) - using 'time' column from existing schema
    local activity = MySQL.query.await([[
        SELECT 'report' as type, id, title, author, time as timestamp
        FROM mdt_reports
        WHERE time IS NOT NULL
        UNION ALL
        SELECT 'incident' as type, id, title, author, time as timestamp
        FROM mdt_incidents
        WHERE time IS NOT NULL
        UNION ALL
        SELECT 'bolo' as type, id, title, author, time as timestamp
        FROM mdt_bolos
        WHERE time IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT 50
    ]], {})
    
    cb({success = true, data = activity or {}})
end)

-- Active Warrants Callback
QBCore.Functions.CreateCallback('ps-mdt:server:getActiveWarrants', function(source, cb)
    local Player = GetPlayer(source)
    if not Player then cb({success = false, error = 'player_not_found'}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false, error = 'unauthorized'}) return end
    
    -- Get active warrants from mdt_convictions where warrant = 'yes'
    local warrants = MySQL.query.await('SELECT * FROM mdt_convictions WHERE warrant = "yes" ORDER BY id DESC LIMIT 20', {})
    
    cb({success = true, data = warrants or {}})
end)

-- Reports Callback
QBCore.Functions.CreateCallback('ps-mdt:server:getReports', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({success = false, error = 'player_not_found'}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false, error = 'unauthorized'}) return end
    
    -- Get reports with optional search/filter
    local query = 'SELECT * FROM mdt_reports ORDER BY id DESC LIMIT 50'
    local reports = MySQL.query.await(query, {})
    
    cb({success = true, data = reports or {}})
end)

-- Incidents Callback
QBCore.Functions.CreateCallback('ps-mdt:server:getIncidents', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({success = false, error = 'player_not_found'}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false, error = 'unauthorized'}) return end
    
    -- Get incidents with optional search/filter
    local query = 'SELECT * FROM mdt_incidents ORDER BY id DESC LIMIT 50'
    local incidents = MySQL.query.await(query, {})
    
    cb({success = true, data = incidents or {}})
end)

-- BOLOs Callback
QBCore.Functions.CreateCallback('ps-mdt:server:getBolos', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({success = false, error = 'player_not_found'}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false, error = 'unauthorized'}) return end
    
    -- Get BOLOs (all are considered active in this schema)
    local query = 'SELECT * FROM mdt_bolos ORDER BY id DESC LIMIT 50'
    local bolos = MySQL.query.await(query, {})
    
    cb({success = true, data = bolos or {}})
end)

-- Dispatch Calls Callback
QBCore.Functions.CreateCallback('ps-mdt:server:getDispatchCalls', function(source, cb)
    local Player = GetPlayer(source)
    if not Player then cb({success = false, error = 'player_not_found'}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false, error = 'unauthorized'}) return end
    
    -- Get active dispatch calls
    -- This is a placeholder - implement based on your dispatch system
    local calls = {}
    
    cb({success = true, data = calls})
end)

-- Active Units Callback
QBCore.Functions.CreateCallback('ps-mdt:server:getActiveUnits', function(source, cb)
    local Player = GetPlayer(source)
    if not Player then cb({success = false, error = 'player_not_found'}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false, error = 'unauthorized'}) return end
    
    -- Get active units
    local units = {}
    local players = QBCore.Functions.GetQBPlayers()
    
    for k, v in pairs(players) do
        if v.PlayerData.job.type == jobType and v.PlayerData.job.onduty then
            local ped = GetPlayerPed(k)
            local coords = GetEntityCoords(ped)
            
            table.insert(units, {
                source = k,
                citizenid = v.PlayerData.citizenid,
                name = v.PlayerData.charinfo.firstname .. ' ' .. v.PlayerData.charinfo.lastname,
                callsign = v.PlayerData.metadata.callsign or 'N/A',
                rank = v.PlayerData.job.grade.name,
                coords = {x = coords.x, y = coords.y, z = coords.z},
                status = 'available' -- This should be tracked separately
            })
        end
    end
    
    cb({success = true, data = units})
end)

-- Cameras Callback
QBCore.Functions.CreateCallback('ps-mdt:server:getCameras', function(source, cb)
    local Player = GetPlayer(source)
    if not Player then cb({success = false, error = 'player_not_found'}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false, error = 'unauthorized'}) return end
    
    -- Get cameras from config or database
    local cameras = Config.SecurityCameras or {}
    
    cb({success = true, data = cameras})
end)

-- Get Client Error Logs (paginated + optional search)
QBCore.Functions.CreateCallback('ps-mdt:server:getClientErrors', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({ success = false, error = 'player_not_found' }) return end
    local jobType = GetJobType(Player.PlayerData.job.name)
    -- Only chiefs or debug can access logs
    if not (HasChiefAccess(Player) or Config.Debug) then cb({ success = false, error = 'unauthorized' }) return end

    local page = tonumber(data and data.page) or 1
    local perPage = tonumber(data and data.perPage) or 25
    local search = data and data.search or ''
    local offset = (page - 1) * perPage

    local whereClause = ''
    local params = {}
    if search and search ~= '' then
        whereClause = ' WHERE text LIKE :search '
        params['search'] = '%' .. tostring(search) .. '%'
    end

    -- Count total matching rows
    local countQuery = 'SELECT COUNT(*) as total FROM mdt_logs' .. whereClause
    local totalRes = MySQL.query.await(countQuery, params)
    local total = 0
    if totalRes and totalRes[1] then total = totalRes[1].total or 0 end

    local query = 'SELECT id, text, time FROM mdt_logs' .. whereClause .. ' ORDER BY time DESC LIMIT :limit OFFSET :offset'
    params['limit'] = perPage
    params['offset'] = offset

    local rows = MySQL.query.await(query, params)

    cb({ success = true, data = { rows = rows or {}, total = total, page = page, perPage = perPage } })
end)

-- Evidence Callback
QBCore.Functions.CreateCallback('ps-mdt:server:getEvidenceByCaseNumber', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({success = false, error = 'player_not_found'}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false, error = 'unauthorized'}) return end
    
    if not data or not data.caseNumber then
        cb({success = false, error = 'missing_case_number'})
        return
    end
    
    -- Get evidence by case number
    local evidence = MySQL.query.await('SELECT * FROM mdt_evidence WHERE case_number = ?', {data.caseNumber})
    
    cb({success = true, data = evidence or {}})
end)

-- ============================================
-- CHIEF MENU CALLBACKS
-- ============================================

-- Check if player can access Chief Menu
QBCore.Functions.CreateCallback('ps-mdt:server:canAccessChief', function(source, cb)
    local Player = GetPlayer(source)
    if not Player then 
        cb({success = true, data = {allowed = false}}) 
        return 
    end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then 
        cb({success = true, data = {allowed = false}}) 
        return 
    end
    
    -- Check if player has chief permissions (isboss flag)
    local allowed = HasChiefAccess(Player)
    
    if Config.Debug then
        local isBoss = Player.PlayerData.job.isboss and true or false
        print(('[PS-MDT NewUI] Chief access check for %s: isboss=%s, allowed=%s'):format(
            Player.PlayerData.citizenid, 
            tostring(isBoss),
            tostring(allowed)
        ))
    end
    
    cb({success = true, data = {allowed = allowed}})
end)

-- Get Officer Roster
QBCore.Functions.CreateCallback('ps-mdt:server:getOfficerRoster', function(source, cb)
    local Player = GetPlayer(source)
    if not Player then cb({}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({}) return end
    
    -- Check if player has chief permissions (high rank)
    if not HasChiefAccess(Player) then
        cb({})
        return
    end
    
    -- Get all officers from the job
    local officers = {}
    local result = MySQL.query.await([[
        SELECT 
            p.citizenid as id,
            p.charinfo,
            p.job,
            p.metadata,
            COUNT(DISTINCT i.id) as incidents,
            COUNT(DISTINCT r.id) as arrests,
            0 as warnings
        FROM players p
        LEFT JOIN mdt_incidents i ON JSON_CONTAINS(i.officers, JSON_QUOTE(p.citizenid))
        LEFT JOIN mdt_reports r ON JSON_CONTAINS(r.officers, JSON_QUOTE(p.citizenid)) AND r.type = 'arrest'
        WHERE JSON_EXTRACT(p.job, '$.name') = ?
        GROUP BY p.citizenid
    ]], {Player.PlayerData.job.name})
    
    for _, officer in ipairs(result) do
        local charinfo = json.decode(officer.charinfo)
        local job = json.decode(officer.job)
        local metadata = json.decode(officer.metadata)
        
        table.insert(officers, {
            id = officer.id,
            name = charinfo.firstname .. ' ' .. charinfo.lastname,
            callsign = metadata.callsign or 'N/A',
            rank = job.grade.name or 'Officer',
            badge = metadata.callsign or '000',
            department = job.name,
            status = 'active',
            onDuty = job.onduty or false,
            incidents = officer.incidents or 0,
            arrests = officer.arrests or 0,
            warnings = officer.warnings or 0
        })
    end
    
    cb(officers)
end)

-- Get Applications (for hiring tab)
QBCore.Functions.CreateCallback('ps-mdt:server:getApplications', function(source, cb)
    local Player = GetPlayer(source)
    if not Player then cb({}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({}) return end
    
    -- Check chief permissions
    if not HasChiefAccess(Player) then
        cb({})
        return
    end
    
    -- Get applications from database
    local applications = MySQL.query.await([[
        SELECT * FROM mdt_applications 
        WHERE job_name = ? AND status = 'pending'
        ORDER BY created_at DESC
    ]], {Player.PlayerData.job.name})
    
    cb(applications or {})
end)

-- Approve Application
QBCore.Functions.CreateCallback('ps-mdt:server:approveApplication', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({success = false}) return end
    
    if not HasChiefAccess(Player) then
        cb({success = false, error = 'unauthorized'})
        return
    end
    
    if not data or not data.applicationId then
        cb({success = false, error = 'missing_data'})
        return
    end
    
    -- Update application status
    local updated = MySQL.update.await([[
        UPDATE mdt_applications 
        SET status = 'approved', approved_by = ?, approved_at = NOW()
        WHERE id = ?
    ]], {Player.PlayerData.citizenid, data.applicationId})
    
    cb({success = updated > 0})
end)

-- Reject Application
QBCore.Functions.CreateCallback('ps-mdt:server:rejectApplication', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({success = false}) return end
    
    if not HasChiefAccess(Player) then
        cb({success = false, error = 'unauthorized'})
        return
    end
    
    if not data or not data.applicationId then
        cb({success = false, error = 'missing_data'})
        return
    end
    
    -- Update application status
    local updated = MySQL.update.await([[
        UPDATE mdt_applications 
        SET status = 'rejected', rejected_by = ?, rejected_at = NOW()
        WHERE id = ?
    ]], {Player.PlayerData.citizenid, data.applicationId})
    
    cb({success = updated > 0})
end)

-- Get Discipline Records
QBCore.Functions.CreateCallback('ps-mdt:server:getDisciplineRecords', function(source, cb)
    local Player = GetPlayer(source)
    if not Player then cb({}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({}) return end
    
    -- Check chief permissions
    if not HasChiefAccess(Player) then
        cb({})
        return
    end
    
    -- Get discipline records
    local records = MySQL.query.await([[
        SELECT * FROM mdt_discipline 
        WHERE job_name = ?
        ORDER BY created_at DESC
        LIMIT 100
    ]], {Player.PlayerData.job.name})
    
    cb(records or {})
end)

-- Send Department Announcement
QBCore.Functions.CreateCallback('ps-mdt:server:sendDepartmentAnnouncement', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({success = false}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false}) return end
    
    if not HasChiefAccess(Player) then
        cb({success = false, error = 'unauthorized'})
        return
    end
    
    if not data or not data.message then
        cb({success = false, error = 'missing_message'})
        return
    end
    
    -- Broadcast to all online officers
    local players = QBCore.Functions.GetQBPlayers()
    for k, v in pairs(players) do
        if v.PlayerData.job.type == jobType then
            TriggerClientEvent('QBCore:Notify', k, '📢 ANNOUNCEMENT: ' .. data.message, 'primary', 8000)
            TriggerClientEvent('ps-mdt:client:announcement', k, {
                title = data.title or 'Department Announcement',
                message = data.message,
                from = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
            })
        end
    end
    
    -- Log to database
    MySQL.insert.await([[
        INSERT INTO mdt_logs (job_name, action, details, citizenid, created_at)
        VALUES (?, 'announcement', ?, ?, NOW())
    ]], {Player.PlayerData.job.name, data.message, Player.PlayerData.citizenid})
    
    cb({success = true})
end)

-- Send Emergency Alert
QBCore.Functions.CreateCallback('ps-mdt:server:sendEmergencyAlert', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({success = false}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false}) return end
    
    if not HasChiefAccess(Player) then
        cb({success = false, error = 'unauthorized'})
        return
    end
    
    -- Broadcast emergency alert
    local players = QBCore.Functions.GetQBPlayers()
    for k, v in pairs(players) do
        if v.PlayerData.job.type == jobType then
            TriggerClientEvent('QBCore:Notify', k, '🚨 EMERGENCY: ' .. (data.message or 'All units respond'), 'error', 10000)
            TriggerClientEvent('ps-mdt:client:emergencyAlert', k, {
                message = data.message or 'Emergency alert issued',
                from = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
            })
        end
    end
    
    cb({success = true})
end)

-- Send All Units Recall
QBCore.Functions.CreateCallback('ps-mdt:server:sendAllUnitsRecall', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({success = false}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false}) return end
    
    if not HasChiefAccess(Player) then
        cb({success = false, error = 'unauthorized'})
        return
    end
    
    -- Broadcast recall
    local players = QBCore.Functions.GetQBPlayers()
    for k, v in pairs(players) do
        if v.PlayerData.job.type == jobType and v.PlayerData.job.onduty then
            TriggerClientEvent('QBCore:Notify', k, '📣 ALL UNITS: Return to station immediately', 'warning', 8000)
            TriggerClientEvent('ps-mdt:client:recall', k, {
                message = data.message or 'Return to station',
                from = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
            })
        end
    end
    
    cb({success = true})
end)

-- Generate Audit Report
QBCore.Functions.CreateCallback('ps-mdt:server:generateAuditReport', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({success = false}) return end
    
    if not HasChiefAccess(Player) then
        cb({success = false, error = 'unauthorized'})
        return
    end
    
    -- Generate report data
    local reportData = {
        generatedBy = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname,
        timestamp = os.date('%Y-%m-%d %H:%M:%S'),
        period = data.period or 'monthly'
    }
    
    cb({success = true, data = reportData})
end)

-- Call Staff Meeting
QBCore.Functions.CreateCallback('ps-mdt:server:callStaffMeeting', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({success = false}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false}) return end
    
    if not HasChiefAccess(Player) then
        cb({success = false, error = 'unauthorized'})
        return
    end
    
    -- Notify supervisors (rank 3+)
    local players = QBCore.Functions.GetQBPlayers()
    for k, v in pairs(players) do
        if v.PlayerData.job.type == jobType and v.PlayerData.job.grade.level >= 3 then
            TriggerClientEvent('QBCore:Notify', k, '📋 MEETING: ' .. (data.message or 'Staff meeting called'), 'info', 8000)
        end
    end
    
    cb({success = true})
end)

-- Issue Commendation
QBCore.Functions.CreateCallback('ps-mdt:server:issueCommendation', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({success = false}) return end
    
    if not HasChiefAccess(Player) then
        cb({success = false, error = 'unauthorized'})
        return
    end
    
    if not data or not data.officerId or not data.reason then
        cb({success = false, error = 'missing_data'})
        return
    end
    
    -- Save commendation to database
    local inserted = MySQL.insert.await([[
        INSERT INTO mdt_commendations (citizenid, reason, issued_by, created_at)
        VALUES (?, ?, ?, NOW())
    ]], {data.officerId, data.reason, Player.PlayerData.citizenid})
    
    -- Notify the officer
    local targetPlayer = QBCore.Functions.GetPlayerByCitizenId(data.officerId)
    if targetPlayer then
        TriggerClientEvent('QBCore:Notify', targetPlayer.PlayerData.source, '⭐ You received a commendation: ' .. data.reason, 'success', 8000)
    end
    
    cb({success = inserted ~= nil})
end)

-- Department Chat Callback
QBCore.Functions.CreateCallback('ps-mdt:server:getDepartmentChat', function(source, cb)
    local Player = GetPlayer(source)
    if not Player then cb({success = false, error = 'player_not_found'}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false, error = 'unauthorized'}) return end
    
    -- Get recent chat messages
    local messages = MySQL.query.await([[
        SELECT * FROM mdt_chat_messages 
        WHERE job_type = ? AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ORDER BY created_at DESC
        LIMIT 100
    ]], {jobType})
    
    cb({success = true, data = messages or {}})
end)

-- Send Department Message Callback
QBCore.Functions.CreateCallback('ps-mdt:server:sendDepartmentMessage', function(source, cb, data)
    local Player = GetPlayer(source)
    if not Player then cb({success = false, error = 'player_not_found'}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false, error = 'unauthorized'}) return end
    
    if not data or not data.message or data.message == '' then
        cb({success = false, error = 'empty_message'})
        return
    end
    
    -- Insert message into database
    local insertId = MySQL.insert.await([[
        INSERT INTO mdt_chat_messages (job_type, citizenid, author, message, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ]], {
        jobType,
        Player.PlayerData.citizenid,
        Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname,
        data.message
    })
    
    if insertId then
        -- Broadcast message to all online officers of same job type
        local messageData = {
            id = insertId,
            author = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname,
            message = data.message,
            timestamp = os.time()
        }
        
        local players = QBCore.Functions.GetQBPlayers()
        for k, v in pairs(players) do
            if v.PlayerData.job.type == jobType then
                TriggerClientEvent('ps-mdt:client:deptChatMessage', k, messageData)
            end
        end
        
        cb({success = true, data = messageData})
    else
        cb({success = false, error = 'database_error'})
    end
end)

-- ============================================
-- COMPATIBILITY LAYER
-- ============================================
-- These callbacks ensure compatibility with
-- the old ps-mdt system while the new UI is active

-- Override the open MDT event to send new UI data structure
RegisterNetEvent('mdt:server:openMDT', function()
    local src = source
    local Player = GetPlayer(src)
    if not Player then return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then 
        TriggerClientEvent('QBCore:Notify', src, 'You are not authorized to access the MDT', 'error')
        return
    end
    
    -- Gather dashboard data
    local bulletin = GetBulletins(jobType) or {}
    local activeUnits = {}
    local calls = {}
    
    -- Get active units
    local players = QBCore.Functions.GetQBPlayers()
    for k, v in pairs(players) do
        if v.PlayerData.job.type == jobType and v.PlayerData.job.onduty then
            table.insert(activeUnits, {
                citizenid = v.PlayerData.citizenid,
                name = v.PlayerData.charinfo.firstname .. ' ' .. v.PlayerData.charinfo.lastname,
                callsign = v.PlayerData.metadata.callsign or 'N/A',
                rank = v.PlayerData.job.grade.name
            })
        end
    end
    
    -- Get department theme
    local theme = {}
    if Config.DepartmentThemes then
        QBCore.Functions.TriggerCallback('mdt:server:getDepartmentTheme', src, function(result)
            theme = result and result.data or {}
        end)
    end
    
    -- Send open event with new data structure
    TriggerClientEvent('ps-mdt:client:open', src, {
        job = Player.PlayerData.job.name,
        jobType = jobType,
        player = {
            citizenid = Player.PlayerData.citizenid,
            firstname = Player.PlayerData.charinfo.firstname,
            lastname = Player.PlayerData.charinfo.lastname,
            callsign = Player.PlayerData.metadata.callsign or "N/A",
            rank = Player.PlayerData.job.grade.name or "Officer",
            department = Player.PlayerData.job.name,
            badgeNumber = Player.PlayerData.metadata.callsign or "000",
            phone = Player.PlayerData.charinfo.phone or "N/A"
        },
        bulletin = bulletin,
        activeUnits = activeUnits,
        calls = calls,
        theme = theme,
        debug = Config.Debug or false
    })
end)

print('[PS-MDT NewUI] Server translation layer ready')

-- ============================================
-- PENAL CODES CALLBACK
-- ============================================
-- Returns penal codes from Config in the format expected by the new UI
QBCore.Functions.CreateCallback('ps-mdt:server:getPenalCodes', function(source, cb)
    local Player = GetPlayer(source)
    if not Player then cb({success = false, error = 'player_not_found'}) return end
    
    local jobType = GetJobType(Player.PlayerData.job.name)
    if not jobType then cb({success = false, error = 'unauthorized'}) return end
    
    -- Transform Config.PenalCode to flat array format expected by UI
    local penalCodes = {}
    local titles = Config.PenalCodeTitles or {}
    local codes = Config.PenalCode or {}
    
    for categoryIndex, categoryTitle in pairs(titles) do
        local categoryOffenses = codes[categoryIndex] or {}
        for _, offense in pairs(categoryOffenses) do
            table.insert(penalCodes, {
                id = offense.id or ('PC-' .. tostring(#penalCodes + 1)),
                code = offense.id or '',
                title = offense.title or 'Unknown',
                description = offense.description or '',
                category = categoryTitle,
                classType = string.lower(offense.class or 'infraction'),
                fine = offense.fine or 0,
                jailTime = offense.months or 0,
                points = 0, -- Not in original config
                isActive = true,
                color = offense.color or 'green'
            })
        end
    end
    
    cb({success = true, data = penalCodes})
end)

-- Report client-side errors received from the UI
RegisterNetEvent('mdt:server:reportClientError', function(payload)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	local playerName = 'Unknown'
	if Player and Player.PlayerData and Player.PlayerData.charinfo then
		playerName = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
	end

	local message = (payload and payload.message) or 'No message'
	local stack = (payload and payload.stack) or ''
	local extra = (payload and payload.extra) or {}

	-- Log server-side (console)
	print(('[PS-MDT] Client Error reported by %s: %s'):format(playerName, message))
	if stack and stack ~= '' then
		print('[PS-MDT] Stack: ' .. tostring(stack))
	end

	-- Optionally persist to MDT logs (if AddLog is available)
	pcall(function()
		AddLog(('Client error reported by %s: %s'):format(playerName, message))
	end)
end)