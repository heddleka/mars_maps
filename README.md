# ARES-NAV // NASA Marswalk EVA Navigation & Science Exploration System
**2026 NASA Space Apps Challenge — Intermediate / Human Exploration & Planets**

> **"A layered, integrated geospatial navigation and scientific operations system designed for the first human explorers conducting Marswalks (EVAs) on the Red Planet."**

---

## 🚀 Live Demo & Launch Instructions

### 🌐 Live Production Website (Vercel)
Anyone can access the live application directly without installing anything:
- **Primary Live Link:** **[https://mars-maps.vercel.app](https://mars-maps.vercel.app)**
- **Alternative Link:** **[https://marsmaps.vercel.app](https://marsmaps.vercel.app)**

---

### Local Quick Start
- Node.js (v18+)
- npm or yarn

### Quick Start
```bash
# Navigate to directory
cd /home/heddleka/Desktop/mars_maps

# Install dependencies (if not already installed)
npm install

# Start local mission operations server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🪐 Core Features & Challenge Solutions

### 1. Multi-Mission Layered Geospatial Engine
Integrates disparate datasets from past and current NASA science missions into a cohesive, hyperlocalized tactical GIS view:
- **Optical & Surface Albedo:** NASA Viking MDIM 2.1 color mosaic & high-resolution CTX / HiRISE imagery.
- **Topography & Elevation (DEM):** NASA Mars Global Surveyor (MOLA) colored relief and elevation contour gradients (-4,500m to +500m).
- **Slope Hazard & Traversability Heatmap:** Automated calculation of terrain incline:
  - 🟢 **< 10° Slope:** Nominal walking and rover mobility.
  - 🟡 **10° – 18° Slope:** Caution zone (+40% metabolic O2 burn rate).
  - 🔴 **> 18° Slope:** Impassable escarpments, steep scree, and cliff slide hazards.
- **CRISM Spectral Mineralogy:** Hydrated smectite clays (ancient lakebeds), magnesium sulfates, carbonates ("bathtub rings"), and gray hematite ridges.
- **THEMIS Thermal Inertia:** Loose sand hazard mapping to avoid active rover sand traps (e.g. Bagnold Dunes & Séítah).
- **Space Weather & Radiation:** Galactic Cosmic Ray (GCR) exposure zones (RAD sensor baseline ~0.24 mSv/day).

---

### 2. Hyperlocalized Target Locations
ARES-NAV is calibrated for human-scale surface excursions across Mars' two premier landing basins:
1. **Gale Crater & Mount Sharp (Aeolis Mons) — "Curiosity Expedition"**
   - **Spotlighted Science:** **Boxwork Formations** (polygonal honeycomb mineral ridges discovered in late 2024–2025 by Curiosity).
   - Key Locations: Bradbury Landing, Yellowknife Bay, Bagnold Dunes bypass, Vera Rubin Hematite Ridge, Gediz Vallis debris flow, and Mount Sharp Boxwork Ridges.
2. **Jezero Crater & Western Fan Delta — "Perseverance Expedition"**
   - **Spotlighted Science:** Ancient river delta stratigraphy, lake bottomset mudstones, and carbonate margin units ("Cheyava Falls" reduction reaction halos).
   - Key Locations: Octavia E. Butler Landing, Séítah Dunes, Kodiak Butte, Hawksbill Gap Scarp, and Bright Angel Margin Unit.

---

### 3. Astronaut Operational Form Factors

| Mode | Purpose | Capabilities |
| :--- | :--- | :--- |
| **Tactical 2D EVA Map** | Mission Planning & Field GIS | Layer opacity sliders, custom waypoint placement, real-time Mars-CRS coordinates, slope hazard inspection. |
| **Astronaut Visor HUD** | In-Suit First-Person Simulation | Curved visor with CRT scanlines, 360° digital compass tape, artificial horizon, live bio-telemetry (Heart Rate, O2 Tank %, Suit Pressure 4.3 PSI, Battery), AR target reticle, snapshot camera, optical/thermal/mineral filters. |
| **3D Mars Globe** | Planetary Strategic Overview | Three.js interactive rotating 3D Martian sphere, atmospheric glow shader, clickable pins for all 9 historical NASA landing sites with camera fly-to. |
| **Raw Surface Images** | Ground-Truth Verification | Live feed directly from NASA's Mars 2020 & MSL Curiosity JSON API (over 1.18 million raw photos accessible), filtered by Sol, Rover, and Camera (Mastcam, Navcam, Hazcam). |
| **Boxwork Science Dossier** | In-depth Geological Briefing | Comprehensive guide on groundwater mineral vein genesis, biosignature fluid inclusions, and step-by-step diamond core sampling protocols. |

---

### 4. Human EVA Consumables & Pathfinding Computer
- **Dynamic Route Distance:** Martian geodesic calculation accounting for planet radius ($R_{\text{Mars}} \approx 3,389.5\text{ km}$).
- **Metabolic & Consumables Budget:**
  - Oxygen consumption ($L_{\text{O2}}$) adjusted dynamically for slope friction and spacesuit mass ($85\text{ kg xEMU}$).
  - Caloric output ($\text{kcal/hr}$) and suit battery thermal draw.
  - Cumulative radiation dose ($\mu\text{Sv}$) tracked against NASA career astronaut limits.
- **Exportable NASA Flight Manifest:** One-click download of the official EVA flight manifest for crew and mission control.

---

### 5. Authentic NASA Audio Synthesis
- Built-in Web Audio synthesizer generating authentic **NASA Quindar Beeps** (2524 Hz key-in and 2475 Hz key-out tones).
- Two-tone terrain hazard alarms for slopes $> 20^\circ$.
- Biometric pulse rate audio and telemetry click tones with full mute control.

---

## 🛰️ NASA Data & Resources Used
- **JPL Mars Trek:** WMTS tile endpoints for MOLA Elevation and Viking MDIM2.1 Color mosaics (`https://trek.nasa.gov/mars/`).
- **NASA Mars Weather Feed:** Live REMS and MEDA atmospheric weather reports (`https://mars.nasa.gov/rss/api/?feed=weather`).
- **NASA Raw Images Gallery API:** Live feed from Curiosity & Perseverance (`https://mars.nasa.gov/rss/api/?feed=raw_images`).
- **USGS Planetary Geologic Mapping:** MOLA hypsometric color ramps & CRISM mineral unit references.
- **NASA Science SMD:** Curiosity Lower Mount Sharp proposed route & Boxwork Formations study (PIA26388).

---

## Local Admin and SQLite

The NASA logo opens the admin panel after a double-click. The local Node server creates `data/mars-maps.sqlite` automatically and stores uploaded photos in `data/uploads/`.

1. Copy `.env.example` to `.env`.
2. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`. Use a password with at least 8 characters; keep `.env` private.
3. Run `npm install`, then `npm run dev`. Open the Vite URL shown in the terminal (normally `http://localhost:3000`).

The database and uploaded photos are local to that computer and are ignored by Git. Each developer gets a separate SQLite database; this setup does not synchronize changes between machines. For a built local run, use `npm run build` followed by `npm start`.

This SQLite MVP requires a persistent Node server and does not work as a static-only Vercel deployment. A shared public deployment would need a host that preserves the SQLite file and uploaded photos.

