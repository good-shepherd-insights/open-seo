import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { runBatch } from "@/db/runBatch";
import { dashboardCardPositions } from "@/db/schema";
import {
  overviewCardIdSchema,
  type OverviewCardId,
} from "@/types/schemas/dashboard";

export const OverviewCardOrderRepository = {
  async get(
    userId: string,
    projectId: string,
  ): Promise<OverviewCardId[] | null> {
    const rows = await db
      .select({ cardId: dashboardCardPositions.cardId })
      .from(dashboardCardPositions)
      .where(
        and(
          eq(dashboardCardPositions.userId, userId),
          eq(dashboardCardPositions.projectId, projectId),
        ),
      )
      .orderBy(asc(dashboardCardPositions.position));
    const order = rows
      .map((row) => row.cardId)
      .filter(
        (id): id is OverviewCardId =>
          overviewCardIdSchema.safeParse(id).success,
      );
    return order.length ? order : null;
  },

  async save(userId: string, projectId: string, order: OverviewCardId[]) {
    await runBatch((tx) => [
      tx
        .delete(dashboardCardPositions)
        .where(
          and(
            eq(dashboardCardPositions.userId, userId),
            eq(dashboardCardPositions.projectId, projectId),
          ),
        ),
      tx.insert(dashboardCardPositions).values(
        order.map((cardId, position) => ({
          userId,
          projectId,
          cardId,
          position,
        })),
      ),
    ]);
  },
};
