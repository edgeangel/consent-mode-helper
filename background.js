let urlHistory = [];
let currentTabId = null;

// Détecter le changement d'URL ou le rechargement de la page
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    currentTabId = tabId;
    urlHistory = []; // Réinitialiser l'historique

    // Envoyer un message pour nettoyer la pop-up si elle est ouverte
    chrome.runtime.sendMessage({
      action: "cleanPopup"
    });
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url && tabId === currentTabId) {
    urlHistory = [];
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (currentTabId === null) {
      currentTabId = details.tabId;
    }

    // GA4 collect request
    if (details.url.includes("/g/collect?v") || details.url.includes("v=2&tid=")) {
      const url = new URL(details.url);
      const gcdValue = url.searchParams.get("gcd");
      const enValue = url.searchParams.get("en");

      if (gcdValue !== null && enValue !== null) {
        const urlData = {
          url: url.href,
          gcdParam: gcdValue,
          enParam: "GA4 event: " + enValue
        };
		
		//To get the last entry on top instead of bottom
		//urlHistory.unshift(urlData);

        urlHistory.push(urlData);
        if (urlHistory.length > 10) {
          urlHistory.shift();
        }

        chrome.runtime.sendMessage({
          action: "updatePopup",
          history: urlHistory
        });
      }
    }

    // Google Ads Conversion #1 request
    if (details.url.includes("/pagead/conversion/")) {
      const url = new URL(details.url);
      const gcdValue = url.searchParams.get("gcd");
      const conversionId = details.url.substring(
        details.url.indexOf("/pagead/conversion/") + 19, 
        details.url.lastIndexOf("/?")
      );
      const conversionLabel = url.searchParams.get("label");
      if (gcdValue !== null && conversionId !== null && conversionLabel !== null) {
        const urlData = {
          url: url.href,
          gcdParam: gcdValue,
          enParam: "Google Ads Conversion: " + conversionId + "(" + conversionLabel + ")"
        };
		
		//To get the last entry on top instead of bottom
		//urlHistory.unshift(urlData);

        urlHistory.push(urlData);
        if (urlHistory.length > 10) {
          urlHistory.shift();
        }

        chrome.runtime.sendMessage({
          action: "updatePopup",
          history: urlHistory
        });
      }
    }

    // Google Ads Conversion #2 request
    if (details.url.includes("/pagead/viewthroughconversion/")) {
      const url = new URL(details.url);
      const gcdValue = url.searchParams.get("gcd");
      const conversionId = details.url.substring(
        details.url.indexOf("/pagead/viewthroughconversion/") + 30, 
        details.url.lastIndexOf("/?")
      );
      if (gcdValue !== null && conversionId !== null) {
        const urlData = {
          url: url.href,
          gcdParam: gcdValue,
          enParam: "Google Ads Conversion: " + conversionId
        };
		
		//To get the last entry on top instead of bottom
		//urlHistory.unshift(urlData);

        urlHistory.push(urlData);
        if (urlHistory.length > 10) {
          urlHistory.shift();
        }

        chrome.runtime.sendMessage({
          action: "updatePopup",
          history: urlHistory
        });
      }
    }

    // Google Ads Remarketing request
    if (details.url.includes("doubleclick.net/pagead/landing")) {
      const url = new URL(details.url);
      const gcdValue = url.searchParams.get("gcd");
      if (gcdValue !== null) {
        const urlData = {
          url: url.href,
          gcdParam: gcdValue,
          enParam: "Google Ads Remarketing"
        };
		
		//To get the last entry on top instead of bottom
		//urlHistory.unshift(urlData);

        urlHistory.push(urlData);
        if (urlHistory.length > 10) {
          urlHistory.shift();
        }

        chrome.runtime.sendMessage({
          action: "updatePopup",
          history: urlHistory
        });
      }
    }
  },
  {urls: ["<all_urls>"]},
  ["requestBody"]
);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action == "getHistory") {
    sendResponse({history: urlHistory});
  }
});
