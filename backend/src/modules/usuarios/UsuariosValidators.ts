import { z } from "zod";

// SUPERUSUARIO queda deliberadamente fuera de los roles asignables desde la
// pantalla de usuarios: es un rol sensible (una sola persona, ve todas las
// empresas) que se asigna a mano, no por esta API.
export const ROLES_ASIGNABLES = ["ADMIN", "SUPERVISOR", "BODEGA", "VENTAS", "GERENCIA"] as const;

export const crearUsuarioSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
    nombre: z.string().min(1, "El nombre es obligatorio"),
    rol: z.enum(ROLES_ASIGNABLES).default("BODEGA"),
    almacenId: z.uuid().optional(),
  })
  .refine((data) => data.rol !== "BODEGA" || Boolean(data.almacenId), {
    message: "Un usuario con rol Bodega debe tener un almacén asignado",
    path: ["almacenId"],
  })
  .refine((data) => data.rol === "BODEGA" || !data.almacenId, {
    message: "El almacén solo aplica a usuarios con rol Bodega",
    path: ["almacenId"],
  });

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;

export const idParamSchema = z.object({
  id: z.uuid(),
});

// Update parcial: cada campo es opcional (PATCH-like), la consistencia
// rol/almacenId se resuelve en UsuariosService.actualizar mezclando con el
// registro actual, no aqui -- un refine cruzado sobre un objeto parcial no
// puede saber si el campo faltante significa "no cambia" o "se borra".
export const actualizarUsuarioSchema = z
  .object({
    nombre: z.string().min(1, "El nombre es obligatorio").optional(),
    rol: z.enum(ROLES_ASIGNABLES).optional(),
    almacenId: z.uuid().nullable().optional(),
    activo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Debe incluir al menos un campo para actualizar" });

export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;
