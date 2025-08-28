import { ProjectData } from '../types';

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function diffData(oldData: ProjectData, newData: ProjectData): { 
  added: ProjectData; 
  modified: ProjectData; 
  removed: string[] 
} {
  const added: ProjectData = {};
  const modified: ProjectData = {};
  const removed: string[] = [];

  // Find added and modified keys
  for (const key in newData) {
    if (!(key in oldData)) {
      added[key] = newData[key];
    } else if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      modified[key] = newData[key];
    }
  }

  // Find removed keys
  for (const key in oldData) {
    if (!(key in newData)) {
      removed.push(key);
    }
  }

  return { added, modified, removed };
}

export function mergeData(base: ProjectData, theirs: ProjectData, ours: ProjectData): { 
  result: ProjectData; 
  conflicts: string[] 
} {
  const result: ProjectData = { ...base };
  const conflicts: string[] = [];

  // Apply changes from 'theirs' branch
  for (const key in theirs) {
    if (!(key in base)) {
      // New key in theirs
      if (key in ours && JSON.stringify(ours[key]) !== JSON.stringify(theirs[key])) {
        conflicts.push(key);
      } else {
        result[key] = theirs[key];
      }
    } else if (JSON.stringify(base[key]) !== JSON.stringify(theirs[key])) {
      // Modified key in theirs
      if (key in ours && JSON.stringify(ours[key]) !== JSON.stringify(theirs[key])) {
        conflicts.push(key);
      } else {
        result[key] = theirs[key];
      }
    }
  }

  // Apply changes from 'ours' branch (our changes take precedence if no conflict)
  for (const key in ours) {
    if (!conflicts.includes(key)) {
      result[key] = ours[key];
    }
  }

  // Remove keys that were deleted in either branch
  for (const key in base) {
    if (!(key in theirs) || !(key in ours)) {
      if (!(key in theirs) && !(key in ours)) {
        delete result[key];
      } else if (!conflicts.includes(key)) {
        if (!(key in theirs)) {
          delete result[key];
        } else if (!(key in ours)) {
          delete result[key];
        }
      }
    }
  }

  return { result, conflicts };
}