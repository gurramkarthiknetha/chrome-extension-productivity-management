// Constants
const STORAGE_KEY_SETTINGS = 'settings';
const STORAGE_KEY_BLOCKED_SITES = 'blockedSites';
const STORAGE_KEY_SITE_CATEGORIES = 'siteCategories';

// DOM elements
const trackIncognitoCheckbox = document.getElementById('track-incognito');
const syncDataCheckbox = document.getElementById('sync-data');
const showNotificationsCheckbox = document.getElementById('show-notifications');
const dailyProductiveGoalInput = document.getElementById('daily-productive-goal');
const dailyDistractingLimitInput = document.getElementById('daily-distracting-limit');
const blockedSitesList = document.getElementById('blocked-sites-list');
const productiveSitesList = document.getElementById('productive-sites-list');
const distractingSitesList = document.getElementById('distracting-sites-list');
const addBlockedSiteInput = document.getElementById('add-blocked-site');
const addProductiveSiteInput = document.getElementById('add-productive-site');
const addDistractingSiteInput = document.getElementById('add-distracting-site');
const addBlockedSiteBtn = document.getElementById('add-blocked-site-btn');
const addProductiveSiteBtn = document.getElementById('add-productive-site-btn');
const addDistractingSiteBtn = document.getElementById('add-distracting-site-btn');
const exportDataBtn = document.getElementById('export-data');
const importDataBtn = document.getElementById('import-data');
const importFileInput = document.getElementById('import-file');
const clearDataBtn = document.getElementById('clear-data');
const saveSettingsBtn = document.getElementById('save-settings');
const statusMessage = document.getElementById('status-message');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Default settings
const defaultSettings = {
  trackIncognito: false,
  syncData: true,
  showNotifications: true,
  dailyProductiveGoal: 4,
  dailyDistractingLimit: 2
};

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  await loadSettings();
  
  // Load site lists
  await loadSiteLists();
  
  // Set up event listeners
  setupEventListeners();
});

// Load settings from storage
async function loadSettings() {
  const storage = await chrome.storage.local.get(STORAGE_KEY_SETTINGS);
  const settings = storage[STORAGE_KEY_SETTINGS] || defaultSettings;
  
  // Apply settings to form
  trackIncognitoCheckbox.checked = settings.trackIncognito;
  syncDataCheckbox.checked = settings.syncData;
  showNotificationsCheckbox.checked = settings.showNotifications;
  dailyProductiveGoalInput.value = settings.dailyProductiveGoal;
  dailyDistractingLimitInput.value = settings.dailyDistractingLimit;
}

// Load site lists from storage
async function loadSiteLists() {
  const storage = await chrome.storage.local.get([
    STORAGE_KEY_BLOCKED_SITES,
    STORAGE_KEY_SITE_CATEGORIES
  ]);
  
  const blockedSites = storage[STORAGE_KEY_BLOCKED_SITES] || [];
  const categories = storage[STORAGE_KEY_SITE_CATEGORIES] || {
    productive: [],
    neutral: [],
    distracting: []
  };
  
  // Populate blocked sites list
  populateSiteList(blockedSitesList, blockedSites, 'blocked');
  
  // Populate productive sites list
  populateSiteList(productiveSitesList, categories.productive, 'productive');
  
  // Populate distracting sites list
  populateSiteList(distractingSitesList, categories.distracting, 'distracting');
}

// Populate a site list element
function populateSiteList(listElement, sites, listType) {
  listElement.innerHTML = '';
  
  if (sites.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = `No ${listType} sites added yet`;
    emptyItem.className = 'empty-list';
    listElement.appendChild(emptyItem);
    return;
  }
  
  sites.forEach(site => {
    const listItem = document.createElement('li');
    
    const siteText = document.createElement('span');
    siteText.textContent = site;
    listItem.appendChild(siteText);
    
    const removeButton = document.createElement('span');
    removeButton.textContent = '×';
    removeButton.className = 'remove-site';
    removeButton.dataset.site = site;
    removeButton.dataset.listType = listType;
    removeButton.addEventListener('click', handleRemoveSite);
    listItem.appendChild(removeButton);
    
    listElement.appendChild(listItem);
  });
}

// Set up event listeners
function setupEventListeners() {
  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const tabId = `${button.dataset.tab}-tab`;
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Add site buttons
  addBlockedSiteBtn.addEventListener('click', () => handleAddSite('blocked'));
  addProductiveSiteBtn.addEventListener('click', () => handleAddSite('productive'));
  addDistractingSiteBtn.addEventListener('click', () => handleAddSite('distracting'));
  
  // Add site on Enter key
  addBlockedSiteInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleAddSite('blocked');
  });
  addProductiveSiteInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleAddSite('productive');
  });
  addDistractingSiteInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleAddSite('distracting');
  });
  
  // Data management buttons
  exportDataBtn.addEventListener('click', handleExportData);
  importDataBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', handleImportData);
  clearDataBtn.addEventListener('click', handleClearData);
  
  // Save settings button
  saveSettingsBtn.addEventListener('click', handleSaveSettings);
}

// Handle adding a site to a list
async function handleAddSite(listType) {
  let inputElement, listElement;
  
  if (listType === 'blocked') {
    inputElement = addBlockedSiteInput;
    listElement = blockedSitesList;
  } else if (listType === 'productive') {
    inputElement = addProductiveSiteInput;
    listElement = productiveSitesList;
  } else if (listType === 'distracting') {
    inputElement = addDistractingSiteInput;
    listElement = distractingSitesList;
  } else {
    return;
  }
  
  const site = inputElement.value.trim();
  
  // Validate input
  if (!site) {
    showStatus('Please enter a valid domain', 'error');
    return;
  }
  
  // Normalize domain (remove protocol, www, etc.)
  const normalizedSite = normalizeDomain(site);
  
  // Update storage based on list type
  if (listType === 'blocked') {
    await addToBlockedSites(normalizedSite);
  } else {
    await addToSiteCategory(normalizedSite, listType);
  }
  
  // Clear input
  inputElement.value = '';
  
  // Reload site lists
  await loadSiteLists();
  
  showStatus(`Added ${normalizedSite} to ${listType} sites`, 'success');
}

// Handle removing a site from a list
async function handleRemoveSite(event) {
  const site = event.target.dataset.site;
  const listType = event.target.dataset.listType;
  
  // Update storage based on list type
  if (listType === 'blocked') {
    await removeFromBlockedSites(site);
  } else {
    await removeFromSiteCategory(site, listType);
  }
  
  // Reload site lists
  await loadSiteLists();
  
  showStatus(`Removed ${site} from ${listType} sites`, 'success');
}

// Add a site to blocked sites
async function addToBlockedSites(site) {
  const storage = await chrome.storage.local.get(STORAGE_KEY_BLOCKED_SITES);
  const blockedSites = storage[STORAGE_KEY_BLOCKED_SITES] || [];
  
  if (!blockedSites.includes(site)) {
    blockedSites.push(site);
    await chrome.storage.local.set({ [STORAGE_KEY_BLOCKED_SITES]: blockedSites });
  }
}

// Remove a site from blocked sites
async function removeFromBlockedSites(site) {
  const storage = await chrome.storage.local.get(STORAGE_KEY_BLOCKED_SITES);
  const blockedSites = storage[STORAGE_KEY_BLOCKED_SITES] || [];
  
  const updatedList = blockedSites.filter(s => s !== site);
  await chrome.storage.local.set({ [STORAGE_KEY_BLOCKED_SITES]: updatedList });
}

// Add a site to a category
async function addToSiteCategory(site, category) {
  const storage = await chrome.storage.local.get(STORAGE_KEY_SITE_CATEGORIES);
  const categories = storage[STORAGE_KEY_SITE_CATEGORIES] || {
    productive: [],
    neutral: [],
    distracting: []
  };
  
  // Remove from all categories first
  categories.productive = categories.productive.filter(s => s !== site);
  categories.neutral = categories.neutral.filter(s => s !== site);
  categories.distracting = categories.distracting.filter(s => s !== site);
  
  // Add to specified category
  if (category !== 'neutral' && categories[category]) {
    categories[category].push(site);
  }
  
  await chrome.storage.local.set({ [STORAGE_KEY_SITE_CATEGORIES]: categories });
}

// Remove a site from a category
async function removeFromSiteCategory(site, category) {
  const storage = await chrome.storage.local.get(STORAGE_KEY_SITE_CATEGORIES);
  const categories = storage[STORAGE_KEY_SITE_CATEGORIES] || {
    productive: [],
    neutral: [],
    distracting: []
  };
  
  if (categories[category]) {
    categories[category] = categories[category].filter(s => s !== site);
    await chrome.storage.local.set({ [STORAGE_KEY_SITE_CATEGORIES]: categories });
  }
}

// Handle exporting data
async function handleExportData() {
  const storage = await chrome.storage.local.get(null); // Get all data
  
  // Create a JSON blob
  const blob = new Blob([JSON.stringify(storage, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Create a download link and click it
  const a = document.createElement('a');
  a.href = url;
  a.download = `productivity-manager-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showStatus('Data exported successfully', 'success');
}

// Handle importing data
async function handleImportData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      await chrome.storage.local.set(data);
      
      // Reload settings and site lists
      await loadSettings();
      await loadSiteLists();
      
      showStatus('Data imported successfully', 'success');
    } catch (error) {
      showStatus('Error importing data: Invalid format', 'error');
      console.error('Import error:', error);
    }
  };
  
  reader.readAsText(file);
  
  // Reset file input
  event.target.value = '';
}

// Handle clearing all data
async function handleClearData() {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    await chrome.storage.local.clear();
    
    // Reset to defaults
    await chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: defaultSettings });
    await chrome.storage.local.set({ [STORAGE_KEY_BLOCKED_SITES]: [] });
    await chrome.storage.local.set({
      [STORAGE_KEY_SITE_CATEGORIES]: {
        productive: [],
        neutral: [],
        distracting: []
      }
    });
    
    // Reload settings and site lists
    await loadSettings();
    await loadSiteLists();
    
    showStatus('All data cleared successfully', 'success');
  }
}

// Handle saving settings
async function handleSaveSettings() {
  const settings = {
    trackIncognito: trackIncognitoCheckbox.checked,
    syncData: syncDataCheckbox.checked,
    showNotifications: showNotificationsCheckbox.checked,
    dailyProductiveGoal: parseFloat(dailyProductiveGoalInput.value) || defaultSettings.dailyProductiveGoal,
    dailyDistractingLimit: parseFloat(dailyDistractingLimitInput.value) || defaultSettings.dailyDistractingLimit
  };
  
  await chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: settings });
  
  showStatus('Settings saved successfully', 'success');
}

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = type === 'error' ? 'error-message' : 'success-message';
  
  // Clear message after 3 seconds
  setTimeout(() => {
    statusMessage.textContent = '';
    statusMessage.className = '';
  }, 3000);
}

// Normalize domain (remove protocol, www, etc.)
function normalizeDomain(input) {
  // Remove protocol
  let domain = input.replace(/^(https?:\/\/)?(www\.)?/, '');
  
  // Remove path and query parameters
  domain = domain.split('/')[0];
  
  return domain;
}
