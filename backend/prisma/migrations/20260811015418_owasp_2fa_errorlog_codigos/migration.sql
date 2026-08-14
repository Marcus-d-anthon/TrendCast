-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "codigo" TEXT;

-- AlterTable
ALTER TABLE "proveedores" ADD COLUMN     "codigo" TEXT;

-- AlterTable
ALTER TABLE "solicitudes" ADD COLUMN     "numero" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "totp_habilitado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totp_secret" TEXT;

-- CreateTable
CREATE TABLE "codigos_recuperacion_2fa" (
    "id" TEXT NOT NULL,
    "codigo_hash" TEXT NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "usado_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" TEXT NOT NULL,

    CONSTRAINT "codigos_recuperacion_2fa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_log" (
    "id" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "metodo" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "categoria" TEXT,
    "stack_trace" TEXT,
    "usuario_id" TEXT,
    "empresa_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "trace_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "codigos_recuperacion_2fa_codigo_hash_key" ON "codigos_recuperacion_2fa"("codigo_hash");

-- CreateIndex
CREATE INDEX "codigos_recuperacion_2fa_usuario_id_idx" ON "codigos_recuperacion_2fa"("usuario_id");

-- CreateIndex
CREATE INDEX "error_log_fecha_idx" ON "error_log"("fecha");

-- CreateIndex
CREATE INDEX "error_log_status_code_idx" ON "error_log"("status_code");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigo_key" ON "clientes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_codigo_key" ON "proveedores"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_numero_key" ON "solicitudes"("numero");

-- AddForeignKey
ALTER TABLE "codigos_recuperacion_2fa" ADD CONSTRAINT "codigos_recuperacion_2fa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
