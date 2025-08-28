import { ProjectManager } from '../core/ProjectManager';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => store[key] = value,
    removeItem: (key: string) => delete store[key],
    clear: () => store = {}
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('ProjectManager', () => {
  let projectManager: ProjectManager;

  beforeEach(async () => {
    localStorageMock.clear();
    projectManager = new ProjectManager({
      repositoryName: 'test-project',
      author: 'Test User'
    });
    await projectManager.initialize();
  });

  describe('Basic Operations', () => {
    it('should initialize with empty data', async () => {
      const data = await projectManager.getCurrentData();
      expect(data).toEqual({});
    });

    it('should set and get values', async () => {
      await projectManager.setValue('name', 'Test Project');
      await projectManager.setValue('version', '1.0.0');

      const name = await projectManager.getValue('name');
      const version = await projectManager.getValue('version');

      expect(name).toBe('Test Project');
      expect(version).toBe('1.0.0');
    });

    it('should remove values', async () => {
      await projectManager.setValue('temp', 'temporary value');
      await projectManager.removeValue('temp');

      const temp = await projectManager.getValue('temp');
      expect(temp).toBeUndefined();
    });

    it('should update entire data object', async () => {
      const newData = {
        name: 'Updated Project',
        description: 'A test project',
        config: { debug: true }
      };

      await projectManager.setData(newData, 'Update project data');
      const data = await projectManager.getCurrentData();

      expect(data).toEqual(newData);
    });
  });

  describe('Branching', () => {
    beforeEach(async () => {
      await projectManager.setValue('name', 'Main Project');
      await projectManager.setValue('version', '1.0.0');
    });

    it('should create a new branch', async () => {
      const branch = await projectManager.createBranch('feature-branch');
      expect(branch.name).toBe('feature-branch');

      const branches = await projectManager.getBranches();
      expect(branches).toContain('feature-branch');
    });

    it('should switch branches', async () => {
      await projectManager.createBranch('feature-branch');
      await projectManager.switchBranch('feature-branch');

      expect(projectManager.getCurrentBranch()).toBe('feature-branch');

      // Data should be the same after switching
      const name = await projectManager.getValue('name');
      expect(name).toBe('Main Project');
    });

    it('should isolate changes between branches', async () => {
      // Create and switch to feature branch
      await projectManager.createBranch('feature-branch');
      await projectManager.switchBranch('feature-branch');
      
      // Make changes on feature branch
      await projectManager.setValue('feature', 'new feature');
      
      // Switch back to main
      await projectManager.switchBranch('main');
      
      // Feature should not exist on main
      const feature = await projectManager.getValue('feature');
      expect(feature).toBeUndefined();
      
      // But original data should still be there
      const name = await projectManager.getValue('name');
      expect(name).toBe('Main Project');
    });

    it('should not allow creating duplicate branches', async () => {
      await projectManager.createBranch('test-branch');
      
      await expect(projectManager.createBranch('test-branch'))
        .rejects.toThrow('Branch \'test-branch\' already exists');
    });

    it('should delete branches', async () => {
      await projectManager.createBranch('temp-branch');
      await projectManager.deleteBranch('temp-branch');

      const branches = await projectManager.getBranches();
      expect(branches).not.toContain('temp-branch');
    });

    it('should not allow deleting main branch', async () => {
      await expect(projectManager.deleteBranch('main'))
        .rejects.toThrow('Cannot delete main branch');
    });
  });

  describe('Merging', () => {
    beforeEach(async () => {
      // Setup main branch
      await projectManager.setValue('name', 'Main Project');
      await projectManager.setValue('version', '1.0.0');
      
      // Create feature branch
      await projectManager.createBranch('feature-branch');
      await projectManager.switchBranch('feature-branch');
      
      // Add feature (no conflicts - different keys)
      await projectManager.setValue('feature', 'awesome feature');
      await projectManager.setValue('description', 'Added new feature');
      
      // Switch back to main
      await projectManager.switchBranch('main');
    });

    it('should merge branches successfully', async () => {
      const result = await projectManager.merge('feature-branch');
      
      expect(result.success).toBe(true);
      expect(result.newCommitId).toBeDefined();
      
      // Check merged data
      const feature = await projectManager.getValue('feature');
      const description = await projectManager.getValue('description');
      const version = await projectManager.getValue('version'); // Should remain unchanged
      
      expect(feature).toBe('awesome feature');
      expect(description).toBe('Added new feature');
      expect(version).toBe('1.0.0'); // No conflict, so original version remains
    });

    it('should not merge branch into itself', async () => {
      await expect(projectManager.merge('main'))
        .rejects.toThrow('Cannot merge branch into itself');
    });

    it('should detect merge conflicts', async () => {
      // Make conflicting changes on main
      await projectManager.setValue('feature', 'different feature');
      
      const result = await projectManager.merge('feature-branch');
      
      expect(result.success).toBe(false);
      expect(result.conflicts).toContain('feature');
    });
  });

  describe('Commit History', () => {
    it('should track commit history', async () => {
      await projectManager.setValue('step', '1');
      await projectManager.setValue('step', '2');
      await projectManager.setValue('step', '3');

      const history = await projectManager.getCommitHistory();
      
      expect(history.length).toBeGreaterThan(3); // Including initial commit
      expect(history[0].message).toContain('Set step');
      expect(history[0].data.step).toBe('3');
    });

    it('should limit commit history', async () => {
      await projectManager.setValue('step', '1');
      await projectManager.setValue('step', '2');
      await projectManager.setValue('step', '3');

      const history = await projectManager.getCommitHistory(2);
      expect(history.length).toBe(2);
    });
  });

  describe('Persistence', () => {
    it('should persist data across instances', async () => {
      await projectManager.setValue('persistent', 'value');
      
      // Create new instance with same repository name
      const newManager = new ProjectManager({
        repositoryName: 'test-project',
        author: 'Test User'
      });
      await newManager.initialize();
      
      const value = await newManager.getValue('persistent');
      expect(value).toBe('value');
    });
  });
});