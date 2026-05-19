import { Document, Packer, Paragraph, Table, TableCell, TableRow, BorderStyle, WidthType, VerticalAlign, AlignmentType } from 'docx';
import * as XLSX from 'xlsx';
import { generateSalesReportData, generateStockReportData } from './reports';

/**
 * Exportar relatório de vendas para PDF (usando docx como intermediário)
 */
export async function exportSalesReportToPDF(
  tenantId: number,
  fromDate?: Date,
  toDate?: Date
): Promise<Buffer> {
  const data = await generateSalesReportData(tenantId, fromDate, toDate);

  const rows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('Métrica')], shading: { fill: 'D3D3D3' } }),
        new TableCell({ children: [new Paragraph('Valor')], shading: { fill: 'D3D3D3' } }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('Receita Total')] }),
        new TableCell({ children: [new Paragraph(`R$ ${data.totalRevenue.toFixed(2)}`)] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('Lucro Total')] }),
        new TableCell({ children: [new Paragraph(`R$ ${data.totalProfit.toFixed(2)}`)] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('Ticket Médio')] }),
        new TableCell({ children: [new Paragraph(`R$ ${data.averageTicket.toFixed(2)}`)] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('Itens Vendidos')] }),
        new TableCell({ children: [new Paragraph(data.totalItems.toString())] }),
      ],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: 'Relatório de Vendas',
            bold: true,
            size: 28,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph(''),
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph(''),
          new Paragraph({
            text: 'Top Produtos',
            bold: true,
            size: 20,
          }),
          ...data.topProducts.map(
            (p) =>
              new Paragraph(`${p.name}: ${p.quantity} unidades (R$ ${p.revenue.toFixed(2)})`)
          ),
          new Paragraph(''),
          new Paragraph({
            text: 'Top Clientes',
            bold: true,
            size: 20,
          }),
          ...data.topCustomers.map(
            (c) =>
              new Paragraph(
                `${c.customerName}: ${c.totalPurchases} compras (R$ ${c.totalSpent.toFixed(2)})`
              )
          ),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Exportar relatório de vendas para Excel
 */
export async function exportSalesReportToExcel(
  tenantId: number,
  fromDate?: Date,
  toDate?: Date
): Promise<Buffer> {
  const data = await generateSalesReportData(tenantId, fromDate, toDate);

  const metricsData = [
    ['Métrica', 'Valor'],
    ['Receita Total', `R$ ${data.totalRevenue.toFixed(2)}`],
    ['Lucro Total', `R$ ${data.totalProfit.toFixed(2)}`],
    ['Ticket Médio', `R$ ${data.averageTicket.toFixed(2)}`],
    ['Itens Vendidos', data.totalItems.toString()],
  ];

  const topProductsData = [
    ['Produto', 'Quantidade', 'Receita'],
    ...data.topProducts.map((p) => [p.name, p.quantity.toString(), `R$ ${p.revenue.toFixed(2)}`]),
  ];

  const topCustomersData = [
    ['Cliente', 'Compras', 'Total Gasto'],
    ...data.topCustomers.map((c) => [
      c.customerName,
      c.totalPurchases.toString(),
      `R$ ${c.totalSpent.toFixed(2)}`,
    ]),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(metricsData), 'Métricas');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(topProductsData), 'Top Produtos');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(topCustomersData),
    'Top Clientes'
  );

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}

/**
 * Exportar relatório de estoque para Excel
 */
export async function exportStockReportToExcel(tenantId: number): Promise<Buffer> {
  const data = await generateStockReportData(tenantId);

  const stockData = [
    ['Produto', 'Tamanho', 'Quantidade'],
    ...data.stockBySize.map((s) => [s.productName, s.size, s.quantity.toString()]),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(stockData), 'Estoque');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}
