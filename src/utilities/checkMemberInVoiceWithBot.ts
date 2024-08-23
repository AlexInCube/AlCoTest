import { GuildMember, VoiceChannel } from 'discord.js';
import { checkBotInVoice } from './checkBotInVoice.js';
import i18next from 'i18next';

export async function checkMemberInVoiceWithBot(
  member: GuildMember
): Promise<{ errorMessage: string; channelTheSame: boolean }> {
  const response = {
    channelTheSame: false,
    errorMessage: 'CheckingVoiceError'
  };

  try {
    const connection = checkBotInVoice(member.guild);
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
          if (channel instanceof VoiceChannel) {
            response.errorMessage = `${i18next.t('commandsHandlers:voice_join_in_channel')} ${channel.name}`;
          }
        }
      });
    }
  } catch (e) {
    return response;
  }

  return response;
}
