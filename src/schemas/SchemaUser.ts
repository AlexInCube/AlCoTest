import { Document, model, Schema } from 'mongoose';
import { PlaylistModelClass } from './SchemaPlaylist.js';

interface ISchemaUser extends Document {
  userID: string;
  playlists?: Array<PlaylistModelClass>;
}

const SchemaUser = new Schema<ISchemaUser>({
  userID: { type: String, required: true, unique: true },
  playlists: [{ type: Schema.Types.ObjectId, ref: 'playlist' }]
});

const UserModel = model<ISchemaUser>('user', SchemaUser);

export class UserModelClass extends UserModel {}

export async function getOrCreateUser(userID: string): Promise<UserModelClass> {
  const user = await UserModelClass.findOne({ userID });
  if (user) return user;
  const newUser = new UserModelClass({
    userID
  });
  await newUser.save();
  return newUser;
}
