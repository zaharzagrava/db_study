// WARNING: this file is used for small, side effect-less utilites that might be used at compile time
// please try to use a utils.service for real utilities to be used in other service in runtime

/**
 * Used to get string names of class fields in strongly type manner.
 * Will give an error at compile time if field name is changed.
 * @param names array of strings - field names in class T, checked if they exist in T at compile time
 * @returns array of string field names
 */
export const nameof = <T>(names: Extract<keyof T, string>[]): string[] => names;
