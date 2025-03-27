// This script runs when a user visits a Reddit post page
// It listens for messages from the popup and responds with the post data

// Function to extract post data from the Reddit page
function extractPostData() {
  const data = {
    title: '',
    postContent: '',
    topComments: []
  };
  
  // Extract the post title
  const titleElement = document.querySelector('h1');
  if (titleElement) {
    data.title = titleElement.textContent.trim();
  }
  
  // Extract the post content
  // This selector might need to be updated based on Reddit's DOM structure
  const postContentElement = document.querySelector('div[data-test-id="post-content"]');
  if (postContentElement) {
    data.postContent = postContentElement.textContent.trim();
  } else {
    // Fallback selectors
    const postContent = document.querySelector('.md');
    if (postContent) {
      data.postContent = postContent.textContent.trim();
    }
  }
  
  // Extract top comments (up to 5)
  const commentElements = document.querySelectorAll('.Comment');
  let count = 0;
  commentElements.forEach(comment => {
    if (count < 5) {
      const commentTextElement = comment.querySelector('.md');
      if (commentTextElement) {
        data.topComments.push(commentTextElement.textContent.trim());
        count++;
      }
    }
  });
  
  return data;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "getPostData") {
      const postData = extractPostData();
      sendResponse(postData);
    }
  }
);

// Log that content script has loaded
console.log("Reddit Explainer: Content script loaded"); 