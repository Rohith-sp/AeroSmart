import { NextRequest, NextResponse } from 'next/server';
import mqtt from 'mqtt';

export async function POST(req: NextRequest) {
  try {
    const { state } = await req.json(); // boolean

    // Connect to HiveMQ Cloud
    const client = mqtt.connect('mqtts://804c8ca2ce0e4e5d9415d5d985bec73c.s1.eu.hivemq.cloud:8883', {
      username: 'aerosmart',
      password: 'Sonu@#envel1',
      clientId: `nextjs_${Math.random().toString(16).slice(2, 10)}`,
    });

    await new Promise<void>((resolve, reject) => {
      client.on('connect', () => {
        client.publish('aerosmart/control/override', state ? '1' : '0', { qos: 1 }, (err) => {
          client.end();
          if (err) reject(err);
          else resolve();
        });
      });
      client.on('error', (err) => {
        client.end();
        reject(err);
      });
    });

    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error('MQTT publish error:', error);
    return NextResponse.json({ error: 'Failed to publish override' }, { status: 500 });
  }
}
