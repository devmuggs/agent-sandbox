import { generateId, deepClone, diffData, mergeData } from '../utils/helpers';

describe('Utility Functions', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('deepClone', () => {
    it('should create deep copies of objects', () => {
      const original = {
        a: 1,
        b: { c: 2, d: [3, 4] },
        e: 'string'
      };

      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      expect(cloned.b.d).not.toBe(original.b.d);
    });
  });

  describe('diffData', () => {
    it('should detect added keys', () => {
      const oldData = { a: 1 };
      const newData = { a: 1, b: 2 };
      
      const diff = diffData(oldData, newData);
      
      expect(diff.added).toEqual({ b: 2 });
      expect(diff.modified).toEqual({});
      expect(diff.removed).toEqual([]);
    });

    it('should detect modified keys', () => {
      const oldData = { a: 1, b: 2 };
      const newData = { a: 10, b: 2 };
      
      const diff = diffData(oldData, newData);
      
      expect(diff.added).toEqual({});
      expect(diff.modified).toEqual({ a: 10 });
      expect(diff.removed).toEqual([]);
    });

    it('should detect removed keys', () => {
      const oldData = { a: 1, b: 2 };
      const newData = { a: 1 };
      
      const diff = diffData(oldData, newData);
      
      expect(diff.added).toEqual({});
      expect(diff.modified).toEqual({});
      expect(diff.removed).toEqual(['b']);
    });

    it('should detect complex changes', () => {
      const oldData = { a: 1, b: 2, c: 3 };
      const newData = { a: 10, c: 3, d: 4 };
      
      const diff = diffData(oldData, newData);
      
      expect(diff.added).toEqual({ d: 4 });
      expect(diff.modified).toEqual({ a: 10 });
      expect(diff.removed).toEqual(['b']);
    });
  });

  describe('mergeData', () => {
    it('should merge non-conflicting changes', () => {
      const base = { a: 1, b: 2 };
      const theirs = { a: 1, b: 2, c: 3 }; // Added c
      const ours = { a: 10, b: 2 }; // Modified a
      
      const { result, conflicts } = mergeData(base, theirs, ours);
      
      expect(result).toEqual({ a: 10, b: 2, c: 3 });
      expect(conflicts).toEqual([]);
    });

    it('should detect conflicts', () => {
      const base = { a: 1 };
      const theirs = { a: 2 }; // Modified a to 2
      const ours = { a: 3 }; // Modified a to 3
      
      const { result, conflicts } = mergeData(base, theirs, ours);
      
      expect(conflicts).toContain('a');
    });

    it('should handle additions on both sides', () => {
      const base = { a: 1 };
      const theirs = { a: 1, b: 2 };
      const ours = { a: 1, c: 3 };
      
      const { result, conflicts } = mergeData(base, theirs, ours);
      
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
      expect(conflicts).toEqual([]);
    });

    it('should handle conflicting additions', () => {
      const base = { a: 1 };
      const theirs = { a: 1, b: 2 };
      const ours = { a: 1, b: 3 }; // Same key, different value
      
      const { result, conflicts } = mergeData(base, theirs, ours);
      
      expect(conflicts).toContain('b');
    });
  });
});