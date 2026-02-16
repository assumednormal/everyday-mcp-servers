import { describe, it, expect } from 'vitest';
import { RemoveFromListInputSchema } from '../../../src/tools/remove-from-list.js';

describe('RemoveFromListInputSchema', () => {
  it('should reject input with neither itemIds nor productName', () => {
    expect(() => RemoveFromListInputSchema.parse({})).toThrow(
      'Either itemIds or productName must be provided'
    );
  });
});
