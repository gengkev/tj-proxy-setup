# TJ Proxy Setup (unofficial)
This Chrome extension provides one-click installation of the TJHSST proxy servers, known as Zeus.

[![Available in the Chrome Web Store](https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_206x58.png)](https://chrome.google.com/webstore/detail/bdoeclpdnjgmmgggdagnfmiehcmddoba/) 

This extension downloads and uses TJ's proxy configuration script, located at https://iodine.tjhsst.edu/www/proxy.pac. This how most TJ students set up the proxy, anyway. It routes requests to databases that TJ subscribes to through TJ's Zeus proxy servers. For more information on the proxy, see https://sites.google.com/site/tjproxyaccess/home.

A pink key appears in the address bar of each page in which the proxy is in use. This is done by parsing the downloaded proxy script in a rudimentary way with regexes. This is definitely subject to break. One caveat is that the extension will not detect when a framed website is using the proxy. It only matches against the URL in the address bar.

Clicking on the pink key will disable the proxy and refresh the page to load it without the proxy. The key will then become gray, indicating that the proxy is disabled. Of course, it can then be clicked again to enable the proxy. The key, as well as the proxy itself, can be disabled in the extension settings.

Because the TJ administration controls the proxy script, they have the ability to redirect and intercept any web request at any time. (This is why the pink key icon is useful!) Of course, so do I, as do many extension writers. So I encourage you to review the source code of the project for yourself!

Unfortunately, the proxy script itself has some issues. The `dnsDomainIs` function actually just matches whether a host ends in a string. For example, any website ending in `oed.com` ([Oxford English Dictionary](http://www.oed.com/)) will be intercepted (and blocked) by the proxy. For example, [West Office Exhibition Design](http://woed.com), [GoEd Student Financing](http://goed.com), [Riverside Office of Economic Development](http://riversideoed.com), [PetroEd](http://petroed.com), etc.

Obligatory note that this extension is in no way sanctioned by the TJHSST administration, nor anyone except myself. I claim no responsibility if this makes your computer blow up, or something.
