// DOM elements
const currentUrlElement = document.getElementById('current-url');
const timeSpentElement = document.getElementById('time-spent');
const blockSiteButton = document.getElementById('block-site');
const setProductiveButton = document.getElementById('set-productive');
const viewDashboardButton = document.getElementById('view-dashboard');
const openOptionsButton = document.getElementById('open-options');
const productiveTimeElement = document.getElementById('productive-time');
const neutralTimeElement = document.getElementById('neutral-time');
const distractingTimeElement = document.getElementById('distracting-time');

// Current tab information
let currentTab = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tabs[0];
  
  // Display current URL
  if (currentTab && currentTab.url) {
    const url = new URL(currentTab.url);
    currentUrlElement.textContent = url.hostname;
    
    // Get time spent on this site today
    const timeSpent = await getTimeSpentOnSite(url.hostname);
    timeSpentElement.textContent = formatTime(timeSpent);
    
    // Check if site is blocked
    const isBlocked = await isSiteBlocked(url.hostname);
    updateBlockButton(isBlocked);
    
    // Check if site is marked as productive
    const siteCategory = await getSiteCategory(url.hostname);
    updateProductiveButton(siteCategory);
  }
  
  // Load today's summary
  await loadTodaySummary();
  
  // Set up event listeners
  setupEventListeners();
});

// Format time in milliseconds to human-readable format
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Get time spent on a specific site today
async function getTimeSpentOnSite(hostname) {
  // This will be replaced with actual data from storage
  // For now, return a random value for demonstration
  return Math.floor(Math.random() * 3600000); // Random time up to 1 hour
}

// Check if a site is blocked
async function isSiteBlocked(hostname) {
  // This will be replaced with actual data from storage
  return false;
}

// Get site category (productive, neutral, distracting)
async function getSiteCategory(hostname) {
  // This will be replaced with actual data from storage
  return 'neutral';
}

// Update block button based on site status
function updateBlockButton(isBlocked) {
  if (isBlocked) {
    blockSiteButton.textContent = 'Unblock This Site';
    blockSiteButton.classList.remove('btn-danger');
    blockSiteButton.classList.add('btn-success');
  } else {
    blockSiteButton.textContent = 'Block This Site';
    blockSiteButton.classList.remove('btn-success');
    blockSiteButton.classList.add('btn-danger');
  }
}

// Update productive button based on site category
function updateProductiveButton(category) {
  if (category === 'productive') {
    setProductiveButton.textContent = 'Mark as Distracting';
    setProductiveButton.classList.remove('btn-success');
    setProductiveButton.classList.add('btn-danger');
  } else if (category === 'distracting') {
    setProductiveButton.textContent = 'Mark as Neutral';
    setProductiveButton.classList.remove('btn-danger');
    setProductiveButton.classList.add('btn-secondary');
  } else {
    setProductiveButton.textContent = 'Mark as Productive';
    setProductiveButton.classList.remove('btn-secondary');
    setProductiveButton.classList.add('btn-success');
  }
}

// Load today's summary data
async function loadTodaySummary() {
  // This will be replaced with actual data from storage
  // For now, use random values for demonstration
  const productive = Math.floor(Math.random() * 7200000); // Up to 2 hours
  const neutral = Math.floor(Math.random() * 3600000); // Up to 1 hour
  const distracting = Math.floor(Math.random() * 5400000); // Up to 1.5 hours
  
  productiveTimeElement.textContent = formatTime(productive);
  neutralTimeElement.textContent = formatTime(neutral);
  distractingTimeElement.textContent = formatTime(distracting);
}

// Set up event listeners for buttons
function setupEventListeners() {
  // Block/unblock site
  blockSiteButton.addEventListener('click', async () => {
    if (!currentTab || !currentTab.url) return;
    
    const url = new URL(currentTab.url);
    const hostname = url.hostname;
    const isBlocked = await isSiteBlocked(hostname);
    
    // Toggle block status
    await toggleSiteBlock(hostname, !isBlocked);
    updateBlockButton(!isBlocked);
  });
  
  // Change site category
  setProductiveButton.addEventListener('click', async () => {
    if (!currentTab || !currentTab.url) return;
    
    const url = new URL(currentTab.url);
    const hostname = url.hostname;
    const currentCategory = await getSiteCategory(hostname);
    
    // Cycle through categories: neutral -> productive -> distracting -> neutral
    let newCategory;
    if (currentCategory === 'neutral') {
      newCategory = 'productive';
    } else if (currentCategory === 'productive') {
      newCategory = 'distracting';
    } else {
      newCategory = 'neutral';
    }
    
    await setSiteCategory(hostname, newCategory);
    updateProductiveButton(newCategory);
  });
  
  // Open dashboard
  viewDashboardButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'dashboard.html' });
  });
  
  // Open options page
  openOptionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// Toggle site block status
async function toggleSiteBlock(hostname, shouldBlock) {
  // This will be replaced with actual storage update
  console.log(`${shouldBlock ? 'Blocking' : 'Unblocking'} ${hostname}`);
  // In a real implementation, we would update chrome.storage here
}

// Set site category
async function setSiteCategory(hostname, category) {
  // This will be replaced with actual storage update
  console.log(`Setting ${hostname} as ${category}`);
  // In a real implementation, we would update chrome.storage here
}
