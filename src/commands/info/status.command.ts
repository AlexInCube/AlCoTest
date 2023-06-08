import {ICommand} from "../../CommandTypes.js";
import {Client, EmbedBuilder, PermissionsBitField, SlashCommandBuilder} from "discord.js";
import {GroupInfo} from "./InfoTypes.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import node_os_pkg from "node-os-utils";

const { cpu, mem, os } = node_os_pkg;

const command : ICommand = {
    name: "status",
    description: 'Просмотр состояния бота',
    slash_builder: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Просмотр состояния бота'),
    group: GroupInfo,
    bot_permissions: [PermissionsBitField.Flags.SendMessages],
    execute: async (interaction) => {
        await interaction.reply({
            embeds: [await generateStatusEmbed(interaction.client)],
            allowedMentions: { users : []},
            ephemeral: true
        })
    },
    executeText: async (message) => {
        await message.reply({
            embeds: [await generateStatusEmbed(message.client)],
            allowedMentions: { users : []}
        })
    }
}

export async function generateStatusEmbed(client: Client): Promise<EmbedBuilder> {
    let stateString = ""

    const memoryInfo = await mem.info();

    function addState(name: string, value: string) {
        stateString += `${name}: \`${value}\`\n`
    }

    addState("Версия бота", `${process.env.npm_package_version}`)
    addState("Websocket Heartbeat", `${client.ws.ping}`)
    addState("Операционная система", `${os.platform()}`)
    addState("Процессор", cpu.model())
    addState("Нагрузка на процессор", `${await cpu.usage()} %`)
    addState("Используемая оперативка", `${memoryInfo.usedMemMb} mb / ${memoryInfo.totalMemMb} mb`)
    addState("Количество серверов", `${client.guilds.cache.size}`)

    return new EmbedBuilder()
        .addFields({name: "Состояние бота: ", value: stateString})
}

export default command
