// Devuelve [1, '…', 4, 5, 6, '…', 12] según la página actual.
function ventana(actual, total, vecinos = 1) {
  const paginas = new Set([1, total]);
  for (let i = actual - vecinos; i <= actual + vecinos; i++) {
    if (i >= 1 && i <= total) paginas.add(i);
  }
  const orden = [...paginas].sort((a, b) => a - b);
  const salida = [];
  orden.forEach((p, i) => {
    if (i > 0 && p - orden[i - 1] > 1) salida.push('…');
    salida.push(p);
  });
  return salida;
}

export default function Paginacion({
  paginaActual,
  totalPaginas,
  onCambiar,
  desde,
  hasta,
  total,
  porPagina,
  opcionesPorPagina = [],
  onCambiarPorPagina,
}) {
  const puedeCambiarTamano =
    Boolean(onCambiarPorPagina) &&
    total != null &&
    total > Math.min(...opcionesPorPagina);

  // No se oculta si hay selector: si el usuario eligió "100" y queda una sola
  // página, necesita poder volver a un tamaño menor.
  if (totalPaginas <= 1 && !puedeCambiarTamano) return null;

  const ir = (n) => onCambiar(Math.min(Math.max(1, n), totalPaginas));

  return (
    <nav aria-label="Paginación" className="pag">
      <span className="pag-info">
        {total != null
          ? `Mostrando ${desde}–${hasta} de ${total}`
          : `Página ${paginaActual} de ${totalPaginas}`}
      </span>

      {puedeCambiarTamano && (
        <label className="pag-tamano">
          <span className="pag-txt">Por página </span>
          <select
            value={porPagina}
            onChange={(e) => onCambiarPorPagina(Number(e.target.value))}
            aria-label="Registros por página"
            style={{ width: 'auto', padding: '3px 24px 3px 8px', fontSize: 13, height: 'auto', minHeight: 0 }}
          >
            {opcionesPorPagina.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      )}

      <div className="pag-controles">
        <button
          type="button"
          className="btn pag-nav"
          onClick={() => ir(paginaActual - 1)}
          disabled={paginaActual === 1}
          aria-label="Página anterior"
        >
          ‹<span className="pag-txt"> Anterior</span>
        </button>

        {ventana(paginaActual, totalPaginas).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} aria-hidden="true" className="pag-gap">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${p === paginaActual ? 'btn primary' : 'btn'} pag-num${p === paginaActual ? ' actual' : ''
                }`}
              onClick={() => ir(p)}
              aria-current={p === paginaActual ? 'page' : undefined}
              aria-label={`Página ${p}`}
            >
              {p}
            </button>
          )
        )}

        <span className="pag-movil" aria-hidden="true">
          {paginaActual} / {totalPaginas}
        </span>

        <button
          type="button"
          className="btn pag-nav"
          onClick={() => ir(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          aria-label="Página siguiente"
        >
          <span className="pag-txt">Siguiente </span>›
        </button>
      </div>
    </nav>
  );
}