/* eslint-disable no-console */
/**
 * Test print script for JK-5802H thermal printer (58mm ESC/POS USB).
 * 
 * This script sends a sample receipt directly to the printer configured
 * in your .env file. Use this to verify printer connectivity and formatting.
 * 
 * Usage:
 *   cd backend
 *   node scripts/testPrint.js
 * 
 * Requirements:
 *   - PRINTER_TRANSPORT=escpos-usb in .env
 *   - PRINTER_VENDOR_ID and PRINTER_PRODUCT_ID set (or let it auto-detect)
 *   - Printer connected via USB and powered on
 */

require('dotenv').config();
const escpos = require('escpos');

let UsbAdapter = null;
try {
  UsbAdapter = require('escpos-usb');
  escpos.USB = UsbAdapter;
} catch (error) {
  console.error('❌ escpos-usb is not installed. Run "npm install escpos-usb" inside backend/');
  process.exit(1);
}

const RECEIPT_CHAR_WIDTH = parseInt(process.env.RECEIPT_CHAR_WIDTH || '32', 10);
const DEFAULT_STORE_NAME = process.env.STORE_NAME || 'Create Your Style';
const DEFAULT_ADDRESS_LINES = (process.env.STORE_ADDRESS || 'TC USHS - #831100254488|Pasoanca, Zambonaga City').split('|');
const CURRENCY_SYMBOL = process.env.PRINTER_CURRENCY_SYMBOL || '₱';

const formatCurrency = (value = 0) => `${CURRENCY_SYMBOL}${Number(value || 0).toFixed(2)}`;
const lineBreak = (char = '-') => char.repeat(RECEIPT_CHAR_WIDTH);
const padLine = (left = '', right = '') => {
  const lhs = String(left);
  const rhs = String(right);
  const spacing = Math.max(RECEIPT_CHAR_WIDTH - lhs.length - rhs.length, 0);
  return `${lhs}${' '.repeat(spacing)}${rhs}`.slice(0, RECEIPT_CHAR_WIDTH);
};

const parseUsbId = (value) => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const radix = trimmed.toLowerCase().startsWith('0x') ? 16 : 10;
  const parsed = parseInt(trimmed, radix);
  return Number.isNaN(parsed) ? null : parsed;
};

// Sample test receipt data
const testReceipt = {
  receiptNo: 'TEST001',
  items: [
    { name: 'Cotton T-Shirt', qty: 2, price: 299.00, total: 598.00 },
    { name: 'Denim Jeans', qty: 1, price: 899.00, total: 899.00 },
    { name: 'Summer Dress', qty: 1, price: 1299.00, total: 1299.00 }
  ],
  subtotal: 2796.00,
  discount: 150.00,
  total: 2646.00,
  cash: 3000.00,
  change: 354.00,
  paymentMethod: 'CASH',
  cashier: 'Test User',
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
  time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  storeName: DEFAULT_STORE_NAME,
  addressLines: DEFAULT_ADDRESS_LINES,
  footerMessage: 'Thank you for your purchase!'
};

async function testPrint() {
  console.log('🧾 Starting test print for 58mm thermal printer...\n');
  console.log('Configuration:');
  console.log(`  Paper width: 58mm (${RECEIPT_CHAR_WIDTH} chars per line)`);
  console.log(`  Store name: ${DEFAULT_STORE_NAME}`);
  console.log(`  Address: ${DEFAULT_ADDRESS_LINES.join(', ')}\n`);

  const vendorId = parseUsbId(process.env.PRINTER_VENDOR_ID);
  const productId = parseUsbId(process.env.PRINTER_PRODUCT_ID);

  if (vendorId && productId) {
    console.log(`  USB Vendor ID: 0x${vendorId.toString(16).padStart(4, '0').toUpperCase()}`);
    console.log(`  USB Product ID: 0x${productId.toString(16).padStart(4, '0').toUpperCase()}\n`);
  } else {
    console.log('  USB IDs: Auto-detecting...\n');
  }

  let device;
  try {
    device = vendorId && productId ? new escpos.USB(vendorId, productId) : new escpos.USB();
  } catch (usbError) {
    console.error('❌ Failed to initialize USB device:', usbError.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Make sure the printer is connected and powered on');
    console.error('  2. Run: node scripts/scanUsbPrinters.js');
    console.error('  3. Check Windows Device Manager for USB device issues');
    process.exit(1);
  }

  return new Promise((resolve, reject) => {
    device.open((error) => {
      if (error) {
        console.error('❌ Failed to open USB printer:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('  1. Unplug and replug the USB cable');
        console.error('  2. Check if another application is using the printer');
        console.error('  3. On Windows: Use Zadig to install WinUSB driver if needed');
        reject(error);
        return;
      }

      console.log('✅ Printer connected successfully!\n');
      console.log('📄 Printing test receipt...\n');

      const printer = new escpos.Printer(device, {
        encoding: process.env.PRINTER_ENCODING || 'GB18030'
      });

      const closePrinter = () => {
        try {
          printer.close();
          console.log('✅ Printer connection closed.\n');
        } catch (closeErr) {
          console.error('⚠️  Error closing printer:', closeErr.message);
        }
      };

      try {
        // Header
        printer
          .align('ct')
          .size(1, 1)
          .text(testReceipt.storeName)
          .size(0, 0);

        testReceipt.addressLines.forEach((line) => printer.text(line));
        printer.feed();
        printer.text(lineBreak());
        
        // Receipt number
        printer.text('Receipt No.');
        printer.style('B');
        printer.text(`#${testReceipt.receiptNo}`);
        printer.style('NORMAL');
        printer.text(lineBreak());

        // Items
        printer.align('lt');
        testReceipt.items.forEach((item) => {
          const itemName = item.name.toString();
          printer.text(itemName.substring(0, RECEIPT_CHAR_WIDTH));
          printer.text(padLine(`${item.qty} x ${formatCurrency(item.price)}`, formatCurrency(item.total)));
        });

        printer.text(lineBreak());

        // Totals
        printer.text(padLine('Subtotal', formatCurrency(testReceipt.subtotal)));
        printer.text(padLine('Discount', formatCurrency(testReceipt.discount)));
        printer.style('B');
        printer.text(padLine('Total', formatCurrency(testReceipt.total)));
        printer.style('NORMAL');

        printer.text(padLine('Cash', formatCurrency(testReceipt.cash)));
        printer.text(padLine('Change', formatCurrency(testReceipt.change)));
        printer.text(padLine('Payment', testReceipt.paymentMethod));
        printer.text(lineBreak());

        // Footer
        printer.align('ct');
        printer.text(`${testReceipt.date} ${testReceipt.time}`);
        printer.text(testReceipt.footerMessage);
        printer.text('This is not an official receipt');
        printer.feed(2);
        
        // Auto-cut
        printer.cut('full');
        
        closePrinter();
        
        console.log('✅ Test receipt printed successfully!');
        console.log('   Check your printer for the output.\n');
        resolve();
      } catch (printErr) {
        closePrinter();
        console.error('❌ Print error:', printErr.message);
        reject(printErr);
      }
    });
  });
}

// Run the test
testPrint()
  .then(() => {
    console.log('✨ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });

