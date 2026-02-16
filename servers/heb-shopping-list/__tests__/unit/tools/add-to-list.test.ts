import { describe, it, expect } from 'vitest';
import { AddToListInputSchema } from '../../../src/tools/add-to-list.js';

describe('AddToListInputSchema', () => {
  it('should reject input with neither productId nor searchTerm', () => {
    expect(() => AddToListInputSchema.parse({})).toThrow(
      'Either productId or searchTerm must be provided'
    );
  });
});
