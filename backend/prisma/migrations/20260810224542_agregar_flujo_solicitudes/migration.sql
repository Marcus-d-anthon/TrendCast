-- AlterTable
ALTER TABLE "movimientos_inventario" ADD COLUMN     "solicitud_id" TEXT;

-- AlterTable
ALTER TABLE "solicitudes" ADD COLUMN     "aprobador_id" TEXT,
ADD COLUMN     "efectuador_id" TEXT,
ADD COLUMN     "fecha_aprobacion" TIMESTAMP(3),
ADD COLUMN     "fecha_efectuacion" TIMESTAMP(3),
ADD COLUMN     "motivo_rechazo" TEXT;

-- CreateIndex
CREATE INDEX "movimientos_inventario_solicitud_id_idx" ON "movimientos_inventario"("solicitud_id");

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_aprobador_id_fkey" FOREIGN KEY ("aprobador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_efectuador_id_fkey" FOREIGN KEY ("efectuador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
