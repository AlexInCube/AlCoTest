import { GuildMember } from 'discord.js';
import i18next from 'i18next';
import { DisTubeVoice } from 'distube';

export async function checkMemberInVoiceWithBot(
  member: GuildMember
): Promise<{ errorMessage: string; channelTheSame: boolean }> {
  const response = {
    channelTheSame: false,
    errorMessage: 'CheckingVoiceError'
  };

  try {
    const connection: DisTubeVoice | undefined = member.guild.client.audioPlayer.distube.voices.get(member.guild);
    if (connection) {
      if (member.voice.channel) {
        response.channelTheSame = member.guild.members.me?.voice.channel?.id === member.voice?.channel.id;
        if (response.channelTheSame) {
          return response;
        }
      } else {
        response.errorMessage = i18next.t('commandsHandlers:voice_join_in_any_channel');
        return response;
      }

      await member.guild.client.channels.fetch(<string>member.guild.members.me?.voice.channel?.id).then((channel) => {
        if (channel) {
          response.errorMessage = `${i18next.t('commandsHandlers:voice_join_in_channel')} ${connection.channel.name}`;
        }
      });
    }
  } catch {
    return response;
  }

  return response;
}
