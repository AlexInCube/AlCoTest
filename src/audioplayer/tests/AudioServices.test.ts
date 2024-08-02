import * as assert from 'node:assert';
import { describe, it, before } from 'node:test';
import { DisTube } from 'distube';
import { Client } from 'discord.js';
import { clientIntents } from '../../ClientIntents.js';
import { LoadPlugins } from '../LoadPlugins.js';
import '../../EnvironmentVariables.js';
import { loggerWarn } from '../../utilities/logger.js';

let distube: DisTube;
const djsClient: Client = new Client({ intents: clientIntents });

before(async () => {
  loggerWarn('If you want to run all this tests successfully, provide all optional .env variables');

  distube = new DisTube(djsClient, {
    nsfw: true,
    plugins: await LoadPlugins()
  });
});

describe('Audio Services', () => {
  describe('Youtube', () => {
    it('Video', async () => {
      const song = await distube.handler.resolve('https://www.youtube.com/watch?v=atgjKEgSqSU');

      assert.ok(song);
    });

    it('Video 18+', async () => {
      const song = await distube.handler.resolve('https://www.youtube.com/watch?v=T1UbWo70Uto');

      assert.ok(song);
    });

    it('Playlist', async () => {
      const playlist = await distube.handler.resolve(
        'https://www.youtube.com/watch?v=qq-RGFyaq0U&list=PLefKpFQ8Pvy5aCLAGHD8Zmzsdljos-t2l'
      );

      assert.ok(playlist);
    });
  });

  describe(`Spotify`, () => {
    it('Song', async () => {
      const song = await distube.handler.resolve(
        'https://open.spotify.com/track/2vBIOyCqBAoZ4Fxc4JOKL3?si=7088fe2f13c840cd'
      );

      assert.ok(song);
    });

    it('Playlist', async () => {
      const playlist = await distube.handler.resolve(
        'https://open.spotify.com/playlist/4Ip3oQJlyl9Zvzp33h1GSe?si=ce13625f480e44ff'
      );

      assert.ok(playlist);
    });
  });

  describe(`SoundCloud`, () => {
    it('Song', async () => {
      const song = await distube.handler.resolve(
        'https://soundcloud.com/u6lg5vfbfely/ninja-gaiden-2-ost-a-long-way'
      );

      assert.ok(song);
    });

    it('Playlist', async () => {
      const playlist = await distube.handler.resolve(
        'https://soundcloud.com/u6lg5vfbfely/sets/music'
      );

      assert.ok(playlist);
    });
  });

  describe(`Yandex Music`, () => {
    it('Song', async () => {
      const song = await distube.handler.resolve(
        'https://music.yandex.com/album/10030/track/38634572'
      );

      assert.ok(song);
    });

    it('Playlist', async () => {
      const song = await distube.handler.resolve(
        'https://music.yandex.ru/users/alexander.tsimbalistiy/playlists/1000'
      );

      assert.ok(song);
    });

    it('Album', async () => {
      const song = await distube.handler.resolve('https://music.yandex.ru/album/5307396');

      assert.ok(song);
    });
  });

  describe('Apple Music', () => {
    it('Song', async () => {
      const song = await distube.handler.resolve(
        'https://music.apple.com/us/album/v/1544457960?i=1544457962'
      );

      assert.ok(song);
    });

    it(
      'Playlist',
      { skip: 'Playlists in Apple Music is not correct implemented right now, so skip this test' },
      async () => {
        const playlist = await distube.handler.resolve(
          'https://music.apple.com/us/album/cyberpunk-2077-original-score/1544457960'
        );

        assert.ok(playlist);
      }
    );
  });
});
