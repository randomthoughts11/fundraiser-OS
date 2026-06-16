import { prisma } from "@/lib/prisma";
import type { Contact, InvestorPerson } from "@/generated/prisma/client";

export type IntroPath = {
  contactId: string;
  contactName: string;
  targetPersonId: string;
  targetPersonName: string;
  strength: number;
  pathDescription: string;
  coldBetter: boolean;
};

export function scoreIntroStrength(
  contact: Contact,
  target: InvestorPerson,
): { strength: number; description: string; coldBetter: boolean } {
  let strength = 0.2;
  const reasons: string[] = [];

  if (contact.canIntro) {
    strength += 0.3;
    reasons.push("marked as can intro");
  }

  if (contact.relationship?.toLowerCase().includes("advisor")) {
    strength += 0.2;
    reasons.push("advisor relationship");
  }

  if (
    contact.employer &&
    target.title?.toLowerCase().includes(contact.employer.toLowerCase())
  ) {
    strength += 0.25;
    reasons.push(`shared connection via ${contact.employer}`);
  }

  if (contact.email && target.email?.split("@")[1] === contact.email.split("@")[1]) {
    strength += 0.15;
    reasons.push("same email domain");
  }

  const coldBetter = strength < 0.35;

  return {
    strength: Math.min(1, strength),
    description: reasons.length > 0 ? reasons.join("; ") : "weak connection",
    coldBetter,
  };
}

export async function findWarmIntroPaths(companyId: string): Promise<IntroPath[]> {
  const contacts = await prisma.contact.findMany({ where: { companyId } });
  const investors = await prisma.investorPerson.findMany({
    where: { email: { not: null } },
    take: 500,
  });

  const paths: IntroPath[] = [];

  for (const contact of contacts) {
    for (const investor of investors) {
      const { strength, description, coldBetter } = scoreIntroStrength(
        contact,
        investor,
      );

      if (strength >= 0.25) {
        paths.push({
          contactId: contact.id,
          contactName: contact.name,
          targetPersonId: investor.id,
          targetPersonName: investor.name,
          strength,
          pathDescription: description,
          coldBetter,
        });
      }
    }
  }

  return paths.sort((a, b) => b.strength - a.strength).slice(0, 100);
}

export async function persistWarmIntroPaths(companyId: string) {
  const paths = await findWarmIntroPaths(companyId);

  await prisma.warmIntroPath.deleteMany({ where: { companyId } });

  if (paths.length > 0) {
    await prisma.warmIntroPath.createMany({
      data: paths.map((p) => ({
        companyId,
        contactId: p.contactId,
        targetPersonId: p.targetPersonId,
        strength: p.strength,
        pathDescription: p.pathDescription,
        bestRequester: p.contactName,
        coldBetter: p.coldBetter,
      })),
    });
  }

  return paths;
}
