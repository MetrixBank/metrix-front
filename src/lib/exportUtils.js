import { jsPDF } from 'jspdf';
    import 'jspdf-autotable';
    import * as XLSX from 'xlsx';

    export const exportToCSV = (data, filename = 'export.csv') => {
      if (!Array.isArray(data) || data.length === 0) {
        alert("Nenhum dado para exportar.");
        return;
      }
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
            cell = cell.replace(/"/g, '""'); // Escape double quotes
            if (cell.includes(',') || cell.includes('\\n') || cell.includes('"')) {
              cell = `"${cell}"`; // Enclose in double quotes if necessary
            }
            return cell;
          }).join(',')
        )
      ];
      const csvString = csvRows.join('\\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    export const exportToExcel = (data, filename = 'export.xlsx', sheetName = 'Sheet1') => {
      if (!Array.isArray(data) || data.length === 0) {
        alert("Nenhum dado para exportar.");
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, filename);
    };

    export const exportToPDF = (data, title = "Relatório", headersToInclude, filename = 'export.pdf') => {
      if (!Array.isArray(data) || data.length === 0) {
        alert("Nenhum dado para exportar.");
        return;
      }
      
      const doc = new jsPDF({
        orientation: headersToInclude.length > 5 ? 'landscape' : 'portrait'
      });
      
      doc.setFontSize(18);
      doc.text(title, 14, 20);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 26);

      const tableColumn = headersToInclude;
      const tableRows = data.map(row => 
        headersToInclude.map(header => {
            const value = row[header];
            return value !== undefined && value !== null ? String(value) : '';
        })
      );

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'striped', // or 'grid', 'plain'
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [22, 160, 133], // A primary-like color
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: { 
          0: { cellWidth: headersToInclude.length > 4 ? 40 : 'auto' }, 
        },
        didParseCell: function (data) {
            if (data.cell.section === 'body') {
                data.cell.styles.cellWidth = 'wrap';
            }
        }
      });
      doc.save(filename);
    };