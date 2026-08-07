import { Prisma } from "../generated/prisma/client";
import { ConflictError } from "../lib/errors";

// Garantia tecnica de que movimientos_inventario es append-only: bloquea
// update/delete aunque alguien los invoque por error, ademas de la disciplina
// del Service (que nunca los llama). Defensa en profundidad.
export const immutableLedgerExtension = Prisma.defineExtension((client) =>
  client.$extends({
    name: "immutable-ledger-guard",
    query: {
      movimientoInventario: {
        async update() {
          throw new ConflictError("Los movimientos de inventario son inmutables. Registre un AJUSTE.");
        },
        async updateMany() {
          throw new ConflictError("Los movimientos de inventario son inmutables. Registre un AJUSTE.");
        },
        async delete() {
          throw new ConflictError("Los movimientos de inventario no pueden eliminarse.");
        },
        async deleteMany() {
          throw new ConflictError("Los movimientos de inventario no pueden eliminarse.");
        },
      },
    },
  })
);
