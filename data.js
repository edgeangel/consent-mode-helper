const MEASUREMENT_ID = 'G-E3N2Z1L4X6';   
const API_SECRET = 'xVVsbdcMQXWH3hEO4cr79A';   
const client_id = crypto.randomUUID();

export function trackPopupOpen(domain, data) {

  console.log(data);

  fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: client_id,
      events: [
        {
          name: "open",
          params: {
            source: "sidepanel.html",
            page_domain: domain
          }
        }
      ],
      consent: {
        ad_user_data: "DENIED",
        ad_personalization: "DENIED"
      }
    })
  }).catch(err => console.error('GA4 error :', err));
}