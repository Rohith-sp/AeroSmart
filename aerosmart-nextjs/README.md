# AeroSmart XAI 🌬️

**Intelligent Autonomous Ventilation Monitor with Explainable AI**

AeroSmart XAI is a full-stack IoT dashboard that monitors industrial air quality, autonomously controls exhaust ventilation, and explains every AI decision using Explainable AI (XAI) techniques. Built for an ESP32-based hardware system with real-time MQTT telemetry, Supabase cloud storage, and a modern Next.js frontend.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Live Monitoring** | Real-time sensor cards: Hazard Score, Temperature, Gas/VOC PPM, Occupancy, Motor Power, Motor Health, Energy |
| **Composite Hazard Score** | 0–100 score computed from Gas Factor × Temperature Multiplier + Occupancy Penalty |
| **Autonomous Fan Control** | Exhaust fan triggers when Hazard Score ≥ 75 — no human intervention needed |
| **Explainable AI (XAI)** | Every fan decision logged with full formula breakdown (gas factor, temp mult, occ penalty) |
| **Analytics Tab** | Historical Gas PPM vs Temperature correlation, Motor Power Signature with baseline overlay |
| **AI Maintenance Hub** | Groq LLM (Llama-3) generates contextual maintenance tickets from live anomaly data |
| **Motor Health Index** | Continuous motor health monitoring based on power deviation from 4.5W baseline |
| **Mock ↔ Real Toggle** | One env var switches between realistic mock data and live Supabase data |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      HARDWARE LAYER                             │
│  ESP32 + DHT11 (Temp) + MQ135 (Gas/VOC) + LDR (Occupancy)      │
│  + INA219 (Voltage/Current) + DC Exhaust Fan                    │
└────────────────────────┬────────────────────────────────────────┘
                         │ MQTT Publish (every 2s, TLS port 8883)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLOUD BROKER                                  │
│  HiveMQ Cloud — aerosmart/telemetry topic                       │
│  aerosmart/control/motor (fan on/off command)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ Subscribe
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               PYTHON BRAIN (brain.py)                           │
│  • Calculates Hazard Score + Motor Health every packet          │
│  • Triggers fan (publishes "1" to control topic) if score ≥ 75  │
│  • Buffers 60 readings in RAM (2-min window)                    │
│  • Flushes averaged row to Supabase every 2 minutes             │
└────────────────────────┬────────────────────────────────────────┘
                         │ INSERT (every 2 min)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               SUPABASE (PostgreSQL + Realtime)                  │
│  Table: telemetry                                               │
│  Fields: temperature, gas, light, voltage, current,             │
│          power, hazard_score, motor_active, created_at          │
└──────────────┬──────────────────────────────────────────────────┘
               │ Realtime subscription + REST queries
               ▼
┌─────────────────────────────────────────────────────────────────┐
│               NEXT.JS FRONTEND (this repo)                      │
│  • useLiveTelemetry hook → Supabase Realtime + 5s poll          │
│  • 3 tabs: Live Monitoring / Analytics / Diagnostics & XAI      │
│  • /api/ticket → Groq Llama-3 (maintenance ticket generator)    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧮 AI Formulas (Mirrors brain.py exactly)

### Composite Hazard Score (0–100)
```
Gas Factor       = clamp((gas_ppm - 300) / 600 × 100,  0, 100)
Temp Multiplier  = 1.0 + max(0, (temp_°C - 28) × 0.05)
Occ Penalty      = 15 if LDR_raw > 400 (occupied) else 0
Hazard Score     = min(100, (Gas Factor × Temp Multiplier) + Occ Penalty)
```

### Motor Health Index (0–100%)
```
Baseline Power   = 4.5W  (9V × 0.5A healthy motor)
Deviation %      = (actual_power - 4.5) / 4.5 × 100
Motor Health     = max(0, 100 - Deviation %)
```

### Fan Trigger Logic
```
if Hazard Score > 75:
    publish("aerosmart/control/motor", "1")  ← Fan ON
```

---

## 📁 Project Structure

```
aerosmart-nextjs/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Redirects to /dashboard
│   ├── globals.css             # Full CSS design system
│   ├── dashboard/
│   │   └── page.tsx            # Main dashboard shell (3 tabs)
│   └── api/
│       └── ticket/
│           └── route.ts        # POST → Groq LLM → streaming response
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         # Fixed nav with uptime & trigger count
│   │   └── Topbar.tsx          # Sticky header with clock & MQTT badge
│   ├── live/
│   │   ├── StatusBanner.tsx    # System status (Normal/Warning/Critical)
│   │   ├── HazardScoreCard.tsx # Composite hazard score + bar
│   │   ├── TempCard.tsx        # DHT11 temperature
│   │   ├── GasCard.tsx         # MQ135 gas/VOC PPM
│   │   ├── OccupancyCard.tsx   # LDR occupancy (raw ADC > 400)
│   │   ├── MotorPowerCard.tsx  # Voltage × Current = Power
│   │   ├── MotorHealthCard.tsx # Health index with animated bar
│   │   ├── EnergyCard.tsx      # Accumulated Wh this session
│   │   ├── LiveChart.tsx       # Rolling Gas + Temp dual-axis chart
│   │   └── FanOverride.tsx     # Manual fan toggle (UI)
│   ├── analytics/
│   │   ├── FilterRow.tsx       # 1h / 24h / 7d time filter
│   │   ├── CorrelationChart.tsx # Gas vs Temp historical
│   │   └── MotorPowerChart.tsx  # Power + Voltage + Baseline
│   └── xai/
│       ├── XaiTable.tsx        # Explainability log (last 30 events)
│       └── MaintenanceHub.tsx  # AI ticket generator
│
├── hooks/
│   ├── useClock.ts             # Real-time clock + session uptime
│   └── useLiveTelemetry.ts     # Mock ↔ Supabase data hook
│
├── lib/
│   ├── types.ts                # TelemetryRow interface (mirrors Supabase schema)
│   ├── calculations.ts         # Hazard score, motor health formulas
│   ├── mockData.ts             # Mock data generator (same schema as real data)
│   └── supabase.ts             # Supabase browser client
│
├── .env.example                # Template for environment variables
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project with the `telemetry` table (see schema below)
- *(Optional)* A [Groq](https://console.groq.com) API key for AI ticket generation

### 1. Clone the repository
```bash
git clone https://github.com/Rohith-sp/AeroSmart.git
cd AeroSmart/aerosmart-nextjs
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GROQ_API_KEY=your_groq_key          # optional — demo works without it
NEXT_PUBLIC_USE_REAL_DATA=false     # set true when hardware is live
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the dashboard loads instantly with realistic mock data.

### 5. Switch to real hardware data
When your ESP32 + brain.py is running and writing to Supabase:
```env
NEXT_PUBLIC_USE_REAL_DATA=true
```
That's the **only change needed**. No code modifications.

---

## 🗄️ Supabase Table Schema

Run this SQL in your Supabase SQL editor:

```sql
CREATE TABLE telemetry (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  temperature   FLOAT NOT NULL,   -- °C from DHT11
  gas           FLOAT NOT NULL,   -- PPM from MQ135
  light         FLOAT NOT NULL,   -- Raw ADC from LDR
  voltage       FLOAT NOT NULL,   -- V from INA219
  current       FLOAT NOT NULL,   -- A from INA219
  power         FLOAT NOT NULL,   -- W = voltage × current
  hazard_score  FLOAT NOT NULL,   -- 0–100 composite score
  motor_active  BOOLEAN NOT NULL  -- true = fan was triggered
);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE telemetry;
```

---

## 🔌 Backend (brain.py)

The Python backend lives in `aerosmart-backend/`:

| File | Purpose |
|---|---|
| `brain.py` | MQTT subscriber → computes scores → flushes to Supabase every 2 min |
| `mock_esp32.py` | Simulates ESP32 sensor data over MQTT (for testing without hardware) |
| `requirements.txt` | `paho-mqtt`, `supabase`, `python-dotenv` |

```bash
cd aerosmart-backend
pip install -r requirements.txt
cp .env.example .env   # fill in HiveMQ + Supabase credentials

# Run the mock ESP32 publisher
python mock_esp32.py

# Run the brain (in a separate terminal)
python brain.py
```

---

## 🧩 Hardware (ESP32)

**Sensors:**
| Sensor | Parameter | Pin |
|---|---|---|
| DHT11 | Temperature | GPIO 4 |
| MQ135 | Gas/VOC PPM | A0 (ADC) |
| LDR | Occupancy | GPIO 34 (ADC) |
| INA219 | Voltage + Current | I²C (SDA/SCL) |

**Actuator:**
| Component | Control |
|---|---|
| DC Exhaust Fan | MQTT topic `aerosmart/control/motor` → relay on GPIO 26 |

The ESP32 sketch is in `sketch_jun20a/` — flash it with Arduino IDE or PlatformIO.

---

## 🤖 AI Maintenance Ticket Generator

The **AI Maintenance Hub** on the Diagnostics & XAI tab generates contextual maintenance tickets:

1. Finds the row with the highest power deviation from your telemetry history
2. Builds a detailed prompt with real sensor values
3. Sends it to **Groq's Llama-3** (`llama3-8b-8192`) via a Next.js Edge API route
4. Streams the response back with a typewriter effect

**Without a Groq API key:** a pre-written demo ticket is typed out — the UI always works.

**To enable real AI tickets:** add `GROQ_API_KEY=gsk_...` to `.env.local`. Get a free key at [console.groq.com](https://console.groq.com).

---

## 📊 Dashboard Tabs

### Live Monitoring
- **Status Banner** — Normal / Warning / Critical based on live hazard score
- **7 Metric Cards** — all updating every 2 seconds from telemetry
- **Dual-Axis Live Chart** — rolling 30-point window of Gas PPM + Temperature
- **Fan Override Toggle** — UI control (hardware override via MQTT in v2)

### Analytics & Trends
- **Time Filter** — Last 1h / 24h / 7 Days
- **Gas vs Temperature Correlation** — dual Y-axis, sampled from Supabase
- **Motor Power Signature** — power + voltage with 4.5W dashed baseline

### Diagnostics & XAI
- **Explainability Log** — last 30 telemetry events with action badge + full formula breakdown
- **AI Maintenance Hub** — anomaly stats + Groq-generated maintenance ticket

---

## 🚢 Deployment

Deploy to [Vercel](https://vercel.com) in one click:

```bash
npm install -g vercel
vercel
```

Set the same env vars in your Vercel project dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`
- `NEXT_PUBLIC_USE_REAL_DATA`

---

## 🧪 Development Notes

### Mock Data
Mock data is generated by `lib/mockData.ts`. It produces rows in the **exact same schema** as the Supabase `telemetry` table, including realistic sensor spikes (10% probability) that trigger fan events and animate the hazard score bar.

### Hardware Swap Checklist
When hardware is ready:
- [ ] Set `NEXT_PUBLIC_USE_REAL_DATA=true` in `.env.local`
- [ ] Ensure `brain.py` is running and connected to HiveMQ
- [ ] Confirm `telemetry` table has Realtime enabled in Supabase
- [ ] Verify Supabase RLS (Row Level Security) allows anon reads on `telemetry`

### Adding the Groq API Key
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
No code changes needed — the API route auto-detects and uses it.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Vanilla CSS (design system in `globals.css`) |
| Charts | Chart.js + react-chartjs-2 |
| Database | Supabase (PostgreSQL + Realtime) |
| AI / LLM | Groq API (Llama-3 8B) |
| MQTT Broker | HiveMQ Cloud (TLS) |
| Backend | Python 3 + paho-mqtt + supabase-py |
| Hardware | ESP32, DHT11, MQ135, LDR, INA219 |

---

## 📄 License

MIT — feel free to use, modify, and build on this project.

---

*Built with ❤️ for autonomous environmental intelligence.*
