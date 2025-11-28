const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer');
const escpos = require('escpos');
let windowsPrinterDriver = null;
let UsbAdapter = null;

try {
  // eslint-disable-next-line global-require
  windowsPrinterDriver = require('printer');
} catch (err) {
  console.warn('Windows printer driver module "printer" is not installed. Install it with "npm install printer" to enable direct printing to Windows printers.');
}

try {
  // eslint-disable-next-line global-require
  UsbAdapter = require('escpos-usb');
  escpos.USB = UsbAdapter;
} catch (err) {
  console.warn('Optional module "escpos-usb" is not installed. Run "npm install escpos escpos-usb" to enable direct USB thermal printing.');
}

// 58mm thermal paper standard: 32 characters per line (8 dots/mm × 58mm = 464 dots / 14.5 dots per char ≈ 32 chars)
// For 80mm paper, use RECEIPT_CHAR_WIDTH=48
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

const printViaEscposUsb = (receiptData = {}) => new Promise((resolve, reject) => {
  if (!UsbAdapter) {
    reject(new Error('escpos-usb adapter is not installed. Run "npm install escpos escpos-usb" inside backend/.'));
    return;
  }

  const vendorId = parseUsbId(process.env.PRINTER_VENDOR_ID);
  const productId = parseUsbId(process.env.PRINTER_PRODUCT_ID);

  let device;
  try {
    device = vendorId && productId ? new escpos.USB(vendorId, productId) : new escpos.USB();
  } catch (usbError) {
    reject(usbError);
    return;
  }

  device.open((error) => {
    if (error) {
      reject(error);
      return;
    }

    const printer = new escpos.Printer(device, {
      encoding: process.env.PRINTER_ENCODING || 'GB18030'
    });

    const closePrinter = () => {
      try {
        printer.close();
      } catch (closeErr) {
        console.error('Failed to close printer connection', closeErr);
      }
    };

    const storeName = receiptData.storeName || DEFAULT_STORE_NAME;
    const addressLines = receiptData.addressLines || DEFAULT_ADDRESS_LINES;
    const receiptNo = receiptData.receiptNo || '000000';
    const paymentMethod = receiptData.paymentMethod || 'CASH';
    const footerMessage = receiptData.footerMessage || 'Thank you for your purchase!';
    const issueDate = receiptData.date || new Date().toLocaleDateString();
    const issueTime = receiptData.time || new Date().toLocaleTimeString();

    try {
      printer
        .align('ct')
        .size(1, 1)
        .text(storeName)
        .size(0, 0);

      addressLines.forEach((line) => printer.text(line));
      printer.feed();
      printer.text(lineBreak());
      printer.text('Receipt No.');
      printer.style('B');
      printer.text(`#${receiptNo}`);
      printer.style('NORMAL');
      printer.text(lineBreak());

      printer.align('lt');
      (receiptData.items || []).forEach((item) => {
        const itemName = (item.name || item.itemName || 'Item').toString();
        const qty = item.qty || item.quantity || 1;
        const price = item.price || item.itemPrice || 0;
        const total = item.total || price * qty;

        printer.text(itemName.substring(0, RECEIPT_CHAR_WIDTH));
        printer.text(padLine(`${qty} x ${formatCurrency(price)}`, formatCurrency(total)));
      });

      if ((receiptData.items || []).length === 0) {
        printer.text('No line items provided.');
      }

      printer.text(lineBreak());
      printer.text(padLine('Subtotal', formatCurrency(receiptData.subtotal)));
      printer.text(padLine('Discount', formatCurrency(receiptData.discount)));
      printer.style('B');
      printer.text(padLine('Total', formatCurrency(receiptData.total)));
      printer.style('NORMAL');

      if (receiptData.cash !== undefined) {
        printer.text(padLine('Cash', formatCurrency(receiptData.cash)));
      }

      if (receiptData.change !== undefined) {
        printer.text(padLine('Change', formatCurrency(receiptData.change)));
      }

      printer.text(padLine('Payment', paymentMethod));
      printer.text(lineBreak());

      printer.align('ct');
      printer.text(`${issueDate} ${issueTime}`);
      printer.text(footerMessage);
      printer.feed(2);
      printer.cut('full');
      closePrinter();
      resolve();
    } catch (printErr) {
      closePrinter();
      reject(printErr);
    }
  });
});

const printReceipt = async (req, res) => {
  try {
    const { receiptData } = req.body;

    if (!receiptData) {
      return res.status(400).json({ success: false, message: 'Receipt data is required' });
    }

    // Initialize printer configuration from environment variables or defaults
    const printerType = process.env.PRINTER_TYPE || 'EPSON'; // EPSON, STAR, or other
    const printerInterface = process.env.PRINTER_INTERFACE || 'printer'; // 'printer', 'tcp', 'usb', or 'bluetooth'
    const printerName = process.env.PRINTER_NAME || ''; // Windows printer name
    const printerIP = process.env.PRINTER_IP || '192.168.1.100'; // Network printer IP
    const printerPort = process.env.PRINTER_PORT || '9100'; // Network printer port
    const printerTransport = (process.env.PRINTER_TRANSPORT || '').toLowerCase();

    if (printerTransport === 'escpos-usb') {
      try {
        await printViaEscposUsb(receiptData);
        return res.json({
          success: true,
          message: 'Receipt sent to USB thermal printer successfully'
        });
      } catch (usbError) {
        console.error('USB print error:', usbError);
        return res.status(500).json({
          success: false,
          message: usbError.message || 'Failed to print via USB thermal printer'
        });
      }
    }

    // --- Existing printing path (node-thermal-printer) ---
    let printer;

    // Determine printer type enum
    let printerTypeEnum = PrinterTypes.EPSON;
    if (printerType === 'STAR') {
      printerTypeEnum = PrinterTypes.STAR;
    } else if (printerType === 'BEPOST') {
      printerTypeEnum = PrinterTypes.BEPOST;
    }

    // Build interface string based on configuration
    let interfaceString;
    if (printerInterface === 'tcp' || printerInterface === 'network') {
      interfaceString = `tcp://${printerIP}:${printerPort}`;
    } else if (printerInterface === 'usb') {
      interfaceString = 'usb';
    } else {
      // Windows printer name
      interfaceString = printerName ? `printer:${printerName}` : 'printer';
    }

    // Extra safety: if we're using a Windows printer interface but the
    // optional "printer" driver is not installed, fail loudly instead of
    // silently "succeeding" without actually printing anything.
    if ((interfaceString.startsWith('printer:') || interfaceString === 'printer') && !windowsPrinterDriver) {
      console.error('Print error: Windows printer driver module "printer" is not installed but PRINTER_INTERFACE is set to "printer".');
      return res.status(500).json({
        success: false,
        message: 'Windows printer driver is not installed. Install it with "npm install printer" and verify PRINTER_NAME in your .env (see README_PRINTER_SETUP.md).'
      });
    }

    const printerConfig = {
      type: printerTypeEnum,
      interface: interfaceString,
      characterSet: CharacterSet.PC852_LATIN2,
      removeSpecialCharacters: false,
      lineCharacter: '-',
      breakLine: BreakLine.WORD,
      options: {
        timeout: 5000,
      }
    };

    // Attach Windows printer driver when using a Windows printer interface
    if ((interfaceString.startsWith('printer:') || interfaceString === 'printer') && windowsPrinterDriver) {
      printerConfig.driver = windowsPrinterDriver;
    }

    printer = new ThermalPrinter(printerConfig);

    // Check if printer is connected (with error handling)
    // For Windows "printer:" interface we skip the connectivity check because
    // many drivers always report "disconnected" even when printing works.
    let isConnected = true;
    // Only perform connection check for explicit network interfaces.
    // USB and Windows printer interfaces often do not support this and can
    // incorrectly report "not connected", so we skip the check for them.
    const shouldCheckConnection = printerInterface === 'tcp' || printerInterface === 'network';

    if (shouldCheckConnection) {
      isConnected = false;
      try {
        isConnected = await printer.isPrinterConnected();
      } catch (connectionError) {
        console.error('Printer connection check failed:', connectionError);
        // Continue anyway - some printers don't support connection check
        isConnected = true; // Assume connected and try to print
      }

      if (!isConnected) {
        return res.status(500).json({ 
          success: false, 
          message: 'Printer not connected. Please check printer connection and configuration. See README_PRINTER_SETUP.md for setup instructions.' 
        });
      }
    }

    // Build receipt content
    printer.alignCenter();
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println('Create Your Style');
    printer.bold(false);
    printer.setTextSize(0, 0);
    printer.println('TC USHS - #831100254488');
    printer.println('Pasoanca, Zambonaga City');
    printer.drawLine();
    
    printer.alignCenter();
    printer.println('Receipt No.');
    printer.bold(true);
    printer.println(`#${receiptData.receiptNo}`);
    printer.bold(false);
    printer.drawLine();

    // Items table
    printer.alignLeft();
    printer.tableCustom([
      { text: 'Item', align: 'LEFT', width: 0.4 },
      { text: 'Qty', align: 'CENTER', width: 0.15 },
      { text: 'Price', align: 'RIGHT', width: 0.2 },
      { text: 'Total', align: 'RIGHT', width: 0.25 }
    ]);

    if (receiptData.items && receiptData.items.length > 0) {
      receiptData.items.forEach(item => {
        const itemName = item.name || item.itemName || 'Item';
        const qty = item.qty || item.quantity || 1;
        const price = item.price || item.itemPrice || 0;
        const total = item.total || (price * qty);

        printer.tableCustom([
          { text: itemName.substring(0, 20), align: 'LEFT', width: 0.4 },
          { text: qty.toString(), align: 'CENTER', width: 0.15 },
          { text: `₱${price.toFixed(2)}`, align: 'RIGHT', width: 0.2 },
          { text: `₱${total.toFixed(2)}`, align: 'RIGHT', width: 0.25 }
        ]);
      });
    }

    printer.drawLine();

    // Totals
    printer.alignLeft();
    printer.println(`Payment Method: ${receiptData.paymentMethod || 'CASH'}`);
    printer.println(`Subtotal: ₱${(receiptData.subtotal || 0).toFixed(2)}`);
    printer.println(`Discount: ₱${(receiptData.discount || 0).toFixed(2)}`);
    printer.bold(true);
    printer.println(`Total: ₱${(receiptData.total || 0).toFixed(2)}`);
    printer.bold(false);
    
    if (receiptData.cash) {
      printer.println(`Cash: ₱${receiptData.cash.toFixed(2)}`);
      printer.println(`Change: ₱${(receiptData.change || 0).toFixed(2)}`);
    }

    printer.drawLine();
    printer.alignCenter();
    printer.println('Thank you for your purchase!');
    printer.println(`${receiptData.date || new Date().toLocaleDateString()} ${receiptData.time || new Date().toLocaleTimeString()}`);
    printer.println('This is not an official receipt');
    printer.newLine();
    printer.cut();

    // Execute print
    await printer.execute();

    res.json({ 
      success: true, 
      message: 'Receipt printed successfully' 
    });
  } catch (error) {
    console.error('Print error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to print receipt: ' + error.message 
    });
  }
};

module.exports = { printReceipt };

