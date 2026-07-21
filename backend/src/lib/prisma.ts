import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env";
import { auditExtension } from "../extensions/audit.extension";
import { immutableLedgerExtension } from "../extensions/immutable-ledger.extension";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const basePrisma = new PrismaClient({ adapter });

export const prisma = basePrisma.$extends(auditExtension).$extends(immutableLedgerExtension);
