import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    InteractionCollector,
    TextChannel,
    ComponentType,
    Client, GuildMember
} from "discord.js";
import {checkMemberInVoiceWithBot} from "../../../utilities/checkMemberInVoiceWithBot";
import {generateErrorEmbed} from "../../../utilities/generateErrorEmbed";
import {loggerSend} from "../../../utilities/logger";
import {generateSkipMessage, generateSkipMessageFailure} from "../skip.command";
import {generateMessageAudioPlayerStop} from "../stop.command";
import {generateMessageAudioPlayerPrevious, generateMessageAudioPlayerPreviousFailure} from "../previous.command";

enum ButtonIDs{
    stopMusic = "stopMusic",
    pauseMusic = "pauseMusic",
    toggleLoopMode = "toggleLoopMode",
    previousSong = "previousSong",
    skipSong = "skipSong",
    showQueue = "showQueue",
    downloadSong = "downloadSong",
}
export class AudioPlayerButtonsHandler {
    rowPrimary = new ActionRowBuilder<ButtonBuilder>()
    rowSecondary = new ActionRowBuilder<ButtonBuilder>()
    rowWithOnlyStop = new ActionRowBuilder<ButtonBuilder>()
    collector: InteractionCollector<any>
    client: Client
    constructor(client: Client, textChannel: TextChannel) {
        this.client = client

        this.rowPrimary.addComponents(
            new ButtonBuilder().setCustomId(ButtonIDs.stopMusic).setStyle(ButtonStyle.Danger).setEmoji('<:stopwhite:1014551716043173989>'),
            new ButtonBuilder().setCustomId(ButtonIDs.pauseMusic).setStyle(ButtonStyle.Primary).setEmoji('<:pausewhite:1014551696174764133>'),
            new ButtonBuilder().setCustomId(ButtonIDs.toggleLoopMode).setStyle(ButtonStyle.Primary).setEmoji('<:repeatmodewhite:1014551751858331731>'),
            new ButtonBuilder().setCustomId(ButtonIDs.previousSong).setStyle(ButtonStyle.Primary).setEmoji('<:previousbutton:1092107334542696512>'),
            new ButtonBuilder().setCustomId(ButtonIDs.skipSong).setStyle(ButtonStyle.Primary).setEmoji('<:skipbutton:1092107438234275900>'),
        )

        this.rowSecondary.addComponents(
            new ButtonBuilder().setCustomId(ButtonIDs.showQueue).setStyle(ButtonStyle.Secondary).setEmoji('<:songlistwhite:1014551771705782405>'),
            new ButtonBuilder().setCustomId(ButtonIDs.downloadSong).setStyle(ButtonStyle.Success).setEmoji('<:downloadwhite:1014553027614617650>')
        )

        this.rowWithOnlyStop.addComponents(
            new ButtonBuilder().setCustomId(ButtonIDs.stopMusic).setStyle(ButtonStyle.Danger).setEmoji('<:stopwhite:1014551716043173989>')
        )

        const filter = (button: { customId: any; }) => button.customId

        this.collector = textChannel.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter
        })

        this.collector.on("collect", async (ButtonInteraction) => {
            try{
                const checkObj = await checkMemberInVoiceWithBot(ButtonInteraction.member)
                if (!checkObj.channelTheSame){
                    ButtonInteraction.reply({embeds: [generateErrorEmbed(checkObj.errorMessage)], ephemeral: true})
                    return
                }

                switch (ButtonInteraction.customId){
                    case ButtonIDs.stopMusic:
                        await this.client.audioPlayer.stop(ButtonInteraction.guild)
                        await ButtonInteraction.reply({content: generateMessageAudioPlayerStop(ButtonInteraction.member)})
                        break

                    case ButtonIDs.pauseMusic:
                        await this.client.audioPlayer.pause(ButtonInteraction.guild)
                        ButtonInteraction.deferUpdate()
                        break

                    case ButtonIDs.previousSong: {
                        const song = await this.client.audioPlayer.previous(ButtonInteraction.guild)
                        if (song) {
                            await ButtonInteraction.reply({content: generateMessageAudioPlayerPrevious(ButtonInteraction.member as GuildMember, song)})
                        }else{
                            await ButtonInteraction.reply({content: generateMessageAudioPlayerPreviousFailure(), ephemeral: true})
                        }
                        break
                    }

                    case ButtonIDs.skipSong: {
                        const song = await this.client.audioPlayer.skip(ButtonInteraction.guild)

                        if (song){
                            await ButtonInteraction.reply({content: generateSkipMessage(song)})
                        }else{
                            await ButtonInteraction.reply({content: generateSkipMessageFailure(), ephemeral: true})
                        }
                        break
                    }

                    case ButtonIDs.toggleLoopMode:
                        await this.client.audioPlayer.changeLoopMode(ButtonInteraction.guild)
                        ButtonInteraction.deferUpdate()
                        break

                    case ButtonIDs.showQueue:
                        await this.client.audioPlayer.showQueue(ButtonInteraction)
                        break

                    case ButtonIDs.downloadSong: {
                        const url = await this.client.audioPlayer.getCurrentSongDownloadLink(ButtonInteraction.guild)
                        ButtonInteraction.reply({content: url, ephemeral: true})
                        break
                    }
                }
            } catch (e) { loggerSend(e) }
        })
    }

    getComponents(): Array<ActionRowBuilder<ButtonBuilder>>{
        return [this.rowPrimary, this.rowSecondary]
    }

    getComponentsOnlyStop(): Array<ActionRowBuilder<ButtonBuilder>>{
        return [this.rowWithOnlyStop]
    }

    destroy(){
        this.collector.stop()
    }
}