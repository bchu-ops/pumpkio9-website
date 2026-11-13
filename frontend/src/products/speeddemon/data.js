import { publicFile } from '../../App';
import { openf1 } from './lib/openf1';
import { createDataSource } from './lib/snapshot';

// Snapshot files live at <site>/f1/... (built at deploy time); live API is the fallback.
export const f1data = createDataSource({ base: publicFile('f1'), api: openf1 });
