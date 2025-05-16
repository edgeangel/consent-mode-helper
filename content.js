function safeSendClickMessage() {
    try {
      if (typeof chrome !== "undefined" &&
          typeof chrome.runtime !== "undefined" &&
          typeof chrome.runtime.sendMessage === "function") {
        chrome.runtime.sendMessage({ type: "user-click-on-page" });
      } else {
        console.warn("chrome.runtime.sendMessage non disponible dans ce contexte.");
      }
    } catch (e) {
      console.error("Erreur lors de l'envoi du message :", e);
    }
  }
  
  window.addEventListener("click", safeSendClickMessage, { capture: true });
  
