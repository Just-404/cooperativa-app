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

export default function Paginacion({ paginaActual, totalPaginas, onCambiar, desde, hasta, total }) {
  if (totalPaginas <= 1) return null;

  const ir = (n) => onCambiar(Math.min(Math.max(1, n), totalPaginas));

  return (
    <nav
      aria-label="Paginación"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        marginTop: 14,
      }}
    >
      <span style={{ color: 'var(--ink-soft)' }}>
        {total != null
          ? `Mostrando ${desde}–${hasta} de ${total}`
          : `Página ${paginaActual} de ${totalPaginas}`}
      </span>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn"
          onClick={() => ir(paginaActual - 1)}
          disabled={paginaActual === 1}
          aria-label="Página anterior"
        >
          ‹ Anterior
        </button>

        {ventana(paginaActual, totalPaginas).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} aria-hidden="true" style={{ color: 'var(--ink-soft)', padding: '0 4px' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={p === paginaActual ? 'btn primary' : 'btn'}
              onClick={() => ir(p)}
              aria-current={p === paginaActual ? 'page' : undefined}
              aria-label={`Página ${p}`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className="btn"
          onClick={() => ir(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          aria-label="Página siguiente"
        >
          Siguiente ›
        </button>
      </div>
    </nav>
  );
}