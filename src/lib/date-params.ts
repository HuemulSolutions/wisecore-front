/** Converts an ISO datetime string to a plain YYYY-MM-DD date string required by the API. */
export function toDateParam(value: string): string {
  return value.slice(0, 10)
}
