// Background script for Reddit Explainer

// Listen for tab updates to ensure the content script is loaded
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the tab is fully loaded and is a Reddit post page
  if (changeInfo.status === 'complete' && tab.url && tab.url.match(/reddit\.com\/r\/[^\/]+\/comments\//)) {
    console.log("Reddit post page detected. Injecting content script if needed.");
    
    // Inject the content script if it hasn't been injected
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(error => {
      console.error("Error injecting content script:", error);
    });
  }
});

// Handle messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "injectContentScript") {
    const tabId = message.tabId;
    
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error("Error injecting content script:", error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Return true to indicate we'll send a response asynchronously
  }
}); 