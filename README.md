# Productivity Manager Chrome Extension

A Chrome extension for productivity management that helps users track and improve their online habits.

## Features

- **Time Tracking**: Monitor the amount of time spent on various websites
- **Site Categorization**: Categorize sites as productive, neutral, or distracting
- **Site Blocking**: Block distracting websites based on user preferences
- **Productivity Dashboard**: View detailed statistics and insights about your browsing habits
- **Daily Reports**: Generate productivity reports with usage statistics
- **Customizable Settings**: Set productivity goals and distracting time limits

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: MERN Stack (MongoDB, Express, React, Node.js)
- **Data Visualization**: Chart.js
- **Storage**: Chrome Storage API (local) and MongoDB (cloud sync)

## Installation

### From Source Code

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/productivity-manager.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top right corner

4. Click "Load unpacked" and select the directory containing the extension files

5. The extension should now be installed and visible in your Chrome toolbar

### From Chrome Web Store (Coming Soon)

1. Visit the Chrome Web Store page for Productivity Manager
2. Click "Add to Chrome"
3. Confirm the installation when prompted

## Usage

1. **Track Time**: The extension automatically tracks the time you spend on websites
2. **View Stats**: Click the extension icon to see your current site stats and daily summary
3. **Block Sites**: Mark sites as distracting to block them or set time limits
4. **Check Dashboard**: Open the dashboard for detailed analytics and insights
5. **Customize Settings**: Configure your productivity goals and preferences

## Project Structure

```
productivity-manager/
├── manifest.json        # Extension configuration
├── background.js        # Background tracking script
├── popup.html           # Extension popup UI
├── options.html         # Settings page
├── dashboard.html       # Analytics dashboard
├── blocked.html         # Blocked site page
├── css/                 # Stylesheets
│   ├── popup.css
│   ├── options.css
│   └── dashboard.css
├── js/                  # JavaScript files
│   ├── popup.js
│   ├── options.js
│   └── dashboard.js
└── icons/               # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Development

### Prerequisites

- Node.js and npm (for backend development)
- MongoDB (for data storage)
- Chrome browser

### Backend Setup (Coming Soon)

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   ```
   cp .env.example .env
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Screenshots

(Coming soon)

## Acknowledgements

- [Chart.js](https://www.chartjs.org/) for data visualization
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/) documentation