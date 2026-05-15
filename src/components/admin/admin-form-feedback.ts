/** Bottom padding when a fixed success/error banner may cover form actions. */
export function adminFormFeedbackPadding(hasBanner: boolean): string {
  return hasBanner ? "pb-28 sm:pb-8" : "";
}
