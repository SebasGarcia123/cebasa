-- cuenta_corriente.saldo_actual se agregó en la migración anterior con
-- default 0.00, lo cual resetea a 0 cualquier cuenta que ya tuviera
-- movimientos cargados a mano antes de este campo existir. Se
-- inicializa acá con el saldo_resultante del último movimiento de cada
-- cuenta (por fecha, y a igualdad de fecha por id), para que el
-- primer documento nuevo continúe la cuenta en vez de reiniciarla.
UPDATE `cuenta_corriente` cc
SET cc.saldo_actual = (
  SELECT m.saldo_resultante
  FROM `movimiento_cuenta_corriente` m
  WHERE m.id_cuenta_corriente = cc.id_cuenta_corriente
  ORDER BY m.fecha DESC, m.id_movimiento_cta_cte DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM `movimiento_cuenta_corriente` m WHERE m.id_cuenta_corriente = cc.id_cuenta_corriente
);
