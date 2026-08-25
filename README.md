# Smart Campus Automation

A polished, self-contained static Smart Campus Automation demo built with HTML, CSS, and JavaScript.

## Run locally

Open `index.html` directly in a browser, or open the project in VS Code and use Live Server. No backend, database, API key, or server-side runtime is required.

## Demo behavior

- 147 deterministic rooms (A101–A149, B101–B149, C101–C149)
- Light, fan, and AC controls update one central browser state
- Empty-room devices switch off independently after 15 seconds when Smart Automation is active
- Occupied-room devices stay on; changing an empty room to occupied cancels pending shutdowns
- Alerts, power, energy use, and savings are calculated locally
- State persists in browser localStorage under `smartCampusState_v2`
- Use Settings to pause/resume Smart Automation; refresh the browser to retain current demo data