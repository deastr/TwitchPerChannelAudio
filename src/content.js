//React properties can only be accessed in page context and not in content script scope, these scripts will be injected into page to work
var scriptTag = document.createElement('script');
scriptTag.src = chrome.runtime.getURL('content-inline.js');
document.documentElement.appendChild(scriptTag);

//Listen for messages sent from page_action popup and forward it to the injected script and send back reply to the popup.
//We use this request/reply-style message connector because page_action can only send messages using browser.runtime and
//we can only access necessary DOM properties in the injected script and the injected script can only listen and send messages using window object.
browser.runtime.onConnect.addListener(function (port) {
	port.onMessage.addListener(function (message) {
		if (port.name === "ttv_pca_channel_settings") {
			if(message.command){
				if(message.command == "ttv_pca_get_channel_settings") {
					window.addEventListener("message", (event) => {
						if(event.data.command && event.data.command == "ttv_pca_get_channel_settings_reply"){
							//Send reply sent from injected script to popup
							try {
								port.postMessage({ 
									command: "ttv_pca_connect_reply", 
									data: event.data.data
								});
							}
							//For some reason Chrome sends "ttv_pca_get_channel_settings_reply" twice on consecutive 
							//page_action  popup displays and causes "Attempting to use a disconnected port object" error.
							catch(_){}
						}
					});
					
					//Send request to injected script
					window.postMessage({ command: "ttv_pca_get_channel_settings_request" }, "*");
				}
				else if(message.command == "ttv_pca_save"){
					//Send request to injected script
					window.postMessage({ command: "ttv_pca_save_request", data: message.data }, "*");
				}
				else if(message.command == "ttv_pca_delete"){
					//Send request to injected script
					window.postMessage({ command: "ttv_pca_delete_request" }, "*");
				}
			}
		}
	});
	/*port.onDisconnect.addListener((p) => {
	  console.log("port disconnect", p, browser.runtime.lastError);
	});*/
});

function getSavedChannelList() {
	return browser.storage.sync.get("channel_list");
}

//Listen for messages posted from content-inline.js and reply
window.addEventListener("message", (event) => {
	if(event?.data?.command == "ttv_pca_get_channel_saved_settings_onload_request"){
		getSavedChannelList()
			.then(settings => {
				const channelSettings = settings?.channel_list?.find(c => c.channelName == event.data.data);
				window.postMessage({ command: "ttv_pca_get_channel_saved_settings_onload_reply", data: channelSettings }, "*");
			});
	}
	else if(event?.data?.command == "ttv_pca_get_channel_saved_settings_onroute_request"){
		getSavedChannelList()
			.then(settings => {
				const channelSettings = settings?.channel_list?.find(c => c.channelName == event.data.data);
				window.postMessage({ command: "ttv_pca_get_channel_saved_settings_onroute_reply", data: channelSettings }, "*");
			});
	}
});