# PollMe 📊

A frictionless, truly anonymous live polling system integrated directly into Apple Keynote. 

Designed for educators and presenters who want to embed live polls into their presentations without relying on expensive third-party subscriptions, cumbersome plugins, or forcing students to create accounts.

## Features
- **Zero-Friction for Students**: They just scan a QR code on the projector screen. No app downloads, no accounts, no logins.
- **Keynote Integrated**: Simply type your poll into Keynote's native "Presenter Notes" section. The system automatically detects it and overlays the live results directly onto your slide while you present.
- **Privacy First**: Truly anonymous. No IP tracking, no persistent cookies, no signups.
- **Self-Hosted**: The backend is a tiny, database-free PHP script. Just drop it onto any basic web host (like cPanel or a university server).
- **Multiple Poll Types**: Supports Multiple Choice (Bar Chart), Donut Charts, and Live Word Clouds.

## How it works
PollMe consists of two tiny parts:
1. **The Web Backend**: A few flat files (`api.php`, `index.html`, etc.) hosted on your own website.
2. **The macOS Companion App**: A lightweight Swift app that runs quietly in your menu bar. It asks Keynote what slide you are currently on. If it sees a `[POLL]` tag in your presenter notes, it seamlessly overlays a transparent webview on top of your presentation to show the live chart.

## Setup Instructions

### 1. Web Hosting
1. Upload the contents of the `web/` folder to your web host (e.g., `yourdomain.com/poll/`).
2. Ensure the directory is writable by PHP so it can create the `poll_data.json` and `poll_votes.json` files.

### 2. macOS Companion App
1. Open `PollMeCompanion.swift` in Xcode or compile it directly via terminal:
   `swiftc PollMeCompanion.swift -o PollMeCompanionApp`
2. **Important**: Before compiling, change the `https://giugliano.info/poll/presenter.html` URL in the Swift file to match your own web host URL.
3. Run the compiled app. You will see a 📊 icon in your macOS menu bar.

### 3. Creating Polls in Keynote
Simply type the following syntax into the Presenter Notes of any slide:

```text
[POLL]
Title: What is your favorite programming language?
Subtitle: (Pick one from the list below)
Type: MCQ
Options: Python, Swift, JavaScript, C++
[/POLL]
```

**Available Types:**
- `MCQ` (Standard Bar Chart)
- `DONUT` (Donut Chart)
- `WORDCLOUD` (Students type a single word; popular words grow larger on screen)

**Resetting Polls:**
Need to run the same poll for a different class later in the day? Just click the 📊 icon in your menu bar and select **"Clear Current Poll"**. The chart will reset, and students can vote again.

## Requirements
- macOS 11.0 or later
- Apple Keynote
- Any standard web host with PHP installed (no database required)
