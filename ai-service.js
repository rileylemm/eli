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
          model: ''
        },
        (items) => {
          this.apiService = items.apiService;
          this.apiKey = items.apiKey;
          this.customEndpoint = items.customEndpoint;
          this.model = items.model;
          
          // Only use real API if we have an API key
          this.useMock = !items.apiKey;
          
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
            content: `You are a helpful assistant that explains Reddit posts in simple terms. When responding, use language appropriate for ${this._getLevelDescription(level)}.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
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
    const modelToUse = this.model || 'claude-3-haiku-20240307';
    
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
            content: `${prompt}\n\nExplain this Reddit post as if I were ${this._getLevelDescription(level)}.`
          }
        ],
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content[0].text;
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
    
    const response = await fetch(this.customEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        prompt: prompt,
        level: level,
        model: this.model || '',
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      throw new Error(`Custom API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.explanation || data.text || data.content || data.result || '';
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
      Your explanation should be friendly and conversational.
      Simplify complex ideas but don't be condescending.
      Focus on the main point of the post and the key insights from comments.
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
        explanationIntro = "Here's a super simple explanation like you're 5 years old:";
        break;
      case 'non-technical':
        explanationIntro = "Here's an explanation without any technical jargon:";
        break;
      case 'beginner':
        explanationIntro = "Here's an explanation for someone new to this topic:";
        break;
      case 'advanced':
        explanationIntro = "Here's an in-depth explanation of this post:";
        break;
      default:
        explanationIntro = "Here's a simple explanation:";
    }
    
    return `${explanationIntro}
    
This Reddit post is about "${postData.title.substring(0, 40)}...". 

The main idea is ${postData.postContent.substring(0, 100)}...

Based on the comments, people seem to be discussing various aspects of this topic. In a real version of this extension, this would be a thoughtful AI-generated explanation tailored to your selected comprehension level.

A full implementation would connect to an AI service like OpenAI's GPT to provide accurate, helpful explanations of Reddit posts at your preferred level of detail.

(Note: To get real AI explanations, please add your API key in the extension options page)`;
  }
}

// Make the service available globally
window.AIService = AIService; 