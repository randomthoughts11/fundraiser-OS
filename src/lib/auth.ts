import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/lib/api/errors";
import type { UserRole } from "@/generated/prisma/client";

export type AuthContext = {
  userId: string;
  clerkId: string;
  email: string;
  role: UserRole;
  founderId?: string;
};

const DEV_BYPASS = process.env.AUTH_BYPASS_DEV === "true" && !process.env.CLERK_SECRET_KEY;

export async function getAuthContext(): Promise<AuthContext | null> {
  if (DEV_BYPASS) {
    let devUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!devUser) {
      devUser = await prisma.user.create({
        data: {
          clerkId: "dev-bypass-user",
          email: "dev@fundraise.local",
          name: "Dev User",
          role: "ADMIN",
        },
      });
      await prisma.founder.upsert({
        where: { email: "dev@fundraise.local" },
        create: {
          email: "dev@fundraise.local",
          name: "Dev User",
          userId: devUser.id,
        },
        update: { userId: devUser.id },
      });
    }
    const founder = await prisma.founder.findFirst({ where: { userId: devUser.id } });
    return {
      userId: devUser.id,
      clerkId: devUser.clerkId,
      email: devUser.email,
      role: devUser.role,
      founderId: founder?.id,
    };
  }

  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const user = await prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      email,
      name: clerkUser.fullName ?? email,
      role: "FOUNDER",
    },
    update: {
      email,
      name: clerkUser.fullName ?? email,
    },
  });

  const founder = await prisma.founder.upsert({
    where: { email },
    create: {
      email,
      name: clerkUser.fullName ?? email,
      userId: user.id,
    },
    update: { userId: user.id, name: clerkUser.fullName ?? email },
  });

  return {
    userId: user.id,
    clerkId,
    email,
    role: user.role,
    founderId: founder.id,
  };
}

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new UnauthorizedError();
  return ctx;
}

export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (ctx.role !== "ADMIN") throw new ForbiddenError("Admin access required");
  return ctx;
}

export async function requireFundraiseAccess(fundraiseId: string): Promise<AuthContext> {
  const ctx = await requireAuth();

  if (ctx.role === "ADMIN") return ctx;

  const fundraise = await prisma.fundraise.findUnique({
    where: { id: fundraiseId },
    include: { company: true },
  });

  if (!fundraise) throw new NotFoundError("Fundraise not found");

  if (ctx.role === "ADVISOR") {
    const access = await prisma.advisorCompanyAccess.findUnique({
      where: {
        advisorId_companyId: {
          advisorId: ctx.userId,
          companyId: fundraise.companyId,
        },
      },
    });
    if (!access) throw new ForbiddenError();
    return ctx;
  }

  if (fundraise.company.founderId !== ctx.founderId) {
    throw new ForbiddenError();
  }

  return ctx;
}

export async function requireCompanyAccess(companyId: string): Promise<AuthContext> {
  const ctx = await requireAuth();

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new NotFoundError("Company not found");

  if (ctx.role === "ADMIN") return ctx;

  if (ctx.role === "ADVISOR") {
    const access = await prisma.advisorCompanyAccess.findUnique({
      where: { advisorId_companyId: { advisorId: ctx.userId, companyId } },
    });
    if (!access) throw new ForbiddenError();
    return ctx;
  }

  if (company.founderId !== ctx.founderId) throw new ForbiddenError();
  return ctx;
}
