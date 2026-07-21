# Manual de Usuario del Sistema SGI

## 1. Introducción

Este manual describe el uso del sistema SGI desde la perspectiva del usuario final. Su propósito es orientar a operadores, supervisores y administradores en el uso de las pantallas y flujos implementados en la interfaz web.

El contenido de este manual está basado en la implementación real del frontend del proyecto, revisada en las rutas y páginas disponibles en la aplicación.

## 2. Acceso al sistema

### 2.1 Iniciar sesión

1. Abra la URL del sistema en el navegador.
2. En la pantalla de inicio de sesión ingrese su correo electrónico y contraseña.
3. Pulse el botón “Ingresar”.
4. Si las credenciales son correctas, el sistema lo redirigirá al panel principal.

### 2.2 Cierre de sesión

El usuario puede cerrar la sesión desde el botón de salida ubicado en la barra superior. Al cerrar sesión, se borra la sesión activa del navegador y se redirige al login.

### 2.3 Roles disponibles

El sistema diferencia el acceso según el rol del usuario autenticado:

- Administrador: acceso completo a administración, catálogo, operaciones, alertas y reportes.
- Supervisor: puede administrar catálogo y operaciones, pero no crear usuarios.
- Bodega: puede consultar el inventario y registrar movimientos.
- Ventas: puede registrar ventas y consultar operaciones vinculadas a ventas.
- Gerencia: acceso a reportes y operaciones de gestión, según la lógica de navegación implementada.

## 3. Navegación general

La interfaz presenta una estructura de navegación basada en un menú lateral y una barra superior.

### 3.1 Menú principal

El menú lateral permite acceder a los módulos:

- Dashboard
- Productos
- Categorías
- Movimientos
- Compras
- Ventas
- Alertas
- Predicción
- Reportes
- Usuarios

La visibilidad de algunas opciones depende del rol autenticado. Si un usuario intenta acceder por URL directa a una sección no autorizada, el sistema muestra una página de acceso denegado.

### 3.2 Barra superior

La barra superior muestra:

- el nombre de la sección activa,
- el nombre del usuario autenticado,
- su rol,
- un botón para cambiar tema,
- un botón para cerrar sesión.

## 4. Módulo Dashboard

### 4.1 Objetivo

El Dashboard ofrece una vista rápida del estado del inventario y de las operaciones recientes.

### 4.2 Información que muestra

- Productos activos
- Unidades en bodega
- Valor de inventario
- Alertas de stock
- Alertas de stock mínimo recientes
- Movimientos recientes

### 4.3 Uso recomendado

Se recomienda usar este módulo como pantalla inicial para identificar rápidamente si existen productos en riesgo de quedarse sin stock o si hay movimientos recientes que merecen revisión.

## 5. Módulo Productos

### 5.1 Objetivo

Permite administrar el catálogo de productos del sistema.

### 5.2 Funcionalidades disponibles

Desde la pantalla de productos el usuario puede:

- buscar productos por nombre o SKU,
- filtrar por categoría,
- ver el estado de stock,
- abrir el detalle de un producto,
- crear nuevos productos,
- editar productos existentes,
- dar de baja lógica un producto.

### 5.3 Crear un producto

1. En la pantalla de productos, pulse “Nuevo producto”.
2. Complete los datos obligatorios:
   - SKU
   - Nombre
   - Categoría
   - Marca
   - Unidad de medida
   - Precio de compra
   - Precio de venta
   - Stock mínimo
3. Puede marcar si el producto requiere control por lote.
4. Pulse “Guardar”.

### 5.4 Validaciones importantes

- El SKU debe ser único.
- El SKU no puede editarse una vez creado.
- Los precios y el stock mínimo deben ingresarse como valores numéricos válidos.
- El sistema inicializa el stock del producto en cero al crear el registro, y el ajuste real del stock ocurre mediante movimientos de inventario.

### 5.5 Detalle de producto

La vista de detalle muestra:

- stock actual,
- stock mínimo,
- precio de compra,
- precio de venta,
- unidad de medida,
- marca,
- stock por almacén,
- historial de movimientos recientes,
- acceso a la proyección de demanda.

## 6. Módulo Categorías

### 6.1 Objetivo

Gestionar las categorías con las que se clasifican los productos.

### 6.2 Funcionalidades

El usuario puede:

- crear una nueva categoría,
- editar una categoría existente,
- dar de baja una categoría.

### 6.3 Consideraciones

Cuando una categoría se da de baja, deja de estar disponible para nuevos productos, aunque el registro se conserva con baja lógica.

## 7. Módulo Movimientos

### 7.1 Objetivo

Registrar y consultar los movimientos de inventario del sistema.

### 7.2 Tipos de movimiento

El sistema admite:

- Entrada
- Salida
- Ajuste

### 7.3 Registrar un movimiento

1. Ingrese a la pantalla de Movimientos.
2. Pulse “Registrar movimiento”.
3. Seleccione producto, almacén y tipo de movimiento.
4. Ingrese la cantidad.
5. Opcionalmente agregue referencia y motivo.
6. Confirme la operación.

### 7.4 Reglas importantes

- Los movimientos quedan registrados de forma permanente en el libro de inventario.
- Los movimientos de tipo salida no pueden dejar el stock en un valor negativo.
- Los ajustes permiten corregir un saldo anterior, referenciando el movimiento original que se corrige.
- El sistema muestra el stock actual del almacén seleccionado antes de registrar el movimiento.

## 8. Módulo Compras

### 8.1 Objetivo

Registrar órdenes de compra a proveedores y controlar su confirmación y efecto sobre el inventario.

### 8.2 Flujo de uso

1. En la pantalla de Compras, pulse “Nueva compra”.
2. Seleccione proveedor y almacén.
3. Agregue líneas con producto, cantidad y precio unitario.
4. Guarde la compra como borrador.
5. Desde el detalle de la compra, confirme o anule la operación.

### 8.3 Reglas de negocio

- Una compra creada en borrador no afecta el stock real.
- Al confirmar la compra, el sistema genera un movimiento de entrada real y aumenta el stock del almacén correspondiente.
- Una compra anulada no genera movimiento de inventario.

## 9. Módulo Ventas

### 9.1 Objetivo

Registrar ventas a clientes y controlar su confirmación y efecto sobre el inventario.

### 9.2 Flujo de uso

1. En la pantalla de Ventas, pulse “Nueva venta”.
2. Seleccione cliente y almacén.
3. Agregue líneas con producto, cantidad y precio unitario.
4. Guarde la venta como borrador.
5. Desde el detalle de la venta, confirme o anule la operación.

### 9.3 Reglas de negocio

- Una venta creada en borrador no afecta el stock real.
- Al confirmar la venta, el sistema genera un movimiento de salida real y reduce el stock del almacén correspondiente.
- Si el stock disponible no alcanza, la confirmación se rechaza.
- Una venta anulada no genera movimiento de inventario.

## 10. Módulo Alertas

### 10.1 Objetivo

Identificar productos que requieren reabastecimiento porque están en o por debajo de su stock mínimo.

### 10.2 Uso

La pantalla muestra una tabla con:

- SKU del producto,
- nombre,
- categoría,
- stock actual,
- stock mínimo,
- unidades faltantes.

Desde esta pantalla también es posible registrar una entrada directamente para el producto alertado.

## 11. Módulo Predicción

### 11.1 Objetivo

Proyectar la demanda futura de un producto para apoyar decisiones de reabastecimiento.

### 11.2 Uso

1. Seleccione un producto.
2. Elija la granularidad de la predicción (diaria, semanal o mensual).
3. Defina la cantidad de períodos a analizar.
4. El sistema mostrará:
   - la proyección de demanda,
   - el promedio móvil,
   - la regresión lineal,
   - la recomendación de reabastecimiento.

### 11.3 Interpretación

La recomendación considera:

- demanda proyectada,
- stock mínimo,
- stock actual.

## 12. Módulo Reportes

### 12.1 Objetivo

Presentar información resumida y analítica del inventario y sus movimientos.

### 12.2 Pestañas disponibles

- Existencias
- Rotación
- Movimientos por período

### 12.3 Uso

El usuario debe seleccionar la pestaña adecuada según el tipo de información que necesite revisar.

## 13. Módulo Usuarios

### 13.1 Objetivo

Gestionar cuentas de usuario del sistema.

### 13.2 Acceso

Esta sección está restringida exclusivamente a usuarios con rol de administrador.

### 13.3 Crear un usuario

1. Ingrese a la pantalla de Usuarios.
2. Pulse “Nuevo usuario”.
3. Ingrese nombre, correo, contraseña y rol.
4. Confirme la operación.

### 13.4 Validaciones

- La contraseña debe tener al menos 8 caracteres.
- El rol define los permisos y la navegación visible para la cuenta.

## 14. Mensajes y estados frecuentes

El sistema usa mensajes y etiquetas visuales para informar el estado de las operaciones:

- Activo / Inactivo
- Borrador / Confirmada / Anulada
- Sin stock / Bajo mínimo / Saludable
- Todo en orden / Sin alertas
- Sin resultados / Sin productos / Sin movimientos

## 15. Recomendaciones de uso

- Revisar el Dashboard diariamente para detectar alertas tempranas.
- Usar los movimientos como registro histórico de inventario y auditoría.
- Utilizar la predicción para anticipar reabastecimientos, no solo reaccionar al faltante.
- Confirmar compras y ventas solo cuando la información esté completa y el stock sea suficiente para la operación.

## 16. Mapa de navegación resumido

- Inicio: Dashboard
- Catálogo: Productos y Categorías
- Operaciones: Movimientos, Compras y Ventas
- Control: Alertas y Predicción
- Gestión: Reportes y Usuarios

## 17. Observaciones finales

Este sistema está orientado a la trazabilidad, el control del stock y la toma de decisiones operativas. La interfaz ha sido diseñada para que cada rol vea únicamente las secciones que necesita para su responsabilidad, manteniendo el control centralizado de las operaciones críticas.
