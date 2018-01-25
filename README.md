# DevTools bugs

* Various issues with [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).
* Makes use of [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface)
* and `npm`

## getResponseBody
The demo attempts to `getResponseBody` on all requests spawned from `https://coinmarketcap.com`.

How to run:
```bash
git clone https://github.com/ilanc/devtools-bugs
cd devtools-bugs
npm install
node ./getResponseBody.js

# look for output like this:
getResponseBody exception 4612.1449 https://files.coinmarketcap.com/generated/search/quick_search.json No data found for resource with given identifier
```

Problem:
* `getResponseBody` fails sporadically
* It seems worse on sites which trigger a lot of downloads

Theory:
* This may be caused by requests expiring from cache?
* Is there a way to turn this off? e.g. to specify that the `quick_search.json` request should be preserved in cache?


```bash
$ node getResponseBody.js
getResponseBody exception 4612.866 https://coinmarketcap.com/ No data found for resource with given identifier
getResponseBody exception 4612.1159 https://files.coinmarketcap.com/generated/search/quick_search.json No data found for resource with given identifier
getResponseBody exception 4612.1344 https://tpc.googlesyndication.com/sadbundle/$csp%3Der3%26dns%3Doff$/16013109180847449435/index.html No data found for resource with given identifier

$ node getResponseBody.js
getResponseBody exception 4612.1449 https://coinmarketcap.com/ No data found for resource with given identifier
getResponseBody exception 4612.1750 https://files.coinmarketcap.com/generated/search/quick_search.json No data found for resource with given identifier

$ node getResponseBody.js
getResponseBody exception 4612.2020 https://fonts.gstatic.com/s/anton/v9/o-91-t7-bPc7W26HmS2N4Q.woff2 No resource with given identifier found
getResponseBody exception 4612.2023 https://coinmarketcap.com/ No data found for resource with given identifier
```