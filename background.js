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

function getOptionPageAction(callback) {
	callback(localStorage['optionPageAction'] === 'true');
}
function setOptionPageAction(value, callback) {
	localStorage['optionPageAction'] = value;
	callback(true);
}
function getOptionProxy(callback) {
	callback(localStorage['optionProxy'] == 'true');
}
function setOptionProxy(value, callback) {
	localStorage['optionProxy'] = value;
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
			configureDeclarativeContent(true, undefined, function(result) {
				if (!result) {
					callback(false);
					return;
				}
				setOptionProxy(true, function(result2) {
					callback(result2);
				});
			});
		});
	});
}

function disableProxy(callback) {
	console.log(">> DISABLING PROXY");
	chrome.proxy.settings.clear({scope: 'regular'}, function() {
		configureDeclarativeContent(false, undefined, function(result) {
			if (!result) {
				callback(false);
				return;
			}
			setOptionProxy(false, function(result2) {
				callback(result2);
			});
		});
	});
}

function enablePageAction(callback) {
	console.log(">> ENABLING PAGE ACTION");
	configureDeclarativeContent(undefined, true, function(result) {
		if (!result) {
			callback(false);
			return;
		}
		setOptionPageAction(true, function(result2) {
			callback(result2);
		});
	});
}

function disablePageAction(callback) {
	console.log(">> DISABLING PAGE ACTION");
	configureDeclarativeContent(undefined, false, function(result) {
		if (!result) {
			callback(false);
			return;
		}
		setOptionPageAction(false, function(result2) {
			callback(result2);
		});
	});
}

// Update declarative content settings
// That is, whether to show the page action on certain pages and what color it should be
function configureDeclarativeContent(proxyEnabled, pageActionEnabled, callback) {
	if (typeof proxyEnabled === 'undefined') {
		getOptionProxy(function(newProxyEnabled) {
			configureDeclarativeContent(newProxyEnabled, pageActionEnabled, callback);
		});
		return;
	}
	else if (typeof pageActionEnabled === 'undefined') {
		getOptionPageAction(function(newPageActionEnabled) {
			configureDeclarativeContent(proxyEnabled, newPageActionEnabled, callback);
		});
		return;
	}

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
}

function getPacScript(callback) {
	var cached = localStorage['pacScript'];
	if (typeof cached === 'undefined') {
		fetchPacScript(callback);
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

		// cache in localStorage
		localStorage['pacScript'] = this.responseText;
		callback(this.responseText);
	};
	xhr.onerror = function(e) {
		console.error("fetch pac script failed: error", e);
		console.log("xhr was", this);

		// try the local version as backup
		fetchLocalPacScript(callback);
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
	getOptionProxy(function(proxyEnabled) {
		console.log(">> PAGE ACTION CLICK in tab", tab.id, proxyEnabled);
		if (proxyEnabled) {
			disableProxy(function() {
				chrome.tabs.reload(tab.id);
			});
		} else {
			enableProxy(function() {
				chrome.tabs.reload(tab.id);
			});
		}
	});
});

// Enable or disable the proxy according to the existing setting
function configureProxy() {
	getOptionProxy(function(result) {
		if (result) {
			enableProxy(function() {
				console.log("configured enableProxy in onInstalled");
			});
		} else {
			disableProxy(function() {
				console.log("configured disableProxy in onInstalled");
			});
		}
	});
}

chrome.runtime.onInstalled.addListener(function(details) {
	console.log("onInstalled at " + (new Date()));

	// first install: set default values
	// this is cheating, but most reliable for now
	if (typeof localStorage['optionProxy'] === 'undefined') {
		localStorage['optionProxy'] = true;
	}
	if (typeof localStorage['optionPageAction'] === 'undefined') {
		localStorage['optionPageAction'] = true;
	}

	// Also calls configureDeclarativeContent, to enable page action showing.
	// Which calls fetchPacScript. Both are necessary on install!
	configureProxy();
});

chrome.runtime.onStartup.addListener(function(details) {
	console.log("onStartup at " + (new Date()));

	// Download the proxy hosts when browser starts up
	// (This is when the browser downloads the PAC file)
	updateProxyHosts(function(hosts) {
		console.log("updated proxy hosts", hosts)
	});
});


// handle messages from other pages
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.type == "enablePageAction") {
		enablePageAction(sendResponse);
		return true;
	}
	else if (request.type == "disablePageAction") {
		disablePageAction(sendResponse);
		return true;
	}
	else if (request.type == "enableProxy") {
		enableProxy(sendResponse);
		return true;
	}
	else if (request.type == "disableProxy") {
		disableProxy(sendResponse);
		return true;
	}
	else {
		console.error("unknown message:", request, sender);
	}
});
