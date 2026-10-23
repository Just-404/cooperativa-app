import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { prestadoVsIngresos } from '../services/reportes.service';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const fmt = (n) => `RD$ ${Number(n).toLocaleString()}`;

export default function PrestadoVsIngresos() {
    const [datos, setDatos] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        prestadoVsIngresos(12)
            .then((filas) =>
                setDatos(
                    filas.map((f) => ({
                        nombre: `${MESES_CORTO[f.mes - 1]} ${String(f.anio).slice(2)}`,
                        Prestado: f.prestado,
                        Ingresos: f.ingresos,
                    }))
                )
            )
            .catch((err) =>
                setError(err.response?.data?.error?.message || 'No se pudo cargar el gráfico')
            );
    }, []);

    return (
        <section style={{ marginTop: 32 }}>
            <h4 style={{ margin: 0 }}>Prestado vs. ingresos</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', margin: '4px 0 12px' }}>
                Últimos 12 meses
            </p>

            {error && <div className="alert error">{error}</div>}

            {!error && (
                <div className="card" style={{ height: 320 }}>
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
                            <Bar dataKey="Prestado" fill="#a94442" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Ingresos" fill="#3f7d4e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}