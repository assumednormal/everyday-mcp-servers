import { ValidationError } from './errors.js';

/**
 * Validate that a string is not empty
 */
export function validateNonEmpty(value: string | undefined, fieldName: string): string {
  if (!value || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }
  return value.trim();
}

/**
 * Validate that a number is positive
 */
export function validatePositive(value: number, fieldName: string): number {
  if (value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`);
  }
  return value;
}

/**
 * Validate product ID format (HEB product IDs are numeric strings)
 */
export function validateProductId(productId: string): string {
  const trimmed = productId.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new ValidationError('Product ID must be a numeric string');
  }
  return trimmed;
}

/**
 * Validate list ID format (UUIDs)
 */
export function validateListId(listId: string): string {
  const trimmed = listId.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) {
    throw new ValidationError('List ID must be a valid UUID');
  }
  return trimmed;
}
