import { pagination } from '../utilities/pagination/pagination.js';
import { Embed, EmbedBuilder, Message, User } from 'discord.js';
import { ButtonStyles, ButtonTypes } from '../utilities/pagination/paginationTypes.js';
import { ReplyContext } from '../CommandTypes.js';

export async function PaginationList(ctx: ReplyContext, pages: Array<Embed | EmbedBuilder>, user: User) {
  await pagination({
    embeds: pages as unknown as Array<Embed>,
    author: user,
    message: ctx instanceof Message ? ctx : undefined,
    interaction: ctx instanceof Message ? undefined : ctx,
    ephemeral: true,
    fastSkip: true,
    pageTravel: false,
    buttons: [
      {
        type: ButtonTypes.first,
        emoji: '⬅️',
        style: ButtonStyles.Secondary
      },
      {
        type: ButtonTypes.previous,
        emoji: '◀️',
        style: ButtonStyles.Secondary
      },
      {
        type: ButtonTypes.next,
        emoji: '▶️',
        style: ButtonStyles.Secondary
      },
      {
        type: ButtonTypes.last,
        emoji: '➡️',
        style: ButtonStyles.Secondary
      }
    ]
  });
}
