# Birthday Planner

**Birthday Planner** is a personal birthday, gift and celebration planner designed to help you keep track of important dates and organize gifts throughout the year.

Save birthdays that automatically repeat every year, check upcoming celebrations, plan gifts, organize birthday parties and create custom festivities involving multiple people.

Free, offline-capable and without accounts, advertisements or subscriptions.

## Installation

**[Open Birthday Planner](https://fedegianne.github.io/birthday-planner/)**

Birthday Planner is a Progressive Web App (PWA) that can be installed directly on your device without using an app store.

### iPhone / iPad

1. Open the app link in Safari.
2. Tap the Share button.
3. Select **Add to Home Screen**.
4. Enable **Open as Web App**, if available.
5. Tap **Add**.

### Android

1. Open the app link in Chrome.
2. Tap the three-dot menu.
3. Select **Install app** or **Add to Home screen**.
4. Confirm the installation.

The app can also be used directly from a desktop browser.

## Features

- Automatically recurring birthdays.
- Birthday countdowns and automatic age calculation.
- Interactive monthly calendar.
- Configurable upcoming birthday lists.
- In-app reminders for birthdays, parties and festivities.
- Gift ideas, notes and purchase tracking.
- Gift wrapping status and cost tracking.
- Birthday party planning.
- Yearly gift history.
- Custom festivities with multiple gift recipients.
- Automatic, light and dark appearance modes.
- Offline functionality.
- Local data storage with backup and restore.

## How to use

### Home

View today's date, the next birthday, upcoming celebrations and active reminders.

The home page provides an overview of birthdays and events occurring during the current month, along with a configurable list of upcoming birthdays.

In-app reminders help you prepare for birthdays and celebrations occurring within the next seven days.

### Calendar

Browse birthdays, parties and custom festivities using the monthly calendar.

Birthdays automatically repeat every year, while party and festivity dates are associated with specific occasions.

### People

Add people and save their birthdays. The birth year is optional and is used to calculate their age when provided.

For each birthday, you can:

- Record gift ideas and notes.
- Mark gifts as purchased or wrapped.
- Record gift costs.
- Schedule a birthday party.
- Save the party date, time and location.
- Review gifts from previous years.

Birthday information is retained permanently, while gifts and parties are organized by year.

### Festivities

Create custom celebrations, such as Christmas gatherings, gift exchanges, anniversaries or other special occasions.

Each festivity can include multiple gift recipients, either selected from existing birthday records or added independently.

For each recipient, you can record gift ideas, purchase status, wrapping status and costs.

Festivities appear in the calendar and upcoming event reminders. Previous festivities remain accessible for future reference.

### Settings

Customize the app appearance, configure reminders and choose which upcoming birthdays are displayed on the home page:

- Next 30 days.
- Next 60 days.
- Next 90 days.
- Next 10 birthdays.
- All upcoming birthdays.

The Settings page also provides backup and restore functionality.

## Reminders

Birthday Planner displays reminders directly within the app for upcoming birthdays, parties and festivities.

Birthday reminders can be displayed one week before, one day before and on the birthday itself.

The app currently does not send push notifications or reminders while it is closed.

## Data and privacy

All personal records are stored locally on your device using IndexedDB. No personal records are uploaded to an external database.

The app does not require an account and does not automatically synchronize data between devices.

Cloudflare Web Analytics is used to collect privacy-focused, aggregate website usage statistics, such as page visits, browser type, operating system, approximate geographical region and loading performance.

Analytics does not access personal records stored within the app and does not use tracking cookies.

For further information, see the [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/).

## Backup and restore

Export your birthdays, gift history, parties, festivities and settings as a JSON backup file from the Settings page.

To recover your data, select a previously exported backup file using the Restore function. Restoring a backup replaces the current app data.

**Regular backups are recommended. Always create a backup before:**

- Removing or reinstalling the app.
- Clearing browser or application storage.
- Changing your device.
- Resetting your device.

Keep backup files in a safe location, such as iCloud Drive, Google Drive or your computer.

## Offline use and updates

After the first successful online launch, the app can be used without an internet connection.

An internet connection is required to receive application updates. Updates are downloaded automatically and normally do not affect locally stored data.

## Development

Built using HTML, CSS, vanilla JavaScript, IndexedDB and Service Workers. No external dependencies or build tools are required.

### Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.

### Deployment

The app is hosted using GitHub Pages. Changes pushed to the main branch are automatically deployed.

Increment the service worker cache version in `sw.js` when releasing functional or visual updates.