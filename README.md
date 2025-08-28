# Git-Based Project Manager

A TypeScript package that provides git-like versioning capabilities for project data management using key:value pairs. This is a proof-of-concept implementation that uses localStorage for persistence and supports branching, merging, and commit history.

## Features

- **Project Data Management**: Store and manage project data as key:value pairs
- **Git-like Operations**: Create branches, merge, track commit history
- **Versioning**: Full commit history with timestamps and messages
- **Conflict Detection**: Automatically detect merge conflicts
- **Local Storage**: Persistent storage using browser localStorage
- **TypeScript**: Full type safety and modern development experience

## Installation

```bash
npm install git-project-manager
```

## Quick Start

```typescript
import { ProjectManager } from 'git-project-manager';

// Create a new project
const projectManager = new ProjectManager({
  repositoryName: 'my-project',
  author: 'Your Name'
});

await projectManager.initialize();

// Add some data
await projectManager.setValue('name', 'My Awesome Project');
await projectManager.setValue('version', '1.0.0');
await projectManager.setValue('config', { 
  debug: false, 
  theme: 'dark' 
});

// Create a feature branch
await projectManager.createBranch('feature/new-feature');
await projectManager.switchBranch('feature/new-feature');

// Make changes on the feature branch
await projectManager.setValue('feature', 'awesome new feature');

// Switch back and merge
await projectManager.switchBranch('main');
const result = await projectManager.merge('feature/new-feature');

if (result.success) {
  console.log('✅ Feature merged successfully!');
} else {
  console.log('⚠️ Merge conflicts:', result.conflicts);
}
```

## API Reference

### ProjectManager

#### Constructor

```typescript
new ProjectManager(options: ProjectManagerOptions)
```

- `repositoryName`: Unique name for your project repository
- `author`: Author name for commits (optional, defaults to 'Anonymous')
- `storage`: Custom storage implementation (optional, defaults to LocalStorageAdapter)

#### Methods

##### Data Management

- `setValue(key: string, value: any, message?: string): Promise<Commit>`
- `getValue(key: string): Promise<any>`
- `removeValue(key: string, message?: string): Promise<Commit>`
- `setData(data: ProjectData, message?: string): Promise<Commit>`
- `getCurrentData(): Promise<ProjectData>`

##### Branch Management

- `createBranch(branchName: string, fromBranch?: string): Promise<Branch>`
- `switchBranch(branchName: string): Promise<void>`
- `deleteBranch(branchName: string): Promise<void>`
- `getBranches(): Promise<string[]>`
- `getCurrentBranch(): string`

##### Merging

- `merge(branchName: string, options?: MergeOptions): Promise<MergeResult>`

##### History

- `getCommitHistory(limit?: number): Promise<Commit[]>`

## Examples

### Basic Usage

```typescript
const pm = new ProjectManager({ repositoryName: 'example' });
await pm.initialize();

// Set individual values
await pm.setValue('title', 'My Project');
await pm.setValue('description', 'A cool project');

// Set complex data
await pm.setData({
  config: { theme: 'dark', debug: true },
  features: ['auth', 'dashboard']
}, 'Initial configuration');

// Get data
const title = await pm.getValue('title');
const allData = await pm.getCurrentData();
```

### Working with Branches

```typescript
// Create and switch to a new branch
await pm.createBranch('feature/user-auth');
await pm.switchBranch('feature/user-auth');

// Make changes
await pm.setValue('authConfig', {
  provider: 'oauth',
  redirectUrl: '/callback'
});

// Switch back to main
await pm.switchBranch('main');

// List all branches
const branches = await pm.getBranches();
console.log('Branches:', branches);
```

### Merging and Conflict Resolution

```typescript
// Merge feature branch
const result = await pm.merge('feature/user-auth');

if (result.success) {
  console.log('Merge successful!');
  console.log('New commit ID:', result.newCommitId);
} else {
  console.log('Conflicts detected in keys:', result.conflicts);
  // Handle conflicts manually then retry
}
```

### Viewing History

```typescript
// Get recent commits
const history = await pm.getCommitHistory(5);

history.forEach(commit => {
  console.log(`${commit.id}: ${commit.message}`);
  console.log(`Author: ${commit.author}`);
  console.log(`Date: ${commit.timestamp}`);
  console.log('---');
});
```

## Storage Adapters

The package uses localStorage by default, but you can implement custom storage:

```typescript
import { StorageInterface } from 'git-project-manager';

class CustomStorage implements StorageInterface {
  async save(key: string, data: any): Promise<void> {
    // Your custom storage logic
  }
  
  async load(key: string): Promise<any> {
    // Your custom retrieval logic
  }
  
  async remove(key: string): Promise<void> {
    // Your custom removal logic
  }
  
  async exists(key: string): Promise<boolean> {
    // Your custom existence check
  }
}

const pm = new ProjectManager({
  repositoryName: 'my-project',
  storage: new CustomStorage()
});
```

## Running the Demo

```bash
npm run demo
```

This will run a comprehensive demo showing all the features of the package.

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Watch mode for development
npm run dev

# Run demo
npm run demo
```

## Testing

The package includes comprehensive tests covering all functionality:

```bash
npm test
```

Tests cover:
- Basic data operations
- Branch management
- Merging and conflict detection
- Commit history
- Data persistence

## License

MIT License - see LICENSE file for details.

## Contributing

This is a proof-of-concept implementation. Contributions are welcome!

## Limitations

- Simple merge strategy (no three-way merge with common ancestor)
- localStorage size limitations
- No authentication or authorization
- Basic conflict resolution
- No remote repository support

## Future Enhancements

- Implement proper three-way merge algorithm
- Add rebase functionality
- Support for remote repositories
- Better conflict resolution UI
- Plugin system for custom storage backends
- CLI interface
- Web-based GUI