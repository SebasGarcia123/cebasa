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

// Reparte los pallets en mitades: de cada tipo va la mitad a cada lado
// del camión, y si el tipo es impar el pallet de más va al lado que
// venga más liviano hasta ese momento. Partir por tipo (y no el total)
// es lo que equilibra el peso: los anchos pesados quedan mitad y mitad.
//
// Ej. 8 anchos pesados + 10 anchos livianos + 10 angostos
//     => 4 + 5 + 5 de cada lado (14 y 14).
export function repartirEnMitades(pallets: PalletAArmar[]): Map<LadoCamion, PalletAArmar[]> {
  const conductor: PalletAArmar[] = [];
  const acompanante: PalletAArmar[] = [];

  for (const tipo of [TipoPallet.ANCHO_PESADO, TipoPallet.ANCHO_LIVIANO, TipoPallet.ANGOSTO]) {
    const delTipo = pallets.filter((p) => p.tipo === tipo);
    const mitad = Math.floor(delTipo.length / 2);
    // El impar va al lado que menos pallets tiene hasta acá, así los
    // sobrantes de los distintos tipos no se acumulan todos del mismo
    // lado.
    const sobraUno = delTipo.length % 2 === 1;
    const alConductorPrimero = conductor.length <= acompanante.length;
    const cuantosConductor = mitad + (sobraUno && alConductorPrimero ? 1 : 0);

    conductor.push(...delTipo.slice(0, cuantosConductor));
    acompanante.push(...delTipo.slice(cuantosConductor));
  }

  return new Map<LadoCamion, PalletAArmar[]>([
    [LadoCamion.CONDUCTOR, conductor],
    [LadoCamion.ACOMPANANTE, acompanante],
  ]);
}

// Reparte `total` en `grupos` partes lo más parejas posible, de mayor a
// menor (ej. 9 en 6 grupos => [2,2,2,1,1,1]).
function tamaniosDeGrupo(total: number, grupos: number): number[] {
  const base = Math.floor(total / grupos);
  const resto = total % grupos;
  return Array.from({ length: grupos }, (_, i) => base + (i < resto ? 1 : 0));
}

// Orden de carga de un lado: los anchos van primero los pesados y
// después los livianos (el peso adelante), y los angostos se intercalan
// entre grupos de anchos, de forma que la fila arranca y termina con un
// ancho y los angostos quedan repartidos parejos entre medio.
//
// Ej. un lado con 4 anchos pesados + 5 anchos livianos + 5 angostos
// (9 anchos, 5 angostos => 6 grupos de anchos de [2,2,2,1,1,1]):
//   AP AP AN AP AP AN AL AL AN AL AN AL AN AL
export function ordenarLado(pallets: PalletAArmar[]): PalletAArmar[] {
  const anchos = [
    ...pallets.filter((p) => p.tipo === TipoPallet.ANCHO_PESADO),
    ...pallets.filter((p) => p.tipo === TipoPallet.ANCHO_LIVIANO),
  ];
  const angostos = pallets.filter((p) => p.tipo === TipoPallet.ANGOSTO);

  if (anchos.length === 0) {
    return angostos;
  }
  if (angostos.length === 0) {
    return anchos;
  }

  // Un angosto entre grupo y grupo: con A angostos hacen falta A+1
  // grupos de anchos para que la fila empiece y termine con ancho. Si
  // no hay tantos anchos, se usa un grupo por ancho y los angostos que
  // sobran se amontonan en los huecos (dos angostos ocupan más o menos
  // lo que un ancho).
  const grupos = Math.min(angostos.length + 1, anchos.length);
  const huecos = grupos - 1;

  // Con un solo grupo (hay un único ancho) no hay hueco donde
  // intercalar: va el ancho primero y los angostos atrás.
  if (huecos === 0) {
    return [...anchos, ...angostos];
  }

  const tamanios = tamaniosDeGrupo(anchos.length, grupos);
  const angostosPorHueco = tamaniosDeGrupo(angostos.length, huecos);

  const orden: PalletAArmar[] = [];
  let siguienteAncho = 0;
  let siguienteAngosto = 0;
  tamanios.forEach((tamanio, i) => {
    for (let n = 0; n < tamanio; n++) {
      orden.push(anchos[siguienteAncho++]);
    }
    if (i < huecos) {
      for (let n = 0; n < angostosPorHueco[i]; n++) {
        orden.push(angostos[siguienteAngosto++]);
      }
    }
  });

  return orden;
}
