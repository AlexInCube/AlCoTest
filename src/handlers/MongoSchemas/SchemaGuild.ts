import {Document, model, Schema} from "mongoose";
import {Guild} from "discord.js";
import {MongoCheckConnection} from "../Mongo.handler.js";
import {ENV} from "../../EnvironmentVariables.js";

interface GuildOptions {
    prefix: string,
}

interface IGuild extends Document {
    guildID: string,
    options: GuildOptions
}

type GuildOption = keyof GuildOptions

const GuildSchema = new Schema<IGuild>({
    guildID: {required:true, type: String},
    options: {
        prefix: {type: String, default: ENV.BOT_COMMAND_PREFIX}
    }
})

GuildSchema.set('collection', 'guilds')

const GuildModel = model("guild", GuildSchema)

export async function getGuildOption(guild: Guild, option: GuildOption): Promise<any>{
    if (!MongoCheckConnection()) return undefined
    let foundGuild: any = await GuildModel.findOne({ guildID: guild.id })
    if (!foundGuild) {
        await setupSettings(guild)
        foundGuild = GuildModel.findOne({ guildID: guild.id })
        return foundGuild.options[option]
    }
    return foundGuild.options[option]
}

export async function setGuildOption(guild: Guild, option: GuildOption, value: unknown): Promise<void>{
    if (!MongoCheckConnection()) return undefined
    let foundGuild: any = await GuildModel.findOne({ guildID: guild.id })
    if (!foundGuild) {
        await setupSettings(guild)
        foundGuild = await GuildModel.findOne({ guildID: guild.id })
    }
    foundGuild.options[option] = value
    await foundGuild.save()
}

export async function setupSettings(guild: Guild) {
    const newGuild = new GuildModel({
        guildID: guild.id
    })
    await newGuild.save()
}
