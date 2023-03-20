import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    InteractionCollector,
    TextChannel,
    ComponentType,
    Client
} from "discord.js";

enum ButtonIDs{
    stopMusic = "stopMusic",
    pauseMusic = "pauseMusic",
    toggleLoopMode = "toggleLoopMode",
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
            new ButtonBuilder().setCustomId(ButtonIDs.skipSong).setStyle(ButtonStyle.Primary).setEmoji('<:skipwhite:1014551792484372510>')
        )

        this.rowSecondary.addComponents(
            new ButtonBuilder().setCustomId(ButtonIDs.showQueue).setStyle(ButtonStyle.Secondary).setEmoji('<:songlistwhite:1014551771705782405>'),
            new ButtonBuilder().setCustomId(ButtonIDs.downloadSong).setStyle(ButtonStyle.Success).setEmoji('<:downloadwhite:1014553027614617650>'),
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
                switch (ButtonInteraction.customId){
                    case ButtonIDs.stopMusic:
                        await this.client.audioPlayer.stop(ButtonInteraction.guild)
                        break

                    case ButtonIDs.pauseMusic:
                        await this.client.audioPlayer.pause(ButtonInteraction.guild)
                        break

                    case ButtonIDs.skipSong:
                        await this.client.audioPlayer.skip(ButtonInteraction.guild)
                        break

                    case ButtonIDs.toggleLoopMode:
                        await this.client.audioPlayer.changeLoopMode(ButtonInteraction.guild)
                        break
                }
            }catch (e) { /* empty */ }
            
            ButtonInteraction.deferUpdate()
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