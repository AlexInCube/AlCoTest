import {ICommand} from "../../CommandTypes";
import {EmbedBuilder, PermissionsBitField, SlashCommandBuilder} from "discord.js";
import {GroupInfo} from "./InfoTypes";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import packageJSON from "../../../package.json";
import {cpu, mem, os} from "node-os-utils";

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
            embeds: [await generateStatusEmbed()],
            allowedMentions: { users : []},
            ephemeral: true
        })
    },
    executeText: async (message) => {
        await message.reply({
            embeds: [await generateStatusEmbed()],
            allowedMentions: { users : []}
        })
    }
}

export async function generateStatusEmbed(): Promise<EmbedBuilder> {
    let stateString = ""

    const memoryInfo = await mem.info();
    // prettier-ignore
    //const operatingSystem = `${os.type()} ${await os.oos().then(o => o)} ${os.arch()}`;

    function addState(name: string, value: string) {
        stateString += `${name}: \`${value}\`\n`
    }

    addState("Версия бота", `${process.env.npm_package_version}`)
    addState("NodeJS версия", process.version.slice(1).split(".").join("."))
    addState("DiscordJS версия", packageJSON.dependencies["discord.js"].slice(1).split(".").join("."))
    addState("Операционная система", `${os.platform()}`)
    addState("Процессор", cpu.model())
    addState("Нагрузка на процессор", `${await cpu.usage()} %`)
    addState("Используемая оперативка", `${memoryInfo.usedMemMb} mb / ${memoryInfo.totalMemMb} mb`)


    return new EmbedBuilder()
        .addFields({name: "Состояние бота: ", value: stateString})
}

export default command