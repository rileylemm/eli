document.addEventListener('DOMContentLoaded', function() {
  const explainButton = document.getElementById('explain-button');
  const explanationLevel = document.getElementById('explanation-level');
  const notRedditDiv = document.getElementById('not-reddit');
  const mainContentDiv = document.getElementById('main-content');
  const loadingDiv = document.getElementById('loading');
  const resultDiv = document.getElementById('result');
  const explanationText = document.getElementById('explanation-text');
  const errorDiv = document.getElementById('error');
  const retryButton = document.getElementById('retry-button');
  const apiKeyNotice = document.getElementById('api-key-notice');
  const optionsLink = document.getElementById('options-link');
  const settingsLink = document.getElementById('settings-link');
  
  // Initialize AI Service
  const aiService = new AIService();
  
  // Check if API key is configured
  checkApiKeyStatus();
  
  // Add click handlers for settings links
  optionsLink.addEventListener('click', openOptions);
  settingsLink.addEventListener('click', openOptions);
  
  // Add retry button functionality
  retryButton.addEventListener('click', function() {
    errorDiv.classList.add('hidden');
    
    // When retry is clicked, first try to inject the content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTabId = tabs[0].id;
      
      // Attempt to inject content script via background script
      chrome.runtime.sendMessage({
        action: "injectContentScript", 
        tabId: currentTabId
      }, function(response) {
        // After injection attempt, try to explain again
        setTimeout(() => {
          explainButton.click(); // Trigger the explain button click after a short delay
        }, 300);
      });
    });
  });
  
  // Check if we're on a Reddit post page
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = tabs[0].url;
    if (!currentUrl.match(/reddit\.com\/r\/[^\/]+\/comments\//)) {
      // Not on a Reddit post
      notRedditDiv.classList.remove('hidden');
      mainContentDiv.classList.add('hidden');
      return;
    }
    
    // We're on a Reddit post, show the main content
    notRedditDiv.classList.add('hidden');
    mainContentDiv.classList.remove('hidden');
    
    // Add click event listener to the explain button
    explainButton.addEventListener('click', function() {
      // Get the selected explanation level
      const level = explanationLevel.value;
      
      // Show loading state
      loadingDiv.classList.remove('hidden');
      mainContentDiv.classList.add('hidden');
      resultDiv.classList.add('hidden');
      errorDiv.classList.add('hidden');
      
      // Try to inject content script first to ensure it's running
      ensureContentScriptLoaded(tabs[0].id, function(success) {
        if (!success) {
          showError("Could not load content script. Please refresh the page and try again.");
          return;
        }
        
        // Now try to get post data
        getPostData(tabs[0].id, level);
      });
    });
  });
  
  /**
   * Ensure the content script is loaded
   * @param {number} tabId - Tab ID to check
   * @param {function} callback - Callback with success status
   */
  function ensureContentScriptLoaded(tabId, callback) {
    // Try to ping the content script first to see if it's loaded
    try {
      chrome.tabs.sendMessage(tabId, {action: "ping"}, function(response) {
        if (chrome.runtime.lastError) {
          console.log("Content script not loaded, injecting via background script");
          
          // Content script not loaded, try to inject it
          chrome.runtime.sendMessage({
            action: "injectContentScript", 
            tabId: tabId
          }, function(response) {
            if (response && response.success) {
              console.log("Content script injected successfully");
              callback(true);
            } else {
              console.error("Failed to inject content script");
              callback(false);
            }
          });
        } else {
          // Content script is already loaded
          console.log("Content script is already loaded");
          callback(true);
        }
      });
    } catch (e) {
      console.error("Error checking content script:", e);
      callback(false);
    }
  }
  
  /**
   * Get post data from the content script
   * @param {number} tabId - Tab ID
   * @param {string} level - Explanation level
   */
  function getPostData(tabId, level) {
    // Send a message to the content script to get the post data
    chrome.tabs.sendMessage(tabId, {action: "getPostData"}, function(response) {
      if (chrome.runtime.lastError) {
        console.error("Runtime error:", chrome.runtime.lastError);
        showError("Content script error: " + chrome.runtime.lastError.message);
        return;
      }
      
      if (!response) {
        showError("No response from content script");
        return;
      }
      
      // Log response for debugging
      console.log("Response from content script:", response);
      
      // Validate the response data
      if (!response.title && !response.postContent && (!response.topComments || response.topComments.length === 0)) {
        showError("Could not extract content from this Reddit post");
        return;
      }
      
      // We have the post data, now send it to the AI service
      aiService.explainPost(response, level)
        .then(explanation => {
          // Show the explanation
          explanationText.textContent = explanation;
          resultDiv.classList.remove('hidden');
          loadingDiv.classList.add('hidden');
          mainContentDiv.classList.remove('hidden');
        })
        .catch(error => {
          console.error('Error generating explanation:', error);
          showError("Error generating explanation: " + error.message);
        });
    });
  }
  
  /**
   * Show error message
   * @param {string} message - Optional error message
   */
  function showError(message) {
    loadingDiv.classList.add('hidden');
    
    if (message) {
      errorDiv.querySelector('p').textContent = message || "Sorry, there was an error processing this post.";
    }
    
    errorDiv.classList.remove('hidden');
    mainContentDiv.classList.remove('hidden');
  }
  
  /**
   * Check if the user has configured an API key
   */
  function checkApiKeyStatus() {
    chrome.storage.sync.get(['apiKey'], function(result) {
      if (result.apiKey) {
        // API key is configured, hide the notice
        apiKeyNotice.classList.add('hidden');
      } else {
        // No API key, show the notice
        apiKeyNotice.classList.remove('hidden');
      }
    });
  }
  
  /**
   * Open the options page
   */
  function openOptions() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  }
}); 