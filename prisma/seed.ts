import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SAMPLE_FIRMS = [
  {
    name: "Nexus Seed Partners",
    sectorFocus: ["B2B_SAAS", "DEVTOOLS", "AI_INFRA"],
    stageFocus: ["SEED", "PRE_SEED"],
    checkSizeMin: 500_000,
    checkSizeMax: 3_000_000,
    leadBehavior: "LEAD",
    investorType: "VC_FUND",
    publicThesis: "Early-stage B2B software with strong product-led growth signals.",
    partner: {
      name: "Jane Smith",
      title: "Partner",
      email: "jane@nexusseed.com",
      sectorFocus: ["B2B_SAAS", "DEVTOOLS"],
      investsCold: false,
      responsiveness: 72,
    },
    signals: [
      {
        signalType: "recent_investment",
        title: "Recently backed two AI developer-tool companies",
        snippet: "Led seed rounds in workflow automation and AI infra tooling.",
        sourceUrl: "https://example.com/nexus-portfolio",
        sourceType: "PORTFOLIO_PAGE",
        confidence: 0.9,
      },
    ],
  },
  {
    name: "Horizon Angels Collective",
    sectorFocus: ["B2B_SAAS", "FINTECH", "CYBERSECURITY"],
    stageFocus: ["PRE_SEED", "SEED"],
    checkSizeMin: 100_000,
    checkSizeMax: 750_000,
    leadBehavior: "FOLLOW",
    investorType: "ANGEL",
    publicThesis: "Operator angels backing technical founders at pre-seed.",
    partner: {
      name: "Mark Chen",
      title: "Lead Angel",
      email: "mark@horizonangels.io",
      sectorFocus: ["B2B_SAAS"],
      investsCold: true,
      responsiveness: 65,
    },
    signals: [
      {
        signalType: "thesis_update",
        title: "Expanded focus to vertical SaaS and cybersecurity",
        sourceType: "NEWS",
        confidence: 0.8,
      },
    ],
  },
  {
    name: "Atlas Pre-Seed Fund",
    sectorFocus: ["AI_INFRA", "DEEPTECH", "DEVTOOLS"],
    stageFocus: ["PRE_SEED", "IDEA"],
    checkSizeMin: 250_000,
    checkSizeMax: 1_500_000,
    leadBehavior: "LEAD",
    investorType: "VC_FUND",
    publicThesis: "Pre-revenue deeptech and AI infrastructure with strong technical teams.",
    partner: {
      name: "Sarah Okonkwo",
      title: "General Partner",
      email: "sarah@atlaspreseed.com",
      sectorFocus: ["AI_INFRA", "DEEPTECH"],
      investsCold: false,
      responsiveness: 58,
    },
    signals: [
      {
        signalType: "fund_activity",
        title: "Fund announced new $80M pre-seed/seed vehicle",
        sourceType: "NEWS",
        confidence: 0.92,
      },
    ],
  },
  {
    name: "Meridian Growth Ventures",
    sectorFocus: ["B2B_SAAS", "FINTECH", "MARKETPLACE"],
    stageFocus: ["SEED", "SERIES_A"],
    checkSizeMin: 2_000_000,
    checkSizeMax: 10_000_000,
    leadBehavior: "LEAD",
    investorType: "VC_FUND",
    publicThesis: "Seed and Series A lead investor for category-defining B2B companies.",
    partner: {
      name: "David Park",
      title: "Partner",
      email: "david@meridiangv.com",
      sectorFocus: ["B2B_SAAS"],
      investsCold: false,
      responsiveness: 45,
    },
    signals: [
      {
        signalType: "recent_investment",
        title: "Led $6M seed in vertical SaaS platform",
        sourceType: "CRUNCHBASE",
        confidence: 0.88,
      },
    ],
  },
  {
    name: "Cipher Capital",
    sectorFocus: ["CYBERSECURITY", "DEFENSE_TECH", "DEVTOOLS"],
    stageFocus: ["SEED", "SERIES_A"],
    checkSizeMin: 1_000_000,
    checkSizeMax: 8_000_000,
    leadBehavior: "LEAD",
    investorType: "VC_FUND",
    publicThesis: "Security and infrastructure software for enterprise and government.",
    partner: {
      name: "Alex Rivera",
      title: "Partner",
      email: "alex@ciphercap.com",
      sectorFocus: ["CYBERSECURITY"],
      investsCold: false,
      responsiveness: 55,
    },
    signals: [
      {
        signalType: "partner_post",
        title: "Partner posted about zero-trust infrastructure trends",
        sourceType: "PARTNER_POST",
        confidence: 0.82,
      },
    ],
  },
] as const;

async function main() {
  console.log("Seeding investor graph...");

  const adminUser = await prisma.user.upsert({
    where: { clerkId: "dev-bypass-user" },
    create: {
      clerkId: "dev-bypass-user",
      email: "dev@fundraise.local",
      name: "Dev Admin",
      role: "ADMIN",
    },
    update: {},
  });

  await prisma.founder.upsert({
    where: { email: "dev@fundraise.local" },
    create: {
      email: "dev@fundraise.local",
      name: "Dev Admin",
      userId: adminUser.id,
    },
    update: { userId: adminUser.id },
  });

  for (const firm of SAMPLE_FIRMS) {
    const created = await prisma.investorFirm.create({
      data: {
        name: firm.name,
        slug: firm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        normalizedName: firm.name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim(),
        sectorFocus: [...firm.sectorFocus],
        stageFocus: [...firm.stageFocus],
        checkSizeMin: firm.checkSizeMin,
        checkSizeMax: firm.checkSizeMax,
        leadBehavior: firm.leadBehavior,
        investorType: firm.investorType,
        publicThesis: firm.publicThesis,
        geography: ["US"],
        lastActivityAt: new Date(),
        dataConfidence: 0.85,
        partners: {
          create: {
            name: firm.partner.name,
            title: firm.partner.title,
            email: firm.partner.email,
            sectorFocus: [...firm.partner.sectorFocus],
            investsCold: firm.partner.investsCold,
            responsiveness: firm.partner.responsiveness,
            lastActivityAt: new Date(),
            dataConfidence: 0.8,
          },
        },
        signals: {
          create: firm.signals.map((s) => ({
            signalType: s.signalType,
            title: s.title,
            snippet: "snippet" in s ? s.snippet : undefined,
            sourceUrl: "sourceUrl" in s ? s.sourceUrl : undefined,
            sourceType: s.sourceType,
            confidence: s.confidence,
            observedAt: new Date(),
          })),
        },
      },
    });
    console.log(`  Created ${created.name}`);
  }

  console.log(`Done. Seeded ${SAMPLE_FIRMS.length} investor firms + dev admin user.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
