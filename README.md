# TJ Proxy Setup (unofficial)
This Chrome extension provides one-click installation of the TJHSST proxy servers, known as Zeus.

[![Available in the Chrome Web Store](https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_206x58.png)](https://chrome.google.com/webstore/detail/bdoeclpdnjgmmgggdagnfmiehcmddoba/) 

This extension downloads and uses TJ's proxy configuration script, located at https://iodine.tjhsst.edu/www/proxy.pac. This how most TJ students set up the proxy, anyway. It routes requests to databases that TJ subscribes to through TJ's Zeus proxy servers.

A pink key appears on each page in which the proxy is in use. This is done by parsing the downloaded proxy script in a rudimentary way. One caveat is that the current code will not detect when framed websites are intercepted by the proxy script. It only matches against the URL in the address bar.

Clicking on the pink key will disable the proxy and refresh the page. The key will then become gray, indicating that the proxy is disabled. The key, as well as the proxy itself, can be disabled in the extension settings.

Because the TJ administration controls the proxy script, they have the ability to redirect and intercept any web request at any time. This is why the pink key icon is useful! Of course, so do I, as do other extension writers. So I encourage you to review the source code of the project on Github!

The other caveat is problems with the somewhat poorly-written proxy script. For example, any website ending in oed.com will be intercepted (and blocked) by the proxy. The only interesting example I could find is [ooed.com](http://ooed.com), which redirects to ooed.org without the proxy.

Obligatory note that this extension is in no way sanctioned by the TJHSST administration.
