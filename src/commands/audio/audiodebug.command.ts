import {ICommand} from "../../CommandTypes.js";
import {
    PermissionsBitField,
} from "discord.js";
import {GroupAudio} from "./AudioTypes.js";

export default function(): ICommand {
    return {
        text_data: {
            name: "audiodebug",
            description: 'Debug info about audioplayers',
            execute: async (message) => {
                await message.reply({
                    content: message.client.audioPlayer.playersManager.debug(),
                    allowedMentions: { users : []}
                })
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
        ],
    }
}

