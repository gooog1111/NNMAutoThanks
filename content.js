chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_page_info") {
    const nav = document.querySelector('.nav');
    sendResponse({
      currentPage: parseInt(nav?.querySelector('b')?.textContent || 1),
      nextPageUrl: nav?.querySelector('a[href*="start="]')?.href,
      isTracker: window.location.href.includes('tracker.php'),
      isTopic: window.location.href.includes('viewtopic.php'),
      searchQuery: new URL(window.location.href).searchParams.get('nm')
    });
  } else if (request.action === "auto_thanks") {
    const result = pressThankButtons();
    sendResponse(result);
  }
  return true;
});

function pressThankButtons() {
  try {
    const buttons = Array.from(document.querySelectorAll('img[src*="sps.gif"], img[src*="thanks.gif"]'))
      .filter(btn => !btn.disabled && btn.offsetParent !== null);
    
    buttons.forEach(btn => {
      btn.click();
      btn.style.opacity = '0.5';
      btn.style.filter = 'grayscale(100%)';
    });
    
    return {
      success: buttons.length > 0,
      count: buttons.length,
      reason: buttons.length ? '' : 'Кнопки не найдены или уже нажаты'
    };
  } catch (e) {
    return {success: false, error: e.message};
  }
}

if (window.location.href.includes('viewtopic.php')) {
  chrome.runtime.sendMessage({action: "check_auto_thanks"}, response => {
    if (response?.autoThanksEnabled) {
      setTimeout(pressThankButtons, 1500);
    }
  });
}

console.log("Content script loaded for:", window.location.href);