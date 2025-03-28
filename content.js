// This script runs when a user visits a Reddit post page
// It listens for messages from the popup and responds with the post data

// Function to extract post data from the Reddit page
function extractPostData() {
  const data = {
    title: '',
    postContent: '',
    topComments: []
  };
  
  // Extract the post title - try multiple possible selectors for different Reddit UIs
  try {
    // Try various title selectors (new Reddit UI has multiple possible layouts)
    const titleSelectors = [
      'h1', // Basic h1 tag
      'h1[slot="title"]', // New Reddit UI
      '[data-testid="post-title"]', // Another Reddit UI variant
      '.Post h1', // Old selector
      '.post-title', // Very old Reddit
      'div[data-adclicklocation="title"] h1', // Another possible location
    ];
    
    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) {
        data.title = titleElement.textContent.trim();
        break;
      }
    }
    
    // Fallback if we still don't have a title
    if (!data.title) {
      // Try to get it from the document title
      const docTitle = document.title;
      if (docTitle && !docTitle.startsWith('reddit')) {
        data.title = docTitle.split(' : ')[0].trim();
      }
    }
    
    console.log("Extracted title:", data.title);
  } catch (e) {
    console.error("Error extracting title:", e);
  }
  
  // Extract the post content - try multiple possible selectors
  try {
    // Try various content selectors
    const contentSelectors = [
      // New Reddit UI selectors
      '[data-testid="post-content"] [data-adclicklocation="media"]', 
      '[data-click-id="text"] div', // Text posts in new Reddit
      '[data-click-id="body"] div', // Another text post location
      '[data-testid="post-content-text"]', // Another possible location
      '[data-adclicklocation="text"]', // Another Reddit variant
      
      // Older Reddit UI selectors
      '.Post div[data-click-id="text"]',
      '.md', // Old Reddit markdown content
      '.usertext-body',
      '.selftext',
    ];
    
    for (const selector of contentSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        // Use the element with the most text content
        let bestElement = elements[0];
        let maxLength = bestElement.textContent.trim().length;
        
        for (let i = 1; i < elements.length; i++) {
          const length = elements[i].textContent.trim().length;
          if (length > maxLength) {
            maxLength = length;
            bestElement = elements[i];
          }
        }
        
        if (maxLength > 0) {
          data.postContent = bestElement.textContent.trim();
          break;
        }
      }
    }
    
    console.log("Extracted post content:", data.postContent);
    
    // If we couldn't find content, at least grab something useful
    if (!data.postContent) {
      // For image/video posts, note the type of post
      if (document.querySelector('img[alt="Post image"]') || 
          document.querySelector('[data-testid="post-content"] img')) {
        data.postContent = "[This appears to be an image post. No text content available.]";
      } else if (document.querySelector('video') || 
                document.querySelector('[data-testid="post-content"] video')) {
        data.postContent = "[This appears to be a video post. No text content available.]";
      } else if (document.querySelector('iframe')) {
        data.postContent = "[This appears to be an embedded content post. No text content available.]";
      } else if (document.querySelector('a[data-testid="outbound-link"]')) {
        const link = document.querySelector('a[data-testid="outbound-link"]');
        data.postContent = `[This is a link post pointing to: ${link.href}]`;
      }
    }
  } catch (e) {
    console.error("Error extracting post content:", e);
  }
  
  // Extract top comments
  try {
    // Try different comment selectors for different Reddit UIs
    const commentSelectors = [
      // New Reddit comments
      '[data-testid="comment"]',
      '[data-adclicklocation="comment"]',
      // Older comment systems
      '.Comment',
      '.top-level-reply-wrap',
      '.sitetable.nestedlisting > .thing',
    ];
    
    let commentsFound = false;
    
    for (const selector of commentSelectors) {
      const commentElements = document.querySelectorAll(selector);
      if (commentElements && commentElements.length > 0) {
        let count = 0;
        commentElements.forEach(comment => {
          if (count < 5) {
            // Try to extract just the text part of the comment
            let commentText = '';
            
            // Try different comment text selectors
            const commentTextSelectors = [
              '[data-testid="comment-content-text"]', // New Reddit
              '[data-click-id="text"]', // Another variant
              '.md', // Old Reddit
              '.usertext-body', // Very old Reddit
            ];
            
            for (const textSelector of commentTextSelectors) {
              const textElement = comment.querySelector(textSelector);
              if (textElement && textElement.textContent.trim()) {
                commentText = textElement.textContent.trim();
                break;
              }
            }
            
            // If no specific text element found, use the whole comment text
            if (!commentText) {
              commentText = comment.textContent.trim();
              
              // Attempt to clean up the comment text by removing username, points, etc.
              commentText = commentText.replace(/\d+ points·/g, '');
              commentText = commentText.replace(/\d+ (hours|hour|minutes|minute|days|day) ago/g, '');
              commentText = commentText.replace(/level \d+/g, '');
            }
            
            if (commentText) {
              data.topComments.push(commentText);
              count++;
              commentsFound = true;
            }
          }
        });
        
        if (commentsFound) break;
      }
    }
    
    console.log("Extracted comments:", data.topComments);
  } catch (e) {
    console.error("Error extracting comments:", e);
  }
  
  return data;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // Respond to ping to verify content script is loaded
    if (request.action === "ping") {
      console.log("Content script received ping");
      sendResponse({status: "ok"});
      return;
    }
    
    if (request.action === "getPostData") {
      try {
        const postData = extractPostData();
        console.log("Sending post data:", postData);
        sendResponse(postData);
      } catch (e) {
        console.error("Error in content script:", e);
        sendResponse({
          title: "Error extracting data",
          postContent: "There was an error extracting data from this Reddit post. This might be due to a change in Reddit's page structure.",
          topComments: []
        });
      }
    }
    
    // Return true to indicate we're sending a response asynchronously
    return true;
  }
);

// Log that content script has loaded
console.log("Reddit Explainer: Content script loaded"); 