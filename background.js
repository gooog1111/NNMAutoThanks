let isProcessing = false;
let currentTabId = null;
let postLinks = [];
let currentIndex = 0;
let currentPage = 1;
let baseTrackerUrl = '';
let searchParams = '';
let pageLoadTimeout = null;
let pageLoadStartTime = null;
let autoThanksEnabled = false;

console.log("Background script initialized");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request.action);
  
  const handleStart = async () => {
    try {
      const tabId = request.tabId || (sender.tab && sender.tab.id);
      if (!tabId) throw new Error("No tab info");
      
      await startProcessing(tabId);
      sendResponse({success: true});
    } catch (error) {
      console.error("Start error:", error);
      sendResponse({success: false, error: error.message});
    }
  };

  const handleStop = () => {
    stopProcessing();
    sendResponse({success: true});
  };

  const handleStatus = () => {
    sendResponse({isProcessing});
  };

  const handleToggleAutoThanks = () => {
    autoThanksEnabled = !autoThanksEnabled;
    updateStatus(`Авто-благодарение ${autoThanksEnabled ? 'включено' : 'выключено'}`);
    sendResponse({autoThanksEnabled});
  };

  const handleCheckAutoThanks = () => {
    sendResponse({autoThanksEnabled});
  };

  switch (request.action) {
    case "start":
      handleStart();
      return true;
    case "stop":
      handleStop();
      return true;
    case "get_status":
      handleStatus();
      return true;
    case "toggle_auto_thanks":
      handleToggleAutoThanks();
      return true;
    case "check_auto_thanks":
      handleCheckAutoThanks();
      return true;
    default:
      return false;
  }
});

async function startProcessing(tabId) {
  console.log("startProcessing called for tab:", tabId);
  if (isProcessing) return;
  
  currentTabId = tabId;
  isProcessing = true;
  
  try {
    const tab = await chrome.tabs.get(tabId);
    console.log("Current tab URL:", tab.url);
    
    if (!tab.url.includes('tracker.php')) {
      updateStatus("Ошибка: откройте страницу трекера");
      return stopProcessing();
    }

    const urlObj = new URL(tab.url);
    baseTrackerUrl = urlObj.origin + urlObj.pathname;
    searchParams = urlObj.search;
    currentPage = getCurrentPageNumber(tab.url);
    
    await loadPostsFromCurrentPage();
  } catch (error) {
    console.error("Error in startProcessing:", error);
    updateStatus("Ошибка при запуске обработки");
    stopProcessing();
  }
}

function getCurrentPageNumber(url) {
  const urlObj = new URL(url);
  const startParam = urlObj.searchParams.get('start');
  return startParam ? Math.floor(parseInt(startParam) / 50) + 1 : 1;
}

async function loadPostsFromCurrentPage() {
  try {
    updateStatus(`Получаем посты со страницы ${currentPage}...`);
    
    const links = await chrome.scripting.executeScript({
      target: {tabId: currentTabId},
      func: () => {
        try {
          return Array.from(document.querySelectorAll('a.topictitle'))
            .map(a => a.href)
            .filter(href => href.includes('viewtopic.php'));
        } catch (e) {
          console.error("Error in content script:", e);
          return [];
        }
      }
    });
    
    postLinks = links[0].result;
    currentIndex = 0;
    
    if (!postLinks.length) {
      updateStatus("Посты не найдены, пробуем следующую страницу...");
      return await goToNextPage();
    }
    
    updateStatus(`Страница ${currentPage}: ${postLinks.length} постов`);
    await processNextPost();
  } catch (error) {
    console.error("Error loading posts:", error);
    updateStatus("Ошибка при получении списка постов");
    stopProcessing();
  }
}

async function processNextPost() {
  if (!isProcessing) return;

  if (currentIndex >= postLinks.length) {
    return await goToNextPage();
  }

  const url = postLinks[currentIndex];
  updateProgress(currentIndex + 1, postLinks.length, url, currentPage);

  try {
    pageLoadStartTime = Date.now();
    pageLoadTimeout = setTimeout(() => {
      if (isProcessing) {
        updateStatus("Таймаут загрузки страницы, пропускаем...");
        currentIndex++;
        processNextPost();
      }
    }, 10000);

    await chrome.tabs.update(currentTabId, {url});
    
    await new Promise(resolve => {
      const listener = (tabId, changeInfo) => {
        if (tabId === currentTabId && changeInfo.status === 'complete') {
          clearTimeout(pageLoadTimeout);
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(resolve, 1500);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
    
    await Promise.race([
      pressThankButtons(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Таймаут нажатия кнопок")), 5000)
    )]);
    
    currentIndex++;
    await new Promise(resolve => setTimeout(resolve, 2500));
    await processNextPost();
  } catch (error) {
    console.error("Post processing error:", error);
    updateStatus(`Ошибка: ${error.message}, продолжаем...`);
    currentIndex++;
    await processNextPost();
  } finally {
    clearTimeout(pageLoadTimeout);
  }
}

async function pressThankButtons() {
  const result = await chrome.scripting.executeScript({
    target: {tabId: currentTabId},
    func: () => {
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
  });
  
  const {success, count, reason} = result[0].result;
  if (success) {
    updateStatus(`Нажато ${count} кнопок на странице ${currentPage}`);
  } else {
    updateStatus(`Пропуск: ${reason || 'неизвестная ошибка'}`);
  }
}

async function goToNextPage() {
  console.log("Trying to go to next page...");
  
  try {
    const nextPage = currentPage + 1;
    const nextPageUrl = new URL(baseTrackerUrl);
    const params = new URLSearchParams(searchParams);
    params.set('start', (nextPage - 1) * 50);
    nextPageUrl.search = params.toString();
    
    updateStatus(`Переход на страницу ${nextPage}...`);
    
    pageLoadStartTime = Date.now();
    pageLoadTimeout = setTimeout(() => {
      if (isProcessing) {
        updateStatus("Таймаут загрузки страницы, останавливаемся...");
        stopProcessing();
      }
    }, 15000);

    await chrome.tabs.update(currentTabId, {url: nextPageUrl.toString()});
    
    await new Promise(resolve => {
      const listener = (tabId, changeInfo) => {
        if (tabId === currentTabId && changeInfo.status === 'complete') {
          clearTimeout(pageLoadTimeout);
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(resolve, 2000);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });

    const tab = await chrome.tabs.get(currentTabId);
    const newPage = getCurrentPageNumber(tab.url);
    
    if (newPage !== nextPage) {
      updateStatus("Достигнут конец результатов поиска");
      return stopProcessing();
    }

    currentPage = newPage;
    await loadPostsFromCurrentPage();
  } catch (error) {
    console.error("Next page error:", error);
    updateStatus("Ошибка перехода на следующую страницу");
    stopProcessing();
  } finally {
    clearTimeout(pageLoadTimeout);
  }
}

function stopProcessing() {
  isProcessing = false;
  updateStatus("Остановлено");
  currentTabId = null;
  postLinks = [];
  currentIndex = 0;
  currentPage = 1;
  baseTrackerUrl = '';
  searchParams = '';
  clearTimeout(pageLoadTimeout);
}

function updateStatus(message) {
  chrome.runtime.sendMessage({type: "status", message});
}

function updateProgress(current, total, url, page) {
  chrome.runtime.sendMessage({
    type: "progress",
    current,
    total,
    url: new URL(url).pathname,
    page
  });
}