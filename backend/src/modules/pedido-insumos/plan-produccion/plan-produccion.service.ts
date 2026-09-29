import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { EstadosLookupService } from '../../../prisma/estados-lookup.service.js';
import { lunesDe, diasDeLaSemana } from './semana.util.js';

const ESTADO_ACTIVO = 'Activo';
const INCLUDE_SEMANA = {
  item_plan_produccion: { include: { productos: true, lineas: true, turnos: true } },
  dia_no_laborable: true,
} as const;

@Injectable()
export class PlanProduccionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estadosLookup: EstadosLookupService,
  ) {}

  // Nunca hay un alta manual de "plan": se crea sola, la primera vez
  // que alguien carga un ítem o marca un día no laborable en esa
  // semana. fecha ya viene normalizada al lunes por el caller.
  async obtenerOCrearPlan(lunes: Date, idUsuario: number) {
    const existente = await this.prisma.plan_produccion.findFirst({ where: { fecha_inicio_semana: lunes } });
    if (existente) {
      return existente;
    }
    const idEstadoActivo = await this.estadosLookup.getId(ESTADO_ACTIVO);
    return this.prisma.plan_produccion.create({
      data: { fecha_inicio_semana: lunes, id_usuario: idUsuario, id_estado: idEstadoActivo },
    });
  }

  // Arma la semana (lunes a viernes) para la fecha pedida, con sus
  // ítems y días no laborables ya agrupados por día. Si todavía no hay
  // plan_produccion para ese lunes, devuelve la semana igual pero con
  // existe:false (para que el frontend muestre "aún no hay plan
  // cargado" en vez de un error).
  async obtenerSemana(fechaQuery: Date) {
    const lunes = lunesDe(fechaQuery);
    const plan = await this.prisma.plan_produccion.findFirst({
      where: { fecha_inicio_semana: lunes },
      include: INCLUDE_SEMANA,
    });

    const items = plan?.item_plan_produccion ?? [];
    const diasNoLaborables = plan?.dia_no_laborable ?? [];

    const dias = diasDeLaSemana(lunes).map((fecha) => ({
      fecha,
      no_laborable: diasNoLaborables.find((d) => d.fecha.getTime() === fecha.getTime()) ?? null,
      items: items.filter((item) => item.fecha.getTime() === fecha.getTime()),
    }));

    return {
      fecha_inicio_semana: lunes,
      existe: !!plan,
      dias,
    };
  }
}
