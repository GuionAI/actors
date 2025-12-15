import type { Schedule } from "../index";

type SqlStorage = DurableObjectStorage["sql"];

/** Current Unix timestamp in seconds */
const nowUnix = () => Math.floor(Date.now() / 1000);

/**
 * Execute SQL query safely, returning undefined if table doesn't exist.
 * This handles the case where destroy() is called inside an alarm callback,
 * which deletes all storage before the alarm processing completes.
 */
function safeExec<T>(
  sql: SqlStorage,
  query: string,
  ...params: (string | number | boolean | null)[]
): T[] | undefined {
  try {
    return [...sql.exec(query, ...params)] as T[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("no such table")) {
      return undefined;
    }
    throw e;
  }
}

/**
 * Select the next alarm to fire (earliest time > now)
 */
export function selectNextAlarm(
  sql: SqlStorage
): { time: number; identifier: string }[] | undefined {
  return safeExec(
    sql,
    `SELECT time, COALESCE(identifier, 'default') as identifier FROM _actor_alarms
     WHERE time > ?
     ORDER BY time ASC
     LIMIT 1`,
    nowUnix()
  );
}

/**
 * Select all alarms that are due (time <= now)
 */
export function selectDueAlarms(
  sql: SqlStorage
): Schedule<string>[] | undefined {
  return safeExec(
    sql,
    `SELECT *, COALESCE(identifier, 'default') as identifier FROM _actor_alarms WHERE time <= ?`,
    nowUnix()
  );
}

/**
 * Update alarm time (for cron rescheduling)
 */
export function updateAlarmTime(
  sql: SqlStorage,
  id: string,
  time: number
): void {
  safeExec(sql, `UPDATE _actor_alarms SET time = ? WHERE id = ?`, time, id);
}

/**
 * Delete alarm by id (after execution)
 */
export function deleteAlarmById(sql: SqlStorage, id: string): void {
  safeExec(sql, `DELETE FROM _actor_alarms WHERE id = ?`, id);
}
