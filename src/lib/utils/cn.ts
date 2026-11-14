/** Une clases CSS ignorando valores vacíos o falsos. */
export function cn(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(" ");
}
