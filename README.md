# AdlaWatt

An IoT-based transportable off-grid solar energy harvesting system with a mobile application for real-time energy monitoring, appliance recommendations, notifications, and backup power management during electricity interruptions.

AdlaWatt is designed to provide households with an alternative backup power source by harvesting solar energy, storing it in a battery, and supplying electricity through a built-in AC outlet. The mobile application allows users to monitor battery status, solar energy, power consumption, temperature, system status, energy history, and appliance recommendations.

> **Project Status:** In Development
> The mobile application is integrated with Supabase — authentication, database, and real-time streaming — for live monitoring, notifications, activity logs, appliances, and analytics report export. Some modules remain in progress: analytics chart rendering and the end-to-end ESP32 hardware feed.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Components](#system-components)
- [Mobile Application](#mobile-application)
- [Tech Stack](#tech-stack)
- [Hardware Components](#hardware-components)
- [Software Architecture](#software-architecture)
- [Project Structure](#project-structure)
- [Application Screens](#application-screens)
- [Data and Backend](#data-and-backend)
- [Data Flow](#data-flow)
- [Installation](#installation)
- [Development](#development)
- [Build and Deployment](#build-and-deployment)
- [Current Development Status](#current-development-status)
- [Limitations](#limitations)
- [System Specifications](#system-specifications)
- [SDG Alignment](#sustainable-development-goals)
- [Research Evaluation](#research-evaluation)
- [Development Approach](#development-approach)
- [Future Improvements](#future-improvements)
- [Research Purpose](#research-purpose)
- [Contributors](#contributors)
- [License](#license)

---

## Overview

AdlaWatt is an IoT-based off-grid solar energy harvesting system developed as a backup power solution for households during electricity interruptions.

The system collects solar energy through a solar panel and stores the generated energy in a 12V battery housed inside a transportable lockable enclosure. A built-in AC outlet allows compatible household appliances to use the stored energy.

The system monitors energy generation, energy consumption, battery status, battery temperature, solar panel temperature, and interior temperature. Sensor data is transmitted through an ESP32 to a cloud database and streamed in real time to the AdlaWatt mobile application.

One of the main features of AdlaWatt is its appliance recommendation system. Users can identify appliances they plan to use, and the application recommends suitable appliances based on their power requirements and the available battery level.

AdlaWatt is intended as a backup power source during electricity interruptions and is not designed to replace the electrical grid.

---

## Features

### Real-Time Monitoring

The application displays live monitoring information received in real time from Supabase (the ESP32 writes to the `monitoring` table; the app subscribes to `postgres_changes` updates). The dashboard shows:

- Battery percentage and battery status (Charging / Discharging / Idle)
- Battery voltage
- Battery energy in watt-hours and estimated time remaining
- Current appliance load
- Depth of discharge (DoD) status (Safe / Unsafe)
- Incoming solar energy and solar status (Low / Moderate / High)
- Solar voltage, solar current, solar timer, and total energy
- Battery temperature, solar panel temperature, and interior temperature (each with Nominal / Elevated / High / Critical status)
- Device status (Online / Offline)
- Live weather (temperature, description, location) from OpenWeatherMap

A battery gauge with smooth animated transitions and a live weather card are rendered on the dashboard.

### Appliance Recommendation

The application allows users to view or select household appliances and receive recommendations based on the available battery state.

A battery-aware recommendation engine (`src/services/recommendation.ts`) classifies the battery tier (Safe / Caution / Unsafe) using remaining energy, the 144 Wh reserve floor, voltage, and depth of discharge, then estimates per-appliance runtime from the usable energy and the appliance power range. Appliances are shown with one of two badges:

- **OK to use** — recommended or still usable with care
- **Not advisable** — not recommended (blocked battery, less than 10 minutes of runtime, or invalid wattage)

The engine keeps the full analysis (runtime range, tier, verdict, reasons) available for richer views, while the dashboard and Appliances screens expose the simplified two-badge display. When no live monitoring reading is available yet, the screens fall back to the previous wattage-threshold rule.

### Dashboard

The dashboard provides a summary of the current AdlaWatt system condition, including:

- Battery status and battery gauge
- Solar input
- Current load
- Device status
- Battery, solar panel, and interior temperatures
- Depth of discharge status
- Appliance recommendations
- Recent activity logs
- Quick navigation buttons with smooth scrolling

### Weather

The dashboard includes a live weather card that displays the current temperature, condition description, and location using the OpenWeatherMap API. Location is resolved through device permissions (`expo-location`) with balanced accuracy, and weather refreshes automatically.

### Notifications

The application generates and displays system notifications in real time:

- Battery alerts (charging, discharging, low level, fully charged, runtime, voltage)
- Temperature alerts (battery, solar panel, and interior — Nominal to Critical)
- Solar alerts (input detected, increased, unavailable, low input during charging)
- Load alerts (current load detected, no load, high load, consumption increased)
- Depth of discharge alerts (safe, unsafe, returned to safe)
- Device status alerts (online, offline, status changed)
- Data health alerts (stale monitoring, missing records, invalid time remaining)

Notifications are stored in the Supabase `notifications` table, include `normal` or `alert` types, use cooldowns to avoid alert spam, and can be marked as read. An unread-count badge is shown on the navigation bar.

### Activity Logs

The application provides an activity log for viewing recorded system activities and events. Logs are paginated and typed (info, warning, error, critical). The dashboard also provides a preview of recent activity logs with an option to view all recorded activities.

### Appliance Management

Users can view household appliances and their power requirements, select appliances for use, and manage custom appliances:

- Add, edit, and delete custom appliances
- Advisable / Not Advisable toggle per appliance
- Filters by advisability, power rating (All / Highest / Moderate / Low), and area (All Areas / Indoor / Outdoor / Custom Appliances)

### Component Monitoring

The Components screen provides live status information for the IoT and power components used by the AdlaWatt system, retrieved from Supabase with real-time updates.

### Analytics & Reports

The Analytics screen loads historical data from the `monitoring_history` and `appliance_usage_history` tables for a selected date range and frequency (daily, weekly, monthly, yearly). It generates:

- **PDF reports** (jsPDF + jspdf-autotable) with brand header, embedded AdlaWatt logo, summary statistics, energy summary, monitoring history, appliance usage history, and chart data tables
- **CSV exports** for raw data

Reports can be downloaded on web and shared through the native share sheet. Chart visuals are temporarily placeholder pending the implementation of the analytics chart module.

### Settings (Menu)

The Menu screen provides account management and user preferences:

- Edit username and email
- Change password (with current-password verification)
- Dark mode toggle, color-blind mode, font size, font weight, font family, language, vibration, and email-notification preferences
- Logout with confirmation

> Preference values are currently kept in application state and are not yet persisted across app restarts.

### About Us

The About Us section provides information about the AdlaWatt project and its developers.

### Authentication

The application uses Supabase authentication with:

- Registration (username, email, password) with validation and Terms and Conditions
- Login by username or email
- Persistent login sessions (AsyncStorage on native, localStorage on web)
- User profile loading and account updates (username, email, password)
- Email change handling with confirmation
- Logout functionality

---

## System Components

AdlaWatt consists of three major parts:

### 1. Physical Power System

The physical system consists of:

- Solar panel
- Solar charge controller
- 12V battery
- Inverter
- Built-in AC outlet
- Protection components
- Transportable lockable enclosure

### 2. IoT Monitoring System

The IoT system collects and processes information from the physical power system using an ESP32 and connected sensors. Sensor readings are transmitted to the cloud database over Wi-Fi.

### 3. Software System

The software system consists of:

- Cross-platform mobile application for household users
- Web-based admin dashboard for researchers (planned)
- Supabase cloud database with real-time data streaming
- REST/HTTP communication between the IoT system and cloud services

The capstone identifies the household user and admin as the primary actors. Household users monitor the system through the mobile application, while administrators can monitor data, view historical information, and configure alert thresholds.

---

## Mobile Application

The AdlaWatt mobile application is designed as a cross-platform application for household users. It is built with Expo (React Native) and Supabase for authentication, data storage, and real-time updates.

### Main Navigation

| Screen | Purpose |
|---|---|
| Dashboard | Displays system overview and real-time monitoring |
| Appliances | Displays household appliances and recommendations |
| Analytics | Displays historical data and report export |
| Components | Displays IoT and system component status |
| Notifications | Displays system notifications and alerts |
| Activity Logs | Displays system activity history |
| Menu | Account management and user preferences |
| About Us | Displays information about AdlaWatt |

### Navigation Components

The application uses:

- Custom bottom tab bar (Dashboard, Appliances, Analytics, Menu)
- Top navigation bar with a notification icon and unread-count badge
- Device status indicator in the navigation bar
- Quick-navigation buttons with smooth animated scrolling on the dashboard
- Route-based navigation through Expo Router
- Screen-specific containers and layout components

---

## Tech Stack

### Mobile Application

| Technology | Purpose |
|---|---|
| Expo SDK 55 (expo-dev-client) | Development platform |
| React Native 0.83 | Cross-platform mobile framework |
| React 19.2 | Component-based user interface |
| Expo Router | File-based routing and typed navigation |
| TypeScript (strict) | Static typing and application development |
| Supabase (`@supabase/supabase-js`) | Authentication, database, real-time streaming |
| React Native StyleSheet | Component styling |
| `react-native-svg` | SVG gauges and chart rendering |
| `react-native-reanimated` + `react-native-worklets` | Animations |
| `expo-linear-gradient` | Gradient navigation interface |
| `expo-glass-effect` | Glass-style surfaces |
| `expo-image` | Optimized image rendering |
| `@expo/vector-icons` / Ionicons | Application icons |
| `@react-native-async-storage/async-storage` | Session and storage persistence |
| `expo-location` | Location access for weather |
| `expo-sqlite` | Local database (reserved for offline support) |
| `@react-native-community/datetimepicker` | Date and time pickers |
| `eslint-config-expo` (ESLint 9 flat config) | Linting |

### Backend and Cloud

| Technology | Purpose |
|---|---|
| Supabase | Cloud database (PostgreSQL), authentication, and real-time streaming |
| Supabase Realtime | `postgres_changes` live updates for monitoring, notification, and components |
| OpenWeatherMap API | Live weather data |
| REST/HTTP | Communication between the IoT system and cloud services |
| ESP32 Wi-Fi | Wireless transmission of sensor data |

### Analytics and Reporting

- **jsPDF + jspdf-autotable** — PDF report generation
- **CSV export** — raw data download and sharing

### Development Tools

- **Visual Studio Code** — Application development
- **Android Studio** — Android testing and emulation
- **Expo CLI / EAS CLI** — Development and application builds
- **Git / GitHub** — Version control

---

## Hardware Components

The AdlaWatt physical prototype consists of power and IoT components.

### Power Components

| Component | Purpose |
|---|---|
| Solar Panel | Collects solar energy |
| PWM Charge Controller | Regulates battery charging |
| 12V Battery | Stores electrical energy |
| 1000W Inverter | Converts DC power to AC power |
| Breaker | Provides overcurrent protection |
| Surge Protection Device | Protects against voltage surges |
| AC Outlet | Supplies power to compatible appliances |

### IoT Components

| Component | Purpose |
|---|---|
| ESP32 | Main microcontroller and Wi-Fi communication |
| INA219 | Monitors solar panel voltage and current |
| INA226 | Monitors load voltage and current |
| DS18B20 | Monitors battery temperature |
| Voltage Sensor | Measures system voltage |
| Relay Module | Controls load and cooling fan switching |
| LCD2004 | Displays local real-time system information |
| 5V Fan | Provides cooling when required |

The app additionally tracks solar panel temperature and interior temperature alongside battery temperature. The capstone identifies the INA219 for the solar-panel side and INA226 for the load/appliance side, with the ESP32 collecting the sensor information and transmitting it to the cloud system.

---

## Software Architecture

The power system flow:

```text
Solar Panel
     │
     ▼
Surge Protection
     │
     ▼
Circuit Breaker
     │
     ▼
PWM Charge Controller
     │
     ▼
12V Battery
     │
     ▼
Inverter
     │
     ▼
Built-in AC Outlet
     │
     ▼
Household Appliance
```

Sensor and data flow:

```text
INA219 ─────────────┐
                    │
INA226 ─────────────┤
                    │
DS18B20 ────────────┤
                    │
Voltage Sensor ─────┤
                    ▼
                  ESP32
                    │
                  Wi-Fi / HTTP
                    │
                    ▼
               Supabase
        (PostgreSQL + Realtime)
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
 Mobile App    Admin Dashboard  ESP32 Status
 (Realtime)     (planned)       (monitoring)
```

Sensor information is collected by the ESP32, transmitted to Supabase over HTTP, and streamed to the mobile application through Supabase Realtime channels filtered by the authenticated user.

---

## Project Structure

The application follows a component-based Expo Router structure with the source under `src/` and the `@/` path alias pointing to `src/`.

```text
AdlaWatt/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── dashboard/
│   │   │   ├── dashboard.tsx
│   │   │   ├── appliances.tsx
│   │   │   ├── analytics.tsx
│   │   │   ├── components.tsx
│   │   │   ├── notifications.tsx
│   │   │   ├── activity-logs.tsx
│   │   │   ├── menu.tsx
│   │   │   └── about-us.tsx
│   │   ├── index.tsx
│   │   └── splash.tsx
│   │
│   ├── components/
│   │   ├── forms/
│   │   ├── layout/
│   │   └── ui/
│   │
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── routes.ts
│   │   └── theme.ts
│   │
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   │   └── supabase.ts
│   ├── services/
│   │   ├── auth.ts
│   │   ├── monitoringService.ts
│   │   ├── notificationService.ts
│   │   ├── analyticsService.ts
│   │   ├── weatherForecast.ts
│   │   └── recommendation.ts
│   └── global.css
│
├── assets/
├── android/
├── .env.local
├── app.json
├── eas.json
├── package.json
└── tsconfig.json
```

> The structure may change as additional screens, services, database integration, and reusable components are implemented.

---

## Application Screens

### Splash Screen

Displays the AdlaWatt logo when the application starts before navigating to authentication.

### Login

Allows users to sign in using:

- Username or email
- Password
- Invalid credential warnings

### Register

Allows users to create an account using Supabase authentication with:

- Username, email, and password validation
- Terms and Conditions agreement
- Account details (username) stored in auth metadata with the `users` profile created by the database trigger

### Dashboard

The dashboard provides the primary system overview with:

- Battery gauge and status with smooth animations
- Real-time monitoring cards (battery, voltage, watt-hours, load, solar, temperatures, depth of discharge)
- Live weather card
- Appliance recommendations
- Recent activity logs
- Quick-navigation buttons with animated scrolling
- View All Activity Logs link

### Appliances

The Appliances screen manages household appliances and power requirements:

- Live appliance list from Supabase
- Advisable / Not Advisable status
- Filters by advisability, power rating, and area
- Add, edit, and delete custom appliances
- Appliance selection for recommendations

### Analytics

The Analytics screen provides historical analysis and report export:

- Date range and frequency selection (daily, weekly, monthly, yearly)
- Data from monitoring history and appliance usage history
- CSV export and PDF report generation (with embedded logo and summary tables)
- Chart visuals currently rendered as a placeholder

### Components

The Components screen:

- Displays IoT and power component status (active/inactive, connected/not connected) with images
- Shows ESP32 device status
- Updates in real time through Supabase channels

### Notifications

The Notifications screen:

- Displays generated notifications (normal / alert types)
- Filters by type and time period
- Paginated list with unread state
- Mark-as-read support with unread-count badge in the navigation bar

### Activity Logs

The Activity Logs screen:

- Provides a complete, paginated view of recorded system activities
- Categorizes logs by type (info, warning, error, critical) with normalized icons

### Menu

The Menu screen provides:

- Account management (username, email, password change)
- Preferences (dark mode, color-blind mode, font size/weight/family, language, vibration, email notifications)
- Logout with confirmation

### About Us

Provides information about the AdlaWatt project and its developers.

---

## Data and Backend

### Current Integration State

The application is connected to Supabase for authentication, storage, and real-time streaming. Data is scoped to the authenticated user through `user_id` filtering and Supabase Realtime channels.

Static/mock dashboard values have been replaced by live Supabase queries and real-time subscriptions.

### Supabase Tables

| Table | Purpose |
|---|---|
| `users` | User profiles (created by a database trigger on sign-up) |
| `monitoring` | Current live sensor readings (single row per user) |
| `monitoring_history` | Historical monitoring records for analytics |
| `appliance_usage_history` | Historical appliance usage for analytics |
| `appliances` | Household appliance catalog and selection state |
| `notifications` | Generated notifications with read state |
| `activity_logs` | Recorded system activities and events |
| `components` | IoT/power component list and live status |

### Real-Time Features

- **Monitoring**: `postgres_changes` subscription on the `monitoring` table (all events) for the current user
- **Device status**: `UPDATE` subscription dedicated to the device online/offline state
- **Notifications**: automatic alert generation driven by real-time monitoring updates, staleness checks, and auth state changes
- **Components**: live `componentsChannel` and `monitoringChannel` subscriptions

### Environment Variables

The app reads its configuration from local environment files (`.env.local`, gitignored). Required variables:

```text
EXPO_PUBLIC_SUPABASE_URL=<supabase project url>
EXPO_PUBLIC_SUPABASE_KEY=<supabase anon/publishable key>
EXPO_PUBLIC_OWM_KEY=<openweathermap api key>
```

### Placeholder Modules

The following modules remain placeholders and are not yet end-to-end:

- **Analytics chart visuals** — data pipeline and CSV/PDF export are implemented; chart rendering is disabled
- **Notification safety thresholds** — load/voltage alert rules are inactive until the production thresholds are configured
- **Forgot password** — the route constant exists but the screen is not yet implemented

---

## Data Flow

The intended data flow is:

```text
Physical Sensors (ESP32)
       │
       ▼
   Wi-Fi / HTTP
       │
       ▼
   Supabase
(PostgreSQL + Realtime)
       │
       ├──────────────► Admin Dashboard (planned)
       │
       ▼ (Realtime postgres_changes)
AdlaWatt Mobile App
       │
       ├── Dashboard
       ├── Notifications
       ├── Activity Logs
       ├── Appliances
       ├── Components
       └── Analytics
```

Users authenticate through Supabase; all queries and real-time channels are scoped to the authenticated user.

---

## Installation

### Prerequisites

Install the following before running the project:

- Node.js
- npm
- Git
- Expo CLI / EAS CLI
- Android Studio for Android development and emulation
- Visual Studio Code or another code editor
- A Supabase project and an OpenWeatherMap API key

### Clone the Repository

```bash
git clone <repository-url>
cd AdlaWatt
```

### Environment Setup

Create a `.env.local` file in the project root and add the required values:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<your-supabase-anon-key>
EXPO_PUBLIC_OWM_KEY=<your-openweathermap-key>
```

The file is already ignored by Git.

### Install Dependencies

```bash
npm install
```

### Start the Development Server

The project uses a development build (native modules):

```bash
npm start
```

For LAN or tunnel connections:

```bash
npm run start:lan
npm run start:tunnel
```

### Android Development

To build and open the application on an Android emulator or device:

```bash
npm run android
```

---

## Development

### Start Development Server

```bash
npm start
```

### Web Development

```bash
npm run web
```

### Lint

```bash
npm run lint
```

### TypeScript Checking

Run the project's TypeScript compiler:

```bash
npx tsc --noEmit
```

### Clear Expo Cache

If the application behaves unexpectedly:

```bash
npx expo start -c
```

### USB Debugging

When using a physical Android device over USB:

```bash
npm run reverse
```

### Git

Check the current repository status:

```bash
git status
```

Create a commit:

```bash
git add .
git commit -m "Update AdlaWatt application"
```

Push changes:

```bash
git push
```

---

## Build and Deployment

The Android application is built using Expo Application Services (EAS) with three build profiles.

| Profile | Distribution | Build Type |
|---|---|---|
| `development` | Internal | Development client (APK) |
| `preview` | Internal | APK |
| `production` | Store-ready | APK (auto-incrementing version) |

### Install EAS CLI

```bash
npm install -g eas-cli
```

### Login to Expo

```bash
eas login
```

### Configure EAS

```bash
eas build:configure
```

### Development Build

```bash
eas build --platform android --profile development
```

### Preview Build

```bash
eas build --platform android --profile preview
```

### Production Build

```bash
eas build --platform android --profile production
```

The final build configuration may change as the project approaches deployment.

---

## Current Development Status

### Completed

- [x] Expo SDK 55 / React Native project setup
- [x] TypeScript (strict) configuration with `@/` path alias
- [x] Expo Router navigation with typed routes
- [x] Splash screen
- [x] Login screen (username or email)
- [x] Registration screen with validation and Terms and Conditions
- [x] Supabase authentication (sign-up, sign-in, profile, account update)
- [x] Persistent login sessions (AsyncStorage)
- [x] Custom bottom tab bar
- [x] Gradient navigation bar with notification icon
- [x] Unread notification count badge
- [x] Dashboard layout with quick-navigation scrolling
- [x] Real-time monitoring cards (battery, solar, temperature, load, device status)
- [x] Battery gauge with smooth animations
- [x] Depth of discharge (safe/unsafe) status
- [x] Live weather card (OpenWeatherMap + location)
- [x] Appliance management (add, edit, delete custom appliances)
- [x] Advisable / Not Advisable appliance toggle and filters
- [x] Battery-aware appliance recommendation engine
- [x] Component monitoring with real-time status
- [x] Notification service (auto-generated alerts and cooldowns)
- [x] Notifications screen with filters and pagination
- [x] Activity logs with pagination
- [x] Analytics data pipeline (monitoring + appliance history)
- [x] CSV and PDF report export
- [x] Light/dark/glass color tokens and theme hooks
- [x] Full dark-mode adoption across dashboard screens and shared components (auth screens intentionally remain light)
- [x] EAS build configuration (development, preview, production)
- [x] ESLint flat config (eslint-config-expo)

### In Progress

- [ ] Analytics chart rendering (visuals currently placeholder)
- [ ] Notification safety threshold configuration
- [ ] Forgot password screen
- [ ] Authentication-aware splash flow
- [ ] Menu preferences persistence
- [ ] End-to-end ESP32 → Supabase hardware feed
- [ ] Admin dashboard
- [ ] Historical energy charts
- [ ] Offline data handling

---

## Limitations

The current prototype has several limitations.

### Prototype Limitation

The project is currently a prototype and is not intended for commercial production or large-scale deployment.

### Backup Power Only

AdlaWatt is designed as an alternative power source during electricity interruptions. It is not intended to replace the electrical grid.

### Solar Dependence

Energy harvesting depends on available sunlight.

### Compatible Appliances

The system is intended for compatible household appliances within the supported power capacity.

### Internet Connectivity

Real-time mobile monitoring requires network connectivity between the IoT system, cloud services, and mobile application.

### ESP32 / Hardware Integration

The ESP32 hardware feed is being integrated. The application consumes data through Supabase, but the end-to-end hardware → cloud → app loop is not yet fully verified.

### Placeholder Modules

- Analytics chart visuals are temporarily disabled (data and exports are implemented)
- Appliance recommendations are battery-aware only while live monitoring data is present; without it, the app falls back to a wattage threshold
- Notification safety rules for load and voltage are inactive until production thresholds are configured
- The forgot password screen is not yet implemented

### Settings Persistence

Menu preferences (dark mode, font settings, toggles) are maintained in application state only and reset when the app restarts.

### Dark Mode Coverage

Dashboard screens and shared components follow the active theme via `useAppColors`. Auth screens intentionally remain light (no theme provider there by design).

### Development Leftovers

The repository contains a leftover development screen (`test-con`) and a few unused dependencies (e.g., `openmeteo`, `@react-navigation/*`) that are candidates for cleanup.

---

## System Specifications

The capstone documentation identifies the following major system characteristics:

| Specification          | Description                                       |
| ---------------------- | ------------------------------------------------- |
| System Type            | IoT-based off-grid solar energy harvesting system |
| Intended Use           | Backup power during electricity interruptions     |
| Battery                | 12V battery                                       |
| Inverter               | 1000W                                             |
| Solar Monitoring       | INA219                                            |
| Load Monitoring        | INA226                                            |
| Temperature Monitoring | DS18B20 (battery, solar panel, interior)          |
| Main Controller        | ESP32                                             |
| Local Display          | LCD2004                                           |
| Cloud Platform         | Supabase (database, auth, real-time)              |
| Weather Data           | OpenWeatherMap API                                |
| Mobile Platform        | Android / Cross-platform mobile application       |
| Mobile Monitoring      | Real-time system information via Supabase Realtime |
| Report Export          | PDF (jsPDF) and CSV                               |
| Evaluation             | System Usability Scale (SUS)                      |

---

## Sustainable Development Goals

AdlaWatt supports the following United Nations Sustainable Development Goals:

### SDG 7 — Affordable and Clean Energy

AdlaWatt promotes the use of solar energy as a renewable source of backup electricity.

### SDG 11 — Sustainable Cities and Communities

The system provides households with an alternative source of electricity during power interruptions.

### SDG 13 — Climate Action

The project encourages the use of solar energy and renewable electricity sources.

The capstone specifically identifies SDG 7, SDG 11, and SDG 13 as the primary SDG alignments of the study.

---

## Research Evaluation

The AdlaWatt study uses the **System Usability Scale (SUS)** to evaluate the usability of the mobile application.

The evaluation focuses on users' assessment of:

- Real-time monitoring
- Appliance recommendation
- Overall user experience
- Mobile application usability

The SUS consists of 10 evaluation items and is interpreted using a Likert scale.

The SUS calculation follows:

```text
SUS Score = (Sum of Score Contributions) × 2.5
```

The capstone identifies SUS as the evaluation tool for assessing the usability of the developed mobile application.

---

## Development Approach

The project follows an iterative development process for the hardware and software components.

The development process includes:

1. Requirements Analysis
2. Planning
3. System Design
4. Hardware Development
5. Software Development
6. Unit Testing
7. Integration Testing
8. System Testing
9. Acceptance Testing

The research documentation identifies experimental research as the study design and uses the V-Model development approach for system development and testing.

---

## Future Improvements

Future development may include:

- Analytics chart rendering and historical energy charts
- Detailed runtime / load-stack recommendation views on top of the recommendation engine
- End-to-end ESP32 → Supabase integration and real-time sensor data
- Automatic notification generation refinement and safety threshold configuration
- Forgot password and password reset flow
- Menu preferences persistence
- Offline data handling using the local database (`expo-sqlite`)
- Admin dashboard for researchers
- Remote monitoring
- Improved authentication flows
- Optimized appliance power consumption calculations
- Improved accessibility
- Application performance optimization
- Production deployment

---

## Research Purpose

AdlaWatt was developed to address the need for a practical and affordable backup power solution during electricity interruptions.

The research identifies a gap in existing systems that commonly provide energy monitoring but do not combine portable off-grid solar harvesting, real-time battery monitoring, temperature monitoring, appliance recommendations, and mobile application monitoring in one system.

The project therefore combines these features into a single system intended to help households monitor and manage available backup energy more safely and efficiently.

---

## Contributors

**AdlaWatt Research and Development Team**

Northern Bukidnon State College
Bukidnon, Philippines

This project was developed as part of an academic capstone research project.

---

## License

This project is an academic capstone project.

The project currently has **no separate open-source license specified**. Unless a license is added by the project authors, the source code and associated materials should not be assumed to be available for unrestricted commercial use, redistribution, or modification.

Copyright © 2026 AdlaWatt Research and Development Team.