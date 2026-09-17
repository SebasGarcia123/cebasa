-- =====================================================================
-- Script SQL acumulado — Sistema de Gestión (Tesis)
-- Motor: MySQL / MariaDB
-- Orden de creación respetado por dependencias de FK.
-- Módulos incluidos:
--   1. Usuarios / Roles / Permisos
--   2. Comercial: Clientes / Pedidos / Productos / Reclamos
--   3. Producción: Insumos / Receta / Depósitos / Movimientos / Prod. física
--   4. Logística: Transporte / Lotes (fletero) / Autoelevador
--   5. Compras: Requerimientos / Cotizaciones / Compras
--   6. Pedido de insumos interno / Plan de producción
--
-- NOTA (decisiones confirmadas con el usuario):
--   - pedidos: PK renombrada de nro_pedido a id_pedido (según DER más reciente).
--   - item_pedido: se eliminó el campo suelto "nro_pedido" (resabio del modelo viejo).
--   - reclamos: tabla nueva, funcionalidad marginal / fuera del foco principal
--     de la tesis. Se mantiene modelada pero sin prioridad de implementación.
--   - lotes/transporte/chofer/camion: es el modelo físico de Lote interplanta
--     (CU-032/033/034). El estado (Pendiente de despacho / En tránsito /
--     Aprobado / Para revisar) vive en lotes.id_estado.
--   - fletero: tabla propia y separada, ABM simple Activo/Eliminado (CU-035),
--     no relacionada con el módulo de lote interplanta.
--   - Compras: el flujo Requerimiento -> Orden de Compra directa (viejo) queda
--     reemplazado por Requerimiento -> Cotización -> Compra. cotizacion lleva
--     archivo adjunto (la cotización enviada por el proveedor). Hay que
--     actualizar 01-decisiones-de-diseño.md y los diagramas de estado
--     correspondientes.
-- =====================================================================


-- =====================================================================
-- MÓDULO 1: Usuarios / Roles / Permisos
-- =====================================================================

CREATE TABLE sectores (
    id_sector     INT AUTO_INCREMENT PRIMARY KEY,
    nombreSector  VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE estados (
    id_estado     INT AUTO_INCREMENT PRIMARY KEY,
    nombreEstado  VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE roles (
    id_rol      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol  VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE permisos (
    id_permiso      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_permiso  VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE usuarios (
    id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario  VARCHAR(100) NOT NULL,
    id_sector       INT NOT NULL,
    id_estado       INT NOT NULL,
    CONSTRAINT fk_usuarios_sector
        FOREIGN KEY (id_sector) REFERENCES sectores(id_sector),
    CONSTRAINT fk_usuarios_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE usuario_roles (
    id_usuario  INT NOT NULL,
    id_rol      INT NOT NULL,
    PRIMARY KEY (id_usuario, id_rol),
    CONSTRAINT fk_usuario_roles_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,
    CONSTRAINT fk_usuario_roles_rol
        FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE rol_permisos (
    id_rol      INT NOT NULL,
    id_permiso  INT NOT NULL,
    PRIMARY KEY (id_rol, id_permiso),
    CONSTRAINT fk_rol_permisos_rol
        FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
        ON DELETE CASCADE,
    CONSTRAINT fk_rol_permisos_permiso
        FOREIGN KEY (id_permiso) REFERENCES permisos(id_permiso)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- =====================================================================
-- MÓDULO 2: Comercial — Clientes / Pedidos / Productos / Reclamos
-- =====================================================================

CREATE TABLE tipo_impacto (
    id_tipo_impacto  INT AUTO_INCREMENT PRIMARY KEY,
    descripcion      VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE tipo_documento (
    id_tipo_documento  INT AUTO_INCREMENT PRIMARY KEY,
    descripcion        VARCHAR(100) NOT NULL,
    id_tipo_impacto    INT NOT NULL,
    CONSTRAINT fk_tipo_documento_tipo_impacto
        FOREIGN KEY (id_tipo_impacto) REFERENCES tipo_impacto(id_tipo_impacto)
) ENGINE=InnoDB;

CREATE TABLE direcciones (
    id_direccion  INT AUTO_INCREMENT PRIMARY KEY,
    calle         VARCHAR(100) NOT NULL,
    numero        VARCHAR(20),
    entrecalle1   VARCHAR(100),
    entrecalle2   VARCHAR(100),
    localidad     VARCHAR(100) NOT NULL,
    provincia     VARCHAR(100) NOT NULL,
    id_estado     INT NOT NULL,
    CONSTRAINT fk_direcciones_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE clientes (
    id_cliente    INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cli    VARCHAR(150) NOT NULL,
    id_direccion  INT NOT NULL,
    telefono_cli  VARCHAR(30),
    email_cli     VARCHAR(150),
    id_estado     INT NOT NULL,
    CONSTRAINT fk_clientes_direccion
        FOREIGN KEY (id_direccion) REFERENCES direcciones(id_direccion),
    CONSTRAINT fk_clientes_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

-- PK renombrada de nro_pedido a id_pedido (según DER más reciente)
CREATE TABLE pedidos (
    id_pedido        INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente       INT NOT NULL,
    fecha_carga      DATE NOT NULL,
    fecha_prometido  DATE,
    id_estado        INT NOT NULL,
    id_usuario       INT NOT NULL,
    CONSTRAINT fk_pedidos_cliente
        FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    CONSTRAINT fk_pedidos_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado),
    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE productos (
    id_producto           INT AUTO_INCREMENT PRIMARY KEY,
    codigo_producto        VARCHAR(50) NOT NULL,
    descripcion_producto   VARCHAR(200) NOT NULL,
    bolsones_por_pallet    INT,
    peso_por_bolson        DECIMAL(10,2),
    precio_venta           DECIMAL(10,2) NOT NULL,
    stock_actual           INT NOT NULL DEFAULT 0,
    stock_minimo           INT NOT NULL DEFAULT 0,
    id_estado              INT NOT NULL,
    CONSTRAINT fk_productos_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

-- Se elimina el campo "nro_pedido" suelto que aparecía en el DER
-- (resabio del modelo viejo); queda solo id_pedido como FK.
CREATE TABLE item_pedido (
    id_item_pedido      INT AUTO_INCREMENT PRIMARY KEY,
    id_producto         INT NOT NULL,
    cantidad_bolsones   INT NOT NULL,
    id_pedido           INT NOT NULL,
    CONSTRAINT fk_item_pedido_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido)
        ON DELETE CASCADE,
    CONSTRAINT fk_item_pedido_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
) ENGINE=InnoDB;

CREATE TABLE cuenta_corriente (
    id_cuenta_corriente  INT AUTO_INCREMENT PRIMARY KEY,
    limite_credito       DECIMAL(10,2) NOT NULL DEFAULT 0,
    id_cliente           INT NOT NULL UNIQUE,  -- UNIQUE para forzar 1:1 con cliente
    CONSTRAINT fk_cuenta_corriente_cliente
        FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
) ENGINE=InnoDB;

CREATE TABLE movimiento_cuenta_corriente (
    id_movimiento_cta_cte  INT AUTO_INCREMENT PRIMARY KEY,
    fecha                  DATE NOT NULL,
    monto                  DECIMAL(10,2) NOT NULL,
    id_tipo_documento      INT NOT NULL,
    saldo_resultante       DECIMAL(10,2) NOT NULL,
    id_cuenta_corriente    INT NOT NULL,
    CONSTRAINT fk_movimiento_cta_cte_cuenta
        FOREIGN KEY (id_cuenta_corriente) REFERENCES cuenta_corriente(id_cuenta_corriente),
    CONSTRAINT fk_movimiento_cta_cte_tipo_doc
        FOREIGN KEY (id_tipo_documento) REFERENCES tipo_documento(id_tipo_documento)
) ENGINE=InnoDB;

-- Tabla nueva (Image 2). Sin CU documentado todavía — pendiente.
CREATE TABLE reclamos (
    id_reclamo   INT AUTO_INCREMENT PRIMARY KEY,
    fecha        DATE NOT NULL,
    descripcion  VARCHAR(500),
    id_cliente   INT NOT NULL,
    id_estado    INT NOT NULL,
    id_usuario   INT NOT NULL,
    CONSTRAINT fk_reclamos_cliente
        FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    CONSTRAINT fk_reclamos_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado),
    CONSTRAINT fk_reclamos_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;


-- =====================================================================
-- MÓDULO 3: Producción — Insumos / Receta / Depósitos / Movimientos /
--           Producción física
-- =====================================================================

CREATE TABLE unidad_medida (
    id_unidad_medida     INT AUTO_INCREMENT PRIMARY KEY,
    nombre_unidad_medida VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE deposito (
    id_deposito     INT AUTO_INCREMENT PRIMARY KEY,
    nombre_deposito VARCHAR(100) NOT NULL,
    id_estado       INT NOT NULL,
    CONSTRAINT fk_deposito_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE naturaleza (
    id_naturaleza     INT AUTO_INCREMENT PRIMARY KEY,
    nombre_naturaleza VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE lineas (
    id_lineas          INT AUTO_INCREMENT PRIMARY KEY,
    descripcion_lineas VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE turnos (
    id_turno          INT AUTO_INCREMENT PRIMARY KEY,
    descripcion_turnos VARCHAR(100) NOT NULL,
    id_estado         INT NOT NULL,
    CONSTRAINT fk_turnos_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE lote_prod (
    id_lote         INT AUTO_INCREMENT PRIMARY KEY,
    id_turno        INT NOT NULL,
    fecha_lote_prod DATE NOT NULL,
    id_estado       INT NOT NULL,
    CONSTRAINT fk_lote_prod_turno
        FOREIGN KEY (id_turno) REFERENCES turnos(id_turno),
    CONSTRAINT fk_lote_prod_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE item_prod (
    id_item      INT AUTO_INCREMENT PRIMARY KEY,
    id_producto  INT NOT NULL,
    cantidad     INT NOT NULL,
    id_lote      INT NOT NULL,
    id_lineas    INT NOT NULL,
    CONSTRAINT fk_item_prod_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    CONSTRAINT fk_item_prod_lote
        FOREIGN KEY (id_lote) REFERENCES lote_prod(id_lote),
    CONSTRAINT fk_item_prod_lineas
        FOREIGN KEY (id_lineas) REFERENCES lineas(id_lineas)
) ENGINE=InnoDB;

CREATE TABLE insumo (
    id_insumo        INT AUTO_INCREMENT PRIMARY KEY,
    codigo_insumo    VARCHAR(50) NOT NULL,
    nombre_insumo    VARCHAR(100) NOT NULL,
    id_unidad_medida INT NOT NULL,
    stock_minimo     INT NOT NULL DEFAULT 0,
    stock_actual     INT NOT NULL DEFAULT 0,  -- total empresa (suma de stock_insumo_deposito)
    id_estado        INT NOT NULL,
    CONSTRAINT fk_insumo_unidad_medida
        FOREIGN KEY (id_unidad_medida) REFERENCES unidad_medida(id_unidad_medida),
    CONSTRAINT fk_insumo_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE stock_insumo_deposito (
    id_stock_insumo_deposito INT AUTO_INCREMENT PRIMARY KEY,
    id_insumo                INT NOT NULL,
    id_deposito               INT NOT NULL,
    cantidad                  INT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_insumo_deposito (id_insumo, id_deposito),
    CONSTRAINT fk_stock_insumo_dep_insumo
        FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo),
    CONSTRAINT fk_stock_insumo_dep_deposito
        FOREIGN KEY (id_deposito) REFERENCES deposito(id_deposito)
) ENGINE=InnoDB;

CREATE TABLE receta (
    id_receta   INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_estado   INT NOT NULL,
    CONSTRAINT fk_receta_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    CONSTRAINT fk_receta_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE receta_item (
    id_receta_item     INT AUTO_INCREMENT PRIMARY KEY,
    id_insumo          INT NOT NULL,
    id_receta          INT NOT NULL,
    cantidad_utilizada DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_receta_item_insumo
        FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo),
    CONSTRAINT fk_receta_item_receta
        FOREIGN KEY (id_receta) REFERENCES receta(id_receta)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tipo_movimiento (
    id_tipo_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    nombre_movimiento  VARCHAR(100) NOT NULL,
    id_naturaleza      INT NOT NULL,
    id_estado          INT NOT NULL,
    CONSTRAINT fk_tipo_mov_naturaleza
        FOREIGN KEY (id_naturaleza) REFERENCES naturaleza(id_naturaleza),
    CONSTRAINT fk_tipo_mov_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;


-- =====================================================================
-- MÓDULO 6: Pedido de insumos interno / Plan de producción
-- (creadas acá porque movimiento_insumo depende de item_pedido_insumo)
-- =====================================================================

CREATE TABLE pedido_insumos (
    id_pedido_insumos INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario        INT NOT NULL,
    fecha_carga       DATE NOT NULL,
    fecha_necesidad   DATE NOT NULL,
    id_estado         INT NOT NULL,
    motivo_rechazo    VARCHAR(255),
    CONSTRAINT fk_pedido_insumos_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_pedido_insumos_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE item_pedido_insumo (
    id_item_pedido_insumo INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido_insumos     INT NOT NULL,
    id_insumo             INT NOT NULL,
    cantidad_solicitada   DECIMAL(10,2) NOT NULL,
    cantidad_abastecida   DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_item_pedido_insumo_pedido
        FOREIGN KEY (id_pedido_insumos) REFERENCES pedido_insumos(id_pedido_insumos)
        ON DELETE CASCADE,
    CONSTRAINT fk_item_pedido_insumo_insumo
        FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo)
) ENGINE=InnoDB;

CREATE TABLE plan_produccion (
    id_plan_produccion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario         INT NOT NULL,
    fecha_inicio_semana DATE NOT NULL,
    id_estado          INT NOT NULL,
    CONSTRAINT fk_plan_produccion_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_plan_produccion_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE item_plan_produccion (
    id_item_plan_produccion INT AUTO_INCREMENT PRIMARY KEY,
    id_plan_produccion      INT NOT NULL,
    id_lineas               INT NOT NULL,
    id_producto              INT NOT NULL,
    id_turno                 INT NOT NULL,
    fecha                     DATE NOT NULL,
    cantidad                  INT NOT NULL,
    CONSTRAINT fk_item_plan_prod_plan
        FOREIGN KEY (id_plan_produccion) REFERENCES plan_produccion(id_plan_produccion)
        ON DELETE CASCADE,
    CONSTRAINT fk_item_plan_prod_lineas
        FOREIGN KEY (id_lineas) REFERENCES lineas(id_lineas),
    CONSTRAINT fk_item_plan_prod_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    CONSTRAINT fk_item_plan_prod_turno
        FOREIGN KEY (id_turno) REFERENCES turnos(id_turno)
) ENGINE=InnoDB;

-- Movimientos físicos de stock (insumo / producto), con id_estado
-- agregado sobre el modelo del DER (Opción A: Pendiente/Aprobado/Rechazado
-- vive en el propio movimiento — decisión tomada en conversación).
-- id_item_pedido_insumo es opcional: liga el movimiento a la solicitud
-- de Producción que lo originó (cuando aplica).
CREATE TABLE movimiento_insumo (
    id_movimiento_insumo  INT AUTO_INCREMENT PRIMARY KEY,
    id_insumo             INT NOT NULL,
    id_tipo_movimiento    INT NOT NULL,
    cantidad               DECIMAL(10,2) NOT NULL,
    fecha_movimiento       DATE NOT NULL,
    id_deposito_origen     INT NULL,   -- NULL = entrada desde afuera (compra, etc.)
    id_deposito_destino    INT NULL,   -- NULL = salida hacia afuera (desperdicio, etc.)
    observaciones          VARCHAR(255),
    id_item_pedido_insumo  INT NULL,
    motivo                  VARCHAR(255),
    id_estado               INT NOT NULL,
    CONSTRAINT fk_mov_insumo_insumo
        FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo),
    CONSTRAINT fk_mov_insumo_tipo
        FOREIGN KEY (id_tipo_movimiento) REFERENCES tipo_movimiento(id_tipo_movimiento),
    CONSTRAINT fk_mov_insumo_dep_origen
        FOREIGN KEY (id_deposito_origen) REFERENCES deposito(id_deposito),
    CONSTRAINT fk_mov_insumo_dep_destino
        FOREIGN KEY (id_deposito_destino) REFERENCES deposito(id_deposito),
    CONSTRAINT fk_mov_insumo_item_pedido_insumo
        FOREIGN KEY (id_item_pedido_insumo) REFERENCES item_pedido_insumo(id_item_pedido_insumo),
    CONSTRAINT fk_mov_insumo_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE movimiento_producto (
    id_movimiento_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_producto             INT NOT NULL,
    id_tipo_movimiento      INT NOT NULL,
    cantidad                 INT NOT NULL,
    fecha_movimiento         DATE NOT NULL,
    id_deposito_origen       INT NULL,  -- NULL = entrada desde Producción
    id_deposito_destino      INT NULL,  -- NULL = salida por despacho a cliente
    observaciones            VARCHAR(255),
    motivo                   VARCHAR(255),
    id_estado                INT NOT NULL,
    CONSTRAINT fk_mov_producto_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    CONSTRAINT fk_mov_producto_tipo
        FOREIGN KEY (id_tipo_movimiento) REFERENCES tipo_movimiento(id_tipo_movimiento),
    CONSTRAINT fk_mov_producto_dep_origen
        FOREIGN KEY (id_deposito_origen) REFERENCES deposito(id_deposito),
    CONSTRAINT fk_mov_producto_dep_destino
        FOREIGN KEY (id_deposito_destino) REFERENCES deposito(id_deposito),
    CONSTRAINT fk_mov_producto_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;


-- =====================================================================
-- MÓDULO 4: Logística — Lote interplanta / Autoelevador / Fletero
-- =====================================================================

-- Fletero (CU-035): ABM simple, independiente del módulo de lote
-- interplanta. Mismo patrón Activo/Eliminado que Producto/Proveedor.
CREATE TABLE fletero (
    id_fletero      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_fletero  VARCHAR(150) NOT NULL,
    cuit            VARCHAR(20),
    telefono        VARCHAR(30),
    id_estado       INT NOT NULL,
    CONSTRAINT fk_fletero_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

-- A continuación: modelo físico de Lote interplanta (CU-032/033/034).
CREATE TABLE tipo_lote (
    id_tipo_lote      INT AUTO_INCREMENT PRIMARY KEY,
    descripcion_lote  VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE transporte (
    id_transporte          INT AUTO_INCREMENT PRIMARY KEY,
    nombre_transporte      VARCHAR(150) NOT NULL,
    cuit                   VARCHAR(20) NOT NULL,
    nombre_contacto        VARCHAR(150),
    id_direccion           INT NOT NULL,
    telefono               VARCHAR(30),
    cbu_cuenta_bancaria    VARCHAR(30),
    alias_cuenta_bancaria  VARCHAR(50),
    id_estado              INT NOT NULL,
    CONSTRAINT fk_transporte_direccion
        FOREIGN KEY (id_direccion) REFERENCES direcciones(id_direccion),
    CONSTRAINT fk_transporte_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE camion (
    id_camion       INT AUTO_INCREMENT PRIMARY KEY,
    id_transporte   INT NOT NULL,
    marca           VARCHAR(50),
    modelo          VARCHAR(50),
    dominio_chasis  VARCHAR(20) NOT NULL,
    dominio_semi    VARCHAR(20),
    CONSTRAINT fk_camion_transporte
        FOREIGN KEY (id_transporte) REFERENCES transporte(id_transporte)
) ENGINE=InnoDB;

CREATE TABLE chofer (
    id_chofer      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_chofer  VARCHAR(150) NOT NULL,
    dni            VARCHAR(20) NOT NULL,
    id_direccion   INT NOT NULL,
    id_transporte  INT NOT NULL,
    id_estado      INT NOT NULL,
    CONSTRAINT fk_chofer_direccion
        FOREIGN KEY (id_direccion) REFERENCES direcciones(id_direccion),
    CONSTRAINT fk_chofer_transporte
        FOREIGN KEY (id_transporte) REFERENCES transporte(id_transporte),
    CONSTRAINT fk_chofer_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE lotes (
    id_lote        INT AUTO_INCREMENT PRIMARY KEY,
    fecha_lote     DATE NOT NULL,
    id_chofer      INT NOT NULL,
    id_camion      INT NOT NULL,
    id_tipo_lote   INT NOT NULL,
    id_estado      INT NOT NULL,
    observaciones  VARCHAR(255),
    motivo         VARCHAR(255),
    CONSTRAINT fk_lotes_chofer
        FOREIGN KEY (id_chofer) REFERENCES chofer(id_chofer),
    CONSTRAINT fk_lotes_camion
        FOREIGN KEY (id_camion) REFERENCES camion(id_camion),
    CONSTRAINT fk_lotes_tipo_lote
        FOREIGN KEY (id_tipo_lote) REFERENCES tipo_lote(id_tipo_lote),
    CONSTRAINT fk_lotes_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE item_lote (
    id_item_lote      INT AUTO_INCREMENT PRIMARY KEY,
    descripcion_item  VARCHAR(200) NOT NULL,
    id_unidad_medida  INT NOT NULL,
    cantidad_item_lote DECIMAL(10,2) NOT NULL,
    id_lote            INT NOT NULL,
    CONSTRAINT fk_item_lote_unidad_medida
        FOREIGN KEY (id_unidad_medida) REFERENCES unidad_medida(id_unidad_medida),
    CONSTRAINT fk_item_lote_lote
        FOREIGN KEY (id_lote) REFERENCES lotes(id_lote)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE autoelevadores (
    id_autoelevadores INT AUTO_INCREMENT PRIMARY KEY,
    nombre            VARCHAR(100) NOT NULL,
    fecha_alta        DATE NOT NULL,
    id_estado         INT NOT NULL,
    CONSTRAINT fk_autoelevadores_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE control_autoelevador (
    id_control_autoelevador INT AUTO_INCREMENT PRIMARY KEY,
    fecha                    DATE NOT NULL,
    id_usuario               INT NOT NULL,
    id_autoelevador          INT NOT NULL,
    CONSTRAINT fk_control_autoelevador_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_control_autoelevador_autoelevador
        FOREIGN KEY (id_autoelevador) REFERENCES autoelevadores(id_autoelevadores)
) ENGINE=InnoDB;

CREATE TABLE item_control_autoelevador (
    id_item_control          INT AUTO_INCREMENT PRIMARY KEY,
    item_nombre              VARCHAR(150) NOT NULL,
    estado_ok                BOOLEAN NOT NULL,
    observacion              VARCHAR(255),
    id_control_autoelevador  INT NOT NULL,
    CONSTRAINT fk_item_control_autoelevador_control
        FOREIGN KEY (id_control_autoelevador) REFERENCES control_autoelevador(id_control_autoelevador)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE service_autoelevador (
    id_service_autoelevador INT AUTO_INCREMENT PRIMARY KEY,
    id_autoelevador          INT NOT NULL,
    horas                     DECIMAL(10,2) NOT NULL,
    detalle                   VARCHAR(255),
    CONSTRAINT fk_service_autoelevador_autoelevador
        FOREIGN KEY (id_autoelevador) REFERENCES autoelevadores(id_autoelevadores)
) ENGINE=InnoDB;


-- =====================================================================
-- MÓDULO 5: Compras — Requerimientos / Cotizaciones / Compras
-- NOTA: reemplaza el flujo "Requerimiento -> Orden de Compra directa"
-- documentado antes en 01-decisiones-de-diseño.md. Ahora es
-- Requerimiento -> Cotización(es) -> Compra. Falta actualizar ese
-- documento y los diagramas de estado correspondientes.
-- =====================================================================

CREATE TABLE proveedor (
    id_proveedor      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_proveedor  VARCHAR(150) NOT NULL,
    direccion         VARCHAR(200),
    email             VARCHAR(150),
    nombre_contacto   VARCHAR(150),
    telefono          VARCHAR(30),
    cbu               VARCHAR(30),
    alias             VARCHAR(50),
    id_estado         INT NOT NULL,
    CONSTRAINT fk_proveedor_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE requerimiento (
    id_requerimiento  INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario        INT NOT NULL,
    fecha_carga       DATE NOT NULL,
    fecha_necesidad   DATE NOT NULL,
    observaciones     VARCHAR(255),
    id_estado         INT NOT NULL,
    CONSTRAINT fk_requerimiento_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_requerimiento_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado)
) ENGINE=InnoDB;

CREATE TABLE requerimiento_detalle (
    id_requerimiento_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_requerimiento          INT NOT NULL,
    id_insumo                  INT NOT NULL,
    cantidad                    DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_requerimiento_detalle_requerimiento
        FOREIGN KEY (id_requerimiento) REFERENCES requerimiento(id_requerimiento)
        ON DELETE CASCADE,
    CONSTRAINT fk_requerimiento_detalle_insumo
        FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo)
) ENGINE=InnoDB;

CREATE TABLE archivo_adjunto (
    id_archivo_adjunto INT AUTO_INCREMENT PRIMARY KEY,
    nombre_archivo      VARCHAR(200) NOT NULL,
    ruta_archivo         VARCHAR(500) NOT NULL,
    tipo_archivo          VARCHAR(50),
    fecha_carga           DATE NOT NULL
) ENGINE=InnoDB;

CREATE TABLE cotizacion (
    id_cotizacion     INT AUTO_INCREMENT PRIMARY KEY,
    id_proveedor      INT NOT NULL,
    fecha_cotizacion  DATE NOT NULL,
    id_estado         INT NOT NULL,
    id_archivo_adjunto INT NULL,  -- archivo de la cotización enviada por el proveedor
    CONSTRAINT fk_cotizacion_proveedor
        FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor),
    CONSTRAINT fk_cotizacion_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado),
    CONSTRAINT fk_cotizacion_archivo_adjunto
        FOREIGN KEY (id_archivo_adjunto) REFERENCES archivo_adjunto(id_archivo_adjunto)
) ENGINE=InnoDB;

CREATE TABLE cotizacion_detalle (
    id_cotizacion_detalle    INT AUTO_INCREMENT PRIMARY KEY,
    id_cotizacion             INT NOT NULL,
    id_requerimiento_detalle  INT NOT NULL,
    cantidad                   DECIMAL(10,2) NOT NULL,
    precio_cotizado             DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_cotizacion_detalle_cotizacion
        FOREIGN KEY (id_cotizacion) REFERENCES cotizacion(id_cotizacion)
        ON DELETE CASCADE,
    CONSTRAINT fk_cotizacion_detalle_requerimiento_detalle
        FOREIGN KEY (id_requerimiento_detalle) REFERENCES requerimiento_detalle(id_requerimiento_detalle)
) ENGINE=InnoDB;

CREATE TABLE compra (
    id_compra          INT AUTO_INCREMENT PRIMARY KEY,
    fecha_compra        DATE NOT NULL,
    id_proveedor         INT NOT NULL,
    id_estado             INT NOT NULL,
    id_archivo_adjunto     INT NULL,
    CONSTRAINT fk_compra_proveedor
        FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor),
    CONSTRAINT fk_compra_estado
        FOREIGN KEY (id_estado) REFERENCES estados(id_estado),
    CONSTRAINT fk_compra_archivo_adjunto
        FOREIGN KEY (id_archivo_adjunto) REFERENCES archivo_adjunto(id_archivo_adjunto)
) ENGINE=InnoDB;

CREATE TABLE compra_detalle (
    id_compra_detalle        INT AUTO_INCREMENT PRIMARY KEY,
    id_compra                 INT NOT NULL,
    id_insumo                  INT NOT NULL,
    id_requerimiento_detalle    INT NOT NULL,
    cantidad                     DECIMAL(10,2) NOT NULL,
    precio_compra                 DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_compra_detalle_compra
        FOREIGN KEY (id_compra) REFERENCES compra(id_compra)
        ON DELETE CASCADE,
    CONSTRAINT fk_compra_detalle_insumo
        FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo),
    CONSTRAINT fk_compra_detalle_requerimiento_detalle
        FOREIGN KEY (id_requerimiento_detalle) REFERENCES requerimiento_detalle(id_requerimiento_detalle)
) ENGINE=InnoDB;
