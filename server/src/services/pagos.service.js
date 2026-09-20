// Lógica de negocio del módulo: pagos
// TODO: implementar reglas de negocio (ver Alcance_del_proyecto.docx)

async function listar() {
  return [];
}

// Identifica cuotas vencidas y calcula los días/monto de mora.
// Puede invocarse desde un endpoint administrativo o desde un scheduler externo al proceso Node.
async function calcularMora() {
  // TODO: implementar lógica real del módulo "Pagos y mora"
}

module.exports = { listar, calcularMora };
