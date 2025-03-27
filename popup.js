document.addEventListener('DOMContentLoaded', function() {
  const explainButton = document.getElementById('explain-button');
  const explanationLevel = document.getElementById('explanation-level');
  const notRedditDiv = document.getElementById('not-reddit');
  const mainContentDiv = document.getElementById('main-content');
  const loadingDiv = document.getElementById('loading');
  const resultDiv = document.getElementById('result');
  const explanationText = document.getElementById('explanation-text');
  const errorDiv = document.getElementById('error');
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
      
      // Send a message to the content script to get the post data
      chrome.tabs.sendMessage(tabs[0].id, {action: "getPostData"}, function(response) {
        if (chrome.runtime.lastError || !response) {
          showError();
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
            showError();
          });
      });
    });
  });
  
  /**
   * Show error message
   */
  function showError() {
    loadingDiv.classList.add('hidden');
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