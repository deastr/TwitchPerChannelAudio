var channel_list;

function getSavedChannelList() {
	return browser.storage.sync.get("channel_list");
}

function loadSettings() {
	getSavedChannelList()
		.then(settings => displaySavedChannels(settings.channel_list));
}

function displaySavedChannels(channelList){
	if(!channelList) return;
	
	channel_list = channelList.sort((channel1, channel2) => channel1.channelName.localeCompare(channel2.channelName));

	var rows = document.querySelector("#rows");
	rows.replaceChildren(); //clear
	
	for(let i = 0; i < channel_list.length; i++) {
		var flexStart = document.createElement("div");
		flexStart.classList.add("flex-row");
		
		var channelNameDiv = document.createElement("div");
		channelNameDiv.classList.add("channelName");
		channelNameDiv.innerText = channel_list[i].channelDisplayName;
		
		var volumeDiv = document.createElement("div");
		volumeDiv.classList.add("volume");
		volumeDiv.innerText = Math.round(channel_list[i].volume * 100) + "%";
		
		var ffzCompDiv = document.createElement("div");
		ffzCompDiv.classList.add("ffzComp");
		ffzCompDiv.innerText = channel_list[i].useFFZAudioCompressor ? browser.i18n.getMessage("yes") : browser.i18n.getMessage("no");
		
		var deleteDiv = document.createElement("div");
		var buttonDelete = document.createElement("button");
		buttonDelete.textContent = browser.i18n.getMessage("delete");
		buttonDelete.onclick = function() { deleteSetting(channel_list[i].channelName); };
		deleteDiv.appendChild(buttonDelete);
		
		flexStart.appendChild(channelNameDiv);
		flexStart.appendChild(volumeDiv);
		flexStart.appendChild(ffzCompDiv);
		flexStart.appendChild(deleteDiv);
		
		rows.appendChild(flexStart);
	}
}

function deleteSetting(channelName){
	for(let i = 0; i < channel_list.length; i++){
		if(channel_list[i].channelName == channelName){
			channel_list.splice(i, 1);
			break;
		}
	}
	
	browser.storage.sync.set({ channel_list })
		.then(() => loadSettings());
}

document.querySelector("#channel").innerText = browser.i18n.getMessage("channel");
document.querySelector("#volume").innerText = browser.i18n.getMessage("volume");
document.querySelector("#ffzComp").innerText = browser.i18n.getMessage("use_ffz_compressor");
document.querySelector("#delete").innerText = browser.i18n.getMessage("delete");

loadSettings();