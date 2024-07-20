import Genius from 'genius-lyrics';
import { ENV } from '../EnvironmentVariables.js';
import { Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';
import { loggerWarn } from '../utilities/logger.js';
import { generateErrorEmbed } from '../utilities/generateErrorEmbed.js';
const Lyrics = new Genius.Client(ENV.BOT_GENIUS_TOKEN);

if (!ENV.BOT_GENIUS_TOKEN) {
  loggerWarn('BOT_GENIUS_TOKEN is not provided, lyrics module disabled', 'Lyrics');
}

export async function getLyricsSong(searchQuery: string) {
  const geniusSearch = await Lyrics.songs.search(searchQuery);

  if (geniusSearch.length === 0) {
    return undefined;
  }

  return geniusSearch[0];
}

export async function generateLyricsEmbed(songQuery: string) {
  const geniusSong = await getLyricsSong(songQuery);

  if (!geniusSong) {
    return generateErrorEmbed(i18next.t('commands:lyrics_embed_lyrics_not_found'));
  }

  try {
    const lyrics = await geniusSong.lyrics();

    const lyricsText = lyrics.slice(0, 4096);

    return new EmbedBuilder()
      .setTitle(geniusSong.title)
      .setURL(geniusSong.url)
      .setDescription(lyricsText)
      .setColor(Colors.Yellow)
      .setFooter({ text: i18next.t('commands:lyrics_embed_text_not_correct') });
  } catch (e) {
    return generateErrorEmbed(i18next.t('commands:lyrics_embed_lyrics_not_found'));
  }
}
