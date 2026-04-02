import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

const BRAND = {
  sellerName: process.env.NEXT_PUBLIC_SELLER_NAME || 'Kure Medi Pvt. Ltd.',
  shipFromAddress:
    process.env.NEXT_PUBLIC_SELLER_SHIP_FROM ||
    'Warehouse 01, Industrial Area, Madhya Pradesh, India - 462001',
  sellerPhone: process.env.NEXT_PUBLIC_SELLER_PHONE || '+91 00000 00000',
  sellerEmail: process.env.NEXT_PUBLIC_SELLER_EMAIL || 'support@kuremedi.com',
  sellerGstin: process.env.NEXT_PUBLIC_SELLER_GSTIN || 'N/A',
  sellerPan: process.env.NEXT_PUBLIC_SELLER_PAN || 'N/A',
  sellerCin: process.env.NEXT_PUBLIC_SELLER_CIN || 'N/A',
  signatureUrl: process.env.NEXT_PUBLIC_SELLER_SIGNATURE_URL || '',
};

const LINE_H = 3.8;

const toNum = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (value) => Math.round((toNum(value) + Number.EPSILON) * 100) / 100;

const money = (value) =>
  `INR ${round2(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const safeText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const formatDate = (dateLike) => {
  if (!dateLike) return '-';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB').replace(/\//g, '-');
};

const getInvoiceNumber = (orderId) => `INV-${String(orderId || '').slice(-8).toUpperCase()}`;

const formatAddress = (shippingAddress = {}, options = {}) => {
  const includePhone = options?.includePhone ?? true;
  const parts = [
    shippingAddress.shopName,
    shippingAddress.address,
    [shippingAddress.city, shippingAddress.state, shippingAddress.pincode].filter(Boolean).join(', '),
    includePhone && shippingAddress.phone ? `Phone: ${shippingAddress.phone}` : '',
  ].filter(Boolean);

  return parts.length ? parts.join('\n') : 'Not provided';
};

const getBuyerLines = (order, buyer = {}) => {
  const phone = buyer?.phone || order?.shippingAddress?.phone || '';
  return [
    buyer?.name || order?.shippingAddress?.shopName || 'Customer',
    buyer?.email || '',
    phone ? `Phone: ${phone}` : '',
    buyer?.gstNumber ? `GSTIN: ${buyer.gstNumber}` : '',
    buyer?.drugLicenseNumber ? `Drug License: ${buyer.drugLicenseNumber}` : '',
    formatAddress(order?.shippingAddress, { includePhone: false }),
  ].filter(Boolean);
};

const buildRows = (items) => {
  return items.map((item) => {
    const qty = Math.max(0, toNum(item?.quantity || 0));
    const unit = toNum(item?.mrp || item?.price || 0);
    const gross = round2(unit * qty);
    const discPct = Math.max(0, toNum(item?.discountPercent || 0));
    const discAmt = round2((gross * discPct) / 100);
    const taxableFromLine = round2(item?.lineSubtotal);
    const taxable = taxableFromLine > 0 ? taxableFromLine : round2(Math.max(0, gross - discAmt));
    const gstTotal = round2(item?.gstAmount || 0);
    const sgst = round2(gstTotal / 2);
    const cgst = round2(gstTotal / 2);
    const lineTotalFromOrder = round2(item?.lineTotal);
    const lineTotal = lineTotalFromOrder > 0 ? lineTotalFromOrder : round2(taxable + sgst + cgst);

    return {
      product: safeText(item?.productName || 'Product'),
      hsn: safeText(item?.hsnCode || 'N/A'),
      qty,
      unit,
      gross,
      discAmt,
      taxable,
      sgst,
      cgst,
      lineTotal,
    };
  });
};

const urlToDataUrl = async (url) => {
  if (!url || typeof window === 'undefined') return '';
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read image file'));
      reader.readAsDataURL(blob);
    });
    return dataUrl;
  } catch {
    return '';
  }
};

export async function downloadOrderInvoicePdf(order, options = {}) {
  if (!order) return;

  const buyer = options?.buyer || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = buildRows(items);

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalGross = rows.reduce((s, r) => s + r.gross, 0);
  const totalDisc = rows.reduce((s, r) => s + r.discAmt, 0);
  const totalTaxable = rows.reduce((s, r) => s + r.taxable, 0);
  const totalSgst = rows.reduce((s, r) => s + r.sgst, 0);
  const totalCgst = rows.reduce((s, r) => s + r.cgst, 0);
  const computedGrand = rows.reduce((s, r) => s + r.lineTotal, 0);

  const subtotal = round2(order.totalAmount || totalTaxable);
  const orderGst = round2(order.totalGstAmount || totalSgst + totalCgst);
  const grandTotal = round2(order.payableAmount || computedGrand || subtotal + orderGst);

  const invoiceNumber = getInvoiceNumber(order._id);
  const buyerLines = getBuyerLines(order, buyer);

  const qrDataUrl = await QRCode.toDataURL(
    `Invoice:${invoiceNumber}\nOrder:${String(order._id || '').slice(-8).toUpperCase()}\nDate:${formatDate(order.createdAt)}\nTotal:${money(grandTotal)}`,
    { width: 160, margin: 0 },
  );

  const signatureDataUrl = await urlToDataUrl(BRAND.signatureUrl);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  doc.setDrawColor(110, 110, 110);
  doc.setLineWidth(0.4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Tax Invoice', pageWidth / 2, 9, { align: 'center' });

  doc.setFontSize(8);
  doc.text(`Supplier: ${BRAND.sellerName}`, margin, 16);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text(`Dispatch Address: ${BRAND.shipFromAddress}`, margin, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`GSTIN - ${BRAND.sellerGstin}`, margin, 24);

  doc.addImage(qrDataUrl, 'PNG', pageWidth - 40, 11, 17, 17);
  doc.rect(pageWidth - 49, 30, 39, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(`Invoice No. ${invoiceNumber}`, pageWidth - 47, 35);

  doc.line(margin, 42, pageWidth - margin, 42);

  const leftLabelX = margin;
  const leftValueX = margin + 24;
  const leftMetaWidth = 28;
  const metaTop = 50;
  const rowGap = 6;
  const orderIdRaw = String(order._id || '').toUpperCase();
  const orderIdDisplay =
    orderIdRaw.length > 18 ? `${orderIdRaw.slice(0, 9)}...${orderIdRaw.slice(-6)}` : orderIdRaw;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Order ID:', leftLabelX, metaTop);
  doc.text('Order Date:', leftLabelX, metaTop + rowGap);
  doc.text('Invoice Date:', leftLabelX, metaTop + rowGap * 2);
  doc.text('PAN:', leftLabelX, metaTop + rowGap * 3);
  doc.text('CIN:', leftLabelX, metaTop + rowGap * 4);

  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(orderIdDisplay, leftMetaWidth), leftValueX, metaTop);
  doc.text(formatDate(order.createdAt), leftValueX, metaTop + rowGap);
  doc.text(formatDate(new Date()), leftValueX, metaTop + rowGap * 2);
  doc.text(BRAND.sellerPan, leftValueX, metaTop + rowGap * 3);
  doc.text(BRAND.sellerCin, leftValueX, metaTop + rowGap * 4);

  const billingX = 60;
  const billingStartY = 54;
  const billToText = doc.splitTextToSize(buyerLines.join('\n'), 50);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To (Retailer)', billingX, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(billToText, billingX, billingStartY);

  const shipX = 118;
  const shipStartY = 54;
  const shipToText = doc.splitTextToSize(formatAddress(order.shippingAddress), 38);
  doc.setFont('helvetica', 'bold');
  doc.text('Delivery Address', shipX, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(shipToText, shipX, shipStartY);

  const noteX = 168;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.7);
  const noteText = ['Please retain this invoice', 'and product packaging for', 'warranty and returns.'];
  doc.text(noteText, noteX, 58);

  const sectionBottom = Math.max(
    78,
    billingStartY + billToText.length * LINE_H,
    shipStartY + shipToText.length * LINE_H,
    58 + noteText.length * LINE_H,
  );

  doc.line(margin, sectionBottom + 2, pageWidth - margin, sectionBottom + 2);

  autoTable(doc, {
    startY: sectionBottom + 6,
    head: [[
      'Product',
      'Description',
      'Qty',
      'Gross (INR)',
      'Discount (INR)',
      'Taxable (INR)',
      'SGST (INR)',
      'CGST (INR)',
      'Total (INR)',
    ]],
    body: rows.length
      ? rows.map((r) => [
          `Product\nHSN: ${r.hsn}`,
          r.product,
          String(r.qty),
          money(r.gross),
          money(r.discAmt),
          money(r.taxable),
          money(r.sgst),
          money(r.cgst),
          money(r.lineTotal),
        ])
      : [['-', 'No products found', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      textColor: [20, 20, 20],
      cellPadding: 2.2,
      lineWidth: 0,
    },
    headStyles: {
      fontStyle: 'bold',
      fillColor: [245, 245, 245],
      textColor: [20, 20, 20],
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 48 },
      2: { cellWidth: 8, halign: 'right' },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 17, halign: 'right' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 13, halign: 'right' },
      7: { cellWidth: 13, halign: 'right' },
      8: { cellWidth: 18, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    didDrawCell(data) {
      if (data.section === 'head' && data.column.index === 0) {
        doc.setDrawColor(110, 110, 110);
        doc.setLineWidth(0.2);
        doc.line(margin, data.cell.y + data.cell.height, pageWidth - margin, data.cell.y + data.cell.height);
      }
    },
  });

  const endY = doc.lastAutoTable?.finalY || 120;
  doc.setDrawColor(110, 110, 110);
  doc.line(margin, endY + 1, pageWidth - margin, endY + 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Total', 58, endY + 8);
  doc.text(String(totalQty), 86, endY + 8, { align: 'right' });
  doc.text(money(totalGross), 104, endY + 8, { align: 'right' });
  doc.text(money(totalDisc), 121, endY + 8, { align: 'right' });
  doc.text(money(subtotal || totalTaxable), 139, endY + 8, { align: 'right' });
  doc.text(money(orderGst / 2 || totalSgst), 152, endY + 8, { align: 'right' });
  doc.text(money(orderGst / 2 || totalCgst), 165, endY + 8, { align: 'right' });
  doc.text(money(grandTotal), 183, endY + 8, { align: 'right' });

  doc.line(margin, endY + 10, pageWidth - margin, endY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text('Grand Total', 116, endY + 22);
  doc.setFont('helvetica', 'bold');
  doc.text(money(grandTotal), pageWidth - margin, endY + 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(BRAND.sellerName.toUpperCase(), pageWidth - margin, endY + 32, { align: 'right' });

  if (signatureDataUrl) {
    doc.addImage(signatureDataUrl, 'PNG', pageWidth - 50, endY + 34, 35, 12);
  } else {
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 48, endY + 40, pageWidth - 16, endY + 45);
  }

  doc.setFontSize(8);
  doc.text('Authorized Signatory', pageWidth - margin, endY + 50, { align: 'right' });

  const notes = safeText(order.notes || '');
  if (notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text(`Order Note: ${notes}`, margin, endY + 22);
  }

  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text('This is a computer-generated tax invoice and does not require a signature.', margin, pageHeight - 8);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth - margin, pageHeight - 8, { align: 'right' });

  doc.save(`${invoiceNumber}.pdf`);
}
