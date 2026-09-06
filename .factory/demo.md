# Tab Sunset List demo sandbox

## Entry point

- Local after `npm run dev:site`: <http://localhost:5173/demo/>
- Production: <https://tab-sunset-list.sociobot.in/demo/>
- The landing page opens it in one click with **Try it with sample data**.

## Sample data

The demo starts with five due tabs about a Chrome release, train booking, CSS
reference, research paper, and equipment choice. It also starts with one saved
keyboard reference. Each item has a realistic title, site, note, and intended
decision.

The sandbox supports Keep open, Move seven days, Bookmark and close, Close tab,
Undo close, arrow navigation, and the K/S/B/C keys. Saved and rescheduled output
updates immediately.

## Isolation and reset

Demo state uses only the localStorage key `demo:tab-sunset-list:v1`. It never
reads or writes the extension's `chrome.storage.local` state. **Reset demo**
deletes that key and restores the seed. **Start for real** deletes that key and
returns to the install section. The persistent banner identifies sample mode.

The claim test seeds a separate real-data sentinel and proves that demo entry,
decisions, reset, and exit leave it unchanged.
