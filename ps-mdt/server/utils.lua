local QBCore = exports['qb-core']:GetCoreObject()

function GetPlayerData(source)
	local Player = QBCore.Functions.GetPlayer(source)
	if Player == nil then return end -- Player not loaded in correctly
	return Player.PlayerData
end

function UnpackJob(data)
	local job = {
		name = data.name,
		label = data.label
	}
	local grade = {
		name = data.grade.name,
	}

	return job, grade
end

function PermCheck(src, PlayerData)
	local result = true

	if not Config.AllowedJobs[PlayerData.job.name] then
		print(("UserId: %s(%d) tried to access the mdt even though they are not authorised (server direct)"):format(GetPlayerName(src), src))
		result = false
	end

	return result
end

function ProfPic(gender, profilepic)
	if profilepic then return profilepic end;
	if gender == "f" then return "img/female.png" end;
	return "img/male.png"
end

function IsJobAllowedToMDT(job)
	if Config.PoliceJobs[job] then
		return true
	elseif Config.AmbulanceJobs[job] then
		return true
	elseif Config.DojJobs[job] then
		return true
	else
		return false
	end
end

function GetNameFromPlayerData(PlayerData)
	return ('%s %s'):format(PlayerData.charinfo.firstname, PlayerData.charinfo.lastname)
end

-- ============================================
-- CLOCKIN WEBHOOK FUNCTIONS
-- ============================================

-- Format seconds to human readable time
function format_time(seconds)
	if not seconds or seconds == 0 then
		return "0h 0m 0s"
	end
	
	local hours = math.floor(seconds / 3600)
	local minutes = math.floor((seconds % 3600) / 60)
	local secs = seconds % 60
	
	return string.format("%dh %dm %ds", hours, minutes, secs)
end

-- Send message to Discord webhook
function sendToDiscord(color, title, message, footer)
	local webhook = ''
	
	-- Determine which webhook to use based on the title
	if string.find(title, "Clock") then
		webhook = ClockinWebhook
	elseif string.find(title, "Incident") then
		webhook = IncidentWebhook
	end
	
	-- Check if webhook is configured
	if webhook == '' then
		return -- Silently return if no webhook configured
	end
	
	local embed = {
		{
			["color"] = color,
			["title"] = title,
			["description"] = message,
			["footer"] = {
				["text"] = footer or "PS-MDT",
			},
			["timestamp"] = os.date("!%Y-%m-%dT%H:%M:%S")
		}
	}
	
	PerformHttpRequest(webhook, function(err, text, headers) end, 'POST', json.encode({username = "PS-MDT", embeds = embed}), { ['Content-Type'] = 'application/json' })
end

