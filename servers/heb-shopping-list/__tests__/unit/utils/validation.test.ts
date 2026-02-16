import { describe, it, expect } from 'vitest';
import {
  validateNonEmpty,
  validatePositive,
  validateProductId,
  validateListId,
} from '../../../src/utils/validation.js';
import { ValidationError } from '../../../src/utils/errors.js';

describe('validateNonEmpty', () => {
  it('should return trimmed value for valid string', () => {
    expect(validateNonEmpty('hello', 'Field')).toBe('hello');
  });

  it('should throw ValidationError for empty string', () => {
    expect(() => validateNonEmpty('', 'Field')).toThrow(ValidationError);
    expect(() => validateNonEmpty('', 'Field')).toThrow('Field cannot be empty');
  });

  it('should trim whitespace and include field name in error', () => {
    expect(validateNonEmpty('  hello  ', 'Field')).toBe('hello');
    expect(() => validateNonEmpty('   ', 'Search term')).toThrow('Search term cannot be empty');
  });
});

describe('validatePositive', () => {
  it('should throw ValidationError for zero', () => {
    expect(() => validatePositive(0, 'Quantity')).toThrow(ValidationError);
    expect(() => validatePositive(0, 'Quantity')).toThrow('Quantity must be a positive number');
  });

  it('should throw ValidationError for negative number', () => {
    expect(() => validatePositive(-5, 'Quantity')).toThrow(ValidationError);
    expect(() => validatePositive(-5, 'Quantity')).toThrow('Quantity must be a positive number');
  });
});

describe('validateProductId', () => {
  it('should return trimmed value for numeric string', () => {
    expect(validateProductId('12345')).toBe('12345');
  });

  it('should reject non-numeric string', () => {
    expect(() => validateProductId('abc')).toThrow(ValidationError);
    expect(() => validateProductId('abc')).toThrow('Product ID must be a numeric string');
  });

  it('should trim whitespace from numeric string', () => {
    expect(validateProductId('  12345  ')).toBe('12345');
  });
});

describe('validateListId', () => {
  it('should return trimmed value for valid UUID', () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    expect(validateListId(uuid)).toBe(uuid);
  });

  it('should throw ValidationError for invalid format', () => {
    expect(() => validateListId('not-a-uuid')).toThrow(ValidationError);
    expect(() => validateListId('not-a-uuid')).toThrow('List ID must be a valid UUID');
  });

  it('should accept uppercase UUID (case insensitive)', () => {
    const uuid = 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890';
    expect(validateListId(uuid)).toBe(uuid);
  });
});
