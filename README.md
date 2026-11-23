# CareAway

A web app prototype that helps you find the right level of care when you're away from home, know the cost first, and see where to go nearby. It works with out-of-state insurance, including a parent's plan.

## Try it out here!

**[kav1yaraja.github.io/careaway](https://kav1yaraja.github.io/careaway/)**

## What it does

- **Triage, never diagnosis.** Answer a few questions, or describe your symptoms in your own words, and CareAway points you to a level of care: self-care, telehealth, primary care, urgent care or the emergency room.
- **Emergency signs come first.** Red-flag signs are checked before anything else and send you straight to 911 or 988.
- **Add a photo.** Take or choose a photo of a rash, burn, cut or swelling to show a clinician later. Photos stay on your device and are not analyzed.
- **Coverage by insurer.** Start typing your insurance company and CareAway picks it. Add the state your plan is from and it works out whether the city you're in is away from home. No member ID or insurance login.
- **Your location.** Type an address or use your device's location to measure distances from where you are. CareAway doesn't save it.
- **Find care.** Compare nearby options by fit, estimated cost, typical wait and travel time by car, walking or transit, on a real street map you can drag and zoom. Numbered pins are sample places with sample prices; small dots are real clinics and hospitals from OpenStreetMap.
- **Veterans and housing help.** Crisis lines, VA programs, and how to get care without insurance or a fixed address.
- **Help with cost.** Free clinics, sliding-scale health centers and hospital financial assistance are shown alongside everything else.

## Cities

San Francisco Bay Area, Chicago, New York City, Los Angeles, Washington DC, Seattle, Austin and Madison, WI. More are on the way.

## Tools used

- HTML, CSS and JavaScript in a single file (`index.html`)
- Leaflet with OpenStreetMap for the map, and an OpenStreetMap snapshot of real clinics and hospitals
- Rules-based triage (no AI in this version)
- GitHub Pages for hosting

## How to run

1. Clone this repo
2. Open `index.html` in a web browser

## Important

This is a prototype.

- The numbered places, prices, wait times and travel times are **made-up sample data**. The real places come from OpenStreetMap and may be out of date or incomplete.
- The triage rules are a draft and have **not been clinically reviewed**.
- It is not medical advice. In an emergency, call 911. For a mental health crisis, call or text 988.
- Nothing you type is saved or sent anywhere.

## Author

kaviyaraja
