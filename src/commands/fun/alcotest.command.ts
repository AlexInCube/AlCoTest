import {ICommand, CommandGroup} from "../../CommandTypes";
import {PermissionsBitField, SlashCommandBuilder} from "discord.js";

const command : ICommand = {
    name: "alcotest",
    description: 'Пишет процент пива в твоей крови',
    slash_builder: new SlashCommandBuilder()
        .setName('alcotest')
        .setDescription('Пишет процент пива в твоей крови'),
    group: CommandGroup.Fun,
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