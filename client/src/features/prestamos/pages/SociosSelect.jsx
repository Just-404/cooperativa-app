import { useMemo, useState, useRef, useEffect } from 'react';

const normalizar = (t) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function SocioSelect({ socios, value, onChange }) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const ref = useRef(null);

  const seleccionado = socios.find((s) => String(s.id) === String(value));

  const resultados = useMemo(() => {
    const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return socios.slice(0, 50);
    return socios
      .filter((s) => {
        const hay = normalizar(`${s.nombre} ${s.apellido} ${s.documento ?? ''}`);
        return palabras.every((p) => hay.includes(p));
      })
      .slice(0, 50);
  }, [socios, texto]);

  useEffect(() => setActivo(0), [texto]);

  useEffect(() => {
    function fuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, []);

  function elegir(s) {
    onChange(String(s.id));
    setTexto('');
    setAbierto(false);
  }

  function limpiar() {
    onChange('');
    setTexto('');
    setAbierto(true);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAbierto(true); setActivo((i) => Math.min(i + 1, resultados.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && abierto && resultados[activo]) { e.preventDefault(); elegir(resultados[activo]); }
    else if (e.key === 'Escape') setAbierto(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {seleccionado ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input readOnly value={`${seleccionado.nombre} ${seleccionado.apellido}`} />
          <button type="button" className="btn" onClick={limpiar}>Cambiar</button>
        </div>
      ) : (
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o cédula"
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
      )}

      {/* Mantiene la validación "required" del formulario */}
      <input
        tabIndex={-1}
        required
        value={value}
        onChange={() => {}}
        style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
      />

      {abierto && !seleccionado && (
        <ul
          style={{
            position: 'absolute', zIndex: 10, left: 0, right: 0, margin: 0, padding: 0,
            listStyle: 'none', maxHeight: 220, overflowY: 'auto',
            background: 'var(--paper, #fff)', border: '1px solid var(--line, #ccc)', borderRadius: 6,
          }}
        >
          {resultados.map((s, i) => (
            <li
              key={s.id}
              onMouseDown={() => elegir(s)}
              onMouseEnter={() => setActivo(i)}
              style={{
                padding: '8px 10px', cursor: 'pointer',
                background: i === activo ? 'var(--line, #eee)' : 'transparent',
              }}
            >
              {s.nombre} {s.apellido}
              {s.documento && <span style={{ color: 'var(--ink-soft)', marginLeft: 8 }}>{s.documento}</span>}
            </li>
          ))}
          {resultados.length === 0 && (
            <li style={{ padding: '8px 10px', color: 'var(--ink-soft)' }}>Sin resultados</li>
          )}
        </ul>
      )}
    </div>
  );
}