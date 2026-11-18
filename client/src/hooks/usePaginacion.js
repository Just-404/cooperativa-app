import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Paginación en cliente con página y tamaño guardados en la URL
 * (?pagina=3&por=25).
 *
 * @param items               Lista ya filtrada.
 * @param porPaginaInicial    Elementos por página por defecto.
 * @param opciones.clave          Parámetro de la página (útil si hay 2 tablas en una vista).
 * @param opciones.claveTamano    Parámetro del tamaño de página.
 * @param opciones.opciones       Tamaños permitidos en el selector.
 * @param opciones.reiniciarCon   Valores que, al cambiar, devuelven a la página 1.
 */
export default function usePaginacion(
  items,
  porPaginaInicial = 10,
  {
    clave = 'pagina',
    claveTamano = 'por',
    opciones = [10, 25, 50, 100],
    reiniciarCon = [],
  } = {}
) {
  const [params, setParams] = useSearchParams();

  // Solo se aceptan tamaños de la lista; cualquier otro valor en la URL se ignora.
  const pedidoTam = parseInt(params.get(claveTamano), 10);
  const porPagina = opciones.includes(pedidoTam) ? pedidoTam : porPaginaInicial;

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

  // Cambia el tamaño y vuelve a la página 1 en una sola actualización de la URL.
  const setPorPagina = useCallback(
    (n) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (n === porPaginaInicial) next.delete(claveTamano);
          else next.set(claveTamano, String(n));
          next.delete(clave);
          return next;
        },
        { replace: true }
      );
    },
    [setParams, clave, claveTamano, porPaginaInicial]
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
    porPagina,
    setPorPagina,
    opciones,
    reiniciar: () => setPagina(1),
    hayMasDeUnaPagina: total > porPagina,
  };
}