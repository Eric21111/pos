const DEFAULT_DEV_ENDPOINT = import.meta.env.DEV
  ? 'http://localhost:5000/api/print/receipt'
  : '/api/print/receipt';
const PRINT_ENDPOINT =
  import.meta.env.VITE_PRINT_API || DEFAULT_DEV_ENDPOINT;
const MAX_WIDTH = Number(import.meta.env.VITE_RECEIPT_LINE_WIDTH || 32);

const formatCurrency = value => `₱${Number(value || 0).toFixed(2)}`;

const padLine = (left, right = '') => {
  const cleanLeft = String(left ?? '').trim();
  const cleanRight = String(right ?? '').trim();
  const available = MAX_WIDTH - (cleanLeft.length + cleanRight.length);
  const spacer = available > 0 ? ' '.repeat(available) : ' ';
  return (cleanLeft + spacer + cleanRight).slice(0, MAX_WIDTH);
};

const chunkText = (text) => {
  if (!text) return [''];
  const normalized = String(text);
  const chunks = [];
  for (let i = 0; i < normalized.length; i += MAX_WIDTH) {
    chunks.push(normalized.slice(i, i + MAX_WIDTH));
  }
  return chunks.length ? chunks : [''];
};

export const buildReceiptLines = receipt => {
  const lines = [];
  lines.push('Create Your Style');
  lines.push('TC USHS - #831100254488');
  lines.push('Pasoanca, Zamboanga City');
  lines.push('-'.repeat(MAX_WIDTH));
  lines.push(`Receipt #${receipt.receiptNo || ''}`);
  lines.push('-'.repeat(MAX_WIDTH));

  (receipt.items || []).forEach(item => {
    chunkText(item.name).forEach(chunk => lines.push(chunk));
    lines.push(
      padLine(`${item.qty} x ${formatCurrency(item.price)}`, formatCurrency(item.total))
    );
  });

  lines.push('-'.repeat(MAX_WIDTH));
  lines.push(padLine('Subtotal', formatCurrency(receipt.subtotal)));
  lines.push(padLine('Discount', formatCurrency(receipt.discount)));
  lines.push(padLine('Total', formatCurrency(receipt.total)));
  lines.push(padLine('Cash', formatCurrency(receipt.cash)));
  lines.push(padLine('Change', formatCurrency(receipt.change)));
  lines.push('-'.repeat(MAX_WIDTH));
  lines.push(`Payment: ${receipt.paymentMethod || ''}`);
  lines.push(`${receipt.date || ''} ${receipt.time || ''}`);
  lines.push('Thank you!');
  lines.push('Not an official receipt');
  return lines;
};

export async function sendReceiptToPrinter(receipt) {
  if (!receipt) throw new Error('No receipt payload provided');

  const response = await fetch(PRINT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiptData: receipt })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Printer rejected the job');
  }

  return payload;
}

