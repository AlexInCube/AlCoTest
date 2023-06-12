import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    InteractionCollector,
    TextChannel,
    ComponentType,
    Client, GuildMember, ButtonInteraction, Guild
} from "discord.js";
import {checkMemberInVoiceWithBot} from "../../../utilities/checkMemberInVoiceWithBot.js";
import {generateErrorEmbed} from "../../../utilities/generateErrorEmbed.js";
import {loggerSend} from "../../../utilities/logger.js";
import {generateSkipMessage, generateSkipMessageFailure} from "../skip.command.js";
import {generateMessageAudioPlayerStop} from "../stop.command.js";
import {generateMessageAudioPlayerPrevious, generateMessageAudioPlayerPreviousFailure} from "../previous.command.js";
import {generateMessageAudioPlayerShuffle, generateMessageAudioPlayerShuffleFailure} from "../shuffle.command.js";

enum ButtonIDs{
    stopMusic = "stopMusic",
    pauseMusic = "pauseMusic",
    toggleLoopMode = "toggleLoopMode",
    previousSong = "previousSong",
    skipSong = "skipSong",
    downloadSong = "downloadSong",
    shuffle = "shuffle",
    showQueue = "showQueue",
}
export class AudioPlayerButtonsHandler {
    rowPrimary = new ActionRowBuilder<ButtonBuilder>()
    rowSecondary = new ActionRowBuilder<ButtonBuilder>()
    rowWithOnlyStop = new ActionRowBuilder<ButtonBuilder>()
    collector: InteractionCollector<ButtonInteraction>
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
            new ButtonBuilder().setCustomId(ButtonIDs.downloadSong).setStyle(ButtonStyle.Success).setEmoji('<:downloadwhite:1014553027614617650>'),
            new ButtonBuilder().setCustomId(ButtonIDs.shuffle).setStyle(ButtonStyle.Primary).setEmoji('<:shufflebutton:1092107651384614912>'),
            new ButtonBuilder().setCustomId(ButtonIDs.showQueue).setStyle(ButtonStyle.Secondary).setEmoji('<:songlistwhite:1014551771705782405>'),
        )

        this.rowWithOnlyStop.addComponents(
            new ButtonBuilder().setCustomId(ButtonIDs.stopMusic).setStyle(ButtonStyle.Danger).setEmoji('<:stopwhite:1014551716043173989>')
        )

        this.collector = textChannel.createMessageComponentCollector({
            componentType: ComponentType.Button
        })

        this.collector.on("collect", async (ButtonInteraction: ButtonInteraction) => {
            try{
                const checkObj = await checkMemberInVoiceWithBot(ButtonInteraction.member as GuildMember)
                if (!checkObj.channelTheSame){
                    await ButtonInteraction.reply({
                        embeds: [generateErrorEmbed(checkObj.errorMessage)],
                        ephemeral: true
                    })
                    return
                }

                switch (ButtonInteraction.customId){
                    case ButtonIDs.stopMusic:
                        await this.client.audioPlayer.stop(ButtonInteraction.guild as Guild)
                        await ButtonInteraction.reply({content: generateMessageAudioPlayerStop(ButtonInteraction.member as GuildMember)})
                        break

                    case ButtonIDs.pauseMusic:
                        await this.client.audioPlayer.pause(ButtonInteraction.guild as Guild)
                        await ButtonInteraction.deferUpdate()
                        break

                    case ButtonIDs.previousSong: {
                        const song = await this.client.audioPlayer.previous(ButtonInteraction.guild as Guild)
                        if (song) {
                            await ButtonInteraction.reply({content: generateMessageAudioPlayerPrevious(ButtonInteraction.member as GuildMember, song)})
                        }else{
                            await ButtonInteraction.reply({content: generateMessageAudioPlayerPreviousFailure(), ephemeral: true})
                        }
                        break
                    }

                    case ButtonIDs.skipSong: {
                        const song = await this.client.audioPlayer.skip(ButtonInteraction.guild as Guild)

                        if (song){
                            await ButtonInteraction.reply({content: generateSkipMessage(song, ButtonInteraction.member as GuildMember)})
                        }else{
                            await ButtonInteraction.reply({content: generateSkipMessageFailure(), ephemeral: true})
                        }
                        break
                    }

                    case ButtonIDs.toggleLoopMode:
                        await this.client.audioPlayer.changeLoopMode(ButtonInteraction.guild as Guild)
                        await ButtonInteraction.deferUpdate()
                        break

                    case ButtonIDs.downloadSong: {
                        const url = await this.client.audioPlayer.getCurrentSongDownloadLink(ButtonInteraction.guild as Guild)
                        await ButtonInteraction.reply({content: url, ephemeral: true})
                        break
                    }

                    case ButtonIDs.showQueue:
                        await this.client.audioPlayer.showQueue(ButtonInteraction)
                        break

                    case ButtonIDs.shuffle: {
                        if (await this.client.audioPlayer.shuffle(ButtonInteraction.guild as Guild)){
                            await ButtonInteraction.reply({content: generateMessageAudioPlayerShuffle(ButtonInteraction.member as GuildMember)})
                        }else{
                            await ButtonInteraction.reply(generateMessageAudioPlayerShuffleFailure())
                        }
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
