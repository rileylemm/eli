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
      showStatus('Settings saved successfully!', 'success');
    }
  );
}

// Function to show status messages
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  statusDiv.style.display = 'block';
  
  // Hide the status message after 3 seconds
  setTimeout(function() {
    statusDiv.style.display = 'none';
  }, 3000);
} 