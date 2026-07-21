# Capítulo 5 — Propuesta Técnica

## 5.1 Requerimientos

La propuesta técnica del sistema se formuló a partir de las necesidades operativas de TIANSHI ECUADOR S.A., una empresa distribuidora de suplementos nutricionales, cuidado personal y productos de bienestar, cuyo crecimiento en volumen de inventario y complejidad operativa exigió un modelo de control más eficiente, trazable y predictivo. En este contexto, el sistema web propuesto busca sostener las operaciones de compra, venta, almacenamiento y control de stock mediante una plataforma centralizada, segura y adaptable a los procesos diarios de la organización.

### 5.1.1 Necesidades del cliente

Las necesidades identificadas del caso de estudio se concentran en tres ejes principales: la reducción de quiebres de stock, la mejora de la trazabilidad y la optimización de la toma de decisiones. En primer lugar, la empresa requiere evitar faltantes que afecten la continuidad operativa y los compromisos con clientes. En segundo lugar, necesita contar con un registro confiable de cada movimiento de inventario para responder preguntas sobre origen, responsable y fecha de cada operación. Finalmente, requiere anticiparse a la demanda en lugar de reaccionar únicamente frente a los faltantes.

### 5.1.2 Requerimientos de usuario por rol

El sistema contempla una estructura de roles que permite segmentar el acceso de acuerdo con las responsabilidades de cada usuario. El rol de administrador tiene responsabilidad sobre la configuración del sistema y la gestión de usuarios. El supervisor participa en la administración del catálogo y en la supervisión de las operaciones críticas. El rol de bodega concentra la ejecución diaria de los movimientos de inventario. El rol de ventas gestiona las operaciones comerciales vinculadas a la salida de mercancía. Finalmente, el rol de gerencia accede a información consolidada para la toma de decisiones estratégicas.

### 5.1.3 Requerimientos funcionales

El sistema debe autenticar usuarios mediante correo electrónico y contraseña, emitir tokens JWT y restringir el acceso a las secciones según el rol asignado. Debe permitir la administración de categorías, productos, proveedores, clientes, almacenes, compras, ventas, movimientos de inventario, alertas y reportes. Además, debe ofrecer un módulo de predicción que calcule la demanda futura de los productos sobre la base de su historial de movimientos. La plataforma también debe conservar trazabilidad de cada operación mediante auditoría y registro inmutable del libro de inventario.

### 5.1.4 Requerimientos no funcionales

Desde el punto de vista no funcional, el sistema debe garantizar seguridad en el manejo de credenciales, integridad de los registros, disponibilidad operativa y capacidad de respuesta adecuada para un entorno de uso empresarial. La solución incorpora autenticación basada en JWT, cifrado de contraseñas mediante bcrypt, validación de datos en capas, control transaccional de las operaciones de stock y uso de restricciones de integridad en base de datos. Asimismo, se contempla una arquitectura modular y escalable que facilita futuras mejoras sin reescribir la solución completa.

### 5.1.5 Historias de usuario

El sistema se ha concebido para responder a historias de usuario claras y orientadas al valor de negocio. Como administrador, el usuario debe poder crear cuentas de acceso y controlar el uso del sistema. Como supervisor, debe poder registrar y revisar productos y operaciones de inventario. Como operador de bodega, debe poder registrar entradas, salidas y ajustes sin alterar el historial original. Como usuario de ventas, debe poder generar ventas que impacten el stock de forma controlada. Como gerente, debe poder consultar reportes y tendencias para tomar decisiones de reabastecimiento y control financiero.

## 5.2 Arquitectura propuesta del sistema

La arquitectura propuesta sigue un modelo cliente-servidor basado en una aplicación web moderna, separando claramente la interfaz de usuario, la lógica de negocio y la persistencia de datos. El frontend está desarrollado en React con TypeScript y Vite, lo que permite una experiencia interactiva y modular. El backend se implementa con Node.js y Express utilizando TypeScript como lenguaje principal, lo que fortalece la mantenibilidad del sistema y facilita la validación estática de los contratos de datos.

La solución está organizada en módulos funcionales que representan los procesos del negocio: autenticación, usuarios, productos, categorías, movimientos, compras, ventas, alertas, predicción y reportes. Cada módulo dispone de rutas, controladores, servicios, validaciones y acceso a la base de datos, lo que favorece la escalabilidad y la trazabilidad del desarrollo. La comunicación entre frontend y backend se realiza mediante una API REST que expone los recursos del negocio de forma estructurada y estandarizada.

El flujo de ejecución del sistema inicia con la autenticación del usuario, continúa con la validación de permisos y finaliza con la ejecución de la operación correspondiente sobre la base de datos. Esta estructura permite separar responsabilidades, reducir acoplamiento y facilitar futuras ampliaciones del sistema sin afectar al conjunto de la aplicación.

## 5.3 Diseño de la base de datos

El diseño de datos del sistema se sustenta en PostgreSQL y Prisma ORM, con una modelación orientada a la integridad transaccional y la trazabilidad. La base de datos está compuesta por entidades como empresas, usuarios, productos, categorías, marcas, unidades de medida, almacenes, clientes, proveedores, compras, ventas, movimientos de inventario, alertas, notificaciones y registros de auditoría.

Uno de los puntos más relevantes del diseño es la gestión del stock por almacén, en lugar de asumir un único saldo global por producto. Esta decisión permite reflejar con mayor fidelidad la realidad operativa de una empresa que maneja múltiples ubicaciones físicas. Cada movimiento de inventario queda asociado a un almacén específico y, a partir de ello, se calcula el saldo resultante aplicando reglas de negocio definidas para entradas, salidas y ajustes.

El modelo incorpora mecanismos de baja lógica para conservar los registros históricos sin eliminar información de forma irreversible. Asimismo, se implementa un libro de movimientos inmutable, en el cual las operaciones jamás se editan ni se borran, sino que se registran como nuevas entradas cuando es necesario corregir un saldo. Este diseño responde a escenarios reales de auditoría y control interno, donde la integridad del historial es un requisito crítico.

Además, la base de datos incorpora restricciones de integridad a nivel de motor, como unicidad en SKU, correo electrónico y otros identificadores, así como restricciones de valor para cantidades, precios y saldos. Estas validaciones complementan la lógica de negocio y reducen la posibilidad de estados inconsistentes en la información.

## 5.4 Diseño de la interfaz de usuario

La interfaz de usuario se desarrolló como una aplicación web responsive, pensada para uso en entornos de escritorio y dispositivos móviles. La arquitectura visual se organiza mediante un shell principal con barra lateral de navegación, cabecera de contexto y contenido dinámico por módulo. Esta composición facilita la orientación del usuario, reduce la carga cognitiva y permite visualizar rápidamente la información crítica del inventario.

El frontend está compuesto por pantallas especializadas para cada proceso del negocio. En la vista de productos, el usuario puede consultar el catálogo, filtrar información, revisar el estado de stock y acceder al detalle de cada artículo. En la vista de movimientos, se pueden registrar operaciones de entrada, salida y ajuste con validaciones inmediatas. En las pantallas de compras y ventas, el usuario trabaja con documentos comerciales que pueden permanecer en borrador hasta su confirmación, momento en el cual se materializa el efecto real sobre el stock.

La navegación se adapta al rol autenticado mediante reglas de visibilidad y restricciones de acceso. De esta manera, un usuario de bodega puede operar sobre inventario sin tener acceso a funciones administrativas, mientras que un administrador conserva control total sobre la configuración y el uso del sistema. Esta capa de interfaz, junto con la validación del backend, refuerza el principio de seguridad y separación de responsabilidades.

## 5.5 Implementación del módulo predictivo

El módulo predictivo constituye una de las funcionalidades diferenciadoras del sistema, ya que permite pasar de un control reactivo del inventario a una estrategia más anticipatoria. La lógica de predicción se apoya en el historial de salidas de cada producto, sobre el cual se calculan dos estimaciones: un promedio móvil simple y una regresión lineal. Estas dos técnicas ofrecen una base cuantitativa para proyectar la demanda futura y estimar el reabastecimiento necesario.

La implementación del módulo considera tres variables clave: el stock actual del producto, su stock mínimo y la demanda proyectada. Con estas entradas, el sistema genera una recomendación de reabastecimiento que intenta cubrir la demanda futura sin exceder de forma innecesaria el nivel de inventario. Este enfoque resulta especialmente útil para PYMES que necesitan optimizar capital invertido en mercancía, evitando tanto la escasez como el sobrestock.

Además, la integración del módulo predictivo con las pantallas de productos y alertas permite que la recomendación sea accionable. El usuario puede revisar la proyección del producto, identificar si requiere reorden y decidir si procede a generar un movimiento de entrada o ajustar su estrategia de compra. De esta forma, el módulo no solo informa, sino que contribuye directamente a la toma de decisiones operativas.

## 5.6 Seguridad, auditoría e integridad de datos

La propuesta técnica incorpora un conjunto de mecanismos orientados a preservar la seguridad y la confiabilidad del sistema. La autenticación se apoya en JWT y en el almacenamiento seguro de contraseñas mediante bcrypt. Cada solicitud protegida debe incluir un token válido, y el backend valida tanto la autenticidad del token como la vigencia y estado del usuario. Asimismo, se implementan reglas de autorización por rol y permisos, lo que impide que usuarios no autorizados accedan a operaciones sensibles.

En términos de seguridad operacional, se emplean encabezados HTTP seguros mediante Helmet, control de CORS y limitación de solicitudes para mitigar abusos. El sistema también incorpora registros de auditoría que capturan las principales mutaciones de negocio y permiten verificar quién realizó cada acción y en qué momento. Este mecanismo es especialmente relevante en ambientes donde el control interno y la trazabilidad son requerimientos de cumplimiento.

La integridad de los datos se refuerza mediante transacciones atómicas en las operaciones que modifican el stock y mediante restricciones de base de datos que impiden estados inválidos. En este esquema, una compra o una venta confirmada no se considera solo un documento comercial, sino también una operación que impacta el inventario y debe ejecutarse bajo reglas consistentes. De este modo, la solución combina validaciones de aplicación con restricciones de base de datos para reducir los riesgos de inconsistencia.

## 5.7 Pruebas, validación y despliegue

La propuesta técnica contempla un ciclo de validación basado en pruebas automatizadas de unidad e integración. El backend incorpora pruebas con Vitest y Supertest para verificar el comportamiento de los módulos principales, incluyendo autenticación, movimientos de inventario, alertas y módulos comerciales. Estas pruebas permiten comprobar que las reglas de negocio se cumplan de forma consistente y que los cambios introducidos no afecten comportamientos previamente establecidos.

En cuanto al despliegue, la solución está diseñada para ejecutarse en un entorno estándar basado en Node.js, PostgreSQL y variables de entorno configurables. El backend valida de forma explícita las variables críticas al arrancar, de modo que el sistema no se inicie con configuraciones ambiguas o incompletas. Esta estrategia mejora la confiabilidad del despliegue y reduce la probabilidad de fallas operativas en producción.

La arquitectura propuesta, por lo tanto, no solo responde a las necesidades funcionales del negocio de TIANSHI ECUADOR S.A., sino que también ofrece una base sólida para su evolución futura. La combinación de modularidad, seguridad, trazabilidad, análisis predictivo y control de inventario convierte al sistema en una solución apropiada para PYMES que requieren profesionalizar sus operaciones sin incurrir en complejidades excesivas.
