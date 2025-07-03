const triggerBtn = document.getElementById("trigger-btn");
triggerBtn.addEventListener("click", async () => {
  triggerBtn.disabled = true;
  try {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;

    // Updated domain validation to include both datonis.io and altizonproductivity.ccbcc.com
    const allowedDomains = [
      /^https:\/\/[a-zA-Z0-9-]+\.datonis\.io/,
      /^https:\/\/[a-zA-Z0-9-]+\.ccbcc\.com/
    ];
    
    const isValidDomain = allowedDomains.some(domain => domain.test(url));
    if (!isValidDomain) {
      alert("Invalid domain: Please use this extension only on a datonis.io subdomain or altizonproductivity.ccbcc.com over HTTPS.");
      triggerBtn.disabled = false;
      return;
    }

    const match = url.match(/\/v3\/(pages|functions)\/([a-zA-Z0-9_-]+)\/edit/);
    if (!match) {
      alert("Invalid URL: Please navigate to a valid pages or functions edit screen on the supported domains.");
      triggerBtn.disabled = false;
      return;
    }

    const type = match[1];
    const id = match[2];
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      alert("Invalid ID detected in URL.");
      triggerBtn.disabled = false;
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

    // Determine API endpoint based on domain
    const isAltizonDomain = /^https:\/\/[a-zA-Z0-9-]+\.ccbcc\.com/.test(url);
    const apiEndpoint = isAltizonDomain 
      ? "https://altizonproductivity.ccbcc.com/api/v1/functions/unlock_pages/execute"
      : "https://quality.datonis.io/api/v1/functions/unlock_pages/execute";

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
    alert(`${isPage ? "Page" : "Function"} unlocked successfully. Please refresh the page to see changes.`);
  } catch (err) {
    alert("Failed to send POST request. Please try again.\n" + (err.message || ""));
  } finally {
    triggerBtn.disabled = false;
  }
});