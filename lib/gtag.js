export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
// export const pageview = (url) => {
//   if (!GA_TRACKING_ID) return
//   window.gtag('config', GA_TRACKING_ID, {
//     page_path: url,
//   })
// }

export const pageview = (url) => {
  try {
    if (window.gtag)
      window.gtag("config", GA_TRACKING_ID, {
        page_location: url,
      });
  } catch (error) {
    console.log("Error from the trackerPageView => ", error);
  }
}

// export const pageview = (url) => {
//   if (typeof window !== 'undefined') {
//     window.gtag("config", GA_TRACKING_ID, {
//       page_path: url,
//     });
//   }
// };

// export const pageview = (url) => {
//   window.gtag("config", GA_TRACKING_ID, {
//     page_path: url,
//   });
// };


// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }) => {
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

