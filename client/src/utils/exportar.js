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

// Una columna es numérica si todos sus valores son números (o están vacíos)
const esNumerica = (col, filas) =>
    !!col.moneda ||
    filas.every((f) => f[col.key] === '' || f[col.key] == null || typeof f[col.key] === 'number');

// Filas que se resaltan: las que dicen "Total" o las marcadas con resaltar: true
const esResaltada = (fila, columnas) =>
    fila.resaltar === true || String(fila[columnas[0].key]).trim() === 'Total';

export async function exportarReporte({ formato, archivo, titulo, periodo, columnas, filas, grafica }) {
    const nombre = `${archivo}_${fechaHoy()}.${formato}`;
    const generado = new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' });

    if (formato === 'xlsx') {
        const ExcelJS = (await import('exceljs')).default;
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet(titulo.slice(0, 31), { views: [{ showGridLines: false }] });
        const numericas = columnas.map((c) => esNumerica(c, filas));
        const borde = { bottom: { style: 'thin', color: { argb: 'FFDDE3DD' } } };

        ws.addRow([titulo]).font = { bold: true, size: 14 };
        ws.addRow([`Periodo: ${periodo}`]).font = { color: { argb: 'FF666666' } };
        ws.addRow([`Generado: ${generado}`]).font = { color: { argb: 'FF666666' } };
        ws.addRow([]);

        // Encabezado
        const cab = ws.addRow(columnas.map((c) => c.header));
        cab.height = 22;
        cab.eachCell((cell, i) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3F7D4E' } };
            cell.alignment = { vertical: 'middle', horizontal: numericas[i - 1] ? 'right' : 'left', indent: 1 };
        });

        // Datos con filas alternadas y filas resaltadas
        filas.forEach((f, idx) => {
            const fila = ws.addRow(columnas.map((c) => f[c.key]));
            const resaltar = esResaltada(f, columnas);
            fila.height = 20;
            fila.eachCell({ includeEmpty: true }, (cell, i) => {
                cell.border = borde;
                cell.alignment = { vertical: 'middle', horizontal: numericas[i - 1] ? 'right' : 'left', indent: 1 };
                if (resaltar) {
                    cell.font = { bold: true };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0EA' } };
                } else if (idx % 2 === 1) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F8F6' } };
                }
            });
        });

        columnas.forEach((c, i) => {
            const col = ws.getColumn(i + 1);
            col.width = Math.max(16, c.header.length + 6);
            col.numFmt = c.moneda ? '#,##0.00' : '#,##0';
        });
        ws.getColumn(1).numFmt = '@'; // la primera columna es texto (meses, tipos, etc.)

        ws.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }]; // el encabezado queda fijo al bajar

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
            const PIXEL_RATIO = 2;
            const PX_A_MM = 25.4 / 96;

            // Medimos el contenido real, no solo la caja visible
            const anchoPx = grafica.scrollWidth;
            const altoPx = grafica.scrollHeight;

            const img = await toPng(grafica, {
                pixelRatio: PIXEL_RATIO,
                backgroundColor: '#ffffff',
                width: anchoPx,
                height: altoPx,
                style: {
                    opacity: '1',
                    color: '#222222',
                    overflow: 'visible',
                    width: `${anchoPx}px`,
                    height: `${altoPx}px`,
                    margin: '0',
                },
            });

            // Tamaño natural en mm; solo se reduce si no cabe, nunca se amplía
            const props = doc.getImageProperties(img);
            let ancho = (props.width / PIXEL_RATIO) * PX_A_MM;
            let alto = (props.height / PIXEL_RATIO) * PX_A_MM;

            const escala = Math.min(1, (anchoPagina - 28) / ancho, 90 / alto);
            ancho *= escala;
            alto *= escala;

            doc.addImage(img, 'PNG', (anchoPagina - ancho) / 2, y, ancho, alto);
            y += alto + 8;
        }
        
        const numericas = columnas.map((c) => esNumerica(c, filas));

        autoTable(doc, {
            startY: y,
            head: [columnas.map((c) => c.header)],
            body: filas.map((f) => columnas.map((c) => formatearCelda(c, f[c.key]))),
            theme: 'plain',
            styles: {
                fontSize: 10,
                textColor: 40,
                cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
                lineColor: [221, 227, 221],
                lineWidth: { bottom: 0.2 },
            },
            headStyles: { fillColor: [63, 125, 78], textColor: 255, fontStyle: 'bold', lineWidth: 0 },
            alternateRowStyles: { fillColor: [246, 248, 246] },
            margin: { left: 14, right: 14 },
            didParseCell: (d) => {
                // Números alineados a la derecha, también en el encabezado
                if (numericas[d.column.index]) d.cell.styles.halign = 'right';

                // Filas "Total" o marcadas, en negrita y con fondo más marcado
                if (d.section === 'body' && esResaltada(filas[d.row.index], columnas)) {
                    d.cell.styles.fontStyle = 'bold';
                    d.cell.styles.fillColor = [232, 240, 234];
                }
            },
        });
        const totalPaginas = doc.getNumberOfPages();
        for (let i = 1; i <= totalPaginas; i++) {
            doc.setPage(i);
            doc.setFontSize(8).setTextColor(150);
            doc.text(`Página ${i} de ${totalPaginas}`, anchoPagina - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
        }

        return doc.save(nombre);
    }
}