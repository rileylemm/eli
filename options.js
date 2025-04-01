// DOM elements
const apiServiceSelect = document.getElementById('api-service');
const apiKeyInput = document.getElementById('api-key');
const customEndpointGroup = document.getElementById('custom-endpoint-group');
const customEndpointInput = document.getElementById('custom-endpoint');
const modelInput = document.getElementById('model');
const saveButton = document.getElementById('save-button');
const statusDiv = document.getElementById('status');
const maxTokensSlider = document.getElementById('max-tokens');
const maxTokensValue = document.getElementById('max-tokens-value');
const temperatureSlider = document.getElementById('temperature');
const temperatureValue = document.getElementById('temperature-value');

// Load saved settings when the options page is opened
document.addEventListener('DOMContentLoaded', loadSettings);

// Show/hide custom endpoint input based on selected API service
apiServiceSelect.addEventListener('change', function() {
  if (apiServiceSelect.value === 'custom') {
    customEndpointGroup.style.display = 'block';
  } else {
    customEndpointGroup.style.display = 'none';
  }
});

// Sync slider and number inputs
maxTokensSlider.addEventListener('input', () => {
  maxTokensValue.value = maxTokensSlider.value;
});

maxTokensValue.addEventListener('input', () => {
  maxTokensSlider.value = maxTokensValue.value;
});

temperatureSlider.addEventListener('input', () => {
  temperatureValue.value = temperatureSlider.value;
});

temperatureValue.addEventListener('input', () => {
  temperatureSlider.value = temperatureValue.value;
});

// Save settings when the save button is clicked
saveButton.addEventListener('click', saveSettings);

// Add a test connection button
const testConnectionButton = document.createElement('button');
testConnectionButton.id = 'test-connection-button';
testConnectionButton.textContent = 'Test Connection';
testConnectionButton.style.marginLeft = '10px';
testConnectionButton.style.backgroundColor = '#4CAF50';
saveButton.after(testConnectionButton);

// Test connection when the test button is clicked
testConnectionButton.addEventListener('click', testApiConnection);

// Function to load saved settings from Chrome storage
function loadSettings() {
  chrome.storage.sync.get(
    {
      apiService: 'openai',
      apiKey: '',
      customEndpoint: '',
      model: '',
      maxTokens: 325,
      temperature: 0.3
    },
    function(items) {
      apiServiceSelect.value = items.apiService;
      apiKeyInput.value = items.apiKey;
      customEndpointInput.value = items.customEndpoint;
      modelInput.value = items.model;
      maxTokensSlider.value = items.maxTokens;
      maxTokensValue.value = items.maxTokens;
      temperatureSlider.value = items.temperature;
      temperatureValue.value = items.temperature;
      
      // Show custom endpoint field if 'custom' is selected
      if (items.apiService === 'custom') {
        customEndpointGroup.style.display = 'block';
      }
    }
  );
}

// Function to save settings to Chrome storage
function saveSettings() {
  const apiService = apiServiceSelect.value;
  const apiKey = apiKeyInput.value.trim();
  const customEndpoint = customEndpointInput.value.trim();
  const model = modelInput.value.trim();
  const maxTokens = parseInt(maxTokensSlider.value);
  const temperature = parseFloat(temperatureSlider.value);
  
  // Validate inputs
  if (!apiKey) {
    showStatus('Please enter an API key.', 'error');
    return;
  }
  
  if (apiService === 'custom' && !customEndpoint) {
    showStatus('Please enter a custom API endpoint.', 'error');
    return;
  }
  
  // Save settings to Chrome storage
  chrome.storage.sync.set(
    {
      apiService: apiService,
      apiKey: apiKey,
      customEndpoint: customEndpoint,
      model: model,
      maxTokens: maxTokens,
      temperature: temperature
    },
    function() {
      showStatus('Settings saved successfully! Test your connection to verify credentials.', 'success');
    }
  );
}

/**
 * Function to test API connection using the currently entered credentials
 */
async function testApiConnection() {
  const apiService = apiServiceSelect.value;
  const apiKey = apiKeyInput.value.trim();
  const customEndpoint = customEndpointInput.value.trim();
  const model = modelInput.value.trim();
  
  // Validate basic inputs
  if (!apiKey) {
    showStatus('Please enter an API key before testing.', 'error');
    return;
  }
  
  if (apiService === 'custom' && !customEndpoint) {
    showStatus('Please enter a custom API endpoint before testing.', 'error');
    return;
  }
  
  showStatus('Testing connection...', 'info');
  
  try {
    const result = await validateApiKey(apiService, apiKey, customEndpoint, model);
    
    if (result.success) {
      showStatus(`Connection successful! ${result.message || ''}`, 'success');
    } else {
      showStatus(`Connection failed: ${result.error || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    showStatus(`Connection error: ${error.message}`, 'error');
  }
}

/**
 * Function to validate API key by making a simple request
 */
async function validateApiKey(service, key, endpoint, model) {
  let url, headers, body, expectedStatus;
  
  switch (service) {
    case 'openai':
      url = 'https://api.openai.com/v1/models';
      headers = {
        'Authorization': `Bearer ${key}`
      };
      expectedStatus = 200;
      break;
      
    case 'anthropic':
      url = 'https://api.anthropic.com/v1/messages';
      headers = {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      };
      body = JSON.stringify({
        model: model || 'claude-3-haiku-20250307',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1
      });
      expectedStatus = 200;
      break;
      
    case 'deepseek':
      url = 'https://api.deepseek.com/v1/models';
      headers = {
        'Authorization': `Bearer ${key}`
      };
      expectedStatus = 200;
      break;
      
    case 'google':
      const modelToUse = model || 'gemini-pro';
      url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}?key=${key}`;
      expectedStatus = 200;
      break;
      
    case 'custom':
      if (endpoint.includes('groq.com')) {
        url = endpoint;
        headers = {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        };
        body = JSON.stringify({
          model: model || 'llama3-70b-8192',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 1
        });
      } else if (endpoint.includes('mistral.ai')) {
        url = endpoint;
        headers = {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        };
        body = JSON.stringify({
          model: model || 'mistral-medium',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 1
        });
      } else {
        url = endpoint;
        headers = {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        };
        body = JSON.stringify({
          prompt: 'Test',
          model: model || '',
          max_tokens: 1
        });
      }
      expectedStatus = 200;
      break;
      
    default:
      return { success: false, error: 'Invalid service type' };
  }
  
  try {
    const method = body ? 'POST' : 'GET';
    const options = { method, headers };
    
    if (body) {
      options.body = body;
    }
    
    const response = await fetch(url, options);
    
    // Check if the response status is in a successful range
    if (response.status >= 200 && response.status < 300) {
      return { 
        success: true, 
        message: service === 'custom' ? 
          'Custom endpoint responded successfully.' : 
          `Connected to ${service} API successfully.` 
      };
    } else {
      const errorData = await response.text();
      console.error('API validation error:', errorData);
      return { 
        success: false, 
        error: `Response status: ${response.status}. ${errorData}` 
      };
    }
  } catch (error) {
    console.error('Connection validation error:', error);
    return { success: false, error: error.message };
  }
}

// Function to show status messages
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  statusDiv.style.display = 'block';
  
  // Only auto-hide success messages
  if (type === 'success') {
    // Hide the status message after 5 seconds
    setTimeout(function() {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

// Add CSS for info status type
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .info {
      background-color: #d1ecf1;
      color: #0c5460;
    }
  </style>
`); 