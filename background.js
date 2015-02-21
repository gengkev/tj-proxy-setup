var config = {
	mode: "pac_script",
	pacScript: {
		url: "https://iodine.tjhsst.edu/www/proxy.pac"
	}
};

chrome.proxy.settings.set(
	{value: config, scope: 'regular'},
	function() {});