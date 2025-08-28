import { 
  ProjectData, 
  Repository, 
  Commit, 
  Branch, 
  StorageInterface, 
  ProjectManagerOptions,
  MergeOptions,
  MergeResult
} from '../types';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter';
import { generateId, deepClone, mergeData } from '../utils/helpers';

export class ProjectManager {
  private repository: Repository;
  private storage: StorageInterface;
  private author: string;

  constructor(options: ProjectManagerOptions) {
    this.storage = options.storage || new LocalStorageAdapter();
    this.author = options.author || 'Anonymous';
    
    this.repository = {
      id: generateId(),
      name: options.repositoryName,
      branches: {},
      commits: {},
      currentBranch: 'main'
    };
  }

  async initialize(): Promise<void> {
    // Try to load existing repository
    const existingRepo = await this.storage.load(`repo:${this.repository.name}`);
    
    if (existingRepo) {
      this.repository = existingRepo;
    } else {
      // Create initial commit with empty data
      const initialCommit = await this.createCommit({}, 'Initial commit');
      this.repository.branches.main = {
        name: 'main',
        commitId: initialCommit.id
      };
      await this.save();
    }
  }

  async getCurrentData(): Promise<ProjectData> {
    const currentCommit = await this.getCurrentCommit();
    return currentCommit ? deepClone(currentCommit.data) : {};
  }

  async setData(data: ProjectData, message: string = 'Update data'): Promise<Commit> {
    const currentCommit = await this.getCurrentCommit();
    const parentCommitId = currentCommit ? currentCommit.id : undefined;
    const commit = await this.createCommit(data, message, parentCommitId);
    this.repository.branches[this.repository.currentBranch].commitId = commit.id;
    await this.save();
    return commit;
  }

  async setValue(key: string, value: any, message?: string): Promise<Commit> {
    const currentData = await this.getCurrentData();
    currentData[key] = value;
    return this.setData(currentData, message || `Set ${key}`);
  }

  async getValue(key: string): Promise<any> {
    const data = await this.getCurrentData();
    return data[key];
  }

  async removeValue(key: string, message?: string): Promise<Commit> {
    const currentData = await this.getCurrentData();
    delete currentData[key];
    return this.setData(currentData, message || `Remove ${key}`);
  }

  async createBranch(branchName: string, fromBranch?: string): Promise<Branch> {
    if (this.repository.branches[branchName]) {
      throw new Error(`Branch '${branchName}' already exists`);
    }

    const sourceBranch = fromBranch || this.repository.currentBranch;
    if (!this.repository.branches[sourceBranch]) {
      throw new Error(`Source branch '${sourceBranch}' does not exist`);
    }

    const newBranch: Branch = {
      name: branchName,
      commitId: this.repository.branches[sourceBranch].commitId
    };

    this.repository.branches[branchName] = newBranch;
    await this.save();
    return newBranch;
  }

  async switchBranch(branchName: string): Promise<void> {
    if (!this.repository.branches[branchName]) {
      throw new Error(`Branch '${branchName}' does not exist`);
    }

    this.repository.currentBranch = branchName;
    await this.save();
  }

  async deleteBranch(branchName: string): Promise<void> {
    if (branchName === 'main') {
      throw new Error('Cannot delete main branch');
    }

    if (branchName === this.repository.currentBranch) {
      throw new Error('Cannot delete current branch');
    }

    if (!this.repository.branches[branchName]) {
      throw new Error(`Branch '${branchName}' does not exist`);
    }

    delete this.repository.branches[branchName];
    await this.save();
  }

  async merge(branchName: string, options: MergeOptions = {}): Promise<MergeResult> {
    if (!this.repository.branches[branchName]) {
      throw new Error(`Branch '${branchName}' does not exist`);
    }

    if (branchName === this.repository.currentBranch) {
      throw new Error('Cannot merge branch into itself');
    }

    const currentCommit = await this.getCurrentCommit();
    const mergeCommit = this.repository.commits[this.repository.branches[branchName].commitId];

    if (!currentCommit || !mergeCommit) {
      throw new Error('Invalid commit state');
    }

    // For simplicity, we'll do a fast-forward merge or create a merge commit
    // In a real implementation, we'd find the common ancestor
    const ourData = currentCommit.data;
    const theirData = mergeCommit.data;
    
    // Simple merge strategy: combine both datasets, with conflicts detected for same keys with different values
    const result: ProjectData = { ...ourData };
    const conflicts: string[] = [];

    for (const key in theirData) {
      if (key in ourData && JSON.stringify(ourData[key]) !== JSON.stringify(theirData[key])) {
        conflicts.push(key);
      } else {
        result[key] = theirData[key];
      }
    }

    if (conflicts.length > 0) {
      return { success: false, conflicts };
    }

    const mergeMessage = options.message || `Merge branch '${branchName}' into ${this.repository.currentBranch}`;
    const newCommit = await this.createCommit(result, mergeMessage, currentCommit.id);
    
    this.repository.branches[this.repository.currentBranch].commitId = newCommit.id;
    await this.save();

    return { success: true, newCommitId: newCommit.id };
  }

  async getCommitHistory(limit?: number): Promise<Commit[]> {
    const history: Commit[] = [];
    let currentCommit = await this.getCurrentCommit();

    while (currentCommit && (!limit || history.length < limit)) {
      history.push(currentCommit);
      if (currentCommit.parentCommitId) {
        currentCommit = this.repository.commits[currentCommit.parentCommitId];
      } else {
        break;
      }
    }

    return history;
  }

  async getBranches(): Promise<string[]> {
    return Object.keys(this.repository.branches);
  }

  getCurrentBranch(): string {
    return this.repository.currentBranch;
  }

  private async createCommit(data: ProjectData, message: string, parentCommitId?: string): Promise<Commit> {
    const commit: Commit = {
      id: generateId(),
      message,
      timestamp: new Date(),
      author: this.author,
      parentCommitId,
      data: deepClone(data)
    };

    this.repository.commits[commit.id] = commit;
    return commit;
  }

  private async getCurrentCommit(): Promise<Commit | null> {
    const currentBranch = this.repository.branches[this.repository.currentBranch];
    if (!currentBranch) return null;
    
    return this.repository.commits[currentBranch.commitId] || null;
  }

  private async save(): Promise<void> {
    await this.storage.save(`repo:${this.repository.name}`, this.repository);
  }
}