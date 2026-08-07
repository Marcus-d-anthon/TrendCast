-- Indices no agrupados compuestos: cubren "ORDER BY nombre/razon_social"
-- filtrado por empresa (todas las listas paginadas del sistema filtran
-- primero por empresa_id) sin ordenar en memoria.
-- CreateIndex
CREATE INDEX "clientes_empresa_id_nombre_idx" ON "clientes"("empresa_id", "nombre");

-- CreateIndex
CREATE INDEX "productos_empresa_id_nombre_idx" ON "productos"("empresa_id", "nombre");

-- CreateIndex
CREATE INDEX "proveedores_empresa_id_razon_social_idx" ON "proveedores"("empresa_id", "razon_social");

-- Indices GIN con pg_trgm: un B-tree normal (los @@index de arriba, y los ya
-- existentes en el schema) NO acelera "ILIKE '%termino%'" -- el comodin al
-- inicio impide usar el orden del arbol. pg_trgm indexa trigramas (grupos de
-- 3 caracteres) de cada valor, asi que "contains" case-insensitive si puede
-- resolverse con un index scan en vez de recorrer toda la tabla. Es el mismo
-- filtro que usa ProductosRepository.listarPaginado (busqueda por
-- nombre/SKU) y que se reutilizara al extender paginacion+busqueda a
-- clientes/proveedores.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "productos_nombre_trgm_idx" ON "productos" USING GIN ("nombre" gin_trgm_ops);
CREATE INDEX "productos_sku_trgm_idx" ON "productos" USING GIN ("sku" gin_trgm_ops);
CREATE INDEX "clientes_nombre_trgm_idx" ON "clientes" USING GIN ("nombre" gin_trgm_ops);
CREATE INDEX "proveedores_razon_social_trgm_idx" ON "proveedores" USING GIN ("razon_social" gin_trgm_ops);
