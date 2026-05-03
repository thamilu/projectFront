export async function getPrisma() {
  try {
    const mod = await import('@prisma/client');
    const PrismaClient = mod.PrismaClient;
    if (!((global as unknown as { __prisma?: unknown }).__prisma)) {
      (global as unknown as { __prisma?: unknown }).__prisma = new PrismaClient();
    }
    return ((global as unknown as { __prisma?: InstanceType<typeof PrismaClient> }).__prisma) as InstanceType<typeof PrismaClient>;
  } catch {
    // Prisma not installed or not configured; return undefined so callers can fallback
    return undefined;
  }
}
