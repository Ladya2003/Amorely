import mongoose from 'mongoose';
import { emptyWorkspace, ServiceError, Workspace } from './domain';

const schema = new mongoose.Schema({
  _id: { type: String, required: true }, revision: { type: Number, default: 0 },
  settings: { type: mongoose.Schema.Types.Mixed, required: true },
  bookings: { type: [mongoose.Schema.Types.Mixed], default: [] },
  blocks: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { collection: 'car_service_workspace', versionKey: false, bufferCommands: false });
const Model = mongoose.models.CarServiceWorkspace || mongoose.model('CarServiceWorkspace', schema);
const ID = 'single-station-demo';
let initialize: Promise<void> | null = null;
async function ensure(): Promise<void> {
  if (mongoose.connection.readyState !== 1) throw new ServiceError(503, 'Сервис записи временно недоступен. Попробуйте позже.');
  if (!initialize) initialize = Model.updateOne({ _id: ID }, { $setOnInsert: { _id: ID, ...emptyWorkspace() } }, { upsert: true }).then(() => undefined).catch((e: unknown) => { initialize = null; throw e; });
  await initialize;
}
export async function readWorkspace(): Promise<Workspace> {
  await ensure();
  const raw = await Model.findById(ID).lean() as unknown as Workspace | null;
  if (!raw) throw new ServiceError(503, 'Не удалось открыть расписание.');
  return { revision: raw.revision, settings: raw.settings, bookings: raw.bookings, blocks: raw.blocks };
}
// All schedule mutations share one versioned document. Atomic compare-and-swap protects
// booking-vs-booking, booking-vs-block and booking-vs-hours without requiring a replica set.
export async function mutateWorkspace<T>(fn: (state: Workspace) => T): Promise<T> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const state = await readWorkspace(), expected = state.revision, result = fn(state);
    const update = await Model.updateOne({ _id: ID, revision: expected }, { $set: { settings: state.settings, bookings: state.bookings, blocks: state.blocks }, $inc: { revision: 1 } });
    if (update.modifiedCount === 1) return result;
  }
  throw new ServiceError(409, 'Расписание обновилось. Повторите действие.');
}
