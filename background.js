chrome.runtime.onInstalled.addListener(() => {
    // Pas de configuration globale ici
  });
  
  // Active le panneau uniquement sur le tab actif, désactive les autres
  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    try {
      // Active sur le tab courant
      await chrome.sidePanel.setOptions({
        tabId,
        path: "sidepanel.html",
        enabled: true
      });
  
      // Désactive sur tous les autres onglets
      const allTabs = await chrome.tabs.query({});
      for (const tab of allTabs) {
        if (tab.id !== tabId) {
          await chrome.sidePanel.setOptions({
            tabId: tab.id,
            enabled: false
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error("Erreur setOptions par onglet :", e);
    }
  });
  
  // Réactive (si désactivé) et ouvre le panneau lors du clic sur l'icône
  chrome.action.onClicked.addListener((tab) => {
    if (!tab?.id) return;
  
    // Activer le panneau d'abord (si désactivé)
    chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: "sidepanel.html",
      enabled: true
    }, () => {
      // Ouvrir ensuite dans le même bloc : contexte utilisateur garanti
      chrome.sidePanel.open({ tabId: tab.id }).catch((e) => {
        console.error("Erreur ouverture side panel :", e);
      });
    });
  });
  
  
  // Ferme le panneau quand l'utilisateur clique dans la page
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "user-click-on-page" && sender.tab?.id) {
      chrome.sidePanel.setOptions({
        tabId: sender.tab.id,
        enabled: false
      }).catch(() => {});
    }
  });
  