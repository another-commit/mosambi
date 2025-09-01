chrome.runtime.onMessage.addListener((message) => {
  if (message === "LOGOUT") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;

      chrome.cookies.remove(
        {
          url: tabs[0].url,
          name: "user_token",
        },
        (details) => {
          chrome.tabs.update(tabs[0].id, {
            url: "https://expertprep.portal.alfapte.com/v1/wc/login",
          });
        }
      );
    });
  }
});
