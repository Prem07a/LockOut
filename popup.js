const triggerBtn = document.getElementById("trigger-btn");
const statusDiv = document.getElementById("status");

function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status show ${type}`;
}

function hideStatus() {
  statusDiv.className = 'status';
}

async function createUnlockFunction(baseUrl) {
  const response = await fetch(`${baseUrl}${CONFIG.apiPaths.createFunction}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CONFIG.functionTemplate)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create function (${response.status}): ${errorText.substring(0, 100)}...`);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const responseText = await response.text();
    if (responseText.toLowerCase().includes("function") && 
        (responseText.toLowerCase().includes("created") || responseText.toLowerCase().includes("success"))) {
      return { success: true, message: responseText };
    }
    throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}...`);
  }

  return await response.json();
}

triggerBtn.addEventListener("click", async () => {
  triggerBtn.disabled = true;
  hideStatus();
  
  try {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;

    if (!CONFIG.allowedDomains.some(domain => domain.test(url))) {
      alert("Invalid domain: Please use this extension only on datonis.io, ccbcc.com subdomains, or localhost.");
      return;
    }

    const match = url.match(CONFIG.urlPattern);
    if (!match) {
      alert("Invalid URL: Please navigate to a valid page or function edit screen.");
      return;
    }

    const [, type, id] = match;

    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      alert("Invalid ID detected in URL.");
      return;
    }

    const isPage = type === "pages";
    const payload = {
      test_mode: true,
      page: isPage,
      function: !isPage,
      page_key: isPage ? id : null,
      report_key: isPage ? null : id
    };

    const baseUrl = url.match(/^https?:\/\/[a-zA-Z0-9.-]+(:\d+)?/)[0];
    const apiEndpoint = `${baseUrl}${CONFIG.apiPaths.executeFunction}`;

    showStatus("Locking item to you...", 'info');

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      showStatus("Item locked to you successfully!", 'success');
      chrome.tabs.reload(tab.id);


    } catch (apiError) {
      showStatus("Function not found. Creating unlock function...", 'warning');
      
      await createUnlockFunction(baseUrl);
      showStatus("Function created! Retrying unlock...", 'info');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const retryResponse = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!retryResponse.ok) {
        const retryErrorText = await retryResponse.text();
        throw new Error(`Retry failed (${retryResponse.status}): ${retryErrorText.substring(0, 100)}...`);
      }

      showStatus("Function created and item locked to you!", 'success');
      chrome.tabs.reload(tab.id);

    }

  } catch (err) {
    showStatus(`Error: ${err.message}`, 'error');
  } finally {
    setTimeout(() => {
      triggerBtn.disabled = false;
    }, 3000);
  }
});