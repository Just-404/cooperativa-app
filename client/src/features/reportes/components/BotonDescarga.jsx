import { useState } from 'react';
import { exportarReporte } from '../../../utils/exportar';

export default function BotonDescarga({ archivo, titulo, periodo, columnas, filas, grafica }) {
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState('');

    const descargar = async (formato) => {
        if (!formato) return;
        setGenerando(true);
        setError('');
        try {
            await exportarReporte({
                formato, archivo, titulo, periodo, columnas, filas,
                grafica: grafica?.current,
            });
        } catch {
            setError('No se pudo generar el archivo');
        } finally {
            setGenerando(false);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <select
                value=""
                onChange={(e) => descargar(e.target.value)}
                disabled={generando || !filas?.length}
                aria-label="Descargar reporte"
                style={{ fontSize: '0.75rem', padding: '2px 6px', height: 26, width: 'auto', minWidth: 0 }}
            >
                <option value="" disabled>{generando ? 'Generando…' : 'Descargar…'}</option>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="pdf">PDF</option>
            </select>

            {error && (
                <div className="alert error" role="alert" style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: 4,
                    fontSize: '0.75rem', whiteSpace: 'nowrap', zIndex: 10,
                }}>
                    {error}
                </div>
            )}
        </div>
    );
}