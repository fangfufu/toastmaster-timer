# Toastmasters Timer

A professional, full-screen countdown timer for [Toastmasters](https://www.toastmasters.org/) meetings — built as a single-page web app with no backend required.

**[▶ Live Demo](https://fangfufu.github.io/toastmaster-timer/)**

## Features

### Session Setup
- **Pre-populated agenda** — ships with a complete default Toastmasters meeting agenda (Toastmaster introduction, speakers, table topics, evaluators, reports, etc.) so you can start timing immediately.
- **Fully editable slots** — each slot has fields for **Role**, **Name**, **Min time**, and **Max time**.
- **Add & remove slots** — add new speaker slots with one click; new slots are inserted after the currently selected row for convenient reordering.
- **Delete any slot** — remove slots you don't need with the trash button.

### Timer
- **Full-screen colour transitions** — the background smoothly changes colour as time elapses:
  - **Green** — minimum time reached (speaker has spoken long enough).
  - **Amber** — halfway between minimum and maximum time.
  - **Red** — maximum time reached (speaker should wrap up).
  - **Flashing red** — bell time (30 seconds past maximum), with a pulsing red/dark flash to grab attention.
- **Large countdown display** — timer text is sized at `15vw` so it's readable from across the room.
- **Screen Wake Lock** — automatically requests a wake lock so the device screen stays on during timing.

### Time Tracking
- **Time used indicator** — after each timed segment, a colour-coded progress bar appears on the setup screen showing what percentage of the bell time the speaker used.

### Session Management
- **Save session** — export the entire session (roles, names, times, recorded durations) to a **YAML** file.
- **Load session** — import a previously saved YAML file to restore a session.

### Design
- **Responsive layout** — works on desktop and mobile with dedicated breakpoints at 850 px and 600 px.
- **Dark glassmorphism UI** — modern dark theme with translucent glass panels, subtle borders, and smooth transitions.
- **No build step** — pure HTML, CSS, and vanilla JavaScript; just open `index.html` or deploy to any static host.

## Usage

1. Open the [live demo](https://fangfufu.github.io/toastmaster-timer/) or serve the files locally.
2. Edit the agenda — fill in speaker names and adjust min/max times as needed.
3. Select a slot with the radio button, then click **Start Session**.
4. The timer runs full-screen. Press the **■ Stop** button when the speaker finishes.
5. Review the summary, then click **Back to Setup** to time the next speaker.
6. Use **Save Session** / **Load Session** to persist your work between meetings.

## Colour Thresholds

| Threshold | Definition |
|-----------|------------|
| **Green** | Speaker has reached the minimum time |
| **Amber** | Halfway between minimum and maximum time |
| **Red** | Speaker has reached the maximum time |
| **Bell** | 30 seconds past maximum — background flashes |

## Technology

| Component | Technology |
|-----------|------------|
| Markup | HTML5 |
| Styling | Vanilla CSS (glassmorphism, CSS variables, keyframe animations) |
| Logic | Vanilla JavaScript (ES6+) |
| Icons | [Lucide](https://lucide.dev/) |
| Fonts | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |
| Session files | [js-yaml](https://github.com/nodeca/js-yaml) (loaded from CDN) |

## Licence

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for details.
