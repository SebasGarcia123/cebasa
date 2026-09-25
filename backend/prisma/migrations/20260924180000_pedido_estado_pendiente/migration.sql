-- El estado inicial del pedido se llama "Pendiente" (no "Cargado"): es
-- el mismo estado de siempre, solo cambia el nombre que se le muestra
-- (nadie más usa este id_estado, así que no hace falta tocar ninguna
-- fila de pedidos).
UPDATE `estados` SET `nombreEstado` = 'Pendiente' WHERE `nombreEstado` = 'Cargado';
