import { ProjectManager } from '../src';

// Demo usage of the git-based project management library
async function demo() {
  console.log('🚀 Git-based Project Management Demo\n');

  // Create a new project manager
  const projectManager = new ProjectManager({
    repositoryName: 'my-awesome-project',
    author: 'Demo User'
  });

  await projectManager.initialize();
  console.log('✅ Project initialized');

  // Add some initial data
  await projectManager.setValue('name', 'My Awesome Project');
  await projectManager.setValue('version', '1.0.0');
  await projectManager.setValue('description', 'A demo project for git-based data management');
  await projectManager.setValue('config', { 
    debug: false, 
    theme: 'dark',
    features: ['auth', 'dashboard'] 
  });

  console.log('📝 Initial data added:');
  console.log(JSON.stringify(await projectManager.getCurrentData(), null, 2));

  // Create a feature branch
  await projectManager.createBranch('feature/user-management');
  await projectManager.switchBranch('feature/user-management');
  console.log('🌿 Created and switched to feature branch');

  // Add feature-specific data
  await projectManager.setValue('features', ['auth', 'dashboard', 'user-management']);
  await projectManager.setValue('userConfig', {
    maxUsers: 100,
    permissions: ['read', 'write', 'admin']
  });

  console.log('🎯 Feature branch data:');
  console.log(JSON.stringify(await projectManager.getCurrentData(), null, 2));

  // Show commit history on feature branch
  const featureHistory = await projectManager.getCommitHistory(3);
  console.log('📚 Recent commits on feature branch:');
  featureHistory.forEach((commit, index) => {
    console.log(`  ${index + 1}. ${commit.message} (${commit.timestamp.toLocaleString()})`);
  });

  // Switch back to main and create another branch
  await projectManager.switchBranch('main');
  await projectManager.createBranch('feature/styling');
  await projectManager.switchBranch('feature/styling');

  // Add styling configuration
  await projectManager.setValue('styles', {
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    typography: 'Arial, sans-serif'
  });

  console.log('\n🎨 Styling branch data:');
  console.log(JSON.stringify(await projectManager.getCurrentData(), null, 2));

  // Switch back to main and merge the user management feature
  await projectManager.switchBranch('main');
  console.log('\n🔀 Merging user management feature...');
  
  const mergeResult = await projectManager.merge('feature/user-management');
  if (mergeResult.success) {
    console.log('✅ Successfully merged user management feature');
  } else {
    console.log('⚠️ Merge conflicts detected:', mergeResult.conflicts);
  }

  // Show final state
  console.log('\n📊 Final project data on main branch:');
  console.log(JSON.stringify(await projectManager.getCurrentData(), null, 2));

  // Show all branches
  const branches = await projectManager.getBranches();
  console.log('\n🌿 All branches:', branches);
  console.log('📍 Current branch:', projectManager.getCurrentBranch());

  // Show commit history
  const mainHistory = await projectManager.getCommitHistory(5);
  console.log('\n📚 Recent commits on main:');
  mainHistory.forEach((commit, index) => {
    console.log(`  ${index + 1}. ${commit.message} (${commit.timestamp.toLocaleString()})`);
  });

  console.log('\n🎉 Demo completed!');
}

// Mock localStorage for Node.js environment
if (typeof localStorage === 'undefined') {
  (global as any).localStorage = (() => {
    let store: { [key: string]: string } = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => store[key] = value,
      removeItem: (key: string) => delete store[key],
      clear: () => store = {},
      length: 0,
      key: (index: number) => null
    };
  })();
}

// Run the demo
demo().catch(console.error);