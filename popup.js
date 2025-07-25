const triggerBtn = document.getElementById("trigger-btn");

triggerBtn.addEventListener("click", async () => {
  triggerBtn.disabled = true;
  try {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;

    const allowedDomains = [
      /^https:\/\/[a-zA-Z0-9-]+\.datonis\.io/,
      /^https:\/\/[a-zA-Z0-9-]+\.ccbcc\.com/
    ];

    const isValidDomain = allowedDomains.some(domain => domain.test(url));
    if (!isValidDomain) {
      alert("Invalid domain: Please use this extension only on a datonis.io or ccbcc.com subdomain.");
      return;
    }

    const match = url.match(/\/v3\/(pages|functions)\/([a-zA-Z0-9_-]+)\/edit/);
    if (!match) {
      alert("Invalid URL: Please navigate to a valid pages or functions edit screen on the supported domains.");
      return;
    }

    const type = match[1];
    const id = match[2];

    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      alert("Invalid ID detected in URL.");
      return;
    }

    const isPage = type === "pages";
    const isFunction = type === "functions";

    const payload = {
      test_mode: true,
      page: isPage,
      function: isFunction,
      page_key: isPage ? id : null,
      report_key: isFunction ? id : null
    };

    // Dynamically extract the base URL
    const baseUrl = url.match(/^https:\/\/[a-zA-Z0-9.-]+/)[0];
    const apiEndpoint = `${baseUrl}/api/v1/functions/unlock_pages/execute`;

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let msg = `Request failed with status ${response.status}`;
      try {
        const errData = await response.json();
        if (errData && errData.error) msg += `: ${errData.error}`;
      } catch {}
      throw new Error(msg);
    }

    const data = await response.json();
    alert(`${isPage ? "Page" : "Function"} unlocked successfully. The page will refresh automatically.`);

    await chrome.tabs.reload(tab.id);

  } catch (err) {
    alert("Failed to send POST request. Please try again.\n" + (err.message || ""));
  } finally {
    triggerBtn.disabled = false;
  }
});
