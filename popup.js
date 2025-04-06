let isActive = false;

document.getElementById('startBtn').addEventListener('click', async () => {
  if (isActive) return;
  
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
      url: "*://nnmclub.to/forum/tracker.php*"
    });
    
    if (!tab) {
      throw new Error("Откройте страницу трекера NNMClub");
    }

    isActive = true;
    updateStatus('Обработка начата...', 'green');
    
    const response = await chrome.runtime.sendMessage({
      action: "start",
      tabId: tab.id
    });
    
    if (!response?.success) {
      throw new Error(response?.error || "Не удалось запустить обработку");
    }
  } catch (error) {
    console.error("Start error:", error);
    updateStatus(error.message, 'red');
    isActive = false;
  }
});

document.getElementById('stopBtn').addEventListener('click', async () => {
  try {
    await chrome.runtime.sendMessage({action: "stop"});
    isActive = false;
    updateStatus('Остановлено', 'orange');
  } catch (error) {
    console.error("Stop error:", error);
  }
});

document.getElementById('autoThanksToggle').addEventListener('change', async (e) => {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "toggle_auto_thanks"
    });
    e.target.checked = response.autoThanksEnabled;
    updateStatus(`Авто-благодарение ${response.autoThanksEnabled ? 'включено' : 'выключено'}`);
  } catch (error) {
    console.error("Auto thanks toggle error:", error);
    e.target.checked = !e.target.checked;
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "status") {
    updateStatus(message.message);
  } else if (message.type === "progress") {
    document.getElementById('progress').innerHTML = `
      Страница ${message.page || 1}<br>
      Прогресс: ${message.current}/${message.total}<br>
      Тема: ${message.url || ''}
    `;
  }
  return true;
});

function updateStatus(text, color = 'black') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = text;
  statusDiv.style.color = color;
}

async function checkProcessingStatus() {
  try {
    const [statusResponse, autoThanksResponse] = await Promise.all([
      chrome.runtime.sendMessage({action: "get_status"}),
      chrome.runtime.sendMessage({action: "check_auto_thanks"})
    ]);
    
    if (statusResponse?.isProcessing) {
      isActive = true;
      updateStatus("Автоблагодарение активно", "blue");
    }
    
    document.getElementById('autoThanksToggle').checked = autoThanksResponse?.autoThanksEnabled || false;
  } catch (error) {
    console.log("Status error:", error);
  }
}

checkProcessingStatus();