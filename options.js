
function getOptionPageAction(callback) {
	callback(localStorage["optionPageAction"] === 'true');
}
function getOptionProxy(callback) {
	callback(localStorage["optionProxy"] == 'true');
}

// Convenience functions
var enablePageAction = chrome.runtime.sendMessage.bind(
	this, {type: "enablePageAction"});
var disablePageAction = chrome.runtime.sendMessage.bind(
	this, {type: "disablePageAction"});
var enableProxy = chrome.runtime.sendMessage.bind(
	this, {type: "enableProxy"});
var disableProxy = chrome.runtime.sendMessage.bind(
	this, {type: "disableProxy"});

function getNameVersion() {
	var manifest = chrome.runtime.getManifest();
	return manifest.name + ", version " + manifest.version;
}
	
var optionPageActionEl = document.getElementById("optionPageAction");
var optionProxyEl = document.getElementById("optionProxy");
var messageEl = document.getElementById("message");

var messageTimeoutId = -1;
function displayMessage(message) {
	messageEl.textContent = message;
	messageEl.style.opacity = '1';

	clearTimeout(messageTimeoutId);
	messageTimeoutId = setTimeout(function() {
		messageEl.style.opacity = '0';
	}, 5000);
}


document.addEventListener('DOMContentLoaded', function() {
	getOptionPageAction(function(result) {
		optionPageActionEl.checked = result;
	});
	getOptionProxy(function(result) {
		optionProxyEl.checked = result;
	});

	document.getElementById("name_version").textContent = getNameVersion();

	optionPageActionEl.addEventListener('change', function() {
		if (optionPageActionEl.checked) {
			enablePageAction(function(result) {
				if (!result) {
					optionPageActionEl.checked = false;
					displayMessage("Error while enabling.");
					return;
				}
				displayMessage("Page action enabled.");
			});
		}
		else {
			disablePageAction(function(result) {
				if (!result) {
					optionPageActionEl.checked = true;
					displayMessage("Error while disabling.");
					return;
				}
				displayMessage("Page action disabled.");
			});
		}
	});
	
	optionProxyEl.addEventListener('change', function() {
		if (optionProxyEl.checked) {
			enableProxy(function(result) {
				if (!result) {
					optionProxyEl.checked = false;
					displayMessage("Error while enabling.");
					return;
				}
				displayMessage("Proxy enabled.");
			});
		}
		else {
			disableProxy(function(result) {
				if (!result) {
					optionProxyEl.checked = true;
					displayMessage("Error while disabling.");
					return;
				}
				displayMessage("Proxy disabled.");
			});
		}
	});
});
