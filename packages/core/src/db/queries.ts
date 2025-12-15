/**
 * Delete actor from tracking table.
 * Returns silently if table doesn't exist (tracking was never enabled).
 */
export async function deleteActorFromTracking(
  trackerActor: { sql: <T>(strings: TemplateStringsArray, ...values: any[]) => T[] },
  actorName: string
): Promise<void> {
  try {
    trackerActor.sql`DELETE FROM actors WHERE identifier = ${actorName};`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("no such table")) {
      return; // Tracking was never enabled
    }
    console.error(`Failed to delete actor from tracking instance: ${msg || "Unknown error"}`);
  }
}
