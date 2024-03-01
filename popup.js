const default_message = 'No event received for the moment ...';

document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.sendMessage({action: "getHistory"}, function(response) {
        if (response.history) {
            updateUrlList(response.history);
        }
    });

	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.action === "updatePopup") {
			if (request.history.length === 0) { 
				urlList.innerHTML = default_message;
			} else {
		  		updateUrlList(request.history);
			}
		} else if (request.action === "cleanPopup") {
		  document.getElementById("urlList").innerHTML = default_message;
		}
	});

    function updateUrlList(history) {
        const urlList = document.getElementById("urlList");
        urlList.innerHTML = '';

        history.forEach(item => {
            const listItem = document.createElement('div');
            listItem.className = 'listItem';

            const toggleDiv = document.createElement('div');
            toggleDiv.className = 'toggleDiv';
            toggleDiv.onclick = function() {
                detailsDiv.style.display = detailsDiv.style.display === 'block' ? 'none' : 'block';
            };

            const enItem = document.createElement('span');
            enItem.className = 'enItem';
            enItem.innerHTML = item.enParam + "<br>";

            const gcdItem = document.createElement('span');
            gcdItem.className = 'gcdItem';
            gcdItem.innerHTML = processGcdValue(item.gcdParam);

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'detailsDiv';
            detailsDiv.innerHTML = 'GCD Value: ' + item.gcdParam + "<br>";
			detailsDiv.innerHTML += 'URL: ' + item.url + "<br>";
            detailsDiv.style.display = 'none';

            toggleDiv.appendChild(enItem);
            toggleDiv.appendChild(gcdItem);
            listItem.appendChild(toggleDiv);
            listItem.appendChild(detailsDiv);
            urlList.appendChild(listItem);
        });
    }

    function processGcdValue(gcdValue) {
		let htmlContent = "";

		// Labels pour chaque valeur
		const labels = [
			"Advertising (storage)",
			"Analytics (storage)",
			"Advertising (user data)",
			"Advertising (personalization)"
		];

		//Génération du code HTML basé sur la valeur GCD
		for (let i=0; i<labels.length; i++) {
			htmlContent += "<span class='" + getColor(gcdValue.charAt(2+2*i)) + "'>" + "<strong>" + labels[i] + "</strong>: " + getMeaning(gcdValue.charAt(2+2*i)) + "</span><br>";
		}
		return htmlContent;
	}

    function getMeaning(value) {
		const meaningTable = {
			"p": "Denied (default)",
			"q": "Denied (update)",
			"t": "Granted (default)",
			"r": "Granted (update)",
			"l": "Not defined",
			"m": "Denied (update)",
			"u": "Denied (update)",
			"e": "Granted (update)",
			"n": "Granted (update)",
			"v": "Granted (update)"
		};
	
		return meaningTable[value] || "Unknown"; // Retourne "Unknown" si aucune correspondance n'est trouvée
	}

	function getColor(value) {
		if (getMeaning(value).indexOf("Granted") >= 0) {
			return "green";
		} else if (getMeaning(value).indexOf("Denied") >= 0) {
			return "grey";
		} else {
			return "red";
		}
	}
	
});

