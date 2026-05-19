import { Document, Packer, Paragraph, Table, TableCell, TableRow, BorderStyle, WidthType, VerticalAlign, AlignmentType, TextRun } from 'docx';
import * as XLSX from 'xlsx';
import { generateSalesReportData, generateStockReportData, SalesReportData, StockReportData } from './reports';

/**
 * Exportar relatório de vendas para PDF (usando docx como intermediário)
 */
export async function exportSalesReportToPDF(
  tenantId: number,
  fromDate?: Date,
  toDate?: Date
): Promise<Buffer> {
  const data = await generateSalesReportData(tenantId, fromDate || new Date(0), toDate || new Date());

  const totalRevenueNum = parseFloat(data.totalRevenue);
  const totalProfitNum = parseFloat(data.totalProfit);
  const averageTicketNum = parseFloat(data.averageTicket);

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
        new TableCell({ children: [new Paragraph(`R$ ${totalRevenueNum.toFixed(2)}`)] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('Lucro Total')] }),
        new TableCell({ children: [new Paragraph(`R$ ${totalProfitNum.toFixed(2)}`)] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('Ticket Médio')] }),
        new TableCell({ children: [new Paragraph(`R$ ${averageTicketNum.toFixed(2)}`)] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('Itens Vendidos')] }),
        new TableCell({ children: [new Paragraph(data.itemsSold.toString())] }),
      ],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Relatório de Vendas', bold: true, size: 28 })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph(''),
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph(''),
          new Paragraph({
            children: [new TextRun({ text: 'Top Produtos', bold: true, size: 20 })],
          }),
          ...data.topProducts.map(
            (p) => {
              const revenueNum = parseFloat(p.revenue);
              return new Paragraph(`${p.name}: ${p.quantity} unidades (R$ ${revenueNum.toFixed(2)})`);
            }
          ),
          new Paragraph(''),
          new Paragraph({
            children: [new TextRun({ text: 'Top Clientes', bold: true, size: 20 })],
          }),
          ...data.topCustomers.map(
            (c) => {
              const totalNum = parseFloat(c.total);
              return new Paragraph(
                `${c.name}: ${c.purchases} compras (R$ ${totalNum.toFixed(2)})`
              );
            }
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
  const data = await generateSalesReportData(tenantId, fromDate || new Date(0), toDate || new Date());

  const totalRevenueNum2 = parseFloat(data.totalRevenue);
  const totalProfitNum2 = parseFloat(data.totalProfit);
  const averageTicketNum2 = parseFloat(data.averageTicket);

  const metricsData = [
    ['Métrica', 'Valor'],
    ['Receita Total', `R$ ${totalRevenueNum2.toFixed(2)}`],
    ['Lucro Total', `R$ ${totalProfitNum2.toFixed(2)}`],
    ['Ticket Médio', `R$ ${averageTicketNum2.toFixed(2)}`],
    ['Itens Vendidos', data.itemsSold.toString()],
  ];

  const topProductsData = [
    ['Produto', 'Quantidade', 'Receita'],
    ...data.topProducts.map((p) => {
      const revenueNum = parseFloat(p.revenue);
      return [p.name, p.quantity.toString(), `R$ ${revenueNum.toFixed(2)}`];
    }),
  ];

  const topCustomersData = [
    ['Cliente', 'Compras', 'Total Gasto'],
    ...data.topCustomers.map((c) => {
      const totalNum = parseFloat(c.total);
      return [
        c.name,
        c.purchases.toString(),
        `R$ ${totalNum.toFixed(2)}`,
      ];
    }),
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
    ...data.products.flatMap((p) =>
      p.sizes.map((s) => [p.name, s.size, s.stock.toString()])
    ),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(stockData), 'Estoque');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}
