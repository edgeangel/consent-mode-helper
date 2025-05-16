import { trackPopupOpen } from './data.js';

document.addEventListener("DOMContentLoaded", async () => {

    const outputElement = document.getElementById("output");

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let domain = "unknown";

    try {
    if (tab?.url) {
        const url = new URL(tab.url);
        domain = url.hostname;
    }
    } catch (e) {
    
    }

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.id) {
            outputElement.textContent = "Error: Unable to access the active tab.";
            return;
        }

        const response = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            world: "MAIN",
            func: () => {
                function getCookie(name) {
                    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                    return match ? decodeURIComponent(match[2]) : null;
                }

                let googleConsent = null;
                let uetConsent = null;
                let clarityConsent = null;
                let pianoConsent = null;
                
                // 🟢 Piano Analytics Consent Mode
                try {
                    const result = { type: null, mode: {} };

                    if (typeof pa !== "undefined" && pa.privacy && pa.privacy.currentMode !== '') {
                        result.type = "privacy";
                        result.mode["PA"] = pa.privacy.currentMode;

                    } else if (typeof pa === "undefined") {
                        const atid = getCookie("atid");
                        const paPrivacyRaw = getCookie("pa_privacy");

                        if (atid && !paPrivacyRaw) {
                            result.type = "privacy";
                            result.mode["AM"] = "exempt";

                        } else if (atid && paPrivacyRaw) {
                            let parsedValue;
                            try {
                                parsedValue = JSON.parse(paPrivacyRaw);
                            } catch (e) {
                                parsedValue = paPrivacyRaw.replace(/^%22|%22$/g, '');
                            }
                            result.type = "privacy";
                            result.mode["AM"] = parsedValue;
                        }

                    } else if (typeof pa !== "undefined" && pa.privacy && pa.privacy.currentMode === '') {
                        result.type = "consent";
                        if (typeof pa.consent.getMode === "function") {
                            result.mode["AM"] = pa.consent.getMode();
                        }
                    }

                    pianoConsent = result;

                } catch (err) {console.log('Piano error:', err);}

                // 🟢 Google Consent Mode
                if (window.google_tag_data?.ics?.entries) {
                    const googleEntries = window.google_tag_data.ics.entries;

                    const processEntry = (key) => {
                        const entry = googleEntries[key];
                        if (!entry) return { value: "Not available", type: "" };

                        const update = entry.update;
                        const defaultValue = entry.default;

                        return {
                            value: update === undefined
                                ? (defaultValue ? "Granted" : "Denied")
                                : (update ? "Granted" : "Denied"),
                            type: `<span class='status-type'>${update === undefined ? "default" : "update"}</span>`
                        };
                    };

                    googleConsent = {
                        analytics_storage: processEntry("analytics_storage"),
                        ad_storage: processEntry("ad_storage"),
                        ad_user_data: processEntry("ad_user_data"),
                        ad_personalization: processEntry("ad_personalization"),
                    };
                }

                // 🟢 Microsoft UET Consent Mode
                if (window.uetq?.uetConfig?.consent?.enabled) {
                    const adStorageAllowed = window.uetq.uetConfig.consent.adStorageAllowed;
                    const adStorageUpdated = window.uetq.uetConfig.consent.adStorageUpdated;

                    uetConsent = {
                        ad_storage: {
                            value: adStorageAllowed ? "Granted" : "Denied",
                            type: `<span class='status-type'>${adStorageUpdated ? "update" : "default"}</span>`
                        }
                    };
                }

                // 🟢 Microsoft Clarity Consent Mode
                if (typeof window.clarity !== "undefined") {
                    const cookies = document.cookie.split("; ");
                    const clarityCookie = cookies.find(cookie => cookie.startsWith("_clck="));

                    clarityConsent = {
                        consent: {
                            value: clarityCookie ? "Granted" : "Denied",
                            type: "" // Remove default/update type for Clarity
                        }
                    };
                }

                return { googleConsent, uetConsent, clarityConsent, pianoConsent };
            }
        });

        const data = response[0]?.result;
        if (!data) {
            outputElement.textContent = "Consent Mode not implemented.";
            return;
        }

        let googleConsentHTML = "";
        let uetConsentHTML = "";
        let clarityConsentHTML = "";
        let pianoConsentHTML = "";

        // 🔹 Generate table for Piano Analytics Consent Mode if data exists
        if (data.pianoConsent && data.pianoConsent.type && data.pianoConsent.type != null) {
            pianoConsentHTML = `
                <h3 class="piano-consent-mode">
                    <img src="https://assets.edgeangel.co/icon-piano.svg">Piano Analytics Consent Mode
                </h3>
                <table class="consent-table">
                    <tr>
                        <td class="consent-signal">${data.pianoConsent.type} mode</td>
                        <td class="consent-status ${getPianoClass(Object.values(data.pianoConsent.mode)[0])}">
                            ${formatPianoValue(Object.values(data.pianoConsent.mode)[0])}
                        </td>
                    </tr>
            `;
            for (const [key, value] of Object.entries(data.pianoConsent.mode)) {
                if (key !== "PA" && key !== "AM") {
                    pianoConsentHTML += `
                    <tr>
                        <td class="consent-signal">${key}</td>
                        <td class="consent-status ${getPianoClass(value)}">
                            ${formatPianoValue(value)}
                        </td>
                    </tr>`;
                }
            }
            pianoConsentHTML += `</table>`;
        }

        // 🔹 Generate table for Google Consent Mode if data exists
        if (data.googleConsent) {
            googleConsentHTML = `
                <h3 class="google-consent-mode"><img src="https://assets.edgeangel.co/icon-google.png">Google Consent Mode</h3>
                <table class="consent-table">
                    ${generateConsentRow("analytics_storage", data.googleConsent.analytics_storage)}
                    ${generateConsentRow("ad_storage", data.googleConsent.ad_storage)}
                    ${generateConsentRow("ad_user_data", data.googleConsent.ad_user_data)}
                    ${generateConsentRow("ad_personalization", data.googleConsent.ad_personalization)}
                </table>
            `;
        }

        // 🔹 Generate table for Microsoft UET Consent Mode if enabled
        if (data.uetConsent) {
            uetConsentHTML = `
                <h3 class="microsoft-consent-mode"><img src="https://assets.edgeangel.co/icon-ms.png">Microsoft UET Consent Mode</h3>
                <table class="consent-table">
                    ${generateConsentRow("ad_storage", data.uetConsent.ad_storage)}
                </table>
            `;
        }

        // 🔹 Generate table for Microsoft Clarity Consent Mode if enabled
        if (data.clarityConsent) {
            clarityConsentHTML = `
                <h3 class="clarity-consent-mode"><img src="https://assets.edgeangel.co/icon-ms.png">Microsoft Clarity Consent</h3>
                <table class="consent-table">
                    ${generateConsentRow("consent", data.clarityConsent.consent)}
                </table>
            `;
        }

        trackPopupOpen(domain, data);

        outputElement.innerHTML = googleConsentHTML + uetConsentHTML + clarityConsentHTML + pianoConsentHTML;

    } catch (error) {
        /*outputElement.textContent = `Error: ${error.message}`;*/
    }
});

// 🔹 Function to generate a table row
function generateConsentRow(key, consent) {
    if (!consent) return ""; // Prevents undefined errors

    return `
        <tr>
            <td class="consent-signal">${key} ${consent.type}</td>
            <td class="consent-status ${consent.value.toLowerCase()}">${consent.value}</td>
        </tr>
    `;
}

// 🔹 Function to format Piano values
function formatPianoValue(val) {
    const v = (val || "").toLowerCase();
    if (v.includes("opt-in") || v.includes("optin")) return "Opt-in"; 
    if (v.includes("optout") || v.includes("opt-out")) return "Opt-out";
    if (v.includes("exempt") || v.includes("essential")) return "Exempt";
    return val;
}

// 🔹 Function to get Piano class based on value
function getPianoClass(val) {
    const v = (val || "").toLowerCase();
    if (v.includes("opt-in") || v.includes("optin")) return "granted";
    if (v.includes("optout") || v.includes("opt-out")) return "denied";
    if (v.includes("exempt") || v.includes("essential")) return "exempt";
    return "";
}
