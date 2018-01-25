/*
Illustrates problems with https://chromedevtools.github.io/devtools-protocol/tot/Network#method-getResponseBody
*/
const CDP = require('chrome-remote-interface');

// Settings
const _url = "https://coinmarketcap.com";
const _waitForLoad = 10000; // wait 10 seconds for various requests to load
const _iterations = 10;

async function run() {
  let client;
  try {
    client = await CDP();
    const { Network, Page } = client;

    // enable events
    await Promise.all([Network.enable(), Page.enable()]);

    // commands
    let requests = {};
    let responses = {};
    let config = {
      all: {
        regex: /.*/
      },
    };

    // add event handlers
    Network.requestWillBeSent(({ requestId, request }) => {
      //console.log(`SEND [${requestId}] ${request.method} ${request.url}`);
      requests[requestId] = request.url;
    });

    Network.responseReceived(async ({ requestId, response }) => {
      //console.log(`RECV [${requestId}] ${url}`, response);
      if (response) {
        let url = response.url;
        responses[requestId] = response;
        //captureResponses(client, requestId, response, config);
      }
    });

    Network.loadingFinished(async ({ requestId }) => {
      //console.log(`FIN [${requestId}]`);
      if (requests[requestId]) {
        let url = requests[requestId];
        let response = responses[requestId];
        if (response) {
          captureResponses(client, requestId, response, config);
        } else {
          console.log('loadingFinished before responseReceived', requestId, url);
        }
      }
    });

    // Load page
    await Page.navigate({ url: _url });
    //await Page.loadEventFired(); // NOTE: unreliable
    await sleep(_waitForLoad);

  } catch (err) {
    if (err.message && err.message === "No inspectable targets") {
      console.error("Either chrome isn't running or you already have another app connected to chrome - e.g. `chrome-remote-interface inspect`")
    } else {
      console.error(err);
    }
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function captureResponses(client, requestId, response, config) {
  if (!response)
    return;
  let url = response.url;
  //console.log(url);
  //console.log(response.headers);
  for (let e in config) {
    let expected = config[e];
    if (expected.regex.test(url)) {
      //console.log(response);

      // headers
      expected.requestId = requestId;
      expected.response = response;
      expected.status = response.status;
      expected.headersText = response.headersText || JSON.stringify(response.headers);

      // body
      if (!config.headersOnly) {
        let data = await getResponseBody(client, requestId, url, config.canBeEmpty);
        if (data) {
          expected.body = data.body;
          expected.base64Encoded = data.base64Encoded;
        } else if (config.canBeEmpty) {
          expected.body = "";
          expected.base64Encoded = false;
        }
      }
    }
  }
}

async function getResponseBody(client, requestId, url, canBeEmpty) {
  try {
    //console.log("getResponseBody", requestId, url);
    let data = await client.Network.getResponseBody({ requestId });
    if (data) {
      //console.log("getResponseBody ok", requestId, url);
      return data;
    } else if (!canBeEmpty) {
      console.error("getResponseBody empty", requestId, url);
    }
    return undefined;
  } catch (ex) {
    console.error("getResponseBody exception", requestId, url, ex.message);
  }
}

function sleep(miliseconds = 1000) {
  if (miliseconds == 0)
    return Promise.resolve();
  return new Promise(resolve => setTimeout(() => resolve(), miliseconds))
}

async function poll(timeout, interval, asyncCallback) {
  timeout = timeout ? timeout : 1000;
  interval = interval ? interval : 100;
  let start = new Date();
  while (true) {
    var res = await asyncCallback();
    if (res) {
      //console.log('poll', res);
      return res;
    }
    let elapsed = (new Date()) - start;
    if (elapsed > timeout) {
      return false;
    }
    await sleep(interval);
  }
}

//run();
async function runMany(num) {
  for (let i = 0; i < num; ++i) {
    await run();
  }
}
runMany(_iterations);
