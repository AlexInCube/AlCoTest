import { ICommand } from '../../CommandTypes.js';
import { PermissionsBitField } from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import { isOverpoweredUser } from '../../utilities/isOverpoweredUser.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'audiodebug',
      description: 'Debug info about audioplayers',
      execute: async (message) => {
        if (!isOverpoweredUser(message.author.id)) return;

        await message.reply({
          content: message.client.audioPlayer.playersManager.debug(),
          allowedMentions: { users: [] }
        });
      }
    },
    group: GroupAudio,
    hidden: true,
    bot_permissions: [
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.Speak,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.AttachFiles
    ]
  };
}
