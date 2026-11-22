import { useEffect, useState } from 'react';
import { prestamosDelMes } from '../services/reportes.service';
import BotonDescarga from './BotonDescarga';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
    'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const mesAnterior = ({ anio, mes }) =>
    mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };

const aValor = ({ anio, mes }) => `${anio}-${String(mes).padStart(2, '0')}`;

const deValor = (valor) => {
    const [anio, mes] = valor.split('-').map(Number);
    return { anio, mes };
};

function Variacion({ actual, previo, invertir = false }) {
    if (previo == null) return null;
    const dif = actual - previo;
    if (dif === 0) {
        return <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>= igual que el mes anterior</div>;
    }
    const esBueno = invertir ? dif < 0 : dif > 0;
    return (
        <div style={{ fontSize: '0.7rem', color: esBueno ? 'var(--forest)' : 'var(--danger)' }}>
            {dif > 0 ? '▲' : '▼'} {Math.abs(dif)} vs. mes anterior
        </div>
    );
}

export default function ResumenMes() {
    const hoy = new Date();
    const [periodo, setPeriodo] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 });
    const [actual, setActual] = useState(null);
    const [previo, setPrevio] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const ant = mesAnterior(periodo);
        setError('');
        Promise.all([
            prestamosDelMes(periodo.anio, periodo.mes),
            prestamosDelMes(ant.anio, ant.mes),
        ])
            .then(([a, p]) => {
                setActual(a);
                setPrevio(p);
            })
            .catch((err) =>
                setError(err.response?.data?.error?.message || 'No se pudo cargar el resumen del mes')
            );
    }, [periodo]);

    const mover = (delta) =>
        setPeriodo(({ anio, mes }) => {
            const m = mes + delta;
            if (m < 1) return { anio: anio - 1, mes: 12 };
            if (m > 12) return { anio: anio + 1, mes: 1 };
            return { anio, mes: m };
        });

    const esMesActual = periodo.anio === hoy.getFullYear() && periodo.mes === hoy.getMonth() + 1;
    const maxValor = aValor({ anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 });

    const onCambiarMes = (e) => {
        if (!e.target.value) return; // el usuario borró el campo
        setPeriodo(deValor(e.target.value));
    };

    const tarjetas = [
        { k: 'solicitados', titulo: 'Solicitados', color: 'var(--ink)' },
        { k: 'aprobados', titulo: 'Aprobados', color: 'var(--forest)' },
        { k: 'rechazados', titulo: 'Rechazados', color: 'var(--danger)', invertir: true },
    ];

    const resueltos = actual ? actual.aprobados + actual.rechazados : 0;
    const tasa = resueltos ? Math.round((actual.aprobados / resueltos) * 100) : 0;
    const altoControl = { height: 26, fontSize: '0.75rem', padding: '0 8px', width: 'auto', minWidth: 0 };

    return (
        <section>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <h4 style={{ margin: 0 }}>Préstamos del Mes</h4>

                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginLeft: 'auto' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button type="button" onClick={() => mover(-1)} aria-label="Mes anterior" style={altoControl}>‹</button>
                        <input
                            type="month"
                            className="mono"
                            value={aValor(periodo)}
                            max={maxValor}
                            onChange={onCambiarMes}
                            aria-label="Seleccionar mes"
                            style={altoControl}
                        />
                        <button type="button" onClick={() => mover(1)} disabled={esMesActual} aria-label="Mes siguiente" style={altoControl}>›</button>
                    </div>

                    <span aria-hidden="true" style={{ width: 1, height: 18, background: 'currentColor', opacity: 0.2 }} />

                    <BotonDescarga
                        archivo="resumen-mes"
                        titulo="Resumen del Mes"
                        periodo={`${MESES[periodo.mes - 1]} ${periodo.anio}`}
                        columnas={[
                            { header: 'Concepto', key: 'concepto' },
                            { header: 'Cantidad', key: 'cantidad' },
                        ]}
                        filas={actual ? [
                            { concepto: 'Solicitados', cantidad: actual.solicitados },
                            { concepto: 'Aprobados', cantidad: actual.aprobados },
                            { concepto: 'Rechazados', cantidad: actual.rechazados },
                        ] : []}
                    />
                </div>
            </div>

            {error && <div className="alert error" style={{ marginTop: 12 }}>{error}</div>}

            {actual && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 16 }}>
                        {tarjetas.map(({ k, titulo, color, invertir }) => (
                            <div key={k} className="card">
                                <div className="mono" style={{ fontSize: '1.4rem', color }}>{actual[k]}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{titulo}</div>
                                <Variacion actual={actual[k]} previo={previo?.[k]} invertir={invertir} />
                            </div>
                        ))}
                    </div>

                    {resueltos > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden' }}>
                                <div style={{ width: `${tasa}%`, background: 'var(--forest)' }} />
                                <div style={{ width: `${100 - tasa}%`, background: 'var(--danger)' }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: 4 }}>
                                {tasa}% de aprobación ({actual.aprobados} de {resueltos} resueltos)
                            </div>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}