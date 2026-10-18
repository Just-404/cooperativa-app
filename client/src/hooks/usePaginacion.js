import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Paginación en cliente con la página guardada en la URL (?pagina=3).
 *
 * @param items      Lista ya filtrada.
 * @param porPagina  Elementos por página.
 * @param opciones.clave        Nombre del parámetro en la URL (útil si hay 2 tablas en una página).
 * @param opciones.reiniciarCon Valores que, al cambiar, devuelven a la página 1 (búsqueda, filtros...).
 */
export default function usePaginacion(
  items,
  porPagina = 10,
  { clave = 'pagina', reiniciarCon = [] } = {}
) {
  const [params, setParams] = useSearchParams();

  const pedida = parseInt(params.get(clave), 10);
  const pagina = Number.isFinite(pedida) && pedida > 0 ? pedida : 1;

  const total = items.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  // Derivada: no toca la URL, así que mientras los datos cargan (lista vacía)
  // la página pedida se conserva y se aplica cuando llegan.
  const paginaActual = Math.min(pagina, totalPaginas);

  const setPagina = useCallback(
    (n) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (n <= 1) next.delete(clave);
          else next.set(clave, String(n));
          return next;
        },
        { replace: true }
      );
    },
    [setParams, clave]
  );

  // Reinicio automático al cambiar búsqueda/filtros (seguro con StrictMode y sin
  // resetear al montar, para no perder la página al volver del detalle).
  const llave = JSON.stringify(reiniciarCon);
  const llaveAnterior = useRef(llave);
  useEffect(() => {
    if (llaveAnterior.current !== llave) {
      llaveAnterior.current = llave;
      setPagina(1);
    }
  }, [llave, setPagina]);

  const visibles = useMemo(
    () => items.slice((paginaActual - 1) * porPagina, paginaActual * porPagina),
    [items, paginaActual, porPagina]
  );

  const desde = total === 0 ? 0 : (paginaActual - 1) * porPagina + 1;
  const hasta = Math.min(paginaActual * porPagina, total);

  return {
    visibles,
    paginaActual,
    totalPaginas,
    total,
    desde,
    hasta,
    setPagina,
    reiniciar: () => setPagina(1),
    hayMasDeUnaPagina: total > porPagina,
  };
}