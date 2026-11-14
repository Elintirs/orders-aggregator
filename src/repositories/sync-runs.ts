import type { Db } from "../db.js";
import type { SyncStats } from "../services/sync.js";

export class SyncRunsRepository {
  constructor(private readonly db: Db) {}

  async start(): Promise<number> {
    const { rows } = await this.db.query<{ id: number }>(`INSERT INTO sync_runs DEFAULT VALUES RETURNING id`);
    return rows[0].id;
  }

  async finish(id: number, stats: SyncStats & { error?: string }): Promise<void> {
    await this.db.query(
      `UPDATE sync_runs
          SET finished_at = now(), pages = $2, received = $3, applied = $4, stale = $5, invalid = $6, error = $7
        WHERE id = $1`,
      [id, stats.pages, stats.received, stats.applied, stats.stale, stats.invalid, stats.error ?? null],
    );
  }
}
