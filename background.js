// If you're reading this, I apologize... welcome to callback hell...

var PROXY_PAC_FILE = 'https://iodine.tjhsst.edu/www/proxy.pac';
var PROXY_PAC_FILE_LOCAL = chrome.runtime.getURL('proxy.pac');

var ICON_PROXY_OFF_PATH = {
	'19': 'img/key19_off.png',
	'38': 'img/key38_off.png'
};
var ICON_PROXY_ON_PATH = {
	'19': 'img/key19.png',
	'38': 'img/key38.png'
};

var CONTENT_ACTIONS_PROXY_ON = [
	new chrome.declarativeContent.ShowPageAction(),
	new chrome.declarativeContent.SetIcon({
		path: ICON_PROXY_ON_PATH
	})
];
var CONTENT_ACTIONS_PROXY_OFF = [
	new chrome.declarativeContent.ShowPageAction(),
	new chrome.declarativeContent.SetIcon({
		path: ICON_PROXY_OFF_PATH
	})
];

function getOptions(callback) {
	callback({
		optionPageAction: localStorage['optionPageAction'] === 'true',
		optionProxy: localStorage['optionProxy'] === 'true'
	});
}
function setOptions(items, callback) {
	for (var key in items) {
		localStorage[key] = items[key];
	}
	callback(true);
}

function enableProxy(callback) {
	console.log(">> ENABLING PROXY");
	getPacScript(function(text) {
		if (text === null) {
			callback(false);
			return;
		}
		chrome.proxy.settings.set({
			value: {
				mode: 'pac_script',
				pacScript: { data: text }
			},
			scope: 'regular'
		}, function() {
			setOptions({optionProxy: true}, function(result) {
				callback(result);
			});
		});
	});
}

function disableProxy(callback) {
	console.log(">> DISABLING PROXY");
	chrome.proxy.settings.clear({scope: 'regular'}, function() {
		setOptions({optionProxy: false}, function(result) {
			callback(result);
		});
	});
}

function enablePageAction(callback) {
	console.log(">> ENABLING PAGE ACTION");
	setOptions({optionPageAction: true}, function(result) {
		callback(result);
	});
}

function disablePageAction(callback) {
	console.log(">> DISABLING PAGE ACTION");
	setOptions({optionPageAction: false}, function(result) {
		callback(result);
	});
}

// Update declarative content settings
// That is, whether to show the page action on certain pages and what color it should be
function configureDeclarativeContent(callback) {
	getOptions(function(items) {
		var proxyEnabled = items['optionProxy'];
		var pageActionEnabled = items['optionPageAction'];

		chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
			if (!pageActionEnabled) {
				callback(true);
				return; // we're done
			}

			getPacScript(function(text) {
				if (text === null) {
					callback(false);
					return;
				}

				var hosts = getHostsFromPacScript(text);
				if (hosts.length === 0) {
					callback(false);
					return;
				}

				var rule1 = {
					conditions: hosts.map(function(host) {
						return new chrome.declarativeContent.PageStateMatcher({
							pageUrl: { hostSuffix: host }
						});
					}),
					actions: proxyEnabled ? CONTENT_ACTIONS_PROXY_ON : CONTENT_ACTIONS_PROXY_OFF
				};

				console.log("rule", rule1);

				// add page action rule
				chrome.declarativeContent.onPageChanged.addRules([rule1], function() {
					callback(true);
				});
			});
		});
	});
}

function getPacScript(callback) {
	var cached = localStorage['pacScript'];
	if (typeof cached === 'undefined') {
		fetchPacScript(function(text) {
			if (text === null) {
				// network didn't work, local backup
				fetchLocalPacScript(callback);
			} else {
				localStorage['pacScript'] = text;
				callback(text);
			}
		});
	} else {
		callback(cached);
	}
}

// Local script = backup plan, when network is unavailable?
function fetchLocalPacScript(callback) {
	var xhr = new XMLHttpRequest();
	xhr.onload = function() {
		console.log("got local pac script, length", this.responseText.length);
		callback(this.responseText);
	};
	xhr.onerror = function(e) {
		console.log("fetch local pac script failed: error", e);
		callback(null);
	};
	xhr.open('GET', PROXY_PAC_FILE_LOCAL);
	xhr.send();
}

function fetchPacScript(callback) {
	var xhr = new XMLHttpRequest();
	xhr.onload = function() {
		if (xhr.status != 200) {
			xhr.onerror(new Error("Bad status code: " + this.status));
			return;
		}
		else if (xhr.responseText.length < 8) {
			xhr.onerror(new Error("Length too short: " + xhr.responseText.length));
			return;
		}

		console.log("got pac script, length", this.responseText.length);
		callback(this.responseText);
	};
	xhr.onerror = function(e) {
		console.error("fetch pac script failed: error", e);
		console.log("xhr was", this);
		callback(null);
	};
	xhr.open('GET', PROXY_PAC_FILE);
	xhr.send();
}

function getHostsFromPacScript(text) {
	var hostRegex = /dnsDomainIs\(host, \"(.+)\"\)/gm;
	var hosts = [];
	var matches;
	while ((matches = hostRegex.exec(text)) != null) {
		hosts.push(matches[1].toLowerCase());
	}
	return hosts;
}

// Toggle proxy state when page action is clicked
chrome.pageAction.onClicked.addListener(function(tab) {
	function defaultCallback(tabId, result) {
		if (!result) {
			console.error("oh no, result is false. continuing?");
		}
		configureDeclarativeContent(function(result2) {
			if (!result2) {
				console.error("oh no, result2 is false. continuing?");
			}
			chrome.tabs.reload(tab.id);
		});
	}
	
	getOptions(function(items) {
		var proxyEnabled = items['optionProxy'];
		console.log(">> PAGE ACTION CLICK in tab", tab.id, proxyEnabled);
		if (proxyEnabled) {
			disableProxy(defaultCallback.bind(this, tab.id));
		} else {
			enableProxy(defaultCallback.bind(this, tab.id));
		}
	});
});

// Enable or disable the proxy according to the existing setting
function configureProxy(callback) {
	getOptions(function(items) {
		if (items['optionProxy']) {
			enableProxy(function(result) {
				console.log("configured enableProxy in onInstalled");
				callback(result);
			});
		} else {
			disableProxy(function(result) {
				console.log("configured disableProxy in onInstalled");
				callback(result);
			});
		}
	});
}

chrome.runtime.onInstalled.addListener(function(details) {
	console.log("onInstalled at " + (new Date()));

	// Downlaod the PAC script initially.
	fetchPacScript(function(text) {
		console.log("updated pac script");
		localStorage['pacScript'] = text;

		configureProxy(function(result) {
			configureDeclarativeContent(function(result2) {
				console.log("configureProxy/configureDeclarativeContent in onInstalled",
							result, result2);
			});
		});
	});
});

chrome.runtime.onStartup.addListener(function(details) {
	console.log("onStartup at " + (new Date()));

	// Download the PAC script when browser starts up
	// (This is also when the browser downloads the PAC file)
	fetchPacScript(function(text) {
		console.log("updated pac script", text);
		localStorage['pacScript'] = text;
	});
});

// handle messages from other pages
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	function defaultCallback(result) {
		if (!result) {
			sendResponse(false);
			return;
		}
		configureDeclarativeContent(sendResponse);
	}

	if (request.type == "enablePageAction") {
		enablePageAction(defaultCallback);
		return true;
	}
	else if (request.type == "disablePageAction") {
		disablePageAction(defaultCallback);
		return true;
	}
	else if (request.type == "enableProxy") {
		enableProxy(defaultCallback);
		return true;
	}
	else if (request.type == "disableProxy") {
		disableProxy(defaultCallback);
		return true;
	}
	else {
		console.error("unknown message:", request, sender);
	}
});
