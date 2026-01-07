/**
 * Array utility functions - common operations for typed arrays
 * Provides type-safe helpers for finding, filtering, and manipulating arrays
 */

/**
 * Find an item by ID in an array of objects with 'id' property
 * Generic type ensures type safety
 * 
 * @param items - Array of items with 'id' property
 * @param id - The ID to search for
 * @returns The matching item or undefined
 */
export function findById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}

/**
 * Remove an item by ID from an array (returns new array)
 * 
 * @param items - Array of items with 'id' property
 * @param id - The ID of the item to remove
 * @returns New array without the item
 */
export function removeById<T extends { id: string }>(
  items: T[],
  id: string
): T[] {
  return items.filter(item => item.id !== id);
}

/**
 * Update an item by ID in an array (returns new array)
 * 
 * @param items - Array of items with 'id' property
 * @param id - The ID of the item to update
 * @param updates - Partial object with fields to update
 * @returns New array with the updated item
 */
export function updateById<T extends { id: string }>(
  items: T[],
  id: string,
  updates: Partial<T>
): T[] {
  return items.map(item => 
    item.id === id ? { ...item, ...updates } : item
  );
}

/**
 * Filter items by a list of IDs
 * 
 * @param items - Array of items with 'id' property
 * @param ids - Array of IDs to filter by
 * @returns Items whose ID is in the ids array
 */
export function filterByIds<T extends { id: string }>(
  items: T[],
  ids: string[]
): T[] {
  return items.filter(item => ids.includes(item.id));
}

/**
 * Check if any item in an array matches a predicate
 * 
 * @param items - Array of items
 * @param predicate - Function to test each item
 * @returns true if any item matches
 */
export function hasMatch<T>(
  items: T[],
  predicate: (item: T) => boolean
): boolean {
  return items.some(predicate);
}

/**
 * Sum a numeric property across all items
 * 
 * @param items - Array of items
 * @param getter - Function to extract the numeric value
 * @returns Sum of all values
 */
export function sumBy<T>(
  items: T[],
  getter: (item: T) => number
): number {
  return items.reduce((sum, item) => sum + getter(item), 0);
}
