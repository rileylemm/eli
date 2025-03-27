# Reddit Explainer Chrome Extension

A Chrome extension that explains Reddit posts in simple terms, making complex discussions accessible to everyone.

## Features

- Works on any Reddit post page
- Offers multiple explanation levels:
  - ELI5 (Explain Like I'm 5)
  - Non-technical explanation
  - Beginner-friendly explanation
  - In-depth explanation
- Clean, simple interface
- Extracts post content and top comments for context

## Installation Instructions

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. The Reddit Explainer icon should now appear in your Chrome toolbar

## Usage

1. Navigate to any Reddit post
2. Click the Reddit Explainer icon in your toolbar
3. Select the desired explanation level
4. Click "Explain this post"
5. Wait for the explanation to be generated
6. Read the simplified explanation!

## Technical Implementation

This extension uses:
- Chrome Extension Manifest V3
- Content scripts to extract Reddit post data
- A mock explanation generator (in the demo version)

For a production version, you would need to:
1. Connect to an AI service like OpenAI's GPT
2. Set up a backend server to securely handle API keys
3. Implement rate limiting and error handling

## Future Enhancements

- Support for different languages
- Customizable explanation styles
- Save favorite explanations
- Share explanations with others
- Support for other social media platforms

## License

MIT License 