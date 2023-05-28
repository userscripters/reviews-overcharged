import type { config } from "./config";
import { Manager } from "./Manager";

export type Cleaner = (cnf: typeof config) => boolean | Promise<boolean>;

export class CleanerManager extends Manager<Cleaner> {}
