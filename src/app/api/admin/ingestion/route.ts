import { withApiHandler } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return withApiHandler(async () => {
    await requireAdmin();

    const [firmCount, personCount, signalCount, staleSignals, jobs] = await Promise.all([
      prisma.investorFirm.count(),
      prisma.investorPerson.count(),
      prisma.investorSignal.count(),
      prisma.investorSignal.count({ where: { isStale: true } }),
      prisma.ingestionJob.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    ]);

    return {
      firmCount,
      personCount,
      signalCount,
      staleSignals,
      recentJobs: jobs,
    };
  });
}
