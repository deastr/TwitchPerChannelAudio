
var port;
var channelSettings = {};

document.addEventListener("click", (e) => {
  if(e.target?.id == "save"){
	  save();
  }
  else if(e.target?.id == "remove"){
	  remove();
  }
  else if(e.target?.id == "options"){
	  openOptions();
  }
});

function save(){
	getChannelList()
		.then(settings => {
			let channel_list = !!settings.channel_list ? settings.channel_list : [];			
			let savedSettings = channel_list.find(c => c.channelName == channelSettings.channelName);
			
			if(!!savedSettings){
				savedSettings.volume = channelSettings.volume;
				savedSettings.useFFZAudioCompressor = document.querySelector("#use_ffz_compressor").checked;
			}
			else{
				channel_list.push({
					channelName: channelSettings.channelName,
					channelDisplayName: channelSettings.channelDisplayName,
					volume: channelSettings.volume,
					useFFZAudioCompressor: document.querySelector("#use_ffz_compressor").checked
				});
			}
			
			browser.storage.sync.set({ channel_list })
				.then(() => window.close());
		});
}

function remove(){
	getChannelList()
		.then(settings => {
			let channel_list = !!settings.channel_list ? settings.channel_list : [];	
			
			if(channel_list.length > 0){
				for(let i = 0; i < channel_list.length; i++){
					if(channel_list[i].channelName == channelSettings.channelName.toLowerCase()){
						channel_list.splice(i, 1);
						break;
					}
				}
			}
			
			browser.storage.sync.set({ channel_list })
				.then(() => window.close());
		});
}

function getChannelList(){
	return browser.storage.sync.get("channel_list");
}

function getActiveTab() {
	return browser.tabs.query({active: true, currentWindow: true});
}

function connectToTab(tabs){
	if(!tabs[0].url.startsWith("https://twitch.tv/") && !tabs[0].url.startsWith("https://www.twitch.tv/")){
		showError(browser.i18n.getMessage("not_twitch"));
		return Promise.resolve();
	}
	
	port = browser.tabs.connect(tabs[0].id, {
		name: "ttv_pca_channel_settings",
	});
	
	port.onMessage.addListener(function (message) {
		processReplyMessage(message);
	});
	
	/*port.onDisconnect.addListener((p) => {
	  console.log("port disconnect", p, browser.runtime.lastError);
	});*/
	
	return Promise.resolve();
}

function showError(message) {
	document.querySelector("#content").style.display = "none";
	document.querySelector("#message").style.display = "table";
	document.querySelector("#message_text").innerText = message;
}

function processReplyMessage(message){
	if(message.command && message.command == "ttv_pca_connect_reply"){
		if(!message.data.isTwitch){
			showError(browser.i18n.getMessage("not_twitch"));
			return;
		}
		if(!message.data.isLiveChannel){
			showError(browser.i18n.getMessage("no_active_channel"));
			return;
		}

		channelSettings.channelName = message.data.channelName.toLowerCase();
		channelSettings.channelDisplayName = message.data.channelName;
		channelSettings.volume = message.data.currentVolume;
		channelSettings.useFFZAudioCompressor = message.data.useFFZAudioCompressor;
		
		document.querySelector("#settings").style.display = "block";
		document.querySelector("#channel").innerText = message.data.channelName;
		const volume = message.data.currentVolume > 0 ? Math.round(message.data.currentVolume * 100) : 0;
		document.querySelector("#current_volume").innerText = browser.i18n.getMessage("current_volume").replace("{volume}", volume);
		document.querySelector("#use_ffz_compressor").checked = message.data?.useFFZAudioCompressor ?? false;
		
		if(!message.data.isFFZEnabled)
			disableFFZSetting();
		
		getChannelList()
			.then(settings => {
				let channel_list = !!settings.channel_list ? settings.channel_list : [];
				let savedSettings = channel_list.find(c => c.channelName == channelSettings.channelName);
				if(!savedSettings){
					let btn = document.querySelector("#remove");
					btn.disabled = true;
					btn.title = browser.i18n.getMessage("no_saved_setting_exists");
				}
			});
	}
}

function sendSaveMessage(){
	return sendMessage("ttv_pca_save", 
	{ 
		useFFZCompressor: document.querySelector("#use_ffz_compressor").checked
	});
}

function sendDeleteMessage(){
	return sendMessage("ttv_pca_delete");
}

function sendMessage(command, data){
	if(!port) return;
	
	port.postMessage({
		command: command,
		data: data
	});
}

function sendGetChannelSettingsMessage(){
	return sendMessage("ttv_pca_get_channel_settings");
}

function disableFFZSetting() {
	const setting_ffz = document.querySelector("#setting_ffz");
	setting_ffz.style.cursor = "not-allowed";
	
	const nodes = setting_ffz.getElementsByTagName("*");
	for(var i = 0; i < nodes.length; i++){
		 nodes[i].disabled = true;
		 nodes[i].style.pointerEvents = "none";
	}
	
	document.querySelector("#use_ffz_compressor").checked = false;
	document.querySelector("#setting_ffz").title = browser.i18n.getMessage("ffz_unavailable");
}

function openOptions() {
	browser.runtime.openOptionsPage()
		.then(() => window.close());
}

document.querySelector("#options").alt = browser.i18n.getMessage("options");
document.querySelector("#options").title = browser.i18n.getMessage("options");
document.querySelector("#use_ffz_comp_message").innerText = browser.i18n.getMessage("use_ffz_compressor");
document.querySelector("#save").textContent = browser.i18n.getMessage("save_settings");
document.querySelector("#remove").textContent = browser.i18n.getMessage("delete_settings");

getActiveTab()
	.then(connectToTab)
	.then(sendGetChannelSettingsMessage);