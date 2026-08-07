import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env";
import { auditExtension } from "../extensions/AuditExtension";
import { immutableLedgerExtension } from "../extensions/ImmutableLedgerExtension";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const basePrisma = new PrismaClient({ adapter });

export const prisma = basePrisma.$extends(auditExtension).$extends(immutableLedgerExtension);
