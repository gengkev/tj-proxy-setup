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

function getProxyEnabled(callback) {
	callback(localStorage['optionProxy'] === 'true');
}
function setProxyEnabled(proxyEnabled, callback) {
	localStorage['optionProxy'] = proxyEnabled;
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

// Update declarative content settings
// That is, whether to show the page action on certain pages and what color it should be
function configureDeclarativeContent(proxyEnabled, callback) {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		getPacScript(function(text) {
			if (!text) {
				callback(new RangeError('Could not get pac script'));
				return;
			}

			var hosts = getHostsFromPacScript(text);
			if (hosts.length === 0) {
				callback(new RangeError('Found 0 hosts in pac script'));
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
		callback(null, this.responseText);
	};
	xhr.onerror = function(e) {
		console.log("fetch local pac script failed: error", e);
		callback(e);
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
		callback(null, this.responseText);
	};
	xhr.onerror = function(e) {
		console.error("fetch pac script failed: error", e);
		console.log("xhr was", this);
		callback(e);
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
	chrome.runtime.openOptionsPage();
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

	if (details.reason === 'install') {
		// enable proxy on install
		setProxyEnabled(true, function(err) {
			console.log('tried to enable proxy on install: ' + err);
		}
	}

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
