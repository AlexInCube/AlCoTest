import { Client, GatewayDispatchEvents } from 'discord.js';

export async function AudioPlayerEventRaw(client: Client, d: any) {
  if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
  client.audioPlayer.riffy.updateVoiceState(d);
}
