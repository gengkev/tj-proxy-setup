
function getNameVersion() {
	var manifest = chrome.runtime.getManifest();
	return manifest.name + ", version " + manifest.version;
}

function handleProxyChange(backgroundPage, optionProxyEl) {
	optionProxyEl.disabled = true;
	backgroundPage.setProxyEnabled(optionProxyEl.checked, function(err) {
		if (err) {
			displayMessage("An error occurred: " + err);
			optionProxyEl.checked = !optionProxyEl.checked;
		} else {
			displayMessage("Successfully updated.");
		}
		optionProxyEl.disabled = false;
	});
}

document.addEventListener('DOMContentLoaded', function() {
	var optionProxyEl = document.getElementById("optionProxy");
	var messageEl = document.getElementById("message");
	var nameVersionEl = document.getElementById("name_version");

	var messageTimeoutId = -1;
	function displayMessage(message) {
		messageEl.textContent = message;
		messageEl.style.opacity = '1';

		clearTimeout(messageTimeoutId);
		messageTimeoutId = setTimeout(function() {
			messageEl.style.opacity = '0';
		}, 5000);
	}

	chrome.runtime.getBackgroundPage(function(backgroundPage) {
		// set version string
		nameVersionEl.textContent = getNameVersion();

		// check whether proxy is enabled
		backgroundPage.getProxyEnabled(function(proxyEnabled) {
			optionProxyEl.checked = proxyEnabled;
		});

		// add handler to enable/disable background page
		optionProxyEl.addEventListener('change',
			handleProxyChange.bind(backgroundPage, optionProxyEl));
	});
});
