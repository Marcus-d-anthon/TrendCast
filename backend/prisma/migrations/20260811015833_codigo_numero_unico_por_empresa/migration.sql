-- DropIndex
DROP INDEX "clientes_codigo_key";

-- DropIndex
DROP INDEX "proveedores_codigo_key";

-- DropIndex
DROP INDEX "solicitudes_numero_key";

-- CreateIndex
CREATE UNIQUE INDEX "clientes_empresa_id_codigo_key" ON "clientes"("empresa_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_empresa_id_codigo_key" ON "proveedores"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "solicitudes_numero_idx" ON "solicitudes"("numero");
