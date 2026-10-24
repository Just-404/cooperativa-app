import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { prestadoVsIngresos } from '../services/reportes.service';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const fmt = (n) => `RD$ ${Number(n).toLocaleString()}`;

const PERIODOS = [
    { valor: 3, etiqueta: 'Últimos 3 meses' },
    { valor: 6, etiqueta: 'Últimos 6 meses' },
    { valor: 12, etiqueta: 'Últimos 12 meses' }
];

export default function PrestadoVsIngresos() {
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

    return (
        <section style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Prestado vs. ingresos</h4>
                <select value={meses} onChange={(e) => setMeses(Number(e.target.value))} style={{
                    fontSize: '0.75rem',
                    padding: '2px 6px',
                    height: 26,
                    width: 'auto',
                    minWidth: 0,
                }}>
                    {PERIODOS.map((p) => (
                        <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
                    ))}
                </select>
            </div>

            {error && <div className="alert error">{error}</div>}

            {!error && (
                <div className="card" style={{ height: 320, opacity: cargando ? 0.6 : 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datos} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                            />
                            <Tooltip formatter={(v) => fmt(v)} />
                            <Legend />
                            <Bar dataKey="Prestado" fill="#a94442" radius={[4, 4, 0, 0]}/>
                            <Bar dataKey="Ingresos" fill="#3f7d4e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}