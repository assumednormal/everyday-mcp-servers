import { describe, it, expect } from 'vitest';
import { UpdateItemQuantityInputSchema } from '../../../src/tools/update-item-quantity.js';

describe('UpdateItemQuantityInputSchema', () => {
  const validItemId = '4b6b1a43-a90d-4f29-82d3-1d09b027a2b3';
  const validListId = '6ab59696-6480-4ee4-8833-42bb3b1e80f5';

  it('should accept valid input with itemId and quantity', () => {
    const result = UpdateItemQuantityInputSchema.parse({
      itemId: validItemId,
      quantity: 2,
    });
    expect(result.itemId).toBe(validItemId);
    expect(result.quantity).toBe(2);
    expect(result.listId).toBeUndefined();
  });

  it('should accept valid input with optional listId', () => {
    const result = UpdateItemQuantityInputSchema.parse({
      itemId: validItemId,
      quantity: 5,
      listId: validListId,
    });
    expect(result.listId).toBe(validListId);
  });

  it('should reject non-UUID itemId', () => {
    expect(() =>
      UpdateItemQuantityInputSchema.parse({
        itemId: 'not-a-uuid',
        quantity: 1,
      })
    ).toThrow();
  });

  it('should reject missing itemId', () => {
    expect(() =>
      UpdateItemQuantityInputSchema.parse({
        quantity: 1,
      })
    ).toThrow();
  });

  it('should reject missing quantity', () => {
    expect(() =>
      UpdateItemQuantityInputSchema.parse({
        itemId: validItemId,
      })
    ).toThrow();
  });

  it('should reject zero quantity', () => {
    expect(() =>
      UpdateItemQuantityInputSchema.parse({
        itemId: validItemId,
        quantity: 0,
      })
    ).toThrow();
  });

  it('should reject negative quantity', () => {
    expect(() =>
      UpdateItemQuantityInputSchema.parse({
        itemId: validItemId,
        quantity: -1,
      })
    ).toThrow();
  });

  it('should reject non-integer quantity', () => {
    expect(() =>
      UpdateItemQuantityInputSchema.parse({
        itemId: validItemId,
        quantity: 1.5,
      })
    ).toThrow();
  });

  it('should reject non-UUID listId', () => {
    expect(() =>
      UpdateItemQuantityInputSchema.parse({
        itemId: validItemId,
        quantity: 1,
        listId: 'bad-list-id',
      })
    ).toThrow();
  });
});
