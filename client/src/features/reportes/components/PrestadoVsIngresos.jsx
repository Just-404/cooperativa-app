import { useEffect, useRef, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, LabelList,
} from 'recharts';
import { prestadoVsIngresos } from '../services/reportes.service';
import BotonDescarga from './BotonDescarga';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const fmt = (n) => `RD$ ${Number(n).toLocaleString()}`;

// Valores compactos para las etiquetas: 1.2M, 350k
const compacto = (v) => {
    const n = Number(v || 0);
    if (!n) return '';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
    return n;
};

const PERIODOS = [
    { valor: 3, etiqueta: 'Últimos 3 meses' },
    { valor: 6, etiqueta: 'Últimos 6 meses' },
    { valor: 12, etiqueta: 'Últimos 12 meses' },
];

export default function PrestadoVsIngresos() {
    const graficaRef = useRef(null);
    const [datos, setDatos] = useState([]);
    const [error, setError] = useState('');
    const [meses, setMeses] = useState(12);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        let cancelado = false;
        setCargando(true);
        setError('');

        prestadoVsIngresos(meses)
            .then((filas) => {
                if (cancelado) return;
                setDatos(
                    filas.map((f) => ({
                        nombre: `${MESES_CORTO[f.mes - 1]} ${String(f.anio).slice(2)}`,
                        Prestado: f.prestado,
                        Ingresos: f.ingresos,
                    }))
                );
            })
            .catch((err) => {
                if (cancelado) return;
                setError(err.response?.data?.error?.message || 'No se pudo cargar el gráfico');
            })
            .finally(() => !cancelado && setCargando(false));

        return () => { cancelado = true; };
    }, [meses]);

    const totalPrestado = datos.reduce((s, d) => s + Number(d.Prestado || 0), 0);
    const totalIngresos = datos.reduce((s, d) => s + Number(d.Ingresos || 0), 0);

    return (
        <section className="card">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 12,
            }}>
                <h4 style={{ margin: 0 }}>Prestado vs. Ingresos</h4>

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

                    <BotonDescarga
                        archivo="prestado-vs-ingresos"
                        titulo="Prestado vs. Ingresos"
                        periodo={PERIODOS.find((p) => p.valor === meses).etiqueta}
                        columnas={[
                            { header: 'Mes', key: 'nombre' },
                            { header: 'Prestado (RD$)', key: 'Prestado', moneda: true },
                            { header: 'Ingresos (RD$)', key: 'Ingresos', moneda: true },
                        ]}
                        filas={datos.length ? [...datos, { nombre: 'Total', Prestado: totalPrestado, Ingresos: totalIngresos }] : []}
                        grafica={graficaRef}
                    />
                </div>
            </div>

            {error && <div className="alert error">{error}</div>}

            {!error && (
                <div ref={graficaRef} style={{ opacity: cargando ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', marginBottom: 8 }}>
                        <span>Total prestado: <b style={{ color: '#a94442' }}>{fmt(totalPrestado)}</b></span>
                        <span>Total ingresos: <b style={{ color: '#3f7d4e' }}>{fmt(totalIngresos)}</b></span>
                    </div>

                    <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datos} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                                />
                                <Tooltip formatter={(v) => fmt(v)} />
                                <Legend />
                                <Bar dataKey="Prestado" fill="#a94442" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="Prestado" position="top" fontSize={10} formatter={compacto} />
                                </Bar>
                                <Bar dataKey="Ingresos" fill="#3f7d4e" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="Ingresos" position="top" fontSize={10} formatter={compacto} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </section>
    );
}