import { Document, model, Schema } from 'mongoose';
import { getCurrentTimestamp } from '../../utilities/logger.js';

export interface IReport extends Document {
  userID: string;
  text: string;
  time: string;
}

const ReportSchema = new Schema<IReport>({
  userID: { required: true, type: String },
  text: { required: true, type: String },
  time: { required: true, type: String }
});

ReportSchema.set('collection', 'reports');

const ReportModel = model('reports', ReportSchema);
export async function submitReport(userID: string, text: string) {
  const newReport = new ReportModel({
    userID: userID,
    text: text,
    time: getCurrentTimestamp()
  });
  await newReport.save();
}
