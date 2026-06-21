import os
import json
import time
import threading
from collections import deque
import paho.mqtt.client as mqtt
from supabase import create_client, Client
from dotenv import load_dotenv

# Load credentials
load_dotenv()

# Configuration
MQTT_BROKER   = os.getenv("MQTT_BROKER")
MQTT_PORT     = int(os.getenv("MQTT_PORT", 8883))
MQTT_USERNAME = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")

TOPIC_TELEMETRY = "aerosmart/telemetry"
TOPIC_CONTROL   = "aerosmart/control/motor"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

BASELINE_POWER   = 4.5   # Watts — healthy motor baseline
FLUSH_INTERVAL_S = 60    # 1 minute between DB writes
BUFFER_MAXLEN    = 30    # 30 readings × 2s = 60s window

# Initialize Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── In-Memory Rolling Buffer ──────────────────────────────────────────────────
# Each element is a full db_payload dict from on_message.
# The buffer auto-discards the oldest entry when full (maxlen).
buffer = deque(maxlen=BUFFER_MAXLEN)
buffer_lock = threading.Lock()

# ── Hazard Score Formula ──────────────────────────────────────────────────────
def calculate_hazard_score(temp, gas, light):
    """
    Composite Hazard Score (0–100):
      1. Gas Factor  = clamp((gas - 300) / 600 * 100, 0, 100)
      2. Temp Mult   = 1.0 + max(0, (temp - 28) * 0.05)
      3. Occ Penalty = 15 if light > 400 else 0
      Score = (GasFactor × TempMult) + OccPenalty
    """
    gas_factor = max(0.0, min(100.0, ((gas - 300) / 600.0) * 100))
    temp_multiplier = 1.0 + max(0.0, (temp - 28.0) * 0.05)
    occupancy_penalty = 15 if light > 400 else 0
    return min(100, round((gas_factor * temp_multiplier) + occupancy_penalty, 1))

# ── Motor Health Index ────────────────────────────────────────────────────────
def calculate_motor_health(power):
    if power < 1.0:
        return 100 # Motor is off or idling

    deviation_pct = abs(((power - BASELINE_POWER) / BASELINE_POWER) * 100)
    return max(0, min(100, round(100 - deviation_pct, 1)))

# ── Flush buffer to Supabase ──────────────────────────────────────────────────
def flush_buffer():
    """
    Averages all readings currently in the buffer and inserts ONE summary row
    into Supabase. Runs every FLUSH_INTERVAL_S seconds on a background thread.
    """
    while True:
        time.sleep(FLUSH_INTERVAL_S)

        with buffer_lock:
            if not buffer:
                print("[DB] Buffer empty — skipping flush.")
                continue

            n = len(buffer)
            avg_row = {
                "temperature":  round(sum(r["temperature"]  for r in buffer) / n, 2),
                "gas":          round(sum(r["gas"]          for r in buffer) / n, 1),
                "light":        round(sum(r["light"]        for r in buffer) / n, 1),
                "voltage":      round(sum(r["voltage"]      for r in buffer) / n, 3),
                "current":      round(sum(r["current"]      for r in buffer) / n, 4),
                "power":        round(sum(r["power"]        for r in buffer) / n, 3),
                "hazard_score": round(sum(r["hazard_score"] for r in buffer) / n, 1),
                # motor_active = True if fan was triggered at ANY point in this window
                "motor_active": any(r["motor_active"] for r in buffer),
            }
            buffer.clear()

        try:
            supabase.table("telemetry").insert(avg_row).execute()
            print(f"[DB] Flushed {n}-reading average to Supabase: {avg_row}")
        except Exception as e:
            print(f"[DB ERROR] Failed to write to Supabase: {e}")

TOPIC_OVERRIDE  = "aerosmart/control/override"

override_active = False

# ── MQTT Callbacks ────────────────────────────────────────────────────────────
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Brain Connected to HiveMQ successfully!")
        client.subscribe(TOPIC_TELEMETRY)
        client.subscribe(TOPIC_OVERRIDE)
        print(f"Subscribed to {TOPIC_TELEMETRY} and {TOPIC_OVERRIDE}")
    else:
        print(f"Failed to connect, return code {rc}")

def on_message(client, userdata, msg):
    global override_active
    
    if msg.topic == TOPIC_OVERRIDE:
        override_active = (msg.payload.decode() == "1")
        print(f"[OVERRIDE] Manual Fan Override set to: {'ON' if override_active else 'AUTO'}")
        return

    try:
        payload = json.loads(msg.payload.decode())

        # Extract sensor values
        temp    = payload.get("temperature", 25.0)
        gas     = payload.get("gas",         300)
        light   = payload.get("light",       0)
        voltage = payload.get("voltage",     9.0)
        current = payload.get("current",     0.0)

        # Derived metrics
        power         = round(voltage * current, 3)
        hazard_score  = calculate_hazard_score(temp, gas, light)
        motor_health  = calculate_motor_health(power)

        # ── Safety trigger logic (runs EVERY packet — no delay) ──
        motor_active = False
        if override_active:
            print(f"[OVERRIDE] Forcing Exhaust Fan ON (Manual Mode)")
            client.publish(TOPIC_CONTROL, "1")
            motor_active = True
        elif hazard_score > 75:
            print(f"[ALERT] CRITICAL HAZARD ({hazard_score}/100) — Triggering Exhaust Fan!")
            client.publish(TOPIC_CONTROL, "1")
            motor_active = True
        else:
            client.publish(TOPIC_CONTROL, "0")
            print(f"[OK]    Hazard: {hazard_score}/100 | Power: {power}W | Health: {motor_health}%")

        # ── Motor anomaly watchdog ──
        if motor_health < 70:
            print(f"[WARN]  Motor Health LOW ({motor_health}%) — power deviation detected.")

        # ── Push into the rolling buffer (not DB) ──
        db_payload = {
            "temperature":  temp,
            "gas":          gas,
            "light":        light,
            "voltage":      voltage,
            "current":      current,
            "power":        power,
            "hazard_score": hazard_score,
            "motor_active": motor_active,
        }
        with buffer_lock:
            buffer.append(db_payload)

        print(f"[BUF]  Buffer size: {len(buffer)}/{BUFFER_MAXLEN} — next DB write in ~{FLUSH_INTERVAL_S}s")

    except Exception as e:
        print(f"[ERROR] {e}")

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    if not SUPABASE_URL or "your_supabase" in SUPABASE_URL:
        print("ERROR: Please update your .env file with real credentials!")
        return

    # Start the background flush thread (daemon so it exits when main exits)
    flush_thread = threading.Thread(target=flush_buffer, daemon=True)
    flush_thread.start()
    print(f"[DB] Background flush thread started. Writing to Supabase every {FLUSH_INTERVAL_S}s.")

    # Setup MQTT Client
    client = mqtt.Client(client_id="python_brain_001")
    client.tls_set()
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    client.on_connect = on_connect
    client.on_message = on_message

    print(f"Brain waking up. Connecting to {MQTT_BROKER}...")
    client.connect(MQTT_BROKER, MQTT_PORT, 60)

    # Block and process MQTT messages forever
    client.loop_forever()

if __name__ == "__main__":
    main()
