# Privacy Policy for eli Chrome Extension

## Last Updated: March 28, 2025

## Introduction

This Privacy Policy explains how the eli Chrome extension ("we," "our," or "the extension") handles user data. The eli extension is designed to explain Reddit posts using AI services while respecting user privacy.

## Information We Store Locally

The eli extension stores the following information locally on your device using Chrome's built-in storage API (`chrome.storage.sync`):

1. **API Keys**: If provided by you, we store API keys for AI services (OpenAI, Anthropic, DeepSeek, or a custom provider) to enable the explanation functionality.

2. **User Preferences**: We store your selected settings such as:
   - Your preferred AI service provider
   - Your preferred explanation level
   - Response settings (temperature, token length)
   - Custom model names (if specified)

This information is stored solely on your device and synchronized across your Chrome browsers (if you use Chrome Sync). We never transmit this information to our servers.

## Content Processing

When you click "Explain this post," the extension:

1. Extracts the content of the current Reddit post and its top comments
2. Sends this content directly to your chosen AI service provider (OpenAI, Anthropic, or DeepSeek) using your provided API key
3. Displays the AI-generated explanation in the extension popup

This processing occurs only when explicitly requested by you. The Reddit content is:
- Only processed when you click the "Explain" button
- Only sent to the AI service provider you have selected
- Not stored permanently by the extension
- Not collected or stored by the extension developers

## Data Collection and Sharing

**We do not collect or store any user data on our servers.**

- We do not track your browsing history
- We do not collect any personal information
- We do not have access to your API keys or extension settings
- We do not maintain any databases of user information

The only data sharing that occurs is when you explicitly request an explanation, and the Reddit post content is sent directly from your browser to your chosen AI service provider using your own API key.

## Third-Party Services

When you use the AI explanation feature, you are using third-party AI services like OpenAI, Anthropic, or DeepSeek. Your use of these services is subject to their respective privacy policies and terms of service. We recommend reviewing the privacy policies of these services:

- [OpenAI Privacy Policy](https://openai.com/policies/privacy-policy)
- [Anthropic Privacy Policy](https://www.anthropic.com/privacy)
- [DeepSeek Privacy Policy](https://platform.deepseek.com/privacy)

## Your Responsibilities

You are responsible for:
- Keeping your API keys secure
- Understanding the terms of service of your chosen AI provider
- Being aware that content you submit to AI services may be used by those services according to their terms

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the GitHub repository. You are advised to review this Privacy Policy periodically for any changes.

## Contact

If you have any questions about this Privacy Policy, please open an issue in the GitHub repository.

## Consent

By using the eli extension, you consent to this Privacy Policy. 