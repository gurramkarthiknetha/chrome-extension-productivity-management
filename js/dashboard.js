// Constants
const STORAGE_KEY_SITE_DATA = 'siteData';
const STORAGE_KEY_SITE_CATEGORIES = 'siteCategories';
const STORAGE_KEY_SETTINGS = 'settings';

// DOM elements
const selectedDateElement = document.getElementById('selected-date');
const prevDayButton = document.getElementById('prev-day');
const nextDayButton = document.getElementById('next-day');
const productiveTimeElement = document.getElementById('productive-time');
const neutralTimeElement = document.getElementById('neutral-time');
const distractingTimeElement = document.getElementById('distracting-time');
const totalTimeElement = document.getElementById('total-time');
const productivePercentageElement = document.getElementById('productive-percentage');
const neutralPercentageElement = document.getElementById('neutral-percentage');
const distractingPercentageElement = document.getElementById('distracting-percentage');
const sitesVisitedElement = document.getElementById('sites-visited');
const allSitesList = document.getElementById('all-sites-list');
const productiveSitesList = document.getElementById('productive-sites-list');
const neutralSitesList = document.getElementById('neutral-sites-list');
const distractingSitesList = document.getElementById('distracting-sites-list');
const insightsContainer = document.getElementById('insights-container');
const openOptionsButton = document.getElementById('open-options');
const exportReportButton = document.getElementById('export-report');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Charts
let timeDistributionChart = null;
let hourlyActivityChart = null;

// Current selected date
let selectedDate = new Date();
let formattedSelectedDate = formatDate(selectedDate);

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  // Set up event listeners
  setupEventListeners();
  
  // Load data for today
  await loadDashboardData(formattedSelectedDate);
  
  // Initialize charts
  initializeCharts();
});

// Format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Format date for display
function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateString === formatDate(today)) {
    return 'Today';
  } else if (dateString === formatDate(yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

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

// Set up event listeners
function setupEventListeners() {
  // Date navigation
  prevDayButton.addEventListener('click', () => {
    selectedDate.setDate(selectedDate.getDate() - 1);
    formattedSelectedDate = formatDate(selectedDate);
    loadDashboardData(formattedSelectedDate);
  });
  
  nextDayButton.addEventListener('click', () => {
    const today = new Date();
    if (selectedDate < today) {
      selectedDate.setDate(selectedDate.getDate() + 1);
      formattedSelectedDate = formatDate(selectedDate);
      loadDashboardData(formattedSelectedDate);
    }
  });
  
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
  
  // Open options page
  openOptionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Export report
  exportReportButton.addEventListener('click', () => {
    exportReport();
  });
}

// Load dashboard data for a specific date
async function loadDashboardData(date) {
  // Update displayed date
  selectedDateElement.textContent = formatDateForDisplay(date);
  
  // Get site data and categories
  const storage = await chrome.storage.local.get([
    STORAGE_KEY_SITE_DATA,
    STORAGE_KEY_SITE_CATEGORIES,
    STORAGE_KEY_SETTINGS
  ]);
  
  const siteData = storage[STORAGE_KEY_SITE_DATA] || {};
  const categories = storage[STORAGE_KEY_SITE_CATEGORIES] || {
    productive: [],
    neutral: [],
    distracting: []
  };
  const settings = storage[STORAGE_KEY_SETTINGS] || {};
  
  // Calculate time spent in each category
  let productiveTime = 0;
  let neutralTime = 0;
  let distractingTime = 0;
  let totalTime = 0;
  let sitesVisited = 0;
  
  // Site data for lists
  const allSites = [];
  const productiveSites = [];
  const neutralSites = [];
  const distractingSites = [];
  
  // Hourly data for chart
  const hourlyData = Array(24).fill(0);
  
  // Process site data
  for (const hostname in siteData) {
    if (siteData[hostname][date]) {
      const timeSpent = siteData[hostname][date];
      totalTime += timeSpent;
      sitesVisited++;
      
      // Categorize time
      if (categories.productive.includes(hostname)) {
        productiveTime += timeSpent;
        productiveSites.push({ hostname, timeSpent });
      } else if (categories.distracting.includes(hostname)) {
        distractingTime += timeSpent;
        distractingSites.push({ hostname, timeSpent });
      } else {
        neutralTime += timeSpent;
        neutralSites.push({ hostname, timeSpent });
      }
      
      // Add to all sites
      allSites.push({ hostname, timeSpent, category: getCategoryForSite(hostname, categories) });
      
      // TODO: Add hourly data processing when we have that data
      // For now, distribute time randomly across hours for demonstration
      const randomHour = Math.floor(Math.random() * 24);
      hourlyData[randomHour] += timeSpent;
    }
  }
  
  // Update summary section
  updateSummarySection(productiveTime, neutralTime, distractingTime, totalTime, sitesVisited);
  
  // Update site lists
  updateSiteLists(allSites, productiveSites, neutralSites, distractingSites, totalTime);
  
  // Update charts
  updateCharts(productiveTime, neutralTime, distractingTime, hourlyData);
  
  // Generate insights
  generateInsights(productiveTime, distractingTime, totalTime, settings, allSites);
}

// Get category for a site
function getCategoryForSite(hostname, categories) {
  if (categories.productive.includes(hostname)) {
    return 'productive';
  } else if (categories.distracting.includes(hostname)) {
    return 'distracting';
  } else {
    return 'neutral';
  }
}

// Update summary section
function updateSummarySection(productiveTime, neutralTime, distractingTime, totalTime, sitesVisited) {
  // Update time values
  productiveTimeElement.textContent = formatTime(productiveTime);
  neutralTimeElement.textContent = formatTime(neutralTime);
  distractingTimeElement.textContent = formatTime(distractingTime);
  totalTimeElement.textContent = formatTime(totalTime);
  
  // Update percentages
  if (totalTime > 0) {
    productivePercentageElement.textContent = `${Math.round((productiveTime / totalTime) * 100)}%`;
    neutralPercentageElement.textContent = `${Math.round((neutralTime / totalTime) * 100)}%`;
    distractingPercentageElement.textContent = `${Math.round((distractingTime / totalTime) * 100)}%`;
  } else {
    productivePercentageElement.textContent = '0%';
    neutralPercentageElement.textContent = '0%';
    distractingPercentageElement.textContent = '0%';
  }
  
  // Update sites visited
  sitesVisitedElement.textContent = `${sitesVisited} sites`;
}

// Update site lists
function updateSiteLists(allSites, productiveSites, neutralSites, distractingSites, totalTime) {
  // Sort sites by time spent (descending)
  allSites.sort((a, b) => b.timeSpent - a.timeSpent);
  productiveSites.sort((a, b) => b.timeSpent - a.timeSpent);
  neutralSites.sort((a, b) => b.timeSpent - a.timeSpent);
  distractingSites.sort((a, b) => b.timeSpent - a.timeSpent);
  
  // Update all sites list
  updateSiteList(allSitesList, allSites, totalTime);
  
  // Update productive sites list
  updateSiteList(productiveSitesList, productiveSites, totalTime, 'productive');
  
  // Update neutral sites list
  updateSiteList(neutralSitesList, neutralSites, totalTime, 'neutral');
  
  // Update distracting sites list
  updateSiteList(distractingSitesList, distractingSites, totalTime, 'distracting');
}

// Update a specific site list
function updateSiteList(listElement, sites, totalTime, category = null) {
  listElement.innerHTML = '';
  
  if (sites.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = `No ${category || ''} sites visited on this day`;
    emptyItem.className = 'empty-list';
    listElement.appendChild(emptyItem);
    return;
  }
  
  sites.forEach(site => {
    const listItem = document.createElement('li');
    
    const siteInfo = document.createElement('div');
    siteInfo.className = 'site-info';
    
    // Try to add favicon (this might not work for all sites)
    const siteFavicon = document.createElement('img');
    siteFavicon.className = 'site-favicon';
    siteFavicon.src = `https://www.google.com/s2/favicons?domain=${site.hostname}`;
    siteFavicon.onerror = () => {
      siteFavicon.style.display = 'none';
    };
    siteInfo.appendChild(siteFavicon);
    
    const siteName = document.createElement('span');
    siteName.className = 'site-name';
    siteName.textContent = site.hostname;
    siteInfo.appendChild(siteName);
    
    listItem.appendChild(siteInfo);
    
    const siteTime = document.createElement('span');
    siteTime.className = 'site-time';
    siteTime.textContent = formatTime(site.timeSpent);
    listItem.appendChild(siteTime);
    
    const sitePercentage = document.createElement('span');
    sitePercentage.className = 'site-percentage';
    sitePercentage.textContent = `${Math.round((site.timeSpent / totalTime) * 100)}%`;
    listItem.appendChild(sitePercentage);
    
    // Add bar visualization
    const siteBar = document.createElement('div');
    siteBar.className = 'site-bar';
    
    const siteBarFill = document.createElement('div');
    siteBarFill.className = 'site-bar-fill';
    siteBarFill.style.width = `${Math.round((site.timeSpent / totalTime) * 100)}%`;
    
    // Set color based on category
    if (category) {
      siteBarFill.className += ` ${category}-fill`;
    } else if (site.category) {
      siteBarFill.className += ` ${site.category}-fill`;
    } else {
      siteBarFill.className += ' neutral-fill';
    }
    
    siteBar.appendChild(siteBarFill);
    listItem.appendChild(siteBar);
    
    listElement.appendChild(listItem);
  });
}

// Initialize charts
function initializeCharts() {
  // Time distribution chart (pie chart)
  const timeDistributionCtx = document.getElementById('time-distribution-chart').getContext('2d');
  timeDistributionChart = new Chart(timeDistributionCtx, {
    type: 'doughnut',
    data: {
      labels: ['Productive', 'Neutral', 'Distracting'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#34a853', '#4285f4', '#ea4335'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
  
  // Hourly activity chart (bar chart)
  const hourlyActivityCtx = document.getElementById('hourly-activity-chart').getContext('2d');
  hourlyActivityChart = new Chart(hourlyActivityCtx, {
    type: 'bar',
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [{
        label: 'Time Spent',
        data: Array(24).fill(0),
        backgroundColor: '#4285f4'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatTime(value);
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// Update charts with new data
function updateCharts(productiveTime, neutralTime, distractingTime, hourlyData) {
  // Update time distribution chart
  timeDistributionChart.data.datasets[0].data = [
    productiveTime,
    neutralTime,
    distractingTime
  ];
  timeDistributionChart.update();
  
  // Update hourly activity chart
  hourlyActivityChart.data.datasets[0].data = hourlyData;
  hourlyActivityChart.update();
}

// Generate insights based on data
function generateInsights(productiveTime, distractingTime, totalTime, settings, allSites) {
  insightsContainer.innerHTML = '';
  
  if (totalTime === 0) {
    const noDataInsight = document.createElement('div');
    noDataInsight.className = 'insight-card';
    noDataInsight.innerHTML = `
      <h3>No data available</h3>
      <p>There is no browsing data recorded for this day.</p>
    `;
    insightsContainer.appendChild(noDataInsight);
    return;
  }
  
  // Productivity ratio insight
  const productivityRatio = productiveTime / (productiveTime + distractingTime) || 0;
  const productivityInsight = document.createElement('div');
  productivityInsight.className = 'insight-card';
  
  let productivityMessage;
  if (productivityRatio >= 0.7) {
    productivityMessage = 'Great job! You spent most of your time on productive sites.';
  } else if (productivityRatio >= 0.5) {
    productivityMessage = 'You had a balanced day between productive and distracting activities.';
  } else {
    productivityMessage = 'You spent more time on distracting sites than productive ones today.';
  }
  
  productivityInsight.innerHTML = `
    <h3>Productivity Score: ${Math.round(productivityRatio * 100)}%</h3>
    <p>${productivityMessage}</p>
  `;
  insightsContainer.appendChild(productivityInsight);
  
  // Top time consumer insight
  if (allSites.length > 0) {
    const topSite = allSites[0];
    const topSiteInsight = document.createElement('div');
    topSiteInsight.className = 'insight-card';
    
    let topSiteMessage;
    if (topSite.category === 'productive') {
      topSiteMessage = 'This is a productive site. Great job focusing your time here!';
    } else if (topSite.category === 'distracting') {
      topSiteMessage = 'This is marked as a distracting site. Consider limiting your time here.';
    } else {
      topSiteMessage = 'This site is not categorized yet. Consider marking it as productive or distracting.';
    }
    
    topSiteInsight.innerHTML = `
      <h3>Top Time Consumer: ${topSite.hostname}</h3>
      <p>You spent ${formatTime(topSite.timeSpent)} (${Math.round((topSite.timeSpent / totalTime) * 100)}% of your browsing time) on this site. ${topSiteMessage}</p>
    `;
    insightsContainer.appendChild(topSiteInsight);
  }
  
  // Goal progress insight (if goals are set)
  if (settings.dailyProductiveGoal) {
    const goalProgress = (productiveTime / (settings.dailyProductiveGoal * 3600000)) * 100;
    const goalInsight = document.createElement('div');
    goalInsight.className = 'insight-card';
    
    let goalMessage;
    if (goalProgress >= 100) {
      goalMessage = 'Congratulations! You reached your daily productive time goal.';
    } else if (goalProgress >= 70) {
      goalMessage = 'You\'re making good progress toward your daily productive time goal.';
    } else {
      goalMessage = 'You still have some way to go to reach your daily productive time goal.';
    }
    
    goalInsight.innerHTML = `
      <h3>Goal Progress: ${Math.min(100, Math.round(goalProgress))}%</h3>
      <p>${goalMessage}</p>
    `;
    insightsContainer.appendChild(goalInsight);
  }
  
  // Distracting time limit insight (if limit is set)
  if (settings.dailyDistractingLimit) {
    const limitProgress = (distractingTime / (settings.dailyDistractingLimit * 3600000)) * 100;
    const limitInsight = document.createElement('div');
    limitInsight.className = 'insight-card';
    
    let limitMessage;
    if (limitProgress >= 100) {
      limitMessage = 'You\'ve exceeded your daily limit for distracting sites.';
    } else if (limitProgress >= 70) {
      limitMessage = 'You\'re approaching your daily limit for distracting sites.';
    } else {
      limitMessage = 'You\'re well within your daily limit for distracting sites.';
    }
    
    limitInsight.innerHTML = `
      <h3>Distracting Time: ${Math.round(limitProgress)}% of limit</h3>
      <p>${limitMessage}</p>
    `;
    insightsContainer.appendChild(limitInsight);
  }
}

// Export report as PDF or HTML
function exportReport() {
  // For now, we'll just create a simple HTML report and open it in a new tab
  // In a real implementation, this could generate a PDF using a library
  
  const reportContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Productivity Report - ${formattedSelectedDate}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        h1 { color: #4285f4; }
        .section { margin-bottom: 30px; }
        .summary { display: flex; justify-content: space-between; }
        .summary-item { text-align: center; padding: 15px; background: #f5f5f5; border-radius: 8px; }
        .time { font-size: 24px; font-weight: bold; margin: 10px 0; }
        .percentage { color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <h1>Productivity Report</h1>
      <p>Date: ${formattedSelectedDate}</p>
      
      <div class="section">
        <h2>Summary</h2>
        <div class="summary">
          <div class="summary-item">
            <h3>Productive Time</h3>
            <div class="time">${productiveTimeElement.textContent}</div>
            <div class="percentage">${productivePercentageElement.textContent}</div>
          </div>
          <div class="summary-item">
            <h3>Neutral Time</h3>
            <div class="time">${neutralTimeElement.textContent}</div>
            <div class="percentage">${neutralPercentageElement.textContent}</div>
          </div>
          <div class="summary-item">
            <h3>Distracting Time</h3>
            <div class="time">${distractingTimeElement.textContent}</div>
            <div class="percentage">${distractingPercentageElement.textContent}</div>
          </div>
          <div class="summary-item">
            <h3>Total Time</h3>
            <div class="time">${totalTimeElement.textContent}</div>
            <div class="percentage">${sitesVisitedElement.textContent}</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2>Top Sites</h2>
        <table>
          <tr>
            <th>Site</th>
            <th>Category</th>
            <th>Time Spent</th>
            <th>Percentage</th>
          </tr>
          ${Array.from(allSitesList.children).map(li => {
            if (li.className === 'empty-list') return '';
            const site = li.querySelector('.site-name').textContent;
            const category = li.querySelector('.site-bar-fill').className.includes('productive') ? 'Productive' :
                            li.querySelector('.site-bar-fill').className.includes('distracting') ? 'Distracting' : 'Neutral';
            const time = li.querySelector('.site-time').textContent;
            const percentage = li.querySelector('.site-percentage').textContent;
            return `
              <tr>
                <td>${site}</td>
                <td>${category}</td>
                <td>${time}</td>
                <td>${percentage}</td>
              </tr>
            `;
          }).join('')}
        </table>
      </div>
      
      <div class="section">
        <h2>Insights</h2>
        ${Array.from(insightsContainer.children).map(insight => {
          return `
            <div class="insight">
              <h3>${insight.querySelector('h3').textContent}</h3>
              <p>${insight.querySelector('p').textContent}</p>
            </div>
          `;
        }).join('')}
      </div>
      
      <footer>
        <p>Generated by Productivity Manager Chrome Extension</p>
      </footer>
    </body>
    </html>
  `;
  
  // Create a blob and open in new tab
  const blob = new Blob([reportContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
