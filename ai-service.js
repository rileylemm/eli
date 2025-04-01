/**
 * AI Service for Reddit Explainer
 * 
 * This file contains functions to connect to AI services (like OpenAI, Anthropic, etc.)
 * to generate explanations of Reddit posts.
 * 
 * In a production environment, you should:
 * 1. Use a backend server to keep API keys secure
 * 2. Implement proper error handling and rate limiting
 * 3. Add caching to reduce API calls
 */

class AIService {
  constructor() {
    // Default values
    this.apiService = 'openai';
    this.apiKey = null;
    this.customEndpoint = null;
    this.model = '';
    this.useMock = true;
    
    // Response parameters with defaults for concise, focused explanations
    this.temperature = 0.3; // Lower temperature for more focused responses
    this.maxTokens = 325;  // Token length as requested
    
    // Initialize settings
    this.loadSettings();
  }
  
  /**
   * Load the user's saved API settings from Chrome storage
   */
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        {
          apiService: 'openai',
          apiKey: '',
          customEndpoint: '',
          model: '',
          temperature: 0.3,
          maxTokens: 325
        },
        (items) => {
          this.apiService = items.apiService;
          this.apiKey = items.apiKey;
          this.customEndpoint = items.customEndpoint;
          this.model = items.model;
          this.temperature = parseFloat(items.temperature) || 0.3;
          this.maxTokens = parseInt(items.maxTokens) || 325;
          
          // Only use real API if we have an API key
          this.useMock = !items.apiKey;
          
          console.log('AI Service settings loaded:', {
            service: this.apiService,
            model: this.model,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            useMock: this.useMock
          });
          
          resolve();
        }
      );
    });
  }
  
  /**
   * Generate an explanation for a Reddit post
   * 
   * @param {Object} postData - Data from the Reddit post
   * @param {string} level - Explanation level ('simple', 'non-technical', etc.)
   * @returns {Promise<string>} - The explanation text
   */
  async explainPost(postData, level) {
    // Make sure settings are loaded
    if (this.useMock === null) {
      await this.loadSettings();
    }
    
    if (this.useMock) {
      // Use mock explanation for demonstration
      return this._generateMockExplanation(postData, level);
    }
    
    // Create a prompt for the AI
    const prompt = this._createPrompt(postData, level);
    
    try {
      // Call the appropriate API based on user settings
      switch (this.apiService) {
        case 'openai':
          return await this._callOpenAI(prompt, level);
        case 'anthropic':
          return await this._callAnthropic(prompt, level);
        case 'deepseek':
          return await this._callDeepSeek(prompt, level);
        case 'google':
          return await this._callGoogle(prompt, level);
        case 'custom':
          return await this._callCustomAPI(prompt, level);
        default:
          return this._generateMockExplanation(postData, level);
      }
    } catch (error) {
      console.error(`Error calling ${this.apiService} API:`, error);
      
      // Fall back to mock explanation on error
      return this._generateMockExplanation(postData, level);
    }
  }
  
  /**
   * Call the OpenAI API
   * 
   * @private
   * @param {string} prompt - The AI prompt
   * @param {string} level - Explanation level
   * @returns {Promise<string>} - The explanation
   */
  async _callOpenAI(prompt, level) {
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    
    // Use default GPT model if none specified
    const modelToUse = this.model || 'gpt-3.5-turbo';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that explains Reddit posts in simple terms. When responding, use language appropriate for ${this._getLevelDescription(level)}. Keep your explanations concise and to the point - aim for brevity.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
  
  /**
   * Call the Anthropic API
   * 
   * @private
   * @param {string} prompt - The AI prompt
   * @param {string} level - Explanation level
   * @returns {Promise<string>} - The explanation
   */
  async _callAnthropic(prompt, level) {
    const apiUrl = 'https://api.anthropic.com/v1/messages';
    
    // Use default Claude model if none specified
    const modelToUse = this.model || 'claude-3-haiku-20250307';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nExplain this Reddit post as if I were ${this._getLevelDescription(level)}. Please be concise and straight to the point.`
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      })
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content[0].text;
  }
  
  /**
   * Call the DeepSeek API
   * 
   * @private
   * @param {string} prompt - The AI prompt
   * @param {string} level - Explanation level
   * @returns {Promise<string>} - The explanation
   */
  async _callDeepSeek(prompt, level) {
    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    
    // Use default DeepSeek model if none specified
    const modelToUse = this.model || 'deepseek-chat';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that explains Reddit posts in simple terms. When responding, use language appropriate for ${this._getLevelDescription(level)}. Keep your explanations concise and to the point.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      })
    });
    
    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
  
  /**
   * Call the Google Gemini API
   * 
   * @private
   * @param {string} prompt - The AI prompt
   * @param {string} level - Explanation level
   * @returns {Promise<string>} - The explanation
   */
  async _callGoogle(prompt, level) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
    
    // Use default Gemini model if none specified
    const modelToUse = this.model || 'gemini-pro';
    
    const fullUrl = `${apiUrl}${modelToUse}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${prompt}\n\nExplain this Reddit post as if I were ${this._getLevelDescription(level)}. Please be concise and straight to the point.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the response text from the Gemini API response format
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    
    throw new Error('Unexpected response format from Google API');
  }
  
  /**
   * Call a custom API endpoint
   * 
   * @private
   * @param {string} prompt - The AI prompt
   * @param {string} level - Explanation level
   * @returns {Promise<string>} - The explanation
   */
  async _callCustomAPI(prompt, level) {
    if (!this.customEndpoint) {
      throw new Error('No custom endpoint provided');
    }
    
    // Detect if this is a known API provider based on endpoint URL
    const isGroq = this.customEndpoint.includes('groq.com');
    const isMistral = this.customEndpoint.includes('mistral.ai');
    
    let requestBody;
    const modelToUse = this.model || '';
    
    if (isGroq) {
      // Use OpenAI-compatible format for Groq
      requestBody = {
        model: modelToUse || 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that explains Reddit posts in simple terms. When responding, use language appropriate for ${this._getLevelDescription(level)}. Keep your explanations concise and to the point.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      };
    } else if (isMistral) {
      // Use Mistral-specific format
      requestBody = {
        model: modelToUse || 'mistral-medium',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that explains Reddit posts in simple terms. When responding, use language appropriate for ${this._getLevelDescription(level)}. Keep your explanations concise and to the point.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      };
    } else {
      // Generic format for custom endpoints
      requestBody = {
        prompt: prompt,
        level: level,
        model: modelToUse,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        // Include OpenAI-compatible format as well for broader compatibility
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that explains Reddit posts in simple terms. When responding, use language appropriate for ${this._getLevelDescription(level)}. Keep your explanations concise and to the point.`
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      };
    }
    
    // Setup request with appropriate headers
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    };
    
    // Special handling for specific providers
    if (isGroq) {
      console.log('Using Groq-compatible format');
    } else if (isMistral) {
      console.log('Using Mistral-compatible format');
      // Mistral uses a different authorization header format
      requestOptions.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    try {
      const response = await fetch(this.customEndpoint, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Custom API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      // Handle different response formats
      if (isGroq || isMistral || (data.choices && data.choices.length > 0)) {
        // OpenAI-like format (also used by Groq and others)
        if (data.choices && data.choices[0].message) {
          return data.choices[0].message.content.trim();
        } else if (data.choices && data.choices[0].text) {
          return data.choices[0].text.trim();
        }
      }
      
      // Handle Anthropic-like format
      if (data.content && Array.isArray(data.content)) {
        const text = data.content.map(item => item.text).join(' ').trim();
        if (text) return text;
      }
      
      // Handle other possible formats
      return data.explanation || data.text || data.content || 
             data.result || data.response || data.message || 
             (data.output && data.output.text) || '';
    } catch (error) {
      console.error('Error in custom API call:', error);
      throw error;
    }
  }
  
  /**
   * Get the text description for a given level
   * 
   * @private
   * @param {string} level - Level ID
   * @returns {string} - Level description
   */
  _getLevelDescription(level) {
    switch(level) {
      case 'simple':
        return "a 5-year-old (ELI5)";
      case 'non-technical':
        return "a non-technical person";
      case 'beginner':
        return "a beginner in this topic";
      case 'advanced':
        return "someone looking for an in-depth explanation";
      case 'more-context':
        return "someone who needs more context";
      case 'custom':
        // For custom explanation level (user-defined)
        return this.customLevelDescription || "someone who needs more context";
      default:
        return "a 5-year-old (ELI5)";
    }
  }
  
  /**
   * Create a prompt for the AI based on post data and explanation level
   * 
   * @private
   * @param {Object} postData - Data from the Reddit post
   * @param {string} level - Explanation level
   * @returns {string} - The formatted prompt
   */
  _createPrompt(postData, level) {
    const levelDescription = this._getLevelDescription(level);
    
    return `
      Explain the following Reddit post as if I were ${levelDescription}:
      
      Title: ${postData.title}
      
      Post Content: ${postData.postContent}
      
      Top Comments:
      ${postData.topComments.map((comment, i) => `${i+1}. ${comment}`).join("\n")}
      
      Please provide a clear, concise explanation that's appropriate for ${levelDescription}.
      Your explanation should be brief and focused on the main points.
      Avoid unnecessary details and keep your response short.
      Focus only on the most important aspects of the post and key insights from comments.
    `;
  }
  
  /**
   * Generate a mock explanation for demonstration purposes
   * 
   * @private
   * @param {Object} postData - Data from the Reddit post
   * @param {string} level - Explanation level
   * @returns {string} - A mock explanation
   */
  _generateMockExplanation(postData, level) {
    let explanationIntro;
    
    switch(level) {
      case 'simple':
        explanationIntro = "Here's a simple ELI5:";
        break;
      case 'non-technical':
        explanationIntro = "Here's a non-technical explanation:";
        break;
      case 'beginner':
        explanationIntro = "Here's a beginner-friendly explanation:";
        break;
      case 'advanced':
        explanationIntro = "Here's an in-depth explanation:";
        break;
      case 'more-context':
        explanationIntro = "Here's an explanation with context:";
        break;
      case 'custom':
        explanationIntro = "Here's a custom explanation:";
        break;
      default:
        explanationIntro = "Here's a simple explanation:";
    }
    
    return `${explanationIntro}
    
This post is about "${postData.title.substring(0, 40)}...". 

The main idea is ${postData.postContent.substring(0, 80)}...

(Note: To get real AI explanations, please add your API key in the extension options page)`;
  }
  
  /**
   * Set a custom level description for custom explanations
   * 
   * @param {string} description - Custom level description
   */
  setCustomLevelDescription(description) {
    this.customLevelDescription = description;
  }
  
  /**
   * Update response parameters
   * 
   * @param {Object} params - Parameters to update
   */
  updateResponseParams(params) {
    if (params.temperature !== undefined) {
      this.temperature = params.temperature;
    }
    
    if (params.maxTokens !== undefined) {
      this.maxTokens = params.maxTokens;
    }
  }
}

// Make the service available globally
window.AIService = AIService; 