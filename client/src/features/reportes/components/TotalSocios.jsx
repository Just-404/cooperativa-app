import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const formatoNumero = (v) => Number(v || 0).toLocaleString('es-DO');

export default function TotalSocios({ data }) {
    if (!data) return null;

    const activos = Number(data.totalSocios || 0);
    const inactivos = Number(data.sociosInactivos || 0);
    const total = activos + inactivos;

    const pctActivos = total ? (activos / total) * 100 : 0;
    const pctInactivos = total ? 100 - pctActivos : 0;

    const segmentos = [
        { etiqueta: 'Activos', cantidad: activos, porcentaje: pctActivos, color: '#3f7d4e' },
        { etiqueta: 'Inactivos', cantidad: inactivos, porcentaje: pctInactivos, color: '#b88b2d' },
    ];

    const pctVisibleActivos = Math.round(pctActivos);
    const pctVisible = [pctVisibleActivos, 100 - pctVisibleActivos];

    return (
        <section className="dashboard-panel">
            <div className="dashboard-section-heading">
                <div>
                    <h2>Socios</h2>
                </div>
                <Link className="dashboard-text-link" to="/socios">
                    Ver socios
                    <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
            </div>

            {total ? (
                <div style={{ display: 'grid', gap: 18 }}>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: '2.6rem', fontWeight: 700, lineHeight: 1 }}>
                            {formatoNumero(total)}
                        </span>
                        <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>socios en total</span>
                    </p>

                    <div
                        role="img"
                        aria-label={`Socios: ${formatoNumero(activos)} activos y ${formatoNumero(inactivos)} inactivos`}
                        style={{
                            display: 'flex',
                            width: '100%',
                            height: 12,
                            borderRadius: 999,
                            overflow: 'hidden',
                        }}
                    >
                        {segmentos.map((s) =>
                            s.porcentaje > 0 ? (
                                <div
                                    key={s.etiqueta}
                                    style={{
                                        width: `${s.porcentaje}%`,
                                        background: s.color,
                                        transition: 'width 0.4s ease',
                                    }}
                                />
                            ) : null
                        )}
                    </div>

                    <ul
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            columnGap: 40,
                            rowGap: 8,
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                        }}
                    >
                        {segmentos.map((s, i) => (
                            <li
                                key={s.etiqueta}
                                style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}
                            >
                                <span
                                    aria-hidden="true"
                                    style={{
                                        width: 9,
                                        height: 9,
                                        borderRadius: '50%',
                                        background: s.color,
                                        flexShrink: 0,
                                        alignSelf: 'center',
                                    }}
                                />
                                <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>{s.etiqueta}</span>
                                <strong style={{ fontSize: '1rem', lineHeight: 1 }}>
                                    {formatoNumero(s.cantidad)}
                                </strong>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: s.color }}>
                                    {pctVisible[i]}%
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="dashboard-chart-empty">No hay socios registrados todavía.</p>
            )}
        </section>
    );
}