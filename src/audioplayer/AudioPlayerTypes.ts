export type AudioPlayerState = 'playing' | 'pause' | 'waiting' | 'loading' | 'destroying';
export type AudioPlayerLoopMode = 'disabled' | 'song' | 'queue';

export enum AudioPlayerIcons {
  stop = '<:stopwhite:1014551716043173989>',
  play = '<:play:1257590184455835698>',
  pause = '<:pausewhite:1014551696174764133>',
  toogleLoopMode = '<:repeatmodewhite:1014551751858331731>',
  previous = '<:previousbutton:1092107334542696512>',
  skip = '<:skipbutton:1092107438234275900>',
  shuffle = '<:shufflebutton:1092107651384614912>',
  list = '<:songlistwhite:1014551771705782405>'
}

export enum AudioSourceIcons {
  other = '<:audiowaves:1257591924693536829>',
  attachment = '<:attachfile:1257591906658156576>',
  youtube = '<:youtube:1257591994750992435>',
  applemusic = '<:applemusic:1257591803260174467>',
  yandexmusic = '<:yandexmusic:1257591977105555506>',
  spotify = '<:spotify:1257591960726933576>',
  soundcloud = '<:soundcloud:1257591943010193500>'
}
