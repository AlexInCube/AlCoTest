import { model, Schema } from 'mongoose';

interface ISongHistoryUnit {
  name: string;
  timestamp: Date;
  requester: string;
}

const SchemaSongsHistoryUnit = new Schema<ISongHistoryUnit>({
  name: String,
  timestamp: Date,
  requester: String,
})

export interface ISchemaSongsHistory {
  songsHistory: Array<ISongHistoryUnit>;
}

export const SchemaSongsHistoryList = new Schema<ISchemaSongsHistory>({
  songsHistory: { type: [SchemaSongsHistoryUnit], default: [] }
});

const SongsHistoryListModel = model<ISchemaSongsHistory>('song_history', SchemaSongsHistoryList);
class SongsHistoryListModelClass extends SongsHistoryListModel {}

