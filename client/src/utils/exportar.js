const fechaHoy = () =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' }); // 2026-11-22

const guardar = (blob, nombre) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

const formatearCelda = (col, valor) =>
    col.moneda ? Number(valor || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }) : valor;

export async function exportarReporte({ formato, archivo, titulo, periodo, columnas, filas, grafica }) {
    const nombre = `${archivo}_${fechaHoy()}.${formato}`;
    const generado = new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' });

    if (formato === 'csv') {
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const lineas = [
            columnas.map((c) => esc(c.header)).join(','),
            ...filas.map((f) => columnas.map((c) => esc(f[c.key])).join(',')),
        ];
        // BOM para que Excel respete las tildes
        return guardar(new Blob(['\uFEFF' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' }), nombre);
    }

    if (formato === 'xlsx') {
        const ExcelJS = (await import('exceljs')).default;
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet(titulo.slice(0, 31));

        ws.addRow([titulo]).font = { bold: true, size: 14 };
        ws.addRow([`Periodo: ${periodo}`]);
        ws.addRow([`Generado: ${generado}`]);
        ws.addRow([]);
        ws.addRow(columnas.map((c) => c.header)).font = { bold: true };

        columnas.forEach((c, i) => {
            ws.getColumn(i + 1).width = Math.max(14, c.header.length + 4);
            if (c.moneda) ws.getColumn(i + 1).numFmt = '#,##0.00';
        });
        filas.forEach((f) => ws.addRow(columnas.map((c) => f[c.key])));

        const buffer = await wb.xlsx.writeBuffer();
        return guardar(
            new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
            nombre
        );
    }

    if (formato === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;
        const doc = new jsPDF();
        const anchoPagina = doc.internal.pageSize.getWidth();

        doc.setFontSize(16).setTextColor(0).text(titulo, 14, 18);
        doc.setFontSize(9).setTextColor(100);
        doc.text(`Periodo: ${periodo}`, 14, 25);
        doc.text(`Generado: ${generado}`, 14, 30);

        let y = 36;

        // Gráfica (solo si el reporte tiene una)
        if (grafica) {
            const { toPng } = await import('html-to-image');
            const img = await toPng(grafica, {
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                // evita que se vea apagada o con texto claro (tema oscuro / estado de carga)
                style: { opacity: '1', color: '#222222' },
            });

            const props = doc.getImageProperties(img);
            let ancho = anchoPagina - 28;
            let alto = (props.height * ancho) / props.width;
            const altoMax = 110; // para que la tabla siga cabiendo en la primera página
            if (alto > altoMax) {
                alto = altoMax;
                ancho = (props.width * alto) / props.height;
            }
            doc.addImage(img, 'PNG', (anchoPagina - ancho) / 2, y, ancho, alto);
            y += alto + 8;
        }

        autoTable(doc, {
            startY: y,
            head: [columnas.map((c) => c.header)],
            body: filas.map((f) => columnas.map((c) => formatearCelda(c, f[c.key]))),
            headStyles: { fillColor: [63, 125, 78] },
        });
        return doc.save(nombre);
    }
}