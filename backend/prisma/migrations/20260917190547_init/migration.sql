-- CreateTable
CREATE TABLE `archivo_adjunto` (
    `id_archivo_adjunto` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_archivo` VARCHAR(200) NOT NULL,
    `ruta_archivo` VARCHAR(500) NOT NULL,
    `tipo_archivo` VARCHAR(50) NULL,
    `fecha_carga` DATE NOT NULL,

    PRIMARY KEY (`id_archivo_adjunto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `autoelevadores` (
    `id_autoelevadores` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `fecha_alta` DATE NOT NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_autoelevadores_estado`(`id_estado`),
    PRIMARY KEY (`id_autoelevadores`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `camion` (
    `id_camion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_transporte` INTEGER NOT NULL,
    `marca` VARCHAR(50) NULL,
    `modelo` VARCHAR(50) NULL,
    `dominio_chasis` VARCHAR(20) NOT NULL,
    `dominio_semi` VARCHAR(20) NULL,

    INDEX `fk_camion_transporte`(`id_transporte`),
    PRIMARY KEY (`id_camion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chofer` (
    `id_chofer` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_chofer` VARCHAR(150) NOT NULL,
    `dni` VARCHAR(20) NOT NULL,
    `id_direccion` INTEGER NOT NULL,
    `id_transporte` INTEGER NOT NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_chofer_direccion`(`id_direccion`),
    INDEX `fk_chofer_estado`(`id_estado`),
    INDEX `fk_chofer_transporte`(`id_transporte`),
    PRIMARY KEY (`id_chofer`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id_cliente` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_cli` VARCHAR(150) NOT NULL,
    `id_direccion` INTEGER NOT NULL,
    `telefono_cli` VARCHAR(30) NULL,
    `email_cli` VARCHAR(150) NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_clientes_direccion`(`id_direccion`),
    INDEX `fk_clientes_estado`(`id_estado`),
    PRIMARY KEY (`id_cliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `compra` (
    `id_compra` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha_compra` DATE NOT NULL,
    `id_proveedor` INTEGER NOT NULL,
    `id_estado` INTEGER NOT NULL,
    `id_archivo_adjunto` INTEGER NULL,

    INDEX `fk_compra_archivo_adjunto`(`id_archivo_adjunto`),
    INDEX `fk_compra_estado`(`id_estado`),
    INDEX `fk_compra_proveedor`(`id_proveedor`),
    PRIMARY KEY (`id_compra`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `compra_detalle` (
    `id_compra_detalle` INTEGER NOT NULL AUTO_INCREMENT,
    `id_compra` INTEGER NOT NULL,
    `id_insumo` INTEGER NOT NULL,
    `id_requerimiento_detalle` INTEGER NOT NULL,
    `cantidad` DECIMAL(10, 2) NOT NULL,
    `precio_compra` DECIMAL(10, 2) NOT NULL,

    INDEX `fk_compra_detalle_compra`(`id_compra`),
    INDEX `fk_compra_detalle_insumo`(`id_insumo`),
    INDEX `fk_compra_detalle_requerimiento_detalle`(`id_requerimiento_detalle`),
    PRIMARY KEY (`id_compra_detalle`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `control_autoelevador` (
    `id_control_autoelevador` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `id_autoelevador` INTEGER NOT NULL,

    INDEX `fk_control_autoelevador_autoelevador`(`id_autoelevador`),
    INDEX `fk_control_autoelevador_usuario`(`id_usuario`),
    PRIMARY KEY (`id_control_autoelevador`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cotizacion` (
    `id_cotizacion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_proveedor` INTEGER NOT NULL,
    `fecha_cotizacion` DATE NOT NULL,
    `id_estado` INTEGER NOT NULL,
    `id_archivo_adjunto` INTEGER NULL,

    INDEX `fk_cotizacion_archivo_adjunto`(`id_archivo_adjunto`),
    INDEX `fk_cotizacion_estado`(`id_estado`),
    INDEX `fk_cotizacion_proveedor`(`id_proveedor`),
    PRIMARY KEY (`id_cotizacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cotizacion_detalle` (
    `id_cotizacion_detalle` INTEGER NOT NULL AUTO_INCREMENT,
    `id_cotizacion` INTEGER NOT NULL,
    `id_requerimiento_detalle` INTEGER NOT NULL,
    `cantidad` DECIMAL(10, 2) NOT NULL,
    `precio_cotizado` DECIMAL(10, 2) NOT NULL,

    INDEX `fk_cotizacion_detalle_cotizacion`(`id_cotizacion`),
    INDEX `fk_cotizacion_detalle_requerimiento_detalle`(`id_requerimiento_detalle`),
    PRIMARY KEY (`id_cotizacion_detalle`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cuenta_corriente` (
    `id_cuenta_corriente` INTEGER NOT NULL AUTO_INCREMENT,
    `limite_credito` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `id_cliente` INTEGER NOT NULL,

    UNIQUE INDEX `id_cliente`(`id_cliente`),
    PRIMARY KEY (`id_cuenta_corriente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deposito` (
    `id_deposito` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_deposito` VARCHAR(100) NOT NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_deposito_estado`(`id_estado`),
    PRIMARY KEY (`id_deposito`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direcciones` (
    `id_direccion` INTEGER NOT NULL AUTO_INCREMENT,
    `calle` VARCHAR(100) NOT NULL,
    `numero` VARCHAR(20) NULL,
    `entrecalle1` VARCHAR(100) NULL,
    `entrecalle2` VARCHAR(100) NULL,
    `localidad` VARCHAR(100) NOT NULL,
    `provincia` VARCHAR(100) NOT NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_direcciones_estado`(`id_estado`),
    PRIMARY KEY (`id_direccion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estados` (
    `id_estado` INTEGER NOT NULL AUTO_INCREMENT,
    `nombreEstado` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_estado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fletero` (
    `id_fletero` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_fletero` VARCHAR(150) NOT NULL,
    `cuit` VARCHAR(20) NULL,
    `telefono` VARCHAR(30) NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_fletero_estado`(`id_estado`),
    PRIMARY KEY (`id_fletero`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `insumo` (
    `id_insumo` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo_insumo` VARCHAR(50) NOT NULL,
    `nombre_insumo` VARCHAR(100) NOT NULL,
    `id_unidad_medida` INTEGER NOT NULL,
    `stock_minimo` INTEGER NOT NULL DEFAULT 0,
    `stock_actual` INTEGER NOT NULL DEFAULT 0,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_insumo_estado`(`id_estado`),
    INDEX `fk_insumo_unidad_medida`(`id_unidad_medida`),
    PRIMARY KEY (`id_insumo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_control_autoelevador` (
    `id_item_control` INTEGER NOT NULL AUTO_INCREMENT,
    `item_nombre` VARCHAR(150) NOT NULL,
    `estado_ok` BOOLEAN NOT NULL,
    `observacion` VARCHAR(255) NULL,
    `id_control_autoelevador` INTEGER NOT NULL,

    INDEX `fk_item_control_autoelevador_control`(`id_control_autoelevador`),
    PRIMARY KEY (`id_item_control`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_lote` (
    `id_item_lote` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion_item` VARCHAR(200) NOT NULL,
    `id_unidad_medida` INTEGER NOT NULL,
    `cantidad_item_lote` DECIMAL(10, 2) NOT NULL,
    `id_lote` INTEGER NOT NULL,

    INDEX `fk_item_lote_lote`(`id_lote`),
    INDEX `fk_item_lote_unidad_medida`(`id_unidad_medida`),
    PRIMARY KEY (`id_item_lote`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_pedido` (
    `id_item_pedido` INTEGER NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER NOT NULL,
    `cantidad_bolsones` INTEGER NOT NULL,
    `id_pedido` INTEGER NOT NULL,

    INDEX `fk_item_pedido_pedido`(`id_pedido`),
    INDEX `fk_item_pedido_producto`(`id_producto`),
    PRIMARY KEY (`id_item_pedido`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_pedido_insumo` (
    `id_item_pedido_insumo` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pedido_insumos` INTEGER NOT NULL,
    `id_insumo` INTEGER NOT NULL,
    `cantidad_solicitada` DECIMAL(10, 2) NOT NULL,
    `cantidad_abastecida` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    INDEX `fk_item_pedido_insumo_insumo`(`id_insumo`),
    INDEX `fk_item_pedido_insumo_pedido`(`id_pedido_insumos`),
    PRIMARY KEY (`id_item_pedido_insumo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_plan_produccion` (
    `id_item_plan_produccion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_plan_produccion` INTEGER NOT NULL,
    `id_lineas` INTEGER NOT NULL,
    `id_producto` INTEGER NOT NULL,
    `id_turno` INTEGER NOT NULL,
    `fecha` DATE NOT NULL,
    `cantidad` INTEGER NOT NULL,

    INDEX `fk_item_plan_prod_lineas`(`id_lineas`),
    INDEX `fk_item_plan_prod_plan`(`id_plan_produccion`),
    INDEX `fk_item_plan_prod_producto`(`id_producto`),
    INDEX `fk_item_plan_prod_turno`(`id_turno`),
    PRIMARY KEY (`id_item_plan_produccion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_prod` (
    `id_item` INTEGER NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `id_lote` INTEGER NOT NULL,
    `id_lineas` INTEGER NOT NULL,

    INDEX `fk_item_prod_lineas`(`id_lineas`),
    INDEX `fk_item_prod_lote`(`id_lote`),
    INDEX `fk_item_prod_producto`(`id_producto`),
    PRIMARY KEY (`id_item`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lineas` (
    `id_lineas` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion_lineas` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_lineas`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lote_prod` (
    `id_lote` INTEGER NOT NULL AUTO_INCREMENT,
    `id_turno` INTEGER NOT NULL,
    `fecha_lote_prod` DATE NOT NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_lote_prod_estado`(`id_estado`),
    INDEX `fk_lote_prod_turno`(`id_turno`),
    PRIMARY KEY (`id_lote`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lotes` (
    `id_lote` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha_lote` DATE NOT NULL,
    `id_chofer` INTEGER NOT NULL,
    `id_camion` INTEGER NOT NULL,
    `id_tipo_lote` INTEGER NOT NULL,
    `id_estado` INTEGER NOT NULL,
    `observaciones` VARCHAR(255) NULL,
    `motivo` VARCHAR(255) NULL,

    INDEX `fk_lotes_camion`(`id_camion`),
    INDEX `fk_lotes_chofer`(`id_chofer`),
    INDEX `fk_lotes_estado`(`id_estado`),
    INDEX `fk_lotes_tipo_lote`(`id_tipo_lote`),
    PRIMARY KEY (`id_lote`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimiento_cuenta_corriente` (
    `id_movimiento_cta_cte` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `id_tipo_documento` INTEGER NOT NULL,
    `saldo_resultante` DECIMAL(10, 2) NOT NULL,
    `id_cuenta_corriente` INTEGER NOT NULL,

    INDEX `fk_movimiento_cta_cte_cuenta`(`id_cuenta_corriente`),
    INDEX `fk_movimiento_cta_cte_tipo_doc`(`id_tipo_documento`),
    PRIMARY KEY (`id_movimiento_cta_cte`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimiento_insumo` (
    `id_movimiento_insumo` INTEGER NOT NULL AUTO_INCREMENT,
    `id_insumo` INTEGER NOT NULL,
    `id_tipo_movimiento` INTEGER NOT NULL,
    `cantidad` DECIMAL(10, 2) NOT NULL,
    `fecha_movimiento` DATE NOT NULL,
    `id_deposito_origen` INTEGER NULL,
    `id_deposito_destino` INTEGER NULL,
    `observaciones` VARCHAR(255) NULL,
    `id_item_pedido_insumo` INTEGER NULL,
    `motivo` VARCHAR(255) NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_mov_insumo_dep_destino`(`id_deposito_destino`),
    INDEX `fk_mov_insumo_dep_origen`(`id_deposito_origen`),
    INDEX `fk_mov_insumo_estado`(`id_estado`),
    INDEX `fk_mov_insumo_insumo`(`id_insumo`),
    INDEX `fk_mov_insumo_item_pedido_insumo`(`id_item_pedido_insumo`),
    INDEX `fk_mov_insumo_tipo`(`id_tipo_movimiento`),
    PRIMARY KEY (`id_movimiento_insumo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimiento_producto` (
    `id_movimiento_producto` INTEGER NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER NOT NULL,
    `id_tipo_movimiento` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `fecha_movimiento` DATE NOT NULL,
    `id_deposito_origen` INTEGER NULL,
    `id_deposito_destino` INTEGER NULL,
    `observaciones` VARCHAR(255) NULL,
    `motivo` VARCHAR(255) NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_mov_producto_dep_destino`(`id_deposito_destino`),
    INDEX `fk_mov_producto_dep_origen`(`id_deposito_origen`),
    INDEX `fk_mov_producto_estado`(`id_estado`),
    INDEX `fk_mov_producto_producto`(`id_producto`),
    INDEX `fk_mov_producto_tipo`(`id_tipo_movimiento`),
    PRIMARY KEY (`id_movimiento_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `naturaleza` (
    `id_naturaleza` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_naturaleza` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id_naturaleza`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedido_insumos` (
    `id_pedido_insumos` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `fecha_carga` DATE NOT NULL,
    `fecha_necesidad` DATE NOT NULL,
    `id_estado` INTEGER NOT NULL,
    `motivo_rechazo` VARCHAR(255) NULL,

    INDEX `fk_pedido_insumos_estado`(`id_estado`),
    INDEX `fk_pedido_insumos_usuario`(`id_usuario`),
    PRIMARY KEY (`id_pedido_insumos`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos` (
    `id_pedido` INTEGER NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER NOT NULL,
    `fecha_carga` DATE NOT NULL,
    `fecha_prometido` DATE NULL,
    `id_estado` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,

    INDEX `fk_pedidos_cliente`(`id_cliente`),
    INDEX `fk_pedidos_estado`(`id_estado`),
    INDEX `fk_pedidos_usuario`(`id_usuario`),
    PRIMARY KEY (`id_pedido`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permisos` (
    `id_permiso` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_permiso` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_permiso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plan_produccion` (
    `id_plan_produccion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `fecha_inicio_semana` DATE NOT NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_plan_produccion_estado`(`id_estado`),
    INDEX `fk_plan_produccion_usuario`(`id_usuario`),
    PRIMARY KEY (`id_plan_produccion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos` (
    `id_producto` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo_producto` VARCHAR(50) NOT NULL,
    `descripcion_producto` VARCHAR(200) NOT NULL,
    `bolsones_por_pallet` INTEGER NULL,
    `peso_por_bolson` DECIMAL(10, 2) NULL,
    `precio_venta` DECIMAL(10, 2) NOT NULL,
    `stock_actual` INTEGER NOT NULL DEFAULT 0,
    `stock_minimo` INTEGER NOT NULL DEFAULT 0,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_productos_estado`(`id_estado`),
    PRIMARY KEY (`id_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proveedor` (
    `id_proveedor` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_proveedor` VARCHAR(150) NOT NULL,
    `direccion` VARCHAR(200) NULL,
    `email` VARCHAR(150) NULL,
    `nombre_contacto` VARCHAR(150) NULL,
    `telefono` VARCHAR(30) NULL,
    `cbu` VARCHAR(30) NULL,
    `alias` VARCHAR(50) NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_proveedor_estado`(`id_estado`),
    PRIMARY KEY (`id_proveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receta` (
    `id_receta` INTEGER NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER NOT NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_receta_estado`(`id_estado`),
    INDEX `fk_receta_producto`(`id_producto`),
    PRIMARY KEY (`id_receta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receta_item` (
    `id_receta_item` INTEGER NOT NULL AUTO_INCREMENT,
    `id_insumo` INTEGER NOT NULL,
    `id_receta` INTEGER NOT NULL,
    `cantidad_utilizada` DECIMAL(10, 2) NOT NULL,

    INDEX `fk_receta_item_insumo`(`id_insumo`),
    INDEX `fk_receta_item_receta`(`id_receta`),
    PRIMARY KEY (`id_receta_item`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reclamos` (
    `id_reclamo` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `descripcion` VARCHAR(500) NULL,
    `id_cliente` INTEGER NOT NULL,
    `id_estado` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,

    INDEX `fk_reclamos_cliente`(`id_cliente`),
    INDEX `fk_reclamos_estado`(`id_estado`),
    INDEX `fk_reclamos_usuario`(`id_usuario`),
    PRIMARY KEY (`id_reclamo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requerimiento` (
    `id_requerimiento` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `fecha_carga` DATE NOT NULL,
    `fecha_necesidad` DATE NOT NULL,
    `observaciones` VARCHAR(255) NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_requerimiento_estado`(`id_estado`),
    INDEX `fk_requerimiento_usuario`(`id_usuario`),
    PRIMARY KEY (`id_requerimiento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requerimiento_detalle` (
    `id_requerimiento_detalle` INTEGER NOT NULL AUTO_INCREMENT,
    `id_requerimiento` INTEGER NOT NULL,
    `id_insumo` INTEGER NOT NULL,
    `cantidad` DECIMAL(10, 2) NOT NULL,

    INDEX `fk_requerimiento_detalle_insumo`(`id_insumo`),
    INDEX `fk_requerimiento_detalle_requerimiento`(`id_requerimiento`),
    PRIMARY KEY (`id_requerimiento_detalle`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rol_permisos` (
    `id_rol` INTEGER NOT NULL,
    `id_permiso` INTEGER NOT NULL,

    INDEX `fk_rol_permisos_permiso`(`id_permiso`),
    PRIMARY KEY (`id_rol`, `id_permiso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id_rol` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_rol` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_rol`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sectores` (
    `id_sector` INTEGER NOT NULL AUTO_INCREMENT,
    `nombreSector` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_sector`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_autoelevador` (
    `id_service_autoelevador` INTEGER NOT NULL AUTO_INCREMENT,
    `id_autoelevador` INTEGER NOT NULL,
    `horas` DECIMAL(10, 2) NOT NULL,
    `detalle` VARCHAR(255) NULL,

    INDEX `fk_service_autoelevador_autoelevador`(`id_autoelevador`),
    PRIMARY KEY (`id_service_autoelevador`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_insumo_deposito` (
    `id_stock_insumo_deposito` INTEGER NOT NULL AUTO_INCREMENT,
    `id_insumo` INTEGER NOT NULL,
    `id_deposito` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 0,

    INDEX `fk_stock_insumo_dep_deposito`(`id_deposito`),
    UNIQUE INDEX `uq_insumo_deposito`(`id_insumo`, `id_deposito`),
    PRIMARY KEY (`id_stock_insumo_deposito`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipo_documento` (
    `id_tipo_documento` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion` VARCHAR(100) NOT NULL,
    `id_tipo_impacto` INTEGER NOT NULL,

    INDEX `fk_tipo_documento_tipo_impacto`(`id_tipo_impacto`),
    PRIMARY KEY (`id_tipo_documento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipo_impacto` (
    `id_tipo_impacto` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_tipo_impacto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipo_lote` (
    `id_tipo_lote` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion_lote` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_tipo_lote`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipo_movimiento` (
    `id_tipo_movimiento` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_movimiento` VARCHAR(100) NOT NULL,
    `id_naturaleza` INTEGER NOT NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_tipo_mov_estado`(`id_estado`),
    INDEX `fk_tipo_mov_naturaleza`(`id_naturaleza`),
    PRIMARY KEY (`id_tipo_movimiento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transporte` (
    `id_transporte` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_transporte` VARCHAR(150) NOT NULL,
    `cuit` VARCHAR(20) NOT NULL,
    `nombre_contacto` VARCHAR(150) NULL,
    `id_direccion` INTEGER NOT NULL,
    `telefono` VARCHAR(30) NULL,
    `cbu_cuenta_bancaria` VARCHAR(30) NULL,
    `alias_cuenta_bancaria` VARCHAR(50) NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_transporte_direccion`(`id_direccion`),
    INDEX `fk_transporte_estado`(`id_estado`),
    PRIMARY KEY (`id_transporte`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `turnos` (
    `id_turno` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion_turnos` VARCHAR(100) NOT NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_turnos_estado`(`id_estado`),
    PRIMARY KEY (`id_turno`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unidad_medida` (
    `id_unidad_medida` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_unidad_medida` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id_unidad_medida`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario_roles` (
    `id_usuario` INTEGER NOT NULL,
    `id_rol` INTEGER NOT NULL,

    INDEX `fk_usuario_roles_rol`(`id_rol`),
    PRIMARY KEY (`id_usuario`, `id_rol`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_usuario` VARCHAR(100) NOT NULL,
    `id_sector` INTEGER NOT NULL,
    `id_estado` INTEGER NOT NULL,

    INDEX `fk_usuarios_estado`(`id_estado`),
    INDEX `fk_usuarios_sector`(`id_sector`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `autoelevadores` ADD CONSTRAINT `fk_autoelevadores_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `camion` ADD CONSTRAINT `fk_camion_transporte` FOREIGN KEY (`id_transporte`) REFERENCES `transporte`(`id_transporte`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `chofer` ADD CONSTRAINT `fk_chofer_direccion` FOREIGN KEY (`id_direccion`) REFERENCES `direcciones`(`id_direccion`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `chofer` ADD CONSTRAINT `fk_chofer_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `chofer` ADD CONSTRAINT `fk_chofer_transporte` FOREIGN KEY (`id_transporte`) REFERENCES `transporte`(`id_transporte`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `fk_clientes_direccion` FOREIGN KEY (`id_direccion`) REFERENCES `direcciones`(`id_direccion`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `fk_clientes_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `compra` ADD CONSTRAINT `fk_compra_archivo_adjunto` FOREIGN KEY (`id_archivo_adjunto`) REFERENCES `archivo_adjunto`(`id_archivo_adjunto`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `compra` ADD CONSTRAINT `fk_compra_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `compra` ADD CONSTRAINT `fk_compra_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `compra_detalle` ADD CONSTRAINT `fk_compra_detalle_compra` FOREIGN KEY (`id_compra`) REFERENCES `compra`(`id_compra`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `compra_detalle` ADD CONSTRAINT `fk_compra_detalle_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo`(`id_insumo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `compra_detalle` ADD CONSTRAINT `fk_compra_detalle_requerimiento_detalle` FOREIGN KEY (`id_requerimiento_detalle`) REFERENCES `requerimiento_detalle`(`id_requerimiento_detalle`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `control_autoelevador` ADD CONSTRAINT `fk_control_autoelevador_autoelevador` FOREIGN KEY (`id_autoelevador`) REFERENCES `autoelevadores`(`id_autoelevadores`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `control_autoelevador` ADD CONSTRAINT `fk_control_autoelevador_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cotizacion` ADD CONSTRAINT `fk_cotizacion_archivo_adjunto` FOREIGN KEY (`id_archivo_adjunto`) REFERENCES `archivo_adjunto`(`id_archivo_adjunto`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cotizacion` ADD CONSTRAINT `fk_cotizacion_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cotizacion` ADD CONSTRAINT `fk_cotizacion_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor`(`id_proveedor`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cotizacion_detalle` ADD CONSTRAINT `fk_cotizacion_detalle_cotizacion` FOREIGN KEY (`id_cotizacion`) REFERENCES `cotizacion`(`id_cotizacion`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cotizacion_detalle` ADD CONSTRAINT `fk_cotizacion_detalle_requerimiento_detalle` FOREIGN KEY (`id_requerimiento_detalle`) REFERENCES `requerimiento_detalle`(`id_requerimiento_detalle`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cuenta_corriente` ADD CONSTRAINT `fk_cuenta_corriente_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `deposito` ADD CONSTRAINT `fk_deposito_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `direcciones` ADD CONSTRAINT `fk_direcciones_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `fletero` ADD CONSTRAINT `fk_fletero_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `insumo` ADD CONSTRAINT `fk_insumo_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `insumo` ADD CONSTRAINT `fk_insumo_unidad_medida` FOREIGN KEY (`id_unidad_medida`) REFERENCES `unidad_medida`(`id_unidad_medida`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_control_autoelevador` ADD CONSTRAINT `fk_item_control_autoelevador_control` FOREIGN KEY (`id_control_autoelevador`) REFERENCES `control_autoelevador`(`id_control_autoelevador`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_lote` ADD CONSTRAINT `fk_item_lote_lote` FOREIGN KEY (`id_lote`) REFERENCES `lotes`(`id_lote`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_lote` ADD CONSTRAINT `fk_item_lote_unidad_medida` FOREIGN KEY (`id_unidad_medida`) REFERENCES `unidad_medida`(`id_unidad_medida`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_pedido` ADD CONSTRAINT `fk_item_pedido_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos`(`id_pedido`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_pedido` ADD CONSTRAINT `fk_item_pedido_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_pedido_insumo` ADD CONSTRAINT `fk_item_pedido_insumo_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo`(`id_insumo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_pedido_insumo` ADD CONSTRAINT `fk_item_pedido_insumo_pedido` FOREIGN KEY (`id_pedido_insumos`) REFERENCES `pedido_insumos`(`id_pedido_insumos`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_plan_produccion` ADD CONSTRAINT `fk_item_plan_prod_lineas` FOREIGN KEY (`id_lineas`) REFERENCES `lineas`(`id_lineas`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_plan_produccion` ADD CONSTRAINT `fk_item_plan_prod_plan` FOREIGN KEY (`id_plan_produccion`) REFERENCES `plan_produccion`(`id_plan_produccion`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_plan_produccion` ADD CONSTRAINT `fk_item_plan_prod_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_plan_produccion` ADD CONSTRAINT `fk_item_plan_prod_turno` FOREIGN KEY (`id_turno`) REFERENCES `turnos`(`id_turno`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_prod` ADD CONSTRAINT `fk_item_prod_lineas` FOREIGN KEY (`id_lineas`) REFERENCES `lineas`(`id_lineas`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_prod` ADD CONSTRAINT `fk_item_prod_lote` FOREIGN KEY (`id_lote`) REFERENCES `lote_prod`(`id_lote`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_prod` ADD CONSTRAINT `fk_item_prod_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `lote_prod` ADD CONSTRAINT `fk_lote_prod_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `lote_prod` ADD CONSTRAINT `fk_lote_prod_turno` FOREIGN KEY (`id_turno`) REFERENCES `turnos`(`id_turno`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `lotes` ADD CONSTRAINT `fk_lotes_camion` FOREIGN KEY (`id_camion`) REFERENCES `camion`(`id_camion`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `lotes` ADD CONSTRAINT `fk_lotes_chofer` FOREIGN KEY (`id_chofer`) REFERENCES `chofer`(`id_chofer`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `lotes` ADD CONSTRAINT `fk_lotes_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `lotes` ADD CONSTRAINT `fk_lotes_tipo_lote` FOREIGN KEY (`id_tipo_lote`) REFERENCES `tipo_lote`(`id_tipo_lote`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_cuenta_corriente` ADD CONSTRAINT `fk_movimiento_cta_cte_cuenta` FOREIGN KEY (`id_cuenta_corriente`) REFERENCES `cuenta_corriente`(`id_cuenta_corriente`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_cuenta_corriente` ADD CONSTRAINT `fk_movimiento_cta_cte_tipo_doc` FOREIGN KEY (`id_tipo_documento`) REFERENCES `tipo_documento`(`id_tipo_documento`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_insumo` ADD CONSTRAINT `fk_mov_insumo_dep_destino` FOREIGN KEY (`id_deposito_destino`) REFERENCES `deposito`(`id_deposito`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_insumo` ADD CONSTRAINT `fk_mov_insumo_dep_origen` FOREIGN KEY (`id_deposito_origen`) REFERENCES `deposito`(`id_deposito`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_insumo` ADD CONSTRAINT `fk_mov_insumo_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_insumo` ADD CONSTRAINT `fk_mov_insumo_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo`(`id_insumo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_insumo` ADD CONSTRAINT `fk_mov_insumo_item_pedido_insumo` FOREIGN KEY (`id_item_pedido_insumo`) REFERENCES `item_pedido_insumo`(`id_item_pedido_insumo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_insumo` ADD CONSTRAINT `fk_mov_insumo_tipo` FOREIGN KEY (`id_tipo_movimiento`) REFERENCES `tipo_movimiento`(`id_tipo_movimiento`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_producto` ADD CONSTRAINT `fk_mov_producto_dep_destino` FOREIGN KEY (`id_deposito_destino`) REFERENCES `deposito`(`id_deposito`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_producto` ADD CONSTRAINT `fk_mov_producto_dep_origen` FOREIGN KEY (`id_deposito_origen`) REFERENCES `deposito`(`id_deposito`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_producto` ADD CONSTRAINT `fk_mov_producto_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_producto` ADD CONSTRAINT `fk_mov_producto_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_producto` ADD CONSTRAINT `fk_mov_producto_tipo` FOREIGN KEY (`id_tipo_movimiento`) REFERENCES `tipo_movimiento`(`id_tipo_movimiento`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pedido_insumos` ADD CONSTRAINT `fk_pedido_insumos_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pedido_insumos` ADD CONSTRAINT `fk_pedido_insumos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `fk_pedidos_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `fk_pedidos_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `plan_produccion` ADD CONSTRAINT `fk_plan_produccion_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `plan_produccion` ADD CONSTRAINT `fk_plan_produccion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `fk_productos_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `proveedor` ADD CONSTRAINT `fk_proveedor_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `receta` ADD CONSTRAINT `fk_receta_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `receta` ADD CONSTRAINT `fk_receta_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `receta_item` ADD CONSTRAINT `fk_receta_item_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo`(`id_insumo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `receta_item` ADD CONSTRAINT `fk_receta_item_receta` FOREIGN KEY (`id_receta`) REFERENCES `receta`(`id_receta`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `reclamos` ADD CONSTRAINT `fk_reclamos_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `reclamos` ADD CONSTRAINT `fk_reclamos_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `reclamos` ADD CONSTRAINT `fk_reclamos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `requerimiento` ADD CONSTRAINT `fk_requerimiento_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `requerimiento` ADD CONSTRAINT `fk_requerimiento_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `requerimiento_detalle` ADD CONSTRAINT `fk_requerimiento_detalle_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo`(`id_insumo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `requerimiento_detalle` ADD CONSTRAINT `fk_requerimiento_detalle_requerimiento` FOREIGN KEY (`id_requerimiento`) REFERENCES `requerimiento`(`id_requerimiento`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `rol_permisos` ADD CONSTRAINT `fk_rol_permisos_permiso` FOREIGN KEY (`id_permiso`) REFERENCES `permisos`(`id_permiso`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `rol_permisos` ADD CONSTRAINT `fk_rol_permisos_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id_rol`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `service_autoelevador` ADD CONSTRAINT `fk_service_autoelevador_autoelevador` FOREIGN KEY (`id_autoelevador`) REFERENCES `autoelevadores`(`id_autoelevadores`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stock_insumo_deposito` ADD CONSTRAINT `fk_stock_insumo_dep_deposito` FOREIGN KEY (`id_deposito`) REFERENCES `deposito`(`id_deposito`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stock_insumo_deposito` ADD CONSTRAINT `fk_stock_insumo_dep_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo`(`id_insumo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tipo_documento` ADD CONSTRAINT `fk_tipo_documento_tipo_impacto` FOREIGN KEY (`id_tipo_impacto`) REFERENCES `tipo_impacto`(`id_tipo_impacto`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tipo_movimiento` ADD CONSTRAINT `fk_tipo_mov_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tipo_movimiento` ADD CONSTRAINT `fk_tipo_mov_naturaleza` FOREIGN KEY (`id_naturaleza`) REFERENCES `naturaleza`(`id_naturaleza`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `transporte` ADD CONSTRAINT `fk_transporte_direccion` FOREIGN KEY (`id_direccion`) REFERENCES `direcciones`(`id_direccion`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `transporte` ADD CONSTRAINT `fk_transporte_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `turnos` ADD CONSTRAINT `fk_turnos_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `usuario_roles` ADD CONSTRAINT `fk_usuario_roles_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id_rol`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `usuario_roles` ADD CONSTRAINT `fk_usuario_roles_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `fk_usuarios_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `fk_usuarios_sector` FOREIGN KEY (`id_sector`) REFERENCES `sectores`(`id_sector`) ON DELETE RESTRICT ON UPDATE RESTRICT;

