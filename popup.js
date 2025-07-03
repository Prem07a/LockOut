const triggerBtn = document.getElementById("trigger-btn");
triggerBtn.addEventListener("click", async () => {
  triggerBtn.disabled = true;
  try {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;

    const allowedDomain = /^https:\/\/[a-zA-Z0-9-]+\.datonis\.io/;
    if (!allowedDomain.test(url)) {
      alert("Invalid domain: Please use this extension only on a datonis.io subdomain over HTTPS.");
      triggerBtn.disabled = false;
      return;
    }

    const match = url.match(/\/v3\/(pages|functions)\/([a-zA-Z0-9_-]+)\/edit/);
    if (!match) {
      alert("Invalid URL: Please navigate to a valid 'pages' or 'functions' edit screen on Datonis.");
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

    const response = await fetch("https://quality.datonis.io/api/v1/functions/unlock_pages/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let msg = `Request failed (${response.status})`;
      try {
        const errData = await response.json();
        if (errData && errData.error) msg += `: ${errData.error}`;
      } catch {}
      throw new Error(msg);
    }

    const data = await response.json();
    alert(`${isPage ? "Page" : "Function"} unlocked successfully! please refresh the page to see changes.`);
  } catch (err) {
    alert("Failed to send POST request. Please try again.\n" + (err.message || ""));
  } finally {
    triggerBtn.disabled = false;
  }
});
