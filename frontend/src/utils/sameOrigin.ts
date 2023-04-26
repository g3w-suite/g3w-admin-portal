/**
 * Check for cross origin URLs.
 */
export default function sameOrigin(a: string, b: string): boolean {
  return (new URL(a)).origin === (new URL(b)).origin;
}
