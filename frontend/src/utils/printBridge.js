const DEFAULT_DEV_ENDPOINT = import.meta.env.DEV
  ? 'http://localhost:5000/api/print/receipt'
  : '/api/print/receipt';
const PRINT_ENDPOINT =
  import.meta.env.VITE_PRINT_BRIDGE_URL ||
  import.meta.env.VITE_PRINT_API ||
  DEFAULT_DEV_ENDPOINT;
const MAX_WIDTH = Number(import.meta.env.VITE_RECEIPT_LINE_WIDTH || 32);

const formatCurrency = value => `PHP ${Number(value || 0).toFixed(2)}`;

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
  const storeName = receipt.storeName || 'Create Your Style';
  const contactNumber = receipt.contactNumber || '+631112224444';
  const location = receipt.location || 'Pasonanca, Zamboanga City';
  const issueTime = receipt.time || '12:00PM';
  const referenceNo = receipt.referenceNo || receipt.reference || '-';

  // Header
  lines.push(storeName);
  lines.push(padLine(issueTime, contactNumber));
  lines.push(location);
  lines.push('-'.repeat(MAX_WIDTH));

  // Receipt No
  lines.push('Receipt No:');
  lines.push(`#${receipt.receiptNo || '000000'}`);
  lines.push('-'.repeat(MAX_WIDTH));

  // Item table headers (Item: 20, Qty: 3, Price: 9 = 32 chars)
  const itemCol = 'Item'.padEnd(20);
  const qtyCol = 'Qty'.padStart(3);
  const priceCol = 'Price'.padStart(9);
  lines.push(`${itemCol}${qtyCol}${priceCol}`);
  lines.push('-'.repeat(MAX_WIDTH));

  // Items
  (receipt.items || []).forEach(item => {
    const itemName = (item.name || item.itemName || 'Item').toString();
    const qty = item.qty || item.quantity || 1;
    const price = item.price || item.itemPrice || 0;

    const itemNameLine = itemName.substring(0, 20).padEnd(20);
    const qtyStr = qty.toString().padStart(3);
    const priceStr = formatCurrency(price).padStart(9);
    lines.push(`${itemNameLine}${qtyStr}${priceStr}`);
  });

  lines.push('-'.repeat(MAX_WIDTH));

  // Payment summary
  lines.push(padLine('Transaction/Reference', referenceNo));
  lines.push(padLine('Payment Method', receipt.paymentMethod || 'CASH'));
  lines.push(padLine('Subtotal', formatCurrency(receipt.subtotal || 0)));
  lines.push('-'.repeat(MAX_WIDTH));
  lines.push(padLine('Discount', formatCurrency(receipt.discount || 0)));
  lines.push('-'.repeat(MAX_WIDTH));
  lines.push(padLine('Total', formatCurrency(receipt.total || 0)));

  if (receipt.cash !== undefined) {
    lines.push(padLine('Cash', formatCurrency(receipt.cash)));
  }

  if (receipt.change !== undefined) {
    lines.push(padLine('Change', formatCurrency(receipt.change)));
  }

  lines.push('-'.repeat(MAX_WIDTH));
  lines.push('This is not an official receipt');
  return lines;
};

export async function sendReceiptToPrinter(receipt) {
  if (!receipt) throw new Error('No receipt payload provided');

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 second timeout (slightly longer than backend)

  try {
    const response = await fetch(PRINT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptData: receipt }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const payload = await response.json().catch(() => ({}));

    // Check for HTTP errors
    if (!response.ok) {
      throw new Error(payload.message || `Print request failed: ${response.status} ${response.statusText}`);
    }

    // Check for application-level errors (including file printing warnings)
    if (payload.success === false) {
      // If it's file printing, treat it as an error (not actual printing)
      if (payload.fileSaved) {
        throw new Error(payload.message || 'Printer not configured. Receipt was saved to file instead of printing.');
      }
      throw new Error(payload.message || 'Printer rejected the job');
    }

    // Only return if actually successful
    if (!payload.success) {
      throw new Error(payload.message || 'Print operation failed');
    }

    return payload;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error.name === 'AbortError') {
      throw new Error('Print request timed out. The printer may be slow or unresponsive. Please try again.');
    }

    // Re-throw other errors
    throw error;
  }
}

