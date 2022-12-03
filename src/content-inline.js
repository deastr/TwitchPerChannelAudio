//Listeners for browser_action popup page
window.addEventListener("message", (event) => {
	if(event.data.command && event.data.command.startsWith("ttv_pca_")){
		//Request from popup
		if(event.data.command == "ttv_pca_get_channel_settings_request"){
			const reply = {
				isTwitch: isTwitch(),
				isLiveChannel: isLiveChannel(),
				channelName: getChannelName(),
				isFFZEnabled: isFFZEnabled(),
				useFFZAudioCompressor: useFFZAudioCompressor(),
				currentVolume: getCurrentVolume()
			};

			//Send reply back to popup
			window.postMessage({ command: "ttv_pca_get_channel_settings_reply", data: reply }, "*");
		}
		else if(event.data.command == "ttv_pca_get_channel_saved_settings_onload_reply"){
			applySettingsOnLoad(event.data.data);
		}
		else if(event.data.command == "ttv_pca_get_channel_saved_settings_onroute_reply"){
			applySettingsOnChannelChange(event.data.data);
		}
	}
});

function isTwitch() {
	return document.location.href.startsWith("https://www.twitch.tv") || document.location.href.startsWith("https://twitch.tv");
}

function isLiveChannel() {
	if(!isTwitch()) return false;
	
	const root_player = document.querySelector(".channel-root")
	if(!!root_player){
		if(root_player.classList.contains("channel-root--live")){
			return true;
		}
		else{
			return false;
		}
	}
	else {
		return false;
	}
}

//https://github.com/night/betterttv/blob/ebce0514e060da76063089bfbd6681b7bd93f111/src/utils/twitch.js#L208
function getChannelName(){
	const chat = getReactInstance(document.querySelector('section[data-test-selector="chat-room-component-layout"]'));
	if(!chat) return null;
	
	const node = searchReactParents(chat,
		(n) => n.stateNode && n.stateNode.props && n.stateNode.props.onSendMessage);
		
	//If the channelDisplayName hasn't populated yet try channelLogin
	return node.memoizedProps?.channelDisplayName ?? node.memoizedProps.channelLogin;
}

function getFFZCompressorButton(){
	return document.querySelector("[data-a-target='ffz-player-comp-button']");
}

function useFFZAudioCompressor(){
	if(!window.FrankerFaceZ && !getFFZCompressorButton()){
		return false;
	}
	
	return isFFZAudiCompressorUsed();
}

function isFFZEnabled() {
	return !!getFFZCompressorButton();
}

function isFFZAudiCompressorUsed(){
	return isFFZEnabled() ? getVideo()?._ffz_compressed ?? false : false;
}

function getVideo() {
	return getVideoPLayer()?.core?.mediaSinkManager?.video;
}

function getCurrentVolume(){
	return getVideo()?.muted ? 0 : getVideoPLayer()?.getVolume();
}

function getVolumeControls(){
	return document.querySelector('.video-player__default-player .player-controls__left-control-group');
}

function toggleFFZAudioCompressor(useFFZCompressor){
	const ffzCompressorButton = getFFZCompressorButton();
	if(!ffzCompressorButton){
		return;
	}
	
	const compressorOn = isFFZAudiCompressorUsed();
	
	if((compressorOn && !useFFZCompressor) || (!compressorOn && useFFZCompressor)) {
		ffzCompressorButton.click();
	}
}

//https://github.com/cleanlock/VideoAdBlockForTwitch/blob/6464358b3991f8111ee594e15189bd56d0851e0e/firefox/content.js#L770
function getVideoPLayer(){
	var reactRootNode = null;
	var rootNode = document.querySelector('#root');
	if (rootNode && rootNode._reactRootContainer && rootNode._reactRootContainer._internalRoot && rootNode._reactRootContainer._internalRoot.current) {
		reactRootNode = rootNode._reactRootContainer._internalRoot.current;
	}
	videoPlayer = findReactNode(reactRootNode, node => node.setPlayerActive && node.props && node.props.mediaPlayerInstance);
	videoPlayer = videoPlayer && videoPlayer.props && videoPlayer.props.mediaPlayerInstance ? videoPlayer.props.mediaPlayerInstance : null;
	return videoPlayer;
}

//https://github.com/night/betterttv/blob/ebce0514e060da76063089bfbd6681b7bd93f111/src/utils/twitch.js#L97
function searchReactParents(node, predicate, maxDepth = 15, depth = 0) {
  try {
    if (predicate(node)) {
      return node;
    }
  } catch(_) {}

  if (!node || depth > maxDepth) {
    return null;
  }

  const {return: parent} = node;
  if (parent) {
    return searchReactParents(parent, predicate, maxDepth, depth + 1);
  }

  return null;
}

//https://github.com/night/betterttv/blob/ebce0514e060da76063089bfbd6681b7bd93f111/src/utils/twitch.js#L77
function getReactInstance(element) {
  for (const key in element) {
    if (key.startsWith('__reactInternalInstance$')) {
      return element[key];
    }
  }

  return null;
}

//https://github.com/cleanlock/VideoAdBlockForTwitch/blob/6464358b3991f8111ee594e15189bd56d0851e0e/firefox/content.js#L755
function findReactNode(root, constraint) {
	if (root.stateNode && constraint(root.stateNode)) {
		return root.stateNode;
	}
	let node = root.child;
	while (node) {
		const result = findReactNode(node, constraint);
		if (result) {
			return result;
		}
		node = node.sibling;
	}
	return null;
}

//https://github.com/SevenTV/Extension/blob/5f8f2477f1da02b5861de5ae336075d1819d1ad2/src/Sites/twitch.tv/Util/Twitch.ts#L19
function findReactChildren(node, predicate, maxDepth = 15, depth = 0) {
	let success = false;
	try { success = predicate(node); } catch {}
	if (success) return node;
	if (!node || depth > maxDepth) return null;

	const { child, sibling } = node;
	if (child || sibling) {
		return findReactChildren(child, predicate, maxDepth, depth + 1) || findReactChildren(sibling, predicate, maxDepth, depth + 1);
	}

	return null;
}
	
/*try {
	const ffz = 'FrankerFaceZ';
	const existingProperty = Object.getOwnPropertyDescriptor(window, ffz);
	
	Object.defineProperty(window, ffz, {
		set: function (value) {
			if (existingProperty) {
				Object.defineProperty(window, ffz, existingProperty);
				if (existingProperty.set) {
					existingProperty.set(value);
				}
			}
			else {
				delete window.FrankerFaceZ;
				window.FrankerFaceZ = value;
			}
			
			checkChannelSettingsOnLoad();
		},
		configurable: true
	});
}
catch(_) {}*/

function checkChannelSettingsOnLoad() {
	const channelName = getChannelName();
	if(!!channelName){
		window.postMessage({ command: "ttv_pca_get_channel_saved_settings_onload_request", data: channelName.toLowerCase() }, "*");
	}
}

function applySettingsOnLoad(savedSettings){
	if(!savedSettings) return;
	
	getVideoPLayer().setVolume(savedSettings.volume);
	
	if(savedSettings.useFFZAudioCompressor){
		//Start observing volume controls and wait for FFZ compressor button to get added
		//https://github.com/FrankerFaceZ/FrankerFaceZ/blob/8cd6545556fbfaaf663b7c383552dc0f77b655bf/src/sites/shared/player.jsx#L1356
		const volumeControls = getVolumeControls();

		const callback = (mutationList, observer) => {
		  for (const mutation of mutationList) {
			if(mutation.addedNodes[0].className.includes("ffz--player-comp")){
				//Compressor button is added as disabled, wait for it to get enabled
				const button = mutation.addedNodes[0].childNodes[0];

				const buttonCallback = (mutationList, observer) => {
				  for (const mutation of mutationList) {
					if(!mutation.target.disabled){
						//Stop observing compressor button
						observer.disconnect();
						
						toggleFFZAudioCompressor(true);
					}
				  }
				};

				const buttonObserver = new MutationObserver(buttonCallback);
				buttonObserver.observe(button, { attributes: true });
				
				//Stop observing compressor button after a while, in case FFZ is not installed
				setTimeout(() => buttonObserver.disconnect(), 10 * 1000);
				
				//Stop observing volume controls
				observer.disconnect();
			}
		  }
		};

		const observer = new MutationObserver(callback);
		observer.observe(volumeControls, { childList: true });
		
		//Stop observing volume controls after a while, just in case
		setTimeout(() => observer.disconnect(), 10 * 1000);
	}
}

//Listen for channel changes
//https://github.com/SevenTV/Extension/blob/5f8f2477f1da02b5861de5ae336075d1819d1ad2/src/Sites/twitch.tv/twitch.tsx#L176
const mainLayout = document.querySelector('main.twilight-main, #root.sunlight-root > div:nth-of-type(3), #root[data-a-page-loaded-name="PopoutChatPage"] > div, #root[data-a-page-loaded-name="ModerationViewChannelPage"] > div:nth-of-type(1)');
const mainLayoutReactInstance = getReactInstance(mainLayout);
const router = findReactChildren(mainLayoutReactInstance,
		n => n.stateNode?.props?.history?.listen,
		100
	);

router.memoizedProps.history.listen((route, action) => {
	if(action !== "PUSH"){
		return;
	}
	
	const channelName = route.pathname.replace("/", "").toLowerCase();
	window.postMessage({ command: "ttv_pca_get_channel_saved_settings_onroute_request", data: channelName }, "*");
});

function applySettingsOnChannelChange(savedSettings){
	if(!savedSettings) return;
	
	getVideoPLayer().setVolume(savedSettings.volume);

	//Sometimes volume set fails due to ads or ad blockers, if it does try for a while
	const volumeSetSuccessCheckInterval = setInterval(() => {
		if(getVideoPLayer().getVolume() != savedSettings.volume){
			getVideoPLayer().setVolume(savedSettings.volume);
		}
		else{
			clearInterval(volumeSetSuccessCheckInterval);
		}
	}, 1000);
	
	setTimeout(() => clearInterval(volumeSetSuccessCheckInterval), 10 * 1000);
	
	const ffzAudiCompressorUsed = isFFZAudiCompressorUsed();
	const shouldToggleCompressor = (savedSettings.useFFZAudioCompressor && !ffzAudiCompressorUsed) || (!savedSettings.useFFZAudioCompressor && ffzAudiCompressorUsed);
	
	if(shouldToggleCompressor){
		const compressorShouldBeOn = savedSettings.useFFZAudioCompressor && !ffzAudiCompressorUsed;

		//Sometimes compressor button doesn't register button clicks, especially when changing streams too rapidly 
		//or changing streams while the button is disabled, so we continue to check and try to click it for a while.
		const compButtonClickSuccessCheckInterval = setInterval(() => {
			if(!getFFZCompressorButton().disabled && (compressorShouldBeOn != isFFZAudiCompressorUsed())){
				getFFZCompressorButton().click();
			}
			
			//Check if the click is successfull
			if(compressorShouldBeOn == isFFZAudiCompressorUsed()){
				clearInterval(compButtonClickSuccessCheckInterval);
			}
		}, 1000);
		
		setTimeout(() => clearInterval(compButtonClickSuccessCheckInterval), 10 * 1000);
	}
}

//Observe video player and wait for it to start streaming to apply audio settings
const videoCallback = (mutationList, observer) => {
	for (const mutation of mutationList) {
		if (mutation.attributeName == "src") {
			videoObserver.disconnect();
			checkChannelSettingsOnLoad();
		}
	}
}

const videoObserver = new MutationObserver(videoCallback);
videoObserver.observe(getVideo(), { attributes: true });