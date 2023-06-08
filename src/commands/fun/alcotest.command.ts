import {ICommand} from "../../CommandTypes.js";
import {PermissionsBitField, SlashCommandBuilder} from "discord.js";
import {GroupFun} from "./FunTypes.js";

const command : ICommand = {
    name: "alcotest",
    description: 'Пишет процент пива в твоей крови',
    slash_builder: new SlashCommandBuilder()
        .setName('alcotest')
        .setDescription('Пишет процент пива в твоей крови'),
    group: GroupFun,
    bot_permissions: [PermissionsBitField.Flags.SendMessages],
    execute: async (interaction) => {
        await interaction.reply({
            content: generateAlcoTestMessage(),
            allowedMentions: { users : []}
        })
    },
    executeText: async (message) => {
        await message.reply({
            content: generateAlcoTestMessage(),
            allowedMentions: { users : []}
        })
    }
}

function generateAlcoTestMessage(): string{
    return `🍻 Вы состоите из пива на ${Math.round(Math.random() * 100)}% 🍻 `
}

export default command
