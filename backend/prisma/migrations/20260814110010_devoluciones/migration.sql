-- CreateEnum
CREATE TYPE "TipoDevolucion" AS ENUM ('CLIENTE', 'PROVEEDOR');

-- AlterEnum
ALTER TYPE "TipoMovimiento" ADD VALUE 'DEVOLUCION_CLIENTE';
ALTER TYPE "TipoMovimiento" ADD VALUE 'DEVOLUCION_PROVEEDOR';

-- AlterTable
ALTER TABLE "movimientos_inventario" ADD COLUMN     "devolucion_id" TEXT;

-- CreateTable
CREATE TABLE "devoluciones" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" "TipoDevolucion" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoDocumentoComercial" NOT NULL DEFAULT 'BORRADOR',
    "motivo" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "venta_id" TEXT,
    "compra_id" TEXT,
    "almacen_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_devoluciones" (
    "id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "devolucion_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,

    CONSTRAINT "detalle_devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devoluciones_numero_key" ON "devoluciones"("numero");

-- CreateIndex
CREATE INDEX "devoluciones_empresa_id_idx" ON "devoluciones"("empresa_id");

-- CreateIndex
CREATE INDEX "devoluciones_venta_id_idx" ON "devoluciones"("venta_id");

-- CreateIndex
CREATE INDEX "devoluciones_compra_id_idx" ON "devoluciones"("compra_id");

-- CreateIndex
CREATE INDEX "devoluciones_estado_idx" ON "devoluciones"("estado");

-- CreateIndex
CREATE INDEX "detalle_devoluciones_devolucion_id_idx" ON "detalle_devoluciones"("devolucion_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_devolucion_id_idx" ON "movimientos_inventario"("devolucion_id");

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_almacen_id_fkey" FOREIGN KEY ("almacen_id") REFERENCES "almacenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_devoluciones" ADD CONSTRAINT "detalle_devoluciones_devolucion_id_fkey" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_devoluciones" ADD CONSTRAINT "detalle_devoluciones_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_devolucion_id_fkey" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
