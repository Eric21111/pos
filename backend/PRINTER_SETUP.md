# JK-5802H Thermal Printer Setup

This project now ships with a USB ESC/POS printing pipeline that talks directly to the JK-5802H (or any 58 mm ESC/POS-compatible) thermal printer. Follow the steps below to reproduce the same setup on another machine.

## 1. Install Runtime Requirements

- Node.js **16+** (tested with 18/20/22).  
- `npm install` inside `backend/` installs `escpos` and `escpos-usb`.
- **Windows:** install the JK-5802H USB driver (WinUSB/CH340). If Windows does not expose the printer to libusb, use [Zadig](https://zadig.akeo.ie/) to assign the WinUSB driver.
- **Linux:** `sudo apt install libusb-1.0-0`. Add a udev rule so non-root users can print:

  ```
  SUBSYSTEM=="usb", ATTR{idVendor}=="XXXX", ATTR{idProduct}=="YYYY", MODE="0666"
  ```

  Replace `XXXX`/`YYYY` with the IDs discovered in the next step, then reload rules:

  ```
  sudo udevadm control --reload-rules && sudo service udev restart
  ```

## 2. Detect the Printer

From `backend/` run:

```
node scripts/scanUsbPrinters.js
```

Example output:

```
Found 1 USB printer(s):
#1
  Vendor ID : 0x0416
  Product ID: 0x5011
```

Copy the IDs into your `.env`:

```
PRINTER_TRANSPORT=escpos-usb
PRINTER_VENDOR_ID=0x0416
PRINTER_PRODUCT_ID=0x5011
RECEIPT_CHAR_WIDTH=32
STORE_NAME=Create Your Style
STORE_ADDRESS=TC USHS - #831100254488|Pasoanca, Zambonaga City
```

`RECEIPT_CHAR_WIDTH=32` keeps layout inside a 58 mm roll. The address uses `|` as a line separator.

### Paper Size Configuration

The system is configured for **58mm thermal paper** by default:
- **58mm paper**: `RECEIPT_CHAR_WIDTH=32` (32 characters per line)
- **80mm paper**: Set `RECEIPT_CHAR_WIDTH=48` in your `.env` file

The character width is automatically enforced throughout the receipt formatting (headers, items, totals, etc.).

## 3. Test Print (Optional but Recommended)

Before integrating with your POS, test the printer connection with a sample receipt:

```bash
cd backend
node scripts/testPrint.js
```

This will:
- ✅ Verify USB printer connection
- ✅ Print a sample receipt with test data
- ✅ Confirm 58mm formatting is correct
- ✅ Test auto-cut functionality

If the test print succeeds, your printer is ready to use with the POS system.

## 4. Express Route

`POST /api/print/receipt`

```json
{
  "receiptData": {
    "receiptNo": "000123",
    "items": [
      { "name": "Top", "qty": 1, "price": 299, "total": 299 }
    ],
    "subtotal": 299,
    "discount": 0,
    "total": 299,
    "cash": 500,
    "change": 201,
    "paymentMethod": "CASH",
    "cashier": "Ana",
    "date": "2025-11-27",
    "time": "13:32"
  }
}
```

The controller automatically calls the ESC/POS USB pipeline when `PRINTER_TRANSPORT=escpos-usb`, formats for 58 mm, feeds, and issues a **full auto-cut** (`.cut('full')`).

## 5. ESC/POS Commands Used

- `.align('ct'|'lt'|'rt')` – headings and totals.
- `.size(width, height)` – bold title row (`1x1`) then normal body (`0x0`).
- `.text()` – main body lines, clamped to `RECEIPT_CHAR_WIDTH`.
- `.style('B')` – emphasise total and receipt number.
- `.feed(n)` – blank lines before cutting.
- `.cut('full')` – JK-5802H automatic cutter trigger.

Feel free to chain additional ESC/POS helpers (e.g. `.qrimage()`, `.barcode()`) inside `printViaEscposUsb`.

## 6. Frontend Trigger Example (React)

```jsx
import { useState } from 'react';
import { sendReceiptToPrinter } from '../utils/printBridge';

export function PrintButton({ receipt }) {
  const [busy, setBusy] = useState(false);

  const handlePrint = async () => {
    try {
      setBusy(true);
      await sendReceiptToPrinter(receipt);
      alert('Receipt sent to printer');
    } catch (error) {
      alert(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={handlePrint} disabled={busy}>
      {busy ? 'Printing…' : 'Print Receipt'}
    </button>
  );
}
```

The helper automatically posts to `/api/print/receipt`.

## 7. Troubleshooting

- **Device not found:** rerun `node scripts/scanUsbPrinters.js` and confirm IDs; ensure no other app is holding the port.
- **Permission denied (Linux):** double-check the udev rule and log out/in.
- **Windows libusb error:** re-run Zadig and select the correct interface (USB Printing Support → WinUSB).
- **Encoding issues:** set `PRINTER_ENCODING` to match your character set (e.g. `CP437`, `GB18030`).

With these steps the JK-5802H prints directly from the MERN backend without any Electron bridge.
