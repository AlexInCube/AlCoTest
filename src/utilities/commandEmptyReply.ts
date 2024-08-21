import { ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { ICommandContext } from '../CommandTypes.js';

// Every chat interaction must be replied, but I don't want to reply,
// So the code below is a workaround
export async function commandEmptyReply(ctx: ICommandContext) {
  if (ctx instanceof ChatInputCommandInteraction) {
    await ctx.reply(i18next.t('general:thinking'));
    await ctx.deleteReply();
  }
}
