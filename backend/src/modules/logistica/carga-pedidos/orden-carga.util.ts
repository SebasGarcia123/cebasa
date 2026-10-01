import { LadoCamion, TipoPallet } from '../../../generated/prisma/client.js';

// Un pallet todavía sin persistir, mientras se arma el orden.
export interface PalletAArmar {
  id_item_pedido: number;
  nro_pallet: number;
  tipo: TipoPallet;
}

// Cuántos pallets ocupa un ítem del pedido. Un producto sin
// bolsones_por_pallet (ej. una bobina, que se mide en kg) cuenta como
// un solo bulto: esta pantalla es para carga paletizada.
export function palletsDeItem(cantidadBolsones: number, bolsonesPorPallet: number | null): number {
  if (!bolsonesPorPallet || bolsonesPorPallet <= 0) {
    return 1;
  }
  return Math.ceil(cantidadBolsones / bolsonesPorPallet);
}

// Reparte los pallets entre los dos lados del camión alternando dentro
// de cada tipo, así cada lado queda con una mezcla parecida de anchos y
// angostos (y no un lado todo pesado y el otro todo liviano).
export function repartirEnMitades(pallets: PalletAArmar[]): Map<LadoCamion, PalletAArmar[]> {
  const porLado = new Map<LadoCamion, PalletAArmar[]>([
    [LadoCamion.CONDUCTOR, []],
    [LadoCamion.ACOMPANANTE, []],
  ]);

  for (const tipo of [TipoPallet.ANCHO_PESADO, TipoPallet.ANCHO_LIVIANO, TipoPallet.ANGOSTO]) {
    pallets
      .filter((p) => p.tipo === tipo)
      .forEach((pallet, i) => {
        const lado = i % 2 === 0 ? LadoCamion.CONDUCTOR : LadoCamion.ACOMPANANTE;
        porLado.get(lado)!.push(pallet);
      });
  }

  return porLado;
}

// Orden de carga de un lado: primero los anchos y pesados, después los
// anchos y livianos (el peso va adelante), y los angostos se intercalan
// entre medio repartidos de forma pareja según la proporción.
//
// Ej. 4 anchos pesados + 2 anchos livianos + 6 angostos:
//   AP AN AP AN AP AN AP AN AL AN AL AN
export function ordenarLado(pallets: PalletAArmar[]): PalletAArmar[] {
  const anchos = [
    ...pallets.filter((p) => p.tipo === TipoPallet.ANCHO_PESADO),
    ...pallets.filter((p) => p.tipo === TipoPallet.ANCHO_LIVIANO),
  ];
  const angostos = pallets.filter((p) => p.tipo === TipoPallet.ANGOSTO);

  if (anchos.length === 0) {
    return angostos;
  }

  // Reparte los angostos en los huecos que quedan después de cada
  // ancho: base para todos y uno extra a los primeros `resto`.
  const base = Math.floor(angostos.length / anchos.length);
  const resto = angostos.length % anchos.length;

  const orden: PalletAArmar[] = [];
  let siguienteAngosto = 0;
  anchos.forEach((ancho, i) => {
    orden.push(ancho);
    const cuantos = base + (i < resto ? 1 : 0);
    for (let n = 0; n < cuantos; n++) {
      orden.push(angostos[siguienteAngosto++]);
    }
  });

  return orden;
}
