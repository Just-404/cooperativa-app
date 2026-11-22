import { useEffect, useRef, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { prestamosPorTipo } from '../services/reportes.service';
import BotonDescarga from './BotonDescarga';

const COLORES = ['#2f6f4f', '#c9a227', '#3a6ea5', '#b3402f', '#7a5195', '#4f9d9d'];

// Detecta pantallas angostas y se actualiza al redimensionar
function useEsMovil(maxAncho = 600) {
    const [esMovil, setEsMovil] = useState(
        typeof window !== 'undefined' && window.matchMedia(`(max-width: ${maxAncho}px)`).matches
    );
    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${maxAncho}px)`);
        const onChange = (e) => setEsMovil(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [maxAncho]);
    return esMovil;
}

export default function PrestamosPorTipo() {
    const graficaRef = useRef(null);
    const [data, setData] = useState([]);
    const esMovil = useEsMovil();

    useEffect(() => { prestamosPorTipo().then(setData).catch(() => { }); }, []);

    if (!data.length) return null;
    const masUsado = data[0];
    const menosUsado = data[data.length - 1];
    const conDatos = data.filter((d) => d.cantidad > 0);

    return (
        <div className="card">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
            }}>
                <h4 style={{ margin: 0 }}>Tipos de Préstamos Más Solicitados</h4>

                <BotonDescarga
                    archivo="prestamos-por-tipo"
                    titulo="Préstamos por Tipo"
                    periodo="-"
                    columnas={[
                        { header: 'Tipo', key: 'nombre' },
                        { header: 'Cantidad', key: 'cantidad' },
                    ]}
                    filas={data}
                    grafica={graficaRef}
                />
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                Más usado: <b>{masUsado.nombre}</b> ({masUsado.cantidad}) ·
                Menos usado: <b>{menosUsado.nombre}</b> ({menosUsado.cantidad})
            </p>

            <div ref={graficaRef} style={{ width: '100%', height: esMovil ? 280 : 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={conDatos}
                            dataKey="cantidad"
                            nameKey="nombre"
                            cx="50%"
                            cy={esMovil ? '45%' : '50%'}
                            outerRadius={esMovil ? '65%' : '75%'}
                            label={esMovil ? false : ({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            labelLine={!esMovil}
                        >
                            {conDatos.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend
                            verticalAlign={esMovil ? 'bottom' : 'middle'}
                            align={esMovil ? 'center' : 'right'}
                            layout={esMovil ? 'horizontal' : 'vertical'}
                            wrapperStyle={{ fontSize: '0.8rem' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}