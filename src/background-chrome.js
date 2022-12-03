//page_action popup display for Chrome
if(typeof chrome.declarativeContent !== 'undefined'){
	const kMatchRule = {
	  conditions: [new chrome.declarativeContent.PageStateMatcher({
		pageUrl: { urlMatches: '^https?://([\w\d]+\.)?twitch\.tv\/(.?)' },
	  })],
	  actions: [new chrome.declarativeContent.ShowPageAction()]
	}

	chrome.runtime.onInstalled.addListener(function() {
	  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		chrome.declarativeContent.onPageChanged.addRules([kMatchRule]);
	  });
	});
}