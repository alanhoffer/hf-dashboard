import jsPDF from 'jspdf';
import { CustomerOrder, ProductionRecord } from '../services/beeService';
import { format } from 'date-fns';

// Define autoTable function type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Simple autoTable implementation for basic table generation
const autoTable = (doc: jsPDF, options: any) => {
  const { head, body, startY = 40, theme = 'grid', headStyles = {}, styles = {}, columnStyles = {} } = options;
  
  let currentY = startY;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const tableWidth = pageWidth - (margin * 2);
  
  // Calculate column widths
  const numColumns = head[0].length;
  const defaultColumnWidth = tableWidth / numColumns;
  
  // Draw header
  doc.setFillColor(59, 130, 246); // Blue header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  
  let currentX = margin;
  head[0].forEach((header: string, index: number) => {
    const colWidth = columnStyles[index]?.cellWidth || defaultColumnWidth;
    doc.rect(currentX, currentY, colWidth, 8, 'F');
    doc.text(header, currentX + 2, currentY + 6);
    currentX += colWidth;
  });
  
  currentY += 8;
  
  // Draw body
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(styles.fontSize || 10);
  
  body.forEach((row: string[]) => {
    currentX = margin;
    row.forEach((cell: string, index: number) => {
      const colWidth = columnStyles[index]?.cellWidth || defaultColumnWidth;
      doc.rect(currentX, currentY, colWidth, 6);
      doc.text(cell, currentX + 2, currentY + 4);
      currentX += colWidth;
    });
    currentY += 6;
  });
  
  return doc;
};

export const exportOrdersToPDF = (orders: CustomerOrder[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138); // Blue color
  doc.text('Queen Cell Orders Report', 20, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy')}`, 20, 30);
  
  // Table data
  const tableData = orders.map(order => [
    order.customerName,
    order.numberOfCells.toString(),
    format(order.larvaeTransferDate, 'MMM dd, yyyy'),
    format(order.deliveryDate, 'MMM dd, yyyy'),
    order.status.replace('_', ' '),
    format(order.createdAt, 'MMM dd, yyyy')
  ]);
  
  autoTable(doc, {
    head: [['Customer', 'Cells', 'Transfer Date', 'Delivery Date', 'Status', 'Order Date']],
    body: tableData,
    startY: 40,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }, // Blue header
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 20 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 30 }
    }
  });
  
  doc.save('queen-cell-orders.pdf');
};

export const exportProductionToPDF = (productions: ProductionRecord[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('Production Records Report', 20, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy')}`, 20, 30);
  
  // Table data
  const tableData = productions.map(production => [
    format(production.transferDate, 'MMM dd, yyyy'),
    production.larvaeTransferred?.toString() || 'N/A',
    production.acceptedCells?.toString() || 'N/A',
    production.cellsProduced.toString(),
    production.hivesUsed.join(', ') || 'N/A',
    production.notes || 'N/A'
  ]);
  
  autoTable(doc, {
    head: [['Transfer Date', 'Larvae', 'Accepted', 'Produced', 'Hives', 'Notes']],
    body: tableData,
    startY: 40,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 35 },
      5: { cellWidth: 50 }
    }
  });
  
  doc.save('production-records.pdf');
};

// Simple CSV export functions (replacing Excel functionality)
export const exportOrdersToExcel = (orders: CustomerOrder[]) => {
  const csvContent = [
    ['Customer Name', 'Number of Cells', 'Transfer Date', 'Delivery Date', 'Status', 'Order Date'],
    ...orders.map(order => [
      order.customerName,
      order.numberOfCells.toString(),
      format(order.larvaeTransferDate, 'yyyy-MM-dd'),
      format(order.deliveryDate, 'yyyy-MM-dd'),
      order.status.replace('_', ' '),
      format(order.createdAt, 'yyyy-MM-dd')
    ])
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'queen-cell-orders.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportProductionToExcel = (productions: ProductionRecord[]) => {
  const csvContent = [
    ['Transfer Date', 'Larvae Transferred', 'Accepted Cells', 'Cells Produced', 'Hives Used', 'Notes'],
    ...productions.map(production => [
      format(production.transferDate, 'yyyy-MM-dd'),
      production.larvaeTransferred?.toString() || 'N/A',
      production.acceptedCells?.toString() || 'N/A',
      production.cellsProduced.toString(),
      production.hivesUsed.join(', ') || 'N/A',
      production.notes || 'N/A'
    ])
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'production-records.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};