// Recalcula las fechas de vencimiento de las cuotas pendientes de todos los
// préstamos desembolsados/cerrados, evitando fines de semana y feriados.
//
// Uso: npm run recalcular-fechas

const { sequelize, Prestamo } = require('../src/models');
const cuotasService = require('../src/services/cuotas.service');

async function main() {
  const prestamos = await Prestamo.findAll({
    where: { estado: ['desembolsado', 'cerrado'] },
    order: [['fechaDesembolso', 'ASC']],
  });

  let total = 0;

  for (const prestamo of prestamos) {
    const resultado = await cuotasService.recalcularFechasCuotas(prestamo.id);
    if (resultado.cuotasActualizadas > 0) {
      console.log(
        `Préstamo ${prestamo.id.slice(0, 8)}: ${resultado.cuotasActualizadas} cuota(s) actualizada(s) ` +
        `(fecha base ${resultado.fechaBase})`
      );
      total += resultado.cuotasActualizadas;
    }
  }

  console.log(`\n${total} cuota(s) actualizada(s) en ${prestamos.length} préstamo(s).`);
  await sequelize.close();
}

main().catch(async (err) => {
  console.error('Error al recalcular fechas:', err);
  await sequelize.close();
  process.exit(1);
});
