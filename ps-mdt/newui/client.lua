-- ============================================
-- PS-MDT NEW UI - CLIENT TRANSLATION LAYER
-- ============================================
-- This file bridges the old ps-mdt client logic
-- with the new React-based UI system.
--
-- It intercepts NUI messages and translates them
-- to work with both the old and new UI formats.
-- ============================================

local QBCore = exports['qb-core']:GetCoreObject()
local PlayerData = {}
local isOpen = false

-- Animation/prop variables (same as original ps-mdt)
local tabletObj = nil
local tabletDict = "amb@code_human_in_bus_passenger_idles@female@tablet@base"
local tabletAnim = "base"
local tabletProp = `prop_cs_tablet`
local tabletBone = 60309
local tabletOffset = vector3(0.03, 0.002, -0.0)
local tabletRot = vector3(10.0, 160.0, 0.0)

-- Check if new UI is enabled in config
if not Config.UseNewUI then
    return -- Exit if new UI is disabled
end

print('[PS-MDT NewUI] Client translation layer loaded')

-- ============================================
-- ANIMATION FUNCTIONS
-- ============================================

-- Start tablet animation and create prop
local function StartAnimation()
    if not isOpen then return end
    
    local plyPed = PlayerPedId()
    
    -- Load animation dictionary
    RequestAnimDict(tabletDict)
    while not HasAnimDictLoaded(tabletDict) do Citizen.Wait(100) end
    
    -- Load model
    RequestModel(tabletProp)
    while not HasModelLoaded(tabletProp) do Citizen.Wait(100) end
    
    -- Create tablet prop
    tabletObj = CreateObject(tabletProp, 0.0, 0.0, 0.0, true, true, false)
    local tabletBoneIndex = GetPedBoneIndex(plyPed, tabletBone)
    
    AttachEntityToEntity(tabletObj, plyPed, tabletBoneIndex, tabletOffset.x, tabletOffset.y, tabletOffset.z, tabletRot.x, tabletRot.y, tabletRot.z, true, false, false, false, 2, true)
    SetModelAsNoLongerNeeded(tabletProp)
    
    -- Animation loop
    CreateThread(function()
        while isOpen do
            Wait(0)
            if not IsEntityPlayingAnim(plyPed, tabletDict, tabletAnim, 3) then
                TaskPlayAnim(plyPed, tabletDict, tabletAnim, 3.0, 3.0, -1, 49, 0, 0, 0, 0)
            end
        end
        
        -- Cleanup when closed
        ClearPedSecondaryTask(plyPed)
        Citizen.Wait(250)
        if tabletObj and DoesEntityExist(tabletObj) then
            DetachEntity(tabletObj, true, false)
            DeleteEntity(tabletObj)
            tabletObj = nil
        end
    end)
end

-- Stop animation and remove prop
local function StopAnimation()
    local plyPed = PlayerPedId()
    ClearPedSecondaryTask(plyPed)
    
    if tabletObj and DoesEntityExist(tabletObj) then
        DetachEntity(tabletObj, true, false)
        DeleteEntity(tabletObj)
        tabletObj = nil
    end
end

-- Cleanup on resource stop
AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    StopAnimation()
end)

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get job type based on job name (police, ambulance, or nil)
local function GetJobType(job)
    if Config.PoliceJobs and Config.PoliceJobs[job] then
        return 'police'
    elseif Config.AmbulanceJobs and Config.AmbulanceJobs[job] then
        return 'ambulance'
    end
    return nil
end

local function NormalizeJobName(job)
    if type(job) ~= 'string' or job == '' then
        return 'default'
    end
    return string.lower(job)
end

local function ResolveJobContext()
    local jobName = 'unemployed'
    local jobType = 'civ'

    if PlayerData and PlayerData.job then
        jobName = PlayerData.job.name or jobName
        jobType = PlayerData.job.type or jobType
    end

    local normalizedJob = NormalizeJobName(jobName)

    local function resolveLink(map)
        if type(map) ~= 'table' then
            return ''
        end
        return map[normalizedJob] or map[jobName] or map.default or ''
    end

    return jobName, jobType, resolveLink(Config.RosterLink), resolveLink(Config.sopLink)
end

-- ============================================
-- NUI MESSAGE INTERCEPTOR
-- ============================================
-- This function intercepts SendNUIMessage calls
-- and translates old format to new React format

local originalSendNUIMessage = SendNUIMessage

-- Note: This interceptor is commented out as it may cause conflicts
-- The translation is handled directly in the callbacks instead
--[[
_G.SendNUIMessage = function(data)
    if not Config.UseNewUI then
        return originalSendNUIMessage(data)
    end

    -- Translate old message types to new action-based format
    local translatedData = data
    
    if data.type then
        -- Old format: { type = "show", enable = true, ... }
        -- New format: { action = "setVisible", data = true }
        
        local typeMapping = {
            ["show"] = function(d)
                return {
                    action = "setVisible",
                    data = d.enable or false
                }
            end,
            ["bulletin"] = function(d)
                return {
                    action = "bulletin",
                    data = d.data
                }
            end,
            ["warrants"] = function(d)
                return {
                    action = "warrants",
                    data = d.data
                }
            end,
            ["reports"] = function(d)
                return {
                    action = "reports",
                    data = d.data
                }
            end,
            ["calls"] = function(d)
                return {
                    action = "calls",
                    data = d.data
                }
            end,
            ["profileData"] = function(d)
                return {
                    action = "profileData",
                    data = d.data
                }
            end,
            ["incidents"] = function(d)
                return {
                    action = "incidents",
                    data = d.data
                }
            end,
            ["bolos"] = function(d)
                return {
                    action = "bolos",
                    data = d.data
                }
            end,
            ["call"] = function(d)
                return {
                    action = "call",
                    data = d.data
                }
            end,
        }
        
        if typeMapping[data.type] then
            translatedData = typeMapping[data.type](data)
        end
    end

    -- Send both old and new format for compatibility
    return originalSendNUIMessage(translatedData)
end
]]--

-- ============================================
-- UI VISIBILITY MANAGEMENT
-- ============================================

local function PushMdtVisibility(enable)
    -- Early safety check for PlayerData before doing anything
    if not PlayerData then
        PlayerData = QBCore.Functions.GetPlayerData()
        if not PlayerData then
            print('[PS-MDT NewUI] Error: PlayerData is nil, cannot open MDT')
            return
        end
    end

    local jobName, jobType, roster, sop = ResolveJobContext()

    -- Set NUI focus for keyboard/mouse input
    SetNuiFocus(enable, enable)
    
    -- Handle animation state
    if enable then
        isOpen = true
        StartAnimation()
    else
        isOpen = false
        StopAnimation()
    end
    
    SendNUIMessage({
        action = "setVisible",
        data = enable
    })
    
    if enable then
        -- Safety check for PlayerData
        if not PlayerData or not PlayerData.charinfo or not PlayerData.job then
            print('[PS-MDT NewUI] Warning: PlayerData not fully loaded, fetching fresh data')
            PlayerData = QBCore.Functions.GetPlayerData()
            if not PlayerData or not PlayerData.charinfo then
                print('[PS-MDT NewUI] Error: Could not load player data')
                return
            end
        end
        
        -- Send player and job data when opening
        SendNUIMessage({
            action = "setPlayerData",
            data = {
                job = jobName,
                jobType = jobType,
                player = {
                    citizenid = PlayerData.citizenid or '',
                    firstname = PlayerData.charinfo and PlayerData.charinfo.firstname or 'Unknown',
                    lastname = PlayerData.charinfo and PlayerData.charinfo.lastname or 'Officer',
                    callsign = (PlayerData.metadata and PlayerData.metadata.callsign) or "N/A",
                    rank = (PlayerData.job and PlayerData.job.grade and PlayerData.job.grade.name) or "Officer",
                    department = jobName,
                    badgeNumber = (PlayerData.metadata and PlayerData.metadata.callsign) or "000",
                    phone = (PlayerData.charinfo and PlayerData.charinfo.phone) or "N/A"
                },
                theme = {}, -- Theme will be fetched separately
                debug = Config.Debug or false
            }
        })
    end
end

-- ============================================
-- EVENT HANDLERS
-- ============================================

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    PlayerData = QBCore.Functions.GetPlayerData()
    
    -- Preload UI if authorized
    if GetJobType(PlayerData.job.name) ~= nil then
        PushMdtVisibility(false)
        
        -- Prefetch data
        SetTimeout(2000, function()
            TriggerServerEvent('mdt:requestOfficerData')
            QBCore.Functions.TriggerCallback("mdt:server:getWarrants", function() end)
        end)
    end
end)

RegisterNetEvent('QBCore:Client:OnJobUpdate', function(JobInfo)
    PlayerData.job = JobInfo
end)

RegisterNetEvent('QBCore:Player:SetPlayerData', function(val)
    PlayerData = val
end)

-- ============================================
-- CLIENT EVENT TO OPEN MDT FROM SERVER
-- ============================================
RegisterNetEvent('ps-mdt:client:open', function(data)
    print('[PS-MDT NewUI] Opening MDT', json.encode(data))
    
    -- Ensure PlayerData is loaded
    if not PlayerData or not PlayerData.charinfo or not PlayerData.job then
        PlayerData = QBCore.Functions.GetPlayerData()
        if not PlayerData or not PlayerData.charinfo then
            print('[PS-MDT NewUI] Error: Could not load player data for MDT open')
            return
        end
    end
    
    -- Send player and job data to UI
    SendNUIMessage({
        action = "setPlayerData",
        data = {
            job = data.job or (PlayerData.job and PlayerData.job.name) or 'unknown',
            jobType = data.jobType or (PlayerData.job and PlayerData.job.type) or 'civ',
            player = data.player or {
                citizenid = PlayerData.citizenid or '',
                firstname = (PlayerData.charinfo and PlayerData.charinfo.firstname) or 'Unknown',
                lastname = (PlayerData.charinfo and PlayerData.charinfo.lastname) or 'Officer',
                callsign = (PlayerData.metadata and PlayerData.metadata.callsign) or "N/A",
                rank = (PlayerData.job and PlayerData.job.grade and PlayerData.job.grade.name) or "Officer",
                department = (PlayerData.job and PlayerData.job.name) or 'unknown',
                badgeNumber = (PlayerData.metadata and PlayerData.metadata.callsign) or "000",
                phone = (PlayerData.charinfo and PlayerData.charinfo.phone) or "N/A"
            },
            theme = data.theme or {},
            debug = data.debug or Config.Debug or false
        }
    })
    
    -- Open the UI (PushMdtVisibility handles isOpen state and animation)
    PushMdtVisibility(true)
end)

-- ============================================
-- NUI CALLBACKS - TRANSLATION LAYER
-- ============================================
-- These callbacks translate between the new UI
-- and the old server callbacks

RegisterNUICallback('close', function(data, cb)
    PushMdtVisibility(false)
    cb(true)
end)

RegisterNUICallback('escape', function(data, cb)
    PushMdtVisibility(false)
    cb(true)
end)

-- Department Chat callbacks
RegisterNUICallback('getDepartmentChat', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getDepartmentChat', function(result)
        cb(result)
    end)
end)

RegisterNUICallback('sendDepartmentMessage', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:sendDepartmentMessage', function(result)
        cb(result)
    end, data)
end)

-- Theme callbacks
RegisterNUICallback('getDepartmentTheme', function(_, cb)
    QBCore.Functions.TriggerCallback('mdt:server:getDepartmentTheme', function(result)
        cb(result or { success = false })
    end)
end)

RegisterNUICallback('saveDepartmentTheme', function(data, cb)
    local payload = data and data.theme or {}
    QBCore.Functions.TriggerCallback('mdt:server:updateDepartmentTheme', function(result)
        cb(result or { success = false })
    end, payload)
end)

-- Dashboard callbacks
RegisterNUICallback('getDashboardStats', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getDashboardStats', function(result)
        cb(result)
    end)
end)

RegisterNUICallback('getRecentActivity', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getRecentActivity', function(result)
        cb(result)
    end)
end)

RegisterNUICallback('getActiveWarrants', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getActiveWarrants', function(result)
        cb(result)
    end)
end)

-- Reports callbacks
RegisterNUICallback('getReports', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getReports', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('getAllReports', function(data, cb)
    TriggerServerEvent('mdt:server:getAllReports')
    cb(true)
end)

-- Incidents callbacks
RegisterNUICallback('getIncidents', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getIncidents', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('getAllIncidents', function(data, cb)
    TriggerServerEvent('mdt:server:getAllIncidents')
    cb(true)
end)

-- BOLOs callbacks
RegisterNUICallback('getBolos', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getBolos', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('getAllBolos', function(data, cb)
    TriggerServerEvent('mdt:server:getAllBolos')
    cb(true)
end)

-- Map/Dispatch callbacks
RegisterNUICallback('getDispatchCalls', function(_, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getDispatchCalls', function(result)
        cb({ success = true, data = result or {} })
    end)
end)

RegisterNUICallback('getUnitLocations', function(_, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getActiveUnits', function(result)
        -- Normalize response - server returns {success, data} but we need to unwrap properly
        if result and result.data then
            cb({ success = true, data = result.data })
        elseif result and type(result) == 'table' and not result.success then
            -- Result is the raw array
            cb({ success = true, data = result })
        else
            cb({ success = true, data = {} })
        end
    end)
end)

-- Alias for Map.tsx which calls 'getActiveUnits'
RegisterNUICallback('getActiveUnits', function(_, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getActiveUnits', function(result)
        -- Normalize response - server returns {success, data} but we need to unwrap properly
        if result and result.data then
            cb({ success = true, data = result.data })
        elseif result and type(result) == 'table' and not result.success then
            -- Result is the raw array
            cb({ success = true, data = result })
        else
            cb({ success = true, data = {} })
        end
    end)
end)

-- Camera callbacks
RegisterNUICallback('getCameras', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getCameras', function(result)
        cb(result)
    end)
end)

-- Camera-related fallbacks / compatibility
RegisterNUICallback('getCamerasByLocation', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getCameras', function(result)
        -- Filter by location if provided
        if data and data.location and result and result.data then
            local filtered = {}
            for _, cam in ipairs(result.data) do
                if cam.location == data.location then table.insert(filtered, cam) end
            end
            cb({ success = true, data = filtered })
            return
        end
        cb(result or { success = true, data = {} })
    end)
end)

RegisterNUICallback('accessCamera', function(data, cb)
    -- No generic server callback available; fallback to not implemented
    cb({ success = false, error = 'not_implemented' })
end)

RegisterNUICallback('disableCamera', function(data, cb)
    cb({ success = false, error = 'not_implemented' })
end)

RegisterNUICallback('getCameraStatus', function(data, cb)
    cb({ success = true, data = {} })
end)

RegisterNUICallback('viewCameraFeed', function(data, cb)
    cb({ success = false, error = 'not_implemented' })
end)

RegisterNUICallback('closeCameraFeed', function(data, cb)
    cb({ success = true })
end)

-- Report client-side UI errors back to the server for diagnostics
RegisterNUICallback('reportClientError', function(data, cb)
    -- Print locally for server console
    print('[PS-MDT NewUI] Client reported error:', json.encode(data or {}))
    -- Forward to server to persist or surface in logs
    TriggerServerEvent('mdt:server:reportClientError', data or {})
    cb({ success = true })
end)

-- Evidence callbacks
RegisterNUICallback('getEvidenceByCaseNumber', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getEvidenceByCaseNumber', function(result)
        cb(result)
    end, data)
end)

-- Get client-side error logs (paginated + optional search) - restricted to chief/debug via server callback
RegisterNUICallback('getClientErrors', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getClientErrors', function(result)
        cb(result)
    end, data)
end)

-- ============================================
-- CHIEF MENU CALLBACKS
-- ============================================

-- Check if player can access Chief Menu
RegisterNUICallback('ps-mdt:chief:canAccess', function(_, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:canAccessChief', function(result)
        cb(result)
    end)
end)

-- Officer Roster
RegisterNUICallback('getOfficerRoster', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getOfficerRoster', function(result)
        cb(result)
    end)
end)

-- Applications Management
RegisterNUICallback('getApplications', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getApplications', function(result)
        cb(result)
    end)
end)

RegisterNUICallback('approveApplication', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:approveApplication', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('rejectApplication', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:rejectApplication', function(result)
        cb(result)
    end, data)
end)

-- Discipline Records
RegisterNUICallback('getDisciplineRecords', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:getDisciplineRecords', function(result)
        cb(result)
    end)
end)

-- Chief Actions
RegisterNUICallback('sendDepartmentAnnouncement', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:sendDepartmentAnnouncement', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('sendEmergencyAlert', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:sendEmergencyAlert', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('sendAllUnitsRecall', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:sendAllUnitsRecall', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('generateAuditReport', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:generateAuditReport', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('callStaffMeeting', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:callStaffMeeting', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('issueCommendation', function(data, cb)
    QBCore.Functions.TriggerCallback('ps-mdt:server:issueCommendation', function(result)
        cb(result)
    end, data)
end)

-- ============================================
-- PROFILE MANAGEMENT CALLBACKS
-- ============================================
RegisterNUICallback('searchProfiles', function(data, cb)
    QBCore.Functions.TriggerCallback('mdt:server:SearchProfile', function(result)
        -- Transform to expected format {success, data}
        if result and type(result) == 'table' then
            cb({ success = true, data = result })
        else
            cb({ success = false, error = 'not_found' })
        end
    end, data.name or data.query)
end)

-- Alias for Profile.tsx person search
RegisterNUICallback('searchPerson', function(data, cb)
    QBCore.Functions.TriggerCallback('mdt:server:SearchProfile', function(result)
        -- Transform to expected format {success, data}
        if result and type(result) == 'table' and next(result) then
            cb({ success = true, data = result })
        else
            cb({ success = false, error = 'Person not found' })
        end
    end, data.query or data.name)
end)

-- Alias for Profile.tsx vehicle search
RegisterNUICallback('searchVehicle', function(data, cb)
    QBCore.Functions.TriggerCallback('mdt:server:SearchVehicles', function(result)
        -- Transform to expected format {success, data}
        if result and type(result) == 'table' and #result > 0 then
            cb({ success = true, data = result[1] }) -- Return first match
        else
            cb({ success = false, error = 'Vehicle not found' })
        end
    end, data.query or data.plate)
end)

RegisterNUICallback('saveProfile', function(data, cb)
    TriggerServerEvent('mdt:server:saveProfile', data.pfp, data.description, data.id, data.fName, data.sName, data.tags, data.gallery, data.licenses, data.fingerprint)
    cb(true)
end)

RegisterNUICallback('getProfileData', function(data, cb)
    QBCore.Functions.TriggerCallback('mdt:server:GetProfileData', function(result)
        cb(result)
    end, data.id)
end)

RegisterNUICallback('newTag', function(data, cb)
    if data.id ~= '' and data.tag ~= '' then
        TriggerServerEvent('mdt:server:newTag', data.id, data.tag)
    end
    cb(true)
end)

RegisterNUICallback('removeProfileTag', function(data, cb)
    TriggerServerEvent('mdt:server:removeProfileTag', data.cid, data.text)
    cb({ success = true })
end)

-- Profile note management (uses newTag server event as the underlying mechanism)
RegisterNUICallback('addProfileNote', function(data, cb)
    if data.citizenid and data.note and data.note ~= '' then
        TriggerServerEvent('mdt:server:newTag', data.citizenid, data.note)
        cb({ success = true })
    else
        cb({ success = false, error = 'Invalid note data' })
    end
end)

RegisterNUICallback('updateProfileNote', function(data, cb)
    -- Not directly supported, return success to avoid UI errors
    cb({ success = true })
end)

RegisterNUICallback('deleteProfileNote', function(data, cb)
    if data.citizenid and data.note then
        TriggerServerEvent('mdt:server:removeProfileTag', data.citizenid, data.note)
        cb({ success = true })
    else
        cb({ success = false, error = 'Invalid data' })
    end
end)

RegisterNUICallback('updateLicence', function(data, cb)
    TriggerServerEvent('mdt:server:updateLicense', data.cid, data.type, data.status)
    cb(true)
end)

-- Vehicle/DMV callbacks (compatibility with original ps-mdt)
RegisterNUICallback('searchVehicles', function(data, cb)
    QBCore.Functions.TriggerCallback('mdt:server:SearchVehicles', function(result)
        cb(result)
    end, data.name)
end)

RegisterNUICallback('getVehicleData', function(data, cb)
    TriggerServerEvent('mdt:server:getVehicleData', data.plate)
    cb(true)
end)

RegisterNUICallback('saveVehicleInfo', function(data, cb)
    TriggerServerEvent('mdt:server:saveVehicleInfo', data.dbid, data.plate, data.imageurl, data.notes, data.stolen, data.code5, data.impound, data.points)
    cb(true)
end)

-- Weapon callbacks (compatibility with original ps-mdt)
RegisterNUICallback('searchWeapons', function(data, cb)
    QBCore.Functions.TriggerCallback('mdt:server:SearchWeapons', function(result)
        cb(result)
    end, data.name)
end)

RegisterNUICallback('getWeaponData', function(data, cb)
    TriggerServerEvent('mdt:server:getWeaponData', data.serial)
    cb(true)
end)

RegisterNUICallback('saveWeaponInfo', function(data, cb)
    TriggerServerEvent('mdt:server:saveWeaponInfo', data.serial, data.imageurl, data.notes, data.owner, data.weapClass, data.weapModel)
    cb(true)
end)

-- Incident management callbacks
RegisterNUICallback('searchIncidents', function(data, cb)
    TriggerServerEvent('mdt:server:searchIncidents', data.incident)
    cb(true)
end)

RegisterNUICallback('getIncidentData', function(data, cb)
    TriggerServerEvent('mdt:server:getIncidentData', data.id)
    cb(true)
end)

RegisterNUICallback('saveIncident', function(data, cb)
    TriggerServerEvent('mdt:server:saveIncident', data.ID, data.title, data.information, data.tags, data.officers, data.civilians, data.evidence, data.associated, data.time)
    cb(true)
end)

RegisterNUICallback('incidentSearchPerson', function(data, cb)
    TriggerServerEvent('mdt:server:incidentSearchPerson', data.name)
    cb(true)
end)

RegisterNUICallback('removeIncidentCriminal', function(data, cb)
    TriggerServerEvent('mdt:server:removeIncidentCriminal', data.cid, data.incidentId)
    cb(true)
end)

-- BOLO callbacks
RegisterNUICallback('searchBolos', function(data, cb)
    TriggerServerEvent('mdt:server:searchBolos', data.searchVal)
    cb(true)
end)

RegisterNUICallback('getBoloData', function(data, cb)
    TriggerServerEvent('mdt:server:getBoloData', data.id)
    cb(true)
end)

RegisterNUICallback('newBolo', function(data, cb)
    TriggerServerEvent('mdt:server:newBolo', data.existing, data.id, data.title, data.plate, data.owner, data.individual, data.detail, data.tags, data.gallery, data.officers, data.time)
    cb(true)
end)

RegisterNUICallback('deleteBolo', function(data, cb)
    TriggerServerEvent('mdt:server:deleteBolo', data.id)
    cb(true)
end)

-- Report callbacks
RegisterNUICallback('searchReports', function(data, cb)
    TriggerServerEvent('mdt:server:searchReports', data.name)
    cb(true)
end)

RegisterNUICallback('getReportData', function(data, cb)
    TriggerServerEvent('mdt:server:getReportData', data.id)
    cb(true)
end)

RegisterNUICallback('newReport', function(data, cb)
    TriggerServerEvent('mdt:server:newReport', data.existing, data.id, data.title, data.type, data.details, data.tags, data.gallery, data.officers, data.civilians, data.time)
    cb(true)
end)

RegisterNUICallback('deleteReport', function(data, cb)
    TriggerServerEvent('mdt:server:deleteReports', data.id)
    cb(true)
end)

-- Fine and community service
RegisterNUICallback('sendFine', function(data, cb)
    TriggerServerEvent('mdt:server:sendFine', data.citizenId, data.fine, data.incidentId)
    cb(true)
end)

RegisterNUICallback('sendToCommunityService', function(data, cb)
    TriggerServerEvent('mdt:server:sendToCommunityService', data.citizenId, data.sentence)
    cb(true)
end)

-- Bulletin callbacks
RegisterNUICallback('deleteBulletin', function(data, cb)
    TriggerServerEvent('mdt:server:deleteBulletin', data.id, data.title)
    cb(true)
end)

RegisterNUICallback('newBulletin', function(data, cb)
    TriggerServerEvent('mdt:server:NewBulletin', data.title, data.info, data.time)
    cb(true)
end)

-- Misc callbacks
RegisterNUICallback('getPenalCode', function(data, cb)
    -- Use new server callback that returns data directly
    QBCore.Functions.TriggerCallback('ps-mdt:server:getPenalCodes', function(result)
        cb(result or { success = false, error = 'no_data' })
    end)
end)

-- Compatibility aliases / fallbacks for NewUI action names
RegisterNUICallback('getPenalCodes', function(data, cb)
    -- Use new server callback that returns data directly
    QBCore.Functions.TriggerCallback('ps-mdt:server:getPenalCodes', function(result)
        cb(result or { success = false, error = 'no_data' })
    end)
end)

RegisterNUICallback('searchPenalCodes', function(data, cb)
    -- No dedicated server callback—fallback to returning not implemented
    print('[PS-MDT NewUI] searchPenalCodes requested but no server endpoint implemented')
    cb({ success = false, error = 'not_implemented' })
end)

RegisterNUICallback('createPenalCode', function(data, cb)
    -- Not implemented on server side in this repo
    cb({ success = false, error = 'not_implemented' })
end)

RegisterNUICallback('updatePenalCode', function(data, cb)
    cb({ success = false, error = 'not_implemented' })
end)

RegisterNUICallback('deletePenalCode', function(data, cb)
    cb({ success = false, error = 'not_implemented' })
end)

-- DMV / vehicle registration fallbacks
RegisterNUICallback('getAllLicenses', function(data, cb)
    -- Mapping not available in current server implementation; return empty set
    cb({ success = true, data = {} })
end)

RegisterNUICallback('getAllVehicleRegistrations', function(data, cb)
    cb({ success = true, data = {} })
end)

RegisterNUICallback('getAvailableVehicles', function(data, cb)
    -- There is no ps-mdt server callback for this; return empty list to avoid 404
    cb({ success = true, data = {} })
end)

RegisterNUICallback('getSettings', function(data, cb)
    -- Fallback settings; the server may implement a specific callback later
    cb({ success = true, data = {} })
end)

RegisterNUICallback('toggleDuty', function(data, cb)
    TriggerServerEvent('QBCore:ToggleDuty')
    TriggerServerEvent('ps-mdt:server:ClockSystem')
    cb(true)
end)

RegisterNUICallback('setCallsign', function(data, cb)
    TriggerServerEvent('mdt:server:setCallsign', data.cid, data.newcallsign)
    cb(true)
end)

RegisterNUICallback('setRadio', function(data, cb)
    TriggerServerEvent('mdt:server:setRadio', data.cid, data.newradio)
    cb(true)
end)

print('[PS-MDT NewUI] Client translation layer ready with full compatibility')
