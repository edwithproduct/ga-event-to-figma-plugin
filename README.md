# GA Event Map

A Figma plugin for annotating your designs with Google Analytics event metadata — built for product and engineering handoff.

Find it on the [Figma Community Marketplace](https://www.figma.com/community/plugin/1615659943400637688).

---

## Getting Started

1. Install **GA Event Map** from Figma Community
2. Open any Figma file and run the plugin via **Plugins → GA Event Map**
3. The plugin will automatically detect all **Frames** on the current page

> **Note:** The plugin only detects **Frame** nodes. Make sure your designs are placed inside a Frame, not just floating on the canvas.

---

## Features

### Hotspot Annotation
Switch to **Edit mode** to place hotspots anywhere on a Frame. Each hotspot stores:
- `trace_label` — GA event label
- `trace_category` — GA event category
- `trace_info` — Additional description
- Implementation status per platform (Web / iOS / Android)
- Notes

### View Mode
Switch to **View mode** and click any hotspot to inspect its event details and implementation status at a glance.

### Copy Event Code
One click to copy ready-to-use tracking code for each platform:

**Web**
```js
gtag('event', 'click', {
  trace_label: '...',
  trace_category: '...',
  trace_info: '...'
});
```

**iOS (Swift)**
```swift
Analytics.logEvent("click", parameters: [
  "trace_label": "...",
  "trace_category": "...",
  "trace_info": "..."
])
```

**Android (Kotlin)**
```kotlin
firebaseAnalytics.logEvent("click") {
  param("trace_label", "...")
  param("trace_category", "...")
  param("trace_info", "...")
}
```

### Page Sync
When you rename a Figma design page, the plugin automatically reflects the updated name — no manual sync needed.

---

## Feedback & Feature Requests

Have a suggestion or a feature you'd like to see? Feel free to open an [Issue](https://github.com/edwithproduct/ga-event-to-figma-plugin/issues) — all requests are welcome!
