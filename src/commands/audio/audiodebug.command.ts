import {ICommand} from "../../CommandTypes.js";
import {
    PermissionsBitField,
} from "discord.js";
import {GroupAudio} from "./AudioTypes.js";

const command : ICommand = {
    name: "audiodebug",
    description: 'Отладочная информация о плеерах',
    group: GroupAudio,
    bot_permissions: [
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.Speak,
        PermissionsBitField.Flags.ManageMessages,
        PermissionsBitField.Flags.AttachFiles
    ],
    executeText: async (message) => {
        await message.reply({
            content: message.client.audioPlayer.playersManager.debug(),
            allowedMentions: { users : []}
        })
    }
}

export default command
