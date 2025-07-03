document.getElementById("trigger-btn").addEventListener("click", async () => {
  // Get current tab URL
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url;
  const match = url.match(/\/v3\/(pages|functions)\/([^/]+)\/edit/);

  if (!match) {
    alert("Invalid URL: Please navigate to a valid 'pages' or 'functions' edit screen on Datonis.");
    return;
  }

  const type = match[1];
  const id = match[2];
  const isPage = type === "pages";
  const isFunction = type === "functions";

  const payload = {
    test_mode: true,
    page: isPage,
    function: isFunction,
    page_key: isPage ? id : null,
    report_key: isFunction ? id : null
  };

  try {
    const response = await fetch("https://quality.datonis.io/api/v1/functions/unlock_pages/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Request failed");

    const data = await response.json();
    alert(`${isPage ? "Page" : "Function"} unlocked successfully!`);
    console.log("Response:", data);
  } catch (err) {
    console.error("POST error:", err);
    alert("Failed to send POST request. Please try again.");
  }
});
