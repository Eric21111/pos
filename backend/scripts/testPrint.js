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
  // Workaround: escpos-usb expects usb.on() method which doesn't exist in usb@2.x
  const usb = require('usb');
  if (usb && typeof usb.on === 'undefined') {
    const EventEmitter = require('events');
    const usbEmitter = new EventEmitter();
    usb.on = function(event, callback) {
      usbEmitter.on(event, callback);
    };
    usb.emit = function(event, ...args) {
      usbEmitter.emit(event, ...args);
    };
    usb.removeListener = function(event, callback) {
      usbEmitter.removeListener(event, callback);
    };
    usb.removeAllListeners = function(event) {
      usbEmitter.removeAllListeners(event);
    };
  }
  
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

// Sample test receipt data matching the new format
const testReceipt = {
  receiptNo: '000123',
  items: [
    { name: 'Item 1', qty: 1, price: 100.00, total: 100.00 },
    { name: 'Item 2', qty: 1, price: 100.00, total: 100.00 },
    { name: 'Item 3', qty: 1, price: 100.00, total: 100.00 }
  ],
  subtotal: 100.00,
  discount: 5.00,
  total: 100.00,
  cash: 500.00,
  change: 200.00,
  paymentMethod: 'CASH/GCASH',
  referenceNo: '',
  contactNumber: '+631112224444',
  location: 'Pasonanca, Zamboanga City',
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
  time: '12:00PM',
  storeName: DEFAULT_STORE_NAME
};

async function testPrint() {
  console.log('🧾 Starting test print for 58mm thermal printer...\n');
  console.log('Configuration:');
  console.log(`  Paper width: 58mm (${RECEIPT_CHAR_WIDTH} chars per line)`);
  console.log(`  Store name: ${DEFAULT_STORE_NAME}`);
  console.log(`  Address: ${DEFAULT_ADDRESS_LINES.join(', ')}\n`);

  const vendorId = parseUsbId(process.env.PRINTER_VENDOR_ID);
  const productId = parseUsbId(process.env.PRINTER_PRODUCT_ID);

  // Log the IDs for debugging
  console.log('USB Printer Configuration:');
  console.log(`  Vendor ID: ${process.env.PRINTER_VENDOR_ID || 'not set'} -> ${vendorId} (${vendorId ? '0x' + vendorId.toString(16).toUpperCase() : 'not set'})`);
  console.log(`  Product ID: ${process.env.PRINTER_PRODUCT_ID || 'not set'} -> ${productId} (${productId ? '0x' + productId.toString(16).toUpperCase() : 'not set'})`);
  console.log('');

  let device;
  try {
    if (vendorId && productId) {
      console.log(`Attempting to connect to USB printer with VID: 0x${vendorId.toString(16).toUpperCase()}, PID: 0x${productId.toString(16).toUpperCase()}`);
      device = new escpos.USB(vendorId, productId);
    } else {
      console.log('No vendor/product ID specified, attempting auto-detect...');
      device = new escpos.USB();
    }
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
        const storeName = testReceipt.storeName || DEFAULT_STORE_NAME;
        const contactNumber = testReceipt.contactNumber || '+631112224444';
        const location = testReceipt.location || 'Pasonanca, Zamboanga City';
        const receiptNo = testReceipt.receiptNo || '000000';
        const paymentMethod = testReceipt.paymentMethod || 'CASH';
        const referenceNo = testReceipt.referenceNo || testReceipt.reference || '';
        const issueTime = testReceipt.time || new Date().toLocaleTimeString();
        
        // Header: Business name (centered, large)
        printer
          .align('ct')
          .size(1, 1)
          .text(storeName)
          .size(0, 0)
          .feed(1);

        // Time (left) and Contact (right)
        printer.align('lt');
        const timeLine = padLine(issueTime, contactNumber);
        printer.text(timeLine);
        
        // Location (centered)
        printer.align('ct');
        printer.text(location);
        printer.feed(1);
        printer.text(lineBreak());

        // Receipt No in box format
        printer.align('ct');
        printer.text('Receipt No:');
        printer.style('B');
        printer.text(`#${receiptNo}`);
        printer.style('NORMAL');
        printer.text(lineBreak());

        // Item table headers
        printer.align('lt');
        // Format: Item (11 chars) | Qty (3) | Price (9) | Total (9) = 32 chars
        const itemCol = 'Item'.padEnd(11);
        const qtyCol = 'Qty'.padStart(3);
        const priceCol = 'Price'.padStart(9);
        const totalCol = 'Total'.padStart(9);
        printer.text(`${itemCol}${qtyCol}${priceCol}${totalCol}`);
        printer.text(lineBreak());

        // Items
        testReceipt.items.forEach((item) => {
          const itemName = item.name.toString();
          const qty = item.qty || 1;
          const price = item.price || 0;
          const total = item.total || price * qty;

          // Format: Item name (truncated to 11 chars)
          const itemNameLine = itemName.substring(0, 11).padEnd(11);
          const qtyStr = qty.toString().padStart(3);
          // Use PHP format to match image
          const priceStr = `PHP ${price.toFixed(2)}`.padStart(9);
          const totalStr = `PHP ${total.toFixed(2)}`.padStart(9);
          printer.text(`${itemNameLine}${qtyStr}${priceStr}${totalStr}`);
        });

        printer.text(lineBreak());

        // Payment summary
        printer.align('lt');
        printer.text(padLine('Transaction/Reference', referenceNo || '-'));
        printer.text(padLine('Payment Method', paymentMethod));
        printer.text(padLine('Subtotal', `PHP ${(testReceipt.subtotal || 0).toFixed(2)}`));
        printer.text(lineBreak());
        printer.text(padLine('Discount', `PHP ${(testReceipt.discount || 0).toFixed(2)}`));
        printer.text(lineBreak());
        printer.style('B');
        printer.text(padLine('Total', `PHP ${(testReceipt.total || 0).toFixed(2)}`));
        printer.style('NORMAL');

        if (testReceipt.cash !== undefined) {
          printer.text(padLine('Cash', `PHP ${testReceipt.cash.toFixed(2)}`));
        }

        if (testReceipt.change !== undefined) {
          printer.text(padLine('Change', `PHP ${testReceipt.change.toFixed(2)}`));
        }

        printer.text(lineBreak());
        printer.align('ct');
        printer.style('B');
        printer.text('This is not an official receipt');
        printer.style('NORMAL');
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

