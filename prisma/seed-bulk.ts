import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { slugify, normalizeInvestorName } from "../src/lib/ingestion/entity-resolution";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SECTORS = [
  "B2B_SAAS",
  "AI_INFRA",
  "FINTECH",
  "DEVTOOLS",
  "CYBERSECURITY",
  "CLIMATE",
  "HEALTHCARE",
] as const;

const STAGES = ["PRE_SEED", "SEED", "SERIES_A"] as const;

const PREFIXES = [
  "Nexus", "Atlas", "Horizon", "Summit", "Vertex", "Apex", "Catalyst", "Forge",
  "Pioneer", "Meridian", "Cipher", "Lumen", "Arc", "Beacon", "Prism", "Quantum",
  "Signal", "Vector", "Delta", "Echo", "Flux", "Grid", "Helix", "Ion",
];

const SUFFIXES = ["Ventures", "Capital", "Partners", "Fund", "Labs", "Collective"];

async function main() {
  console.log("Bulk seeding investor graph (target: 200+ firms)...");

  const existing = await prisma.investorFirm.count();
  if (existing >= 200) {
    console.log(`Already have ${existing} firms, skipping bulk seed.`);
    return;
  }

  let created = 0;
  for (let i = 0; i < 200; i++) {
    const prefix = PREFIXES[i % PREFIXES.length];
    const suffix = SUFFIXES[i % SUFFIXES.length];
    const name = `${prefix} ${suffix} ${Math.floor(i / PREFIXES.length) || ""}`.trim();
    const normalized = normalizeInvestorName(name);

    const exists = await prisma.investorFirm.findFirst({
      where: { normalizedName: normalized },
    });
    if (exists) continue;

    const sector = SECTORS[i % SECTORS.length];
    const stage = STAGES[i % STAGES.length];

    await prisma.investorFirm.create({
      data: {
        name,
        slug: slugify(name),
        normalizedName: normalized,
        website: `https://${slugify(name)}.example.com`,
        sectorFocus: [sector, SECTORS[(i + 1) % SECTORS.length]],
        stageFocus: [stage],
        checkSizeMin: 250_000 + (i % 10) * 100_000,
        checkSizeMax: 2_000_000 + (i % 10) * 500_000,
        leadBehavior: i % 3 === 0 ? "LEAD" : "FOLLOW",
        investorType: i % 5 === 0 ? "ANGEL" : "VC_FUND",
        publicThesis: `Invests in ${sector.replace(/_/g, " ").toLowerCase()} at ${stage.replace(/_/g, " ").toLowerCase()}`,
        geography: ["US"],
        lastActivityAt: new Date(Date.now() - (i % 60) * 86400000),
        dataConfidence: 0.5 + (i % 5) * 0.08,
        partners: {
          create: {
            name: `Partner ${i}`,
            title: i % 2 === 0 ? "Partner" : "Principal",
            email: `partner${i}@${slugify(name)}.example.com`,
            sectorFocus: [sector],
            stageFocus: [stage],
            investsCold: i % 4 === 0,
            responsiveness: 40 + (i % 40),
          },
        },
        signals: {
          create: {
            signalType: "seed_data",
            title: `Active in ${sector.replace(/_/g, " ")}`,
            sourceUrl: `https://example.com/signal/${i}`,
            sourceType: "OTHER",
            confidence: 0.6,
          },
        },
      },
    });
    created++;
  }

  console.log(`Created ${created} investor firms. Total: ${existing + created}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
