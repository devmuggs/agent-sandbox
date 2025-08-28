export interface ProjectData {
  [key: string]: any;
}

export interface Commit {
  id: string;
  message: string;
  timestamp: Date;
  author: string;
  parentCommitId?: string;
  data: ProjectData;
}

export interface Branch {
  name: string;
  commitId: string;
}

export interface Repository {
  id: string;
  name: string;
  branches: { [branchName: string]: Branch };
  commits: { [commitId: string]: Commit };
  currentBranch: string;
}

export interface StorageInterface {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
  remove(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export interface ProjectManagerOptions {
  repositoryName: string;
  storage?: StorageInterface;
  author?: string;
}

export interface MergeOptions {
  strategy?: 'merge' | 'rebase';
  message?: string;
}

export interface MergeResult {
  success: boolean;
  conflicts?: string[];
  newCommitId?: string;
}