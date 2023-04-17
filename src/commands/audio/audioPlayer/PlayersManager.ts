import {Client, Collection, TextChannel, VoiceChannel} from "discord.js";
import {Queue} from "distube";
import {PlayerGuild} from "./PlayerGuild";
import {Audio} from "../../../main";
import {entersState, getVoiceConnection, joinVoiceChannel, VoiceConnectionStatus} from "@discordjs/voice";
import {loggerSend} from "../../../utilities/logger";

export class PlayersManager{
    private readonly client: Client;
    private readonly collection = new Collection<string, PlayerGuild>();
    constructor(_client: Client) {
        this.client = _client
    }
    async add(guildId: string, textChannel: TextChannel, queue: Queue): Promise<PlayerGuild | undefined> {
        if (await this.client.guilds.cache.get(guildId)) {
            if (!this.collection.has(guildId)) {
                //loggerSend("Player Added")
                this.collection.set(guildId, new PlayerGuild(this.client, textChannel, queue))
            }

            return this.collection.get(guildId)
        }

        return undefined
    }

    get(guildId: string): PlayerGuild | undefined{
        return this.collection.get(guildId)
    }

    async remove(guildId: string) {
        const player = this.get(guildId)
        if (player) {
            await player.destroy()
            this.collection.delete(guildId)
        }
    }

    has(guildId: string): boolean{
        return this.collection.has(guildId)
    }

    async reconnect(){
        loggerSend("playersManager reconnect")

        this.collection.forEach((player) => {
            Audio.distube.stop(player.textChannel.guild)
        })
        /*
        this.collection.forEach((player) => {
            const queue = Audio.distube.getQueue(player.textChannel.guild)

            if (queue){
                try{
                    const voice = Audio.distube.voices.get(player.textChannel.guild)
                    const connection = getVoiceConnection(player.textChannel.guild.id, player.textChannel.guild.client.user.id)
                    if (!voice) return
                    loggerSend(`Status: ${connection?.state.status}`)
                    if (!connection) return

                    connection.once('stateChange', (oldState, newState) => {
                        loggerSend(`OldState: ${oldState.status}, NewState: ${newState.status}`)
                        if (!connection) return
                        if (newState.status === VoiceConnectionStatus.Ready) {
                            connection.configureNetworking()
                            loggerSend(connection.state.status)
                            const VoicePlayer = voice.audioPlayer

                            loggerSend("subscribe audioplayer")
                            connection.subscribe(VoicePlayer)

                            const audioRes = voice.audioResource
                            if (audioRes){
                                VoicePlayer.unpause()
                                loggerSend("player audioResource")
                                VoicePlayer.play(audioRes)
                            }
                        }
                    })

                    setTimeout(() => {
                        if (voice.channel.joinable){
                            loggerSend("Try to rejoin")
                            connection?.rejoin()
                        }

                        // connection = joinVoiceChannel({
                        //     channelId: voice.channel.id,
                        //     guildId: player.textChannel.guild.id,
                        //     adapterCreator: player.textChannel.guild.voiceAdapterCreator
                        // })

                        loggerSend(`Status After Join: ${connection?.state.status}, Channel ${voice.channel.id}`)
                    }, 2000)
                }catch (e) {
                    loggerSend(e)
                }
            }else{
                loggerSend("queue NOT found, so remove")
                Audio.playersManager.remove(player.textChannel.guild.id)
            }
        })
         */
    }

    debug(): string {
        let str = `Players Count: ${this.collection.size}\n`
        this.collection.forEach((player) => {
            str += player.debug()
        })

        return str
    }
}
