import { useEffect, useState, useRef } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, LabelList
} from 'recharts';
import { cuentasMovimiento } from '../services/reportes.service';
import BotonDescarga from './BotonDescarga';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const PERIODOS = [
    { valor: 3, etiqueta: 'Últimos 3 meses' },
    { valor: 6, etiqueta: 'Últimos 6 meses' },
    { valor: 12, etiqueta: 'Últimos 12 meses' },
];

export default function CuentasAbiertasCerradas() {
    const graficaRef = useRef(null);
    const [datos, setDatos] = useState([]);
    const [error, setError] = useState('');
    const [meses, setMeses] = useState(6);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        let cancelado = false;
        setCargando(true);
        setError('');

        cuentasMovimiento(meses)
            .then((filas) => {
                if (cancelado) return;
                setDatos(
                    filas.map((f) => {
                        const [anio, mes] = f.mes.split('-'); // "2026-11"
                        return {
                            nombre: `${MESES_CORTO[Number(mes) - 1]} ${anio.slice(2)}`,
                            Abiertas: f.abiertas,
                            Cerradas: f.cerradas,
                        };
                    })
                );
            })
            .catch((err) => {
                if (cancelado) return;
                setError(err.response?.data?.error?.message || 'No se pudo cargar el gráfico');
            })
            .finally(() => !cancelado && setCargando(false));

        return () => { cancelado = true; };
    }, [meses]);

    const totalAbiertas = datos.reduce((s, d) => s + Number(d.Abiertas || 0), 0);
    const totalCerradas = datos.reduce((s, d) => s + Number(d.Cerradas || 0), 0);
    const neto = totalAbiertas - totalCerradas;

    return (
        <section className="card">
            {/* Encabezado: queda fuera del ref, así que no sale en las descargas */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 12,
            }}>
                <h4 style={{ margin: 0 }}>Cuentas Abiertas vs. Cerradas</h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select
                        value={meses}
                        onChange={(e) => setMeses(Number(e.target.value))}
                        style={{ fontSize: '0.75rem', padding: '2px 6px', height: 26, width: 'auto', minWidth: 0 }}
                    >
                        {PERIODOS.map((p) => (
                            <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
                        ))}
                    </select>

                    <span aria-hidden="true" style={{ width: 1, height: 18, background: 'currentColor', opacity: 0.2 }} />

                    <BotonDescarga
                        archivo="cuentas-abiertas-cerradas"
                        titulo="Cuentas Abiertas vs. Cerradas"
                        periodo={PERIODOS.find((p) => p.valor === meses).etiqueta}
                        columnas={[
                            { header: 'Mes', key: 'nombre' },
                            { header: 'Abiertas', key: 'Abiertas' },
                            { header: 'Cerradas', key: 'Cerradas' },
                        ]}
                        filas={datos.length ? [...datos, { nombre: 'Total', Abiertas: totalAbiertas, Cerradas: totalCerradas }] : []}
                        grafica={graficaRef}
                    />
                </div>
            </div>

            {error && <div className="alert error">{error}</div>}

            {!error && (
                /* Solo esto se captura para el PDF: totales + gráfica */
                <div ref={graficaRef} style={{ opacity: cargando ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', marginBottom: 8 }}>
                        <span>Total abiertas: <b style={{ color: '#3f7d4e' }}>{totalAbiertas}</b></span>
                        <span>Total cerradas: <b style={{ color: '#a94442' }}>{totalCerradas}</b></span>
                        <span>Neto: <b>{neto > 0 ? `+${neto}` : neto}</b></span>
                    </div>

                    <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datos} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Abiertas" fill="#3f7d4e" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="Abiertas" position="top" fontSize={11} formatter={(v) => v || ''} />
                                </Bar>
                                <Bar dataKey="Cerradas" fill="#a94442" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="Cerradas" position="top" fontSize={11} formatter={(v) => v || ''} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </section>
    );
}