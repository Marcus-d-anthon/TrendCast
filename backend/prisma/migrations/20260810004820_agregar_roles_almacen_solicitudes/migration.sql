-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'EFECTUADA');

-- CreateEnum
CREATE TYPE "TipoSolicitud" AS ENUM ('REABASTECIMIENTO', 'VENTA_ESPECIAL');

-- AlterEnum
ALTER TYPE "RolUsuario" ADD VALUE 'SUPERUSUARIO';

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "almacen_id" TEXT;

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" TEXT NOT NULL,
    "tipo" "TipoSolicitud" NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "cantidad" INTEGER NOT NULL,
    "comentario" TEXT,
    "producto_id" TEXT NOT NULL,
    "almacen_id" TEXT NOT NULL,
    "solicitante_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitudes_estado_idx" ON "solicitudes"("estado");

-- CreateIndex
CREATE INDEX "solicitudes_solicitante_id_idx" ON "solicitudes"("solicitante_id");

-- CreateIndex
CREATE INDEX "solicitudes_almacen_id_idx" ON "solicitudes"("almacen_id");

-- CreateIndex
CREATE INDEX "usuarios_almacen_id_idx" ON "usuarios"("almacen_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "almacenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "almacenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
