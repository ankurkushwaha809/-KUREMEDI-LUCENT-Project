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

const PAGE_SIZE = 'A4';
const PAGE_MARGIN = 40;

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
    const finalUnitFromOrder = toNum(item?.price || 0);
    const discPct = Math.max(0, toNum(item?.discountPercent || 0));
    const gstPct = Math.max(0, toNum(item?.gstPercent || 0));

    // Preferred exact source when available.
    let sellingUnit = toNum(item?.sellingPrice || 0);

    // Recover selling price from final price when sellingPrice is not stored.
    const denominator = 1 - discPct / 100 + gstPct / 100;
    if (sellingUnit <= 0 && finalUnitFromOrder > 0 && denominator > 0) {
      sellingUnit = round2(finalUnitFromOrder / denominator);
    }

    // Fallback hierarchy for incomplete legacy rows.
    if (sellingUnit <= 0) {
      sellingUnit = toNum(item?.mrp || finalUnitFromOrder || 0);
    }

    const discountUnit = round2((sellingUnit * discPct) / 100);
    const discountedUnit = round2(Math.max(0, sellingUnit - discountUnit));
    const gstUnit = round2((sellingUnit * gstPct) / 100);
    const computedFinalUnit = round2(discountedUnit + gstUnit);

    const gross = round2(sellingUnit * qty);
    const discAmt = round2(discountUnit * qty);
    const taxable = round2(discountedUnit * qty);
    const gstTotal = round2(gstUnit * qty);

    const unit = discountedUnit;
    const sgst = round2(gstTotal / 2);
    const cgst = round2(gstTotal / 2);
    const finalLineTotal = round2(computedFinalUnit * qty);

    return {
      product: safeText(item?.productName || 'Product'),
      hsn: safeText(item?.hsnCode || 'N/A'),
      qty,
      sellingUnit: sellingUnit,
      discountUnit: discountUnit,
      discountedUnit: discountedUnit,
      gstUnit: gstUnit,
      finalUnit: computedFinalUnit,
      unit,
      gross,
      discAmt,
      taxable,
      sgst,
      cgst,
      gstPercent: gstPct,
      discountPercent: discPct,
      lineTotal: finalLineTotal,
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

const normalizeRows = (rows = []) =>
  rows.map((r) => ({
    ...r,
    tax: round2(r.sgst + r.cgst),
  }));

const waitForBlob = (stream) =>
  new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(stream.toBlob('application/pdf')));
    stream.on('error', reject);
  });

const drawLabelValue = (doc, label, value, x, y, labelWidth = 90) => {
  doc.font('Helvetica-Bold').text(label, x, y, { width: labelWidth });
  doc.font('Helvetica').text(String(value || '-'), x + labelWidth, y, { width: 180 });
};

const drawTableHeader = (doc, y, columns) => {
  doc.save();
  doc.rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 20).fill('#f3f4f6');
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9);

  let x = PAGE_MARGIN + 6;
  columns.forEach((col) => {
    doc.text(col.label, x, y + 6, { width: col.width, align: col.align || 'left' });
    x += col.width;
  });

  doc.restore();
  doc.moveTo(PAGE_MARGIN, y + 20).lineTo(doc.page.width - PAGE_MARGIN, y + 20).stroke('#d1d5db');
};

const ensureTableRoom = (doc, cursorY, minHeight = 26) => {
  const bottomSafe = doc.page.height - PAGE_MARGIN - 70;
  if (cursorY + minHeight <= bottomSafe) return cursorY;
  doc.addPage({ size: PAGE_SIZE, margin: PAGE_MARGIN });
  return PAGE_MARGIN;
};

const triggerBrowserDownload = (blob, filename) => {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
};

export async function downloadOrderInvoicePdf(order, options = {}) {
  if (!order || typeof window === 'undefined') return;

  const [{ default: PDFDocument }, blobStreamModule] = await Promise.all([
    import('pdfkit/js/pdfkit.standalone'),
    import('blob-stream'),
  ]);
  const blobStream = blobStreamModule?.default || blobStreamModule;

  const buyer = options?.buyer || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = normalizeRows(buildRows(items));

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalGross = rows.reduce((s, r) => s + r.gross, 0);
  const totalDisc = rows.reduce((s, r) => s + r.discAmt, 0);
  const totalTaxable = rows.reduce((s, r) => s + r.taxable, 0);
  const totalSgst = rows.reduce((s, r) => s + r.sgst, 0);
  const totalCgst = rows.reduce((s, r) => s + r.cgst, 0);
  const computedGrand = rows.reduce((s, r) => s + r.lineTotal, 0);

  const subtotal = round2(totalTaxable || order.totalAmount || 0);
  const orderGst = round2(totalSgst + totalCgst || order.totalGstAmount || 0);
  const grandTotal = round2(computedGrand || subtotal + orderGst || order.payableAmount || 0);
  const discountPercent = totalGross > 0 ? round2((totalDisc / totalGross) * 100) : 0;
  const gstPercent = totalGross > 0 ? round2((orderGst / totalGross) * 100) : 0;

  const invoiceNumber = getInvoiceNumber(order._id);
  const buyerLines = getBuyerLines(order, buyer);

  const qrDataUrl = await QRCode.toDataURL(
    `Invoice:${invoiceNumber}\nOrder:${String(order._id || '').slice(-8).toUpperCase()}\nDate:${formatDate(order.createdAt)}\nTotal:${money(grandTotal)}`,
    { width: 160, margin: 0 },
  );

  const signatureDataUrl = await urlToDataUrl(BRAND.signatureUrl);

  const doc = new PDFDocument({ size: PAGE_SIZE, margin: PAGE_MARGIN, compress: true });
  const stream = doc.pipe(blobStream());

  const pageWidth = doc.page.width;
  const usableWidth = pageWidth - PAGE_MARGIN * 2;

  doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text('TAX INVOICE', PAGE_MARGIN, 42);
  doc.font('Helvetica').fontSize(10).fillColor('#1f2937').text(BRAND.sellerName, PAGE_MARGIN, 66);
  doc.font('Helvetica').fontSize(9).fillColor('#4b5563').text(BRAND.shipFromAddress, PAGE_MARGIN, 82, {
    width: 300,
    lineGap: 2,
  });
  doc.text(`GSTIN: ${BRAND.sellerGstin}`, PAGE_MARGIN, 110);
  doc.text(`Phone: ${BRAND.sellerPhone} | Email: ${BRAND.sellerEmail}`, PAGE_MARGIN, 124);

  if (qrDataUrl) {
    doc.image(qrDataUrl, pageWidth - PAGE_MARGIN - 85, 42, { fit: [72, 72] });
  }

  const metaX = pageWidth - PAGE_MARGIN - 210;
  const metaY = 130;
  doc.roundedRect(metaX, metaY, 210, 75, 6).stroke('#d1d5db');
  drawLabelValue(doc, 'Invoice No.', invoiceNumber, metaX + 10, metaY + 10, 70);
  drawLabelValue(doc, 'Order ID', String(order._id || '').toUpperCase(), metaX + 10, metaY + 26, 70);
  drawLabelValue(doc, 'Order Date', formatDate(order.createdAt), metaX + 10, metaY + 42, 70);
  drawLabelValue(doc, 'Invoice Date', formatDate(new Date()), metaX + 10, metaY + 58, 70);

  const blockTop = 220;
  const blockW = (usableWidth - 14) / 2;
  const buyerText = buyerLines.join('\n');
  const shipText = formatAddress(order.shippingAddress);

  doc.roundedRect(PAGE_MARGIN, blockTop, blockW, 110, 6).stroke('#d1d5db');
  doc.roundedRect(PAGE_MARGIN + blockW + 14, blockTop, blockW, 110, 6).stroke('#d1d5db');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('Bill To (Retailer)', PAGE_MARGIN + 10, blockTop + 10);
  doc.font('Helvetica').fontSize(9).fillColor('#374151').text(buyerText, PAGE_MARGIN + 10, blockTop + 28, {
    width: blockW - 20,
    lineGap: 2,
  });
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('Delivery Address', PAGE_MARGIN + blockW + 24, blockTop + 10);
  doc.font('Helvetica').fontSize(9).fillColor('#374151').text(shipText, PAGE_MARGIN + blockW + 24, blockTop + 28, {
    width: blockW - 20,
    lineGap: 2,
  });

  const columns = [
    { label: 'Product', width: 126 },
    { label: 'HSN', width: 40 },
    { label: 'Qty', width: 28, align: 'right' },
    { label: 'Selling (INR)', width: 62, align: 'right' },
    { label: 'Discount (INR)', width: 62, align: 'right' },
    { label: 'After Disc. (INR)', width: 72, align: 'right' },
    { label: 'GST (INR)', width: 55, align: 'right' },
    { label: 'Final (INR)', width: 70, align: 'right' },
  ];

  let y = ensureTableRoom(doc, blockTop + 130, 50);
  drawTableHeader(doc, y, columns);
  y += 24;

  const printableRows = rows.length
    ? rows
    : [{ product: 'No products found', hsn: '-', qty: '-', sellingUnit: '-', discountUnit: '-', discountedUnit: '-', gstUnit: '-', lineTotal: '-' }];

  printableRows.forEach((row) => {
    y = ensureTableRoom(doc, y, 28);
    if (y === PAGE_MARGIN) {
      drawTableHeader(doc, y, columns);
      y += 24;
    }

    doc.font('Helvetica').fontSize(9).fillColor('#111827');
    let x = PAGE_MARGIN + 6;
    const rowData = [
      safeText(row.product),
      safeText(row.hsn),
      String(row.qty),
      typeof row.sellingUnit === 'number' ? money(row.sellingUnit) : String(row.sellingUnit),
      typeof row.discountUnit === 'number' ? money(row.discountUnit) : String(row.discountUnit),
      typeof row.discountedUnit === 'number' ? money(row.discountedUnit) : String(row.discountedUnit),
      typeof row.gstUnit === 'number' ? money(row.gstUnit) : String(row.gstUnit),
      typeof row.lineTotal === 'number' ? money(row.lineTotal) : String(row.lineTotal),
    ];

    rowData.forEach((value, index) => {
      const col = columns[index];
      doc.text(String(value), x, y, {
        width: col.width,
        align: col.align || 'left',
        lineBreak: false,
        ellipsis: true,
      });
      x += col.width;
    });

    doc.moveTo(PAGE_MARGIN, y + 16).lineTo(pageWidth - PAGE_MARGIN, y + 16).stroke('#e5e7eb');
    y += 18;
  });

  y += 8;
  y = ensureTableRoom(doc, y, 140);

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Invoice Summary', PAGE_MARGIN, y);
  y += 18;
  drawLabelValue(doc, 'Total Quantity', String(totalQty), PAGE_MARGIN, y, 120);
  y += 14;
  drawLabelValue(doc, 'Gross Amount', money(totalGross), PAGE_MARGIN, y, 120);
  y += 14;
  drawLabelValue(doc, `Discount (${discountPercent.toFixed(2)}%)`, money(totalDisc), PAGE_MARGIN, y, 120);
  y += 14;
  drawLabelValue(doc, 'Price After Discount', money(subtotal || totalTaxable), PAGE_MARGIN, y, 120);
  y += 14;
  drawLabelValue(doc, `GST Amount (${gstPercent.toFixed(2)}%)`, money(orderGst), PAGE_MARGIN, y, 120);
  y += 14;

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text(`Grand Total: ${money(grandTotal)}`, PAGE_MARGIN, y + 6);

  const signY = y - 30;
  doc.font('Helvetica-Bold').fontSize(10).text(BRAND.sellerName.toUpperCase(), pageWidth - PAGE_MARGIN - 220, signY, {
    width: 220,
    align: 'right',
  });
  if (signatureDataUrl) {
    doc.image(signatureDataUrl, pageWidth - PAGE_MARGIN - 130, signY + 12, { fit: [110, 36] });
  } else {
    doc.moveTo(pageWidth - PAGE_MARGIN - 120, signY + 36).lineTo(pageWidth - PAGE_MARGIN - 20, signY + 36).stroke('#9ca3af');
  }
  doc.font('Helvetica').fontSize(8).fillColor('#374151').text('Authorized Signatory', pageWidth - PAGE_MARGIN - 220, signY + 54, {
    width: 220,
    align: 'right',
  });

  const notes = safeText(order.notes || '');
  if (notes) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor('#4b5563').text(`Order Note: ${notes}`, PAGE_MARGIN, doc.page.height - PAGE_MARGIN - 36, {
      width: usableWidth,
    });
  }

  doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text(
    `Generated on ${new Date().toLocaleString()} | This is a computer-generated invoice and does not require a signature.`,
    PAGE_MARGIN,
    doc.page.height - PAGE_MARGIN - 16,
    { width: usableWidth, align: 'center' },
  );

  doc.end();
  const blob = await waitForBlob(stream);
  triggerBrowserDownload(blob, `${invoiceNumber}.pdf`);
}
