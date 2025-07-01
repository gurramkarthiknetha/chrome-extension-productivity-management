// Constants
const ALARM_NAME = 'update-tracking';
const UPDATE_INTERVAL_MINUTES = 1;
const STORAGE_KEY_SITE_DATA = 'siteData';
const STORAGE_KEY_BLOCKED_SITES = 'blockedSites';
const STORAGE_KEY_SITE_CATEGORIES = 'siteCategories';

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Productivity Manager extension installed');
  
  // Initialize storage with default values if not already set
  const storage = await chrome.storage.local.get([
    STORAGE_KEY_SITE_DATA,
    STORAGE_KEY_BLOCKED_SITES,
    STORAGE_KEY_SITE_CATEGORIES
  ]);
  
  if (!storage[STORAGE_KEY_SITE_DATA]) {
    await chrome.storage.local.set({ [STORAGE_KEY_SITE_DATA]: {} });
  }
  
  if (!storage[STORAGE_KEY_BLOCKED_SITES]) {
    await chrome.storage.local.set({ [STORAGE_KEY_BLOCKED_SITES]: [] });
  }
  
  if (!storage[STORAGE_KEY_SITE_CATEGORIES]) {
    await chrome.storage.local.set({ 
      [STORAGE_KEY_SITE_CATEGORIES]: {
        productive: [],
        neutral: [],
        distracting: []
      } 
    });
  }
  
  // Set up alarm for periodic updates
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: UPDATE_INTERVAL_MINUTES
  });
});

// Track active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  handleTabChange(tab);
});

// Track tab URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    handleTabChange(tab);
  }
});

// Handle periodic updates via alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    updateCurrentTabTracking();
  }
});

// Variables to track current state
let currentActiveTab = null;
let currentActiveTabStartTime = null;

// Handle tab changes (activation or URL update)
async function handleTabChange(tab) {
  // If we have a previous active tab, update its tracking data
  if (currentActiveTab && currentActiveTabStartTime) {
    await updateTabTracking(currentActiveTab, currentActiveTabStartTime, Date.now());
  }
  
  // Check if the new tab should be blocked
  if (tab.url && !tab.url.startsWith('chrome://')) {
    const hostname = new URL(tab.url).hostname;
    const isBlocked = await checkIfSiteIsBlocked(hostname);
    
    if (isBlocked) {
      // Redirect to blocked page
      chrome.tabs.update(tab.id, { url: 'blocked.html' });
      return;
    }
  }
  
  // Update current active tab information
  currentActiveTab = tab;
  currentActiveTabStartTime = Date.now();
}

// Update tracking for the current active tab
async function updateCurrentTabTracking() {
  if (currentActiveTab && currentActiveTabStartTime) {
    const now = Date.now();
    await updateTabTracking(currentActiveTab, currentActiveTabStartTime, now);
    currentActiveTabStartTime = now;
  }
}

// Update tracking data for a specific tab
async function updateTabTracking(tab, startTime, endTime) {
  // Skip tracking for chrome:// URLs and other special pages
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url === 'about:blank') {
    return;
  }
  
  try {
    const url = new URL(tab.url);
    const hostname = url.hostname;
    const timeSpent = endTime - startTime;
    
    // Skip if time spent is negligible
    if (timeSpent < 1000) {
      return;
    }
    
    // Get current date as YYYY-MM-DD for daily tracking
    const today = new Date().toISOString().split('T')[0];
    
    // Get existing site data
    const storage = await chrome.storage.local.get(STORAGE_KEY_SITE_DATA);
    const siteData = storage[STORAGE_KEY_SITE_DATA] || {};
    
    // Initialize site data structure if needed
    if (!siteData[hostname]) {
      siteData[hostname] = {};
    }
    
    if (!siteData[hostname][today]) {
      siteData[hostname][today] = 0;
    }
    
    // Update time spent
    siteData[hostname][today] += timeSpent;
    
    // Save updated data
    await chrome.storage.local.set({ [STORAGE_KEY_SITE_DATA]: siteData });
    
  } catch (error) {
    console.error('Error updating tab tracking:', error);
  }
}

// Check if a site is blocked
async function checkIfSiteIsBlocked(hostname) {
  const storage = await chrome.storage.local.get(STORAGE_KEY_BLOCKED_SITES);
  const blockedSites = storage[STORAGE_KEY_BLOCKED_SITES] || [];
  return blockedSites.includes(hostname);
}

// Listen for messages from popup or options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSiteData') {
    handleGetSiteData(message.hostname, message.date).then(sendResponse);
    return true; // Indicates async response
  } else if (message.action === 'blockSite') {
    handleBlockSite(message.hostname, message.shouldBlock).then(sendResponse);
    return true;
  } else if (message.action === 'setSiteCategory') {
    handleSetSiteCategory(message.hostname, message.category).then(sendResponse);
    return true;
  } else if (message.action === 'getDailySummary') {
    handleGetDailySummary(message.date).then(sendResponse);
    return true;
  }
});

// Handle request for site data
async function handleGetSiteData(hostname, date) {
  const storage = await chrome.storage.local.get(STORAGE_KEY_SITE_DATA);
  const siteData = storage[STORAGE_KEY_SITE_DATA] || {};
  
  if (!date) {
    date = new Date().toISOString().split('T')[0]; // Today
  }
  
  if (siteData[hostname] && siteData[hostname][date]) {
    return { timeSpent: siteData[hostname][date] };
  } else {
    return { timeSpent: 0 };
  }
}

// Handle block/unblock site request
async function handleBlockSite(hostname, shouldBlock) {
  const storage = await chrome.storage.local.get(STORAGE_KEY_BLOCKED_SITES);
  let blockedSites = storage[STORAGE_KEY_BLOCKED_SITES] || [];
  
  if (shouldBlock && !blockedSites.includes(hostname)) {
    blockedSites.push(hostname);
  } else if (!shouldBlock) {
    blockedSites = blockedSites.filter(site => site !== hostname);
  }
  
  await chrome.storage.local.set({ [STORAGE_KEY_BLOCKED_SITES]: blockedSites });
  return { success: true };
}

// Handle set site category request
async function handleSetSiteCategory(hostname, category) {
  const storage = await chrome.storage.local.get(STORAGE_KEY_SITE_CATEGORIES);
  const categories = storage[STORAGE_KEY_SITE_CATEGORIES] || {
    productive: [],
    neutral: [],
    distracting: []
  };
  
  // Remove from all categories first
  categories.productive = categories.productive.filter(site => site !== hostname);
  categories.neutral = categories.neutral.filter(site => site !== hostname);
  categories.distracting = categories.distracting.filter(site => site !== hostname);
  
  // Add to specified category
  if (category && categories[category]) {
    categories[category].push(hostname);
  }
  
  await chrome.storage.local.set({ [STORAGE_KEY_SITE_CATEGORIES]: categories });
  return { success: true };
}

// Handle request for daily summary
async function handleGetDailySummary(date) {
  if (!date) {
    date = new Date().toISOString().split('T')[0]; // Today
  }
  
  const storage = await chrome.storage.local.get([
    STORAGE_KEY_SITE_DATA,
    STORAGE_KEY_SITE_CATEGORIES
  ]);
  
  const siteData = storage[STORAGE_KEY_SITE_DATA] || {};
  const categories = storage[STORAGE_KEY_SITE_CATEGORIES] || {
    productive: [],
    neutral: [],
    distracting: []
  };
  
  // Calculate time spent in each category
  let productiveTime = 0;
  let neutralTime = 0;
  let distractingTime = 0;
  
  for (const hostname in siteData) {
    if (siteData[hostname][date]) {
      const timeSpent = siteData[hostname][date];
      
      if (categories.productive.includes(hostname)) {
        productiveTime += timeSpent;
      } else if (categories.distracting.includes(hostname)) {
        distractingTime += timeSpent;
      } else {
        neutralTime += timeSpent;
      }
    }
  }
  
  return {
    date,
    productiveTime,
    neutralTime,
    distractingTime,
    totalTime: productiveTime + neutralTime + distractingTime
  };
}
