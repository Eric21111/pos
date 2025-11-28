/* eslint-disable no-console */
/**
 * Utility script to list all ESC/POS USB printers connected to the machine.
 * Usage:
 *   cd backend
 *   node scripts/scanUsbPrinters.js
 *
 * The script prints vendor/product IDs which you can copy into
 * PRINTER_VENDOR_ID and PRINTER_PRODUCT_ID in your .env file.
 */
const escpos = require('escpos');

let UsbAdapter = null;
try {
  UsbAdapter = require('escpos-usb');
  escpos.USB = UsbAdapter;
} catch (error) {
  console.error('escpos-usb is not installed. Run "npm install escpos-usb" inside backend/');
  process.exitCode = 1;
  process.exit();
}

const printers = escpos.USB.findPrinter();

if (!printers.length) {
  console.warn('No ESC/POS USB printers detected.');
  process.exit(0);
}

console.log(`Found ${printers.length} USB printer(s):`);
printers.forEach((printer, index) => {
  const { idVendor, idProduct } = printer.deviceDescriptor;
  console.log(`\n#${index + 1}`);
  console.log(`  Vendor ID : 0x${idVendor.toString(16).padStart(4, '0')}`);
  console.log(`  Product ID: 0x${idProduct.toString(16).padStart(4, '0')}`);
});

console.log('\nCopy the IDs into PRINTER_VENDOR_ID and PRINTER_PRODUCT_ID to lock onto a specific printer.');

