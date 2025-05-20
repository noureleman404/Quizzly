## 👀 Cheat‑Detection Logic

| Check | Trigger | Action |
|-------|---------|--------|
| **No Face** | 0 faces for > 0 frames | Show “No face” banner for interval then auto-exit |
| **Multiple Faces** | `faceCount > 1` | Register violation & show soft warning |
| **Looking Away** | Eye‑angle < ‑10° or > 10° for > 1 second | Register violation |
| **Tab Switch / Minimise** | `visibilitychange` → `document.hidden` | Register violation |

After **6 violations** (configurable) the quiz is ended and the user is redirected.

---