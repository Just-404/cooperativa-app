// Recalcula las fechas de vencimiento de las cuotas pendientes de todos los
// préstamos desembolsados/cerrados, evitando fines de semana y feriados.
//
// Uso:
//   npm run recalcular-fechas              aplica los cambios
//   npm run recalcular-fechas -- --dry-run solo muestra lo que cambiaría

const { sequelize, Prestamo } = require('../src/models');
const cuotasService = require('../src/services/cuotas.service');

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const prestamos = await Prestamo.findAll({
    where: { estado: ['desembolsado', 'cerrado'] },
    order: [['fechaDesembolso', 'ASC']],
  });

  let total = 0;
  let prestamosAfectados = 0;

  for (const prestamo of prestamos) {
    const resultado = await cuotasService.recalcularFechasCuotas(prestamo.id, { dryRun });
    if (resultado.cuotasActualizadas > 0) {
      prestamosAfectados++;
      console.log(
        `Préstamo ${prestamo.id.slice(0, 8)}: ${resultado.cuotasActualizadas} cuota(s) ` +
        `${dryRun ? 'cambiarían' : 'actualizada(s)'} (fecha base ${resultado.fechaBase})`
      );
      for (const cambio of resultado.cambios.slice(0, 3)) {
        console.log(`  Cuota ${cambio.numeroCuota}: ${cambio.fechaAnterior} => ${cambio.fechaNueva}`);
      }
      if (resultado.cambios.length > 3) {
        console.log(`  ... y ${resultado.cambios.length - 3} más`);
      }
      total += resultado.cuotasActualizadas;
    }
  }

  console.log(
    `\n${total} cuota(s) ${dryRun ? 'cambiarían' : 'actualizada(s)'} en ` +
    `${prestamosAfectados} de ${prestamos.length} préstamo(s).` +
    (dryRun ? ' (dry-run: no se escribió en la BD)' : '')
  );
  await sequelize.close();
}

main().catch(async (err) => {
  console.error('Error al recalcular fechas:', err);
  await sequelize.close();
  process.exit(1);
});
