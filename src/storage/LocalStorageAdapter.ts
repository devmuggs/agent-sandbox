import { StorageInterface } from '../types';

export class LocalStorageAdapter implements StorageInterface {
  private prefix: string;

  constructor(prefix: string = 'git-project-manager') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async save(key: string, data: any): Promise<void> {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(this.getKey(key), serializedData);
    } catch (error) {
      throw new Error(`Failed to save data to localStorage: ${error}`);
    }
  }

  async load(key: string): Promise<any> {
    try {
      const data = localStorage.getItem(this.getKey(key));
      if (data === null) {
        return null;
      }
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to load data from localStorage: ${error}`);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      throw new Error(`Failed to remove data from localStorage: ${error}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    return localStorage.getItem(this.getKey(key)) !== null;
  }
}