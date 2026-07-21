-- Referencia de todos los CHECK constraints e integridad manual del sistema.
-- Este archivo NO se ejecuta automaticamente: sirve como documentacion y
-- como copia para pegar en migration.sql cada vez que una migracion futura
-- recree alguna de estas tablas (Prisma no soporta @@check nativamente,
-- ver https://github.com/prisma/prisma/issues/3388).
-- La version realmente aplicada vive en prisma/migrations/<timestamp>_init_erp/migration.sql

-- CHECK constraints
ALTER TABLE "productos" ADD CONSTRAINT "productos_stock_minimo_check" CHECK ("stock_minimo" >= 0);
ALTER TABLE "productos" ADD CONSTRAINT "productos_precio_compra_check" CHECK ("precio_compra" >= 0);
ALTER TABLE "productos" ADD CONSTRAINT "productos_precio_venta_check" CHECK ("precio_venta" >= 0);

ALTER TABLE "stock" ADD CONSTRAINT "stock_cantidad_check" CHECK ("cantidad" >= 0);

ALTER TABLE "lotes" ADD CONSTRAINT "lotes_cantidad_check" CHECK ("cantidad" >= 0);

ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_cantidad_check" CHECK ("cantidad" > 0);
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_saldo_resultante_check" CHECK ("saldo_resultante" >= 0);

ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_cantidad_check" CHECK ("cantidad" > 0);
ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_precio_unitario_check" CHECK ("precio_unitario" >= 0);
ALTER TABLE "detalle_compras" ADD CONSTRAINT "detalle_compras_subtotal_check" CHECK ("subtotal" >= 0);

ALTER TABLE "detalle_ventas" ADD CONSTRAINT "detalle_ventas_cantidad_check" CHECK ("cantidad" > 0);
ALTER TABLE "detalle_ventas" ADD CONSTRAINT "detalle_ventas_precio_unitario_check" CHECK ("precio_unitario" >= 0);
ALTER TABLE "detalle_ventas" ADD CONSTRAINT "detalle_ventas_subtotal_check" CHECK ("subtotal" >= 0);

ALTER TABLE "compras" ADD CONSTRAINT "compras_subtotal_check" CHECK ("subtotal" >= 0);
ALTER TABLE "compras" ADD CONSTRAINT "compras_impuesto_check" CHECK ("impuesto" >= 0);
ALTER TABLE "compras" ADD CONSTRAINT "compras_total_check" CHECK ("total" >= 0);

ALTER TABLE "ventas" ADD CONSTRAINT "ventas_subtotal_check" CHECK ("subtotal" >= 0);
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_impuesto_check" CHECK ("impuesto" >= 0);
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_total_check" CHECK ("total" >= 0);

-- Claves foraneas manuales para created_by / updated_by (Prisma no las
-- modela como relacion, ver decision B.1 en el plan de arquitectura) y para
-- audit_log.usuario_id
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "marcas" ADD CONSTRAINT "marcas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marcas" ADD CONSTRAINT "marcas_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "unidades_medida" ADD CONSTRAINT "unidades_medida_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "unidades_medida" ADD CONSTRAINT "unidades_medida_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "categorias" ADD CONSTRAINT "categorias_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "almacenes" ADD CONSTRAINT "almacenes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "almacenes" ADD CONSTRAINT "almacenes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "productos" ADD CONSTRAINT "productos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "productos" ADD CONSTRAINT "productos_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock" ADD CONSTRAINT "stock_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock" ADD CONSTRAINT "stock_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lotes" ADD CONSTRAINT "lotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "clientes" ADD CONSTRAINT "clientes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
