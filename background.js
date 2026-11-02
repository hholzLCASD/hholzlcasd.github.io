const TARGET_URL = "https://docs.google.com/presentation/d/e/2PACX-1vSltSNmGtlDbWMngDzEu8mc-ENHklK75TDXiHvW23e54BoR5iloKLPVIRoqziSs75Rbb9AqiIYqDoqz/embed?&start=true&loop=true&rm=minimal&delayms=10000";

// Schedule alarms when extension is installed or Chrome starts
chrome.runtime.onInstalled.addListener(setupAlarms);
chrome.runtime.onStartup.addListener(setupAlarms);

function setupAlarms() {
  chrome.alarms.get("openTabAlarm", (alarm) => {
    if (!alarm) {
      scheduleDailyAlarm("openTabAlarm", 0, 0); // 12:00 AM (00:00)
    }
  });

  chrome.alarms.get("closeTabAlarm", (alarm) => {
    if (!alarm) {
      scheduleDailyAlarm("closeTabAlarm", 15, 30); // 3:30 PM (15:30)
    }
  });
}

function scheduleDailyAlarm(name, hour, minute) {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hour, minute, 0, 0);

  // If the target time today has already passed, schedule for tomorrow
  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  chrome.alarms.create(name, {
    when: scheduledTime.getTime(),
    periodInMinutes: 24 * 60 // Repeat daily
  });
}

// Listen for the scheduled alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "openTabAlarm") {
    openPresentationTab();
  } else if (alarm.name === "closeTabAlarm") {
    closePresentationTab();
  }
});

function openPresentationTab() {
  chrome.tabs.create({ url: TARGET_URL }, (tab) => {
    // Save tab ID to chrome.storage so we can reference it at 3:30 PM
    chrome.storage.local.set({ presentationTabId: tab.id });
  });
}

function closePresentationTab() {
  chrome.storage.local.get("presentationTabId", (data) => {
    if (data.presentationTabId) {
      chrome.tabs.remove(data.presentationTabId, () => {
        // Clear stored tab ID after closing or if error occurs
        if (chrome.runtime.lastError) {
          // Tab was likely already manually closed by the user
        }
        chrome.storage.local.remove("presentationTabId");
      });
    }
  });
}