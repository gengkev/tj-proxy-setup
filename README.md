# TJ Proxy Setup (unofficial)
This Chrome extension provides one-click installation of the TJHSST proxy servers, known as Zeus.

[![Available in the Chrome Web Store](https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_206x58.png)](https://chrome.google.com/webstore/detail/bdoeclpdnjgmmgggdagnfmiehcmddoba/) 

A pink key appears in the address bar of each page in which the proxy is in use. This is done by parsing the downloaded proxy script in a rudimentary way with regexes. This is definitely subject to break. One caveat is that the extension will not detect when a framed website is using the proxy. It only matches against the URL in the address bar.

Clicking on the pink key will disable the proxy and refresh the page to load it without the proxy. The key will then become gray, indicating that the proxy is disabled. Of course, it can then be clicked again to enable the proxy. The key, as well as the proxy itself, can be disabled in the extension settings.

## Proxy script
This extension downloads and uses TJ's proxy configuration script, located at https://iodine.tjhsst.edu/www/proxy.pac. This how most TJ students set up the proxy, anyway. It routes requests to databases that TJ subscribes to through TJ's Zeus proxy servers. For more information on the proxy, see https://sites.google.com/site/tjproxyaccess/home.

Because the TJ administration controls the proxy script, they have the ability to redirect and intercept any web request at any time. That's basically what the proxy does, anyway, and it's why the pink key icon is useful! (From a security standpoint, the writers of almost any extension you've installed also have that ability. That includes this extension: if you're concerned, feel free to review the source code.)

Unfortunately, the proxy script itself has some issues. The `dnsDomainIs` function actually just matches whether a host ends in a string. For example, any website ending in `oed.com` ([Oxford English Dictionary](http://www.oed.com/)) will be intercepted (and blocked) by the proxy. For example, [West Office Exhibition Design](http://woed.com), [GoEd Student Financing](http://goed.com), [Riverside Office of Economic Development](http://riversideoed.com), [PetroEd](http://petroed.com), etc.

## Fin
Feel free to contact me if you have any concerns, on GitHub or anywhere else you manage to find me.

Obligatory note that this extension is in no way sanctioned by the TJHSST administration, nor anyone except myself. I claim no responsibility if this makes your computer blow up, or something.
