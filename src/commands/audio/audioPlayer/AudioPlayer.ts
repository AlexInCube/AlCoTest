import {Client, Embed, EmbedBuilder, Guild, TextChannel, VoiceBasedChannel} from "discord.js";
import {DisTube, PlayOptions, Queue, RepeatMode, SearchResult, Song} from 'distube';
import {PlayersManager} from "./PlayersManager.js";
import {SpotifyPlugin} from "@distube/spotify";
import {YtDlpPlugin} from "@distube/yt-dlp";
import {SoundCloudPlugin} from "@distube/soundcloud";
import {pagination} from "../../../utilities/pagination/pagination.js";
import {ButtonStyles, ButtonTypes} from "../../../utilities/pagination/paginationTypes.js";
import {clamp} from "../../../utilities/clamp.js";
import {generateErrorEmbed} from "../../../utilities/generateErrorEmbed.js";
import {getDownloadLink} from "./getDownloadLink.js";
import {joinVoiceChannel} from "@discordjs/voice";

export class AudioPlayer{
    client: Client
    playersManager: PlayersManager
    distube: DisTube
    constructor(client: Client) {
        this.client = client
        this.client.audioPlayer = this
        this.playersManager = new PlayersManager(this.client)
        this.distube = new DisTube(this.client, {
            leaveOnEmpty: true,
            emptyCooldown: process.env.NODE_ENV === 'production' ? 20 : 5,
            leaveOnFinish: false,
            leaveOnStop: true,
            youtubeCookie: process.env.BOT_YOUTUBE_COOKIE,
            nsfw: true,
            emitAddListWhenCreatingQueue: true,
            emitAddSongWhenCreatingQueue: true,
            savePreviousSongs: true,
            plugins: [
                new YtDlpPlugin({
                    update: true
                }),
                new SpotifyPlugin(
                    {
                        parallel: true,
                        emitEventsAfterFetching: true,
                        api: {
                            clientId: process.env.BOT_SPOTIFY_CLIENT_ID,
                            clientSecret: process.env.BOT_SPOTIFY_CLIENT_SECRET
                        }
                    }),
                new SoundCloudPlugin()
            ]
        })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.client.distube = this.distube

        this.setupEvents()
    }

    async play(voiceChannel: VoiceBasedChannel, textChannel: TextChannel, song: string | Song | SearchResult, options?: PlayOptions) {
        await this.distube.voices.join(voiceChannel)

        joinVoiceChannel({channelId: voiceChannel.id, guildId: voiceChannel.guildId, adapterCreator: voiceChannel.guild.voiceAdapterCreator})

        try{
            await this.distube.play(voiceChannel, song, options)
        } catch (e) {
            await textChannel.send({embeds: [generateErrorEmbed("Произошла ошибка, попробуйте другую ссылку")]})
        }
    }

    async stop(guild: Guild){
        if (this.distube.getQueue(guild)) {
            await this.distube.stop(guild)
        } else {
            await this.distube.voices.leave(guild)
        }
        await this.playersManager.remove(guild.id)
    }

    async pause(guild: Guild){
        const queue = this.distube.getQueue(guild)
        if (!queue) return
        const player = this.playersManager.get(queue.id)
        if (!player) return
        if (queue.paused){
            await this.distube.resume(guild)
            await player.setState("playing")
        }else{
            await this.distube.pause(guild)
            await player.setState("pause")
        }

        await player.update()
    }

    async changeLoopMode (guild: Guild) {
        const queue = this.distube.getQueue(guild)
        if (!queue) return
        const player = this.playersManager.get(queue.id)
        if (!player) return

        switch (queue.repeatMode) {
            case RepeatMode.DISABLED:
                await queue.setRepeatMode(RepeatMode.SONG)
                player.embedBuilder.setLoopMode("song")
                break
            case RepeatMode.SONG:
                await queue.setRepeatMode(RepeatMode.QUEUE)
                player.embedBuilder.setLoopMode("queue")
                break
            case RepeatMode.QUEUE:
                await queue.setRepeatMode(RepeatMode.DISABLED)
                player.embedBuilder.setLoopMode("disabled")
                break
        }

        await player.update()
    }

    async skip (guild: Guild): Promise<Song | undefined>{
        try{
            const queue = this.distube.getQueue(guild)
            if (queue) {
                await this.distube.skip(guild)
                return queue.songs[0]
            }
        } catch (e) { /* empty */ }
        return undefined
    }

    async shuffle(guild: Guild): Promise<Queue | undefined>{
        try{
            let queue = this.distube.getQueue(guild)
            if (queue){
                queue = await this.distube.shuffle(guild)
                const player = this.playersManager.get(queue.id)
                if (!player) return undefined
                await player.update()
                return queue
            }
        } catch (e) { /* empty */ }
        return undefined
    }

    async jump(guild: Guild, position: number): Promise<Song | undefined>{
        try{
            const queue = this.distube.getQueue(guild)
            if (queue){
                return this.distube.jump(guild, clamp(position, 1, queue.songs.length))
            }
        }catch (e) { /* empty */ }
        return undefined
    }

    async previous(guild: Guild): Promise<Song | undefined>{
        try{
            const queue = this.distube.getQueue(guild)
            if (queue){
                return await this.distube.previous(guild)
            }
        }catch (e) { /* empty */ }
        return undefined
    }

    async rewind(guild: Guild, time: number): Promise<boolean>{
        try{
            const queue = this.distube.getQueue(guild)
            if (!queue) return false
            const player = this.playersManager.get(queue.id)
            if (!player) return false
            if (time < 0) time = 0
            await this.distube.seek(guild, time)
            await player.setState("playing")
            return true
        } catch (e) {
            return false
        }
    }
    async showQueue (interaction: any){
        const queue = this.distube.getQueue(interaction.guild)
        if (!queue) {
            return
        }

        function buildPage(queue: Queue, pageNumber: number, entriesPerPage: number){
            let queueList = ''

            const startingIndex = pageNumber * entriesPerPage

            for (let i = startingIndex; i < Math.min(startingIndex + entriesPerPage, queue.songs.length); i++) {
                const song = queue.songs[i]
                queueList += `${i + 1}. ` + `[${song.name}](${song.url})` + ` - \`${song.formattedDuration}\`\n`
            }

            return new EmbedBuilder()
                .setAuthor({name: 'Сейчас играет: '})
                .setTitle(queue.songs[0].name!).setURL(queue.songs[0].url)
                .setDescription(`**Песни в очереди: **\n${queueList}`.slice(0, 4096))
        }

        const arrayEmbeds: Array<EmbedBuilder> = []
        const entriesPerPage = 20
        const pages = Math.ceil( queue.songs.length / entriesPerPage)

        for (let i = 0; i < pages; i++) {
            arrayEmbeds.push(buildPage(queue, i, entriesPerPage))
        }

        await pagination({
            embeds: arrayEmbeds as unknown as Embed[],
            author: interaction.member.user,
            interaction: interaction,
            ephemeral: true,
            fastSkip: true,
            pageTravel: false,
            buttons: [
                {
                    type: ButtonTypes.first,
                    emoji: "⬅️",
                    style: ButtonStyles.Secondary
                },
                {
                    type: ButtonTypes.previous,
                    emoji: "◀️",
                    style: ButtonStyles.Secondary
                },
                {
                    type: ButtonTypes.next,
                    emoji: "▶️",
                    style: ButtonStyles.Secondary
                },
                {
                    type: ButtonTypes.last,
                    emoji: "➡️",
                    style: ButtonStyles.Secondary
                },
            ]
        });
    }

    async getCurrentSongDownloadLink(guild: Guild): Promise<string | undefined> {
        const queue = this.distube.getQueue(guild)
        if (!queue) {
            return undefined
        }

        return await getDownloadLink(guild.client, queue.songs[0].url)
    }
    private setupEvents(){
        this.distube
            .on("empty", async (queue) => {
                await queue.textChannel?.send('Все ушли от меня, значит я тоже ухожу.')
                await this.playersManager.remove(queue.id)
            })
            .on("initQueue", async (queue) => {
                await this.playersManager.add(queue.id, queue.textChannel as TextChannel, queue)

                const player = this.playersManager.get(queue.id)
                if (player) {
                    await player.init()
                }
            })
            .on("playSong", async (queue) => {
                const player = this.playersManager.get(queue.id)
                if (player) {
                    await player.setState("playing")
                }
            })
            .on("disconnect", async (queue) => {
                await this.playersManager.remove(queue.id)
            })
            .on("addSong", async (queue, song) => {
                const songEmbed = new EmbedBuilder()
                    .setTitle(song.name ?? null)
                    .setURL(song.url)
                    .setAuthor({ name: `🎵${song.member!.user.username} добавил песню🎵` })
                    .setDescription(`Длительность - ${song.formattedDuration} | Автор - ${song.uploader.name}`)
                    .setThumbnail(song.thumbnail ?? null)

                if (queue.textChannel){
                    await queue.textChannel.send({ embeds: [songEmbed] })
                }

                const player = this.playersManager.get(queue.id)
                if (player){
                    await player.update()
                }
            })
            .on("addList", async (queue, playlist) => {
                const songEmbed = new EmbedBuilder()
                    .setTitle(playlist.name ?? null)
                    .setURL(playlist.url ?? null)
                    .setAuthor({ name: `🎵${playlist.member!.user.username} добавил песню🎵` })
                    .setDescription(`Количество песен - ${playlist.songs.length} | Длительность - ${playlist.formattedDuration}`)
                    .setThumbnail(playlist.thumbnail ?? null)

                if (queue.textChannel){
                    await queue.textChannel.send({ embeds: [songEmbed] })
                }

                const player = this.playersManager.get(queue.id)
                if (player){
                    await player.update()
                }
            })
            .on('finishSong', async (queue) => {
                if (!this.playersManager.has(queue.id)) return
                if (queue._next || queue._prev || queue.stopped || queue.songs.length > 1) return
                this.playersManager.get(queue.id)?.setState("waiting")
            })
            .on("error", async (channel, error) => {
                channel?.send({embeds: [generateErrorEmbed(`${error.name} + \n\n + ${error.message} \n\n + ${error.stack}`)]})
            })
    }
}
