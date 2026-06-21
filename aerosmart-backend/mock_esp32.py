import time
import json
import random
import os
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

# Load credentials from .env file
load_dotenv()

MQTT_BROKER = os.getenv("MQTT_BROKER")
MQTT_PORT = int(os.getenv("MQTT_PORT", 8883))
MQTT_USERNAME = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")
TOPIC_TELEMETRY = "aerosmart/telemetry"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Mock ESP32 Connected to HiveMQ successfully!")
    else:
        print(f"Failed to connect, return code {rc}")

def simulate_data():
    """Simulates realistic hardware sensor data"""
    # Create a baseline that occasionally spikes
    is_spike = random.random() > 0.9 # 10% chance of a spike
    
    if is_spike:
        temp = round(random.uniform(30.0, 38.0), 1)
        gas = int(random.uniform(700, 950))
        current = round(random.uniform(0.8, 1.5), 2)
    else:
        temp = round(random.uniform(22.0, 26.0), 1)
        gas = int(random.uniform(200, 400))
        current = round(random.uniform(0.4, 0.6), 2)

    return {
        "temperature": temp,
        "gas": gas,
        "light": int(random.uniform(100, 800)), # Simulating LDR analog reading
        "voltage": round(random.uniform(8.5, 9.2), 2),
        "current": current
    }

def main():
    if not MQTT_BROKER or "your_hivemq" in MQTT_BROKER:
        print("ERROR: Please update your .env file with real HiveMQ credentials!")
        return

    # Setup MQTT Client
    client = mqtt.Client(client_id="mock_esp32_001")
    client.tls_set() # Enable secure TLS connection (required for HiveMQ Cloud)
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    client.on_connect = on_connect

    print(f"Connecting to {MQTT_BROKER}...")
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start() # Start network loop in background

    print("Starting sensor simulation. Press Ctrl+C to exit.")
    try:
        while True:
            # 1. Gather data
            payload_dict = simulate_data()
            payload_json = json.dumps(payload_dict)
            
            # 2. Publish
            client.publish(TOPIC_TELEMETRY, payload_json)
            print(f"[PUB] Sent: {payload_json}")
            
            # 3. Wait 2 seconds (like the real ESP32 will)
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("\nStopping Mock ESP32.")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
