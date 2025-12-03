# Design Document: Void Transaction Button

## Overview

This feature adds a void transaction button to the Order Summary component, enabling cashiers to void multiple cart items in a single operation. The implementation follows the existing patterns in the codebase, reusing the RemoveItemPinModal for PIN authorization and creating a new VoidTransactionModal for item selection.

## Architecture

The feature follows the existing React component architecture:

```
Terminal Page (terminal.jsx)
└── OrderSummary.jsx
    ├── VoidTransactionModal.jsx (NEW)
    └── RemoveItemPinModal.jsx (EXISTING - reused)
```

The flow is:
1. User clicks void button → Opens VoidTransactionModal
2. User selects items → Clicks "Void Items"
3. VoidTransactionModal closes → RemoveItemPinModal opens with selected items
4. User enters PIN → Void transaction processed → Items removed from cart

## Components and Interfaces

### VoidTransactionModal (New Component)

```jsx
interface VoidTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedItems: CartItem[]) => void;
  cartItems: CartItem[];
}
```

**Responsibilities:**
- Display all cart items with checkboxes
- Track selected items state
- Calculate total amount of selected items
- Pass selected items to parent on confirm

### OrderSummary (Modified)

**New State:**
- `isVoidModalOpen: boolean` - Controls VoidTransactionModal visibility
- `itemsToVoid: CartItem[]` - Stores selected items for void operation

**New Handler:**
- `handleVoidButtonClick()` - Opens VoidTransactionModal
- `handleVoidItemsConfirm(selectedItems)` - Receives selected items, opens PIN modal
- `handleBulkVoidConfirm(reason)` - Processes void for all selected items

### RemoveItemPinModal (Existing - Minor Modification)

The existing modal will be reused. It already accepts an `item` prop for single item void. For bulk void, we'll pass a synthetic item object representing the total:

```jsx
{
  itemPrice: totalSelectedAmount,
  quantity: 1,
  itemName: `${selectedCount} items`
}
```

## Data Models

### CartItem (Existing)
```typescript
interface CartItem {
  _id: string;
  productId: string;
  itemName: string;
  sku: string;
  variant?: string;
  selectedVariation?: string;
  selectedSize?: string;
  size?: string;
  itemPrice: number;
  quantity: number;
  itemImage?: string;
  currentStock?: number;
  sizes?: Record<string, number | { quantity: number }>;
}
```

### VoidTransaction (Existing - for API call)
```typescript
interface VoidTransaction {
  userId: string;
  items: VoidedItem[];
  paymentMethod: 'void';
  totalAmount: number;
  performedById: string;
  performedByName: string;
  status: 'Voided';
  voidReason: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Void button state reflects cart emptiness
*For any* cart state, the void button should be disabled if and only if the cart is empty.
**Validates: Requirements 1.2, 1.3**

### Property 2: Modal displays all cart items
*For any* non-empty cart, when the VoidTransactionModal opens, it should display exactly the same items that are in the cart.
**Validates: Requirements 2.1, 2.2**

### Property 3: Checkbox toggle is idempotent
*For any* item in the modal, clicking the checkbox twice should return the item to its original selection state.
**Validates: Requirements 2.3**

### Property 4: Void Items button state reflects selection
*For any* selection state in the modal, the "Void Items" button should be disabled if and only if no items are selected.
**Validates: Requirements 2.4, 2.5**

### Property 5: Void amount equals sum of selected items
*For any* set of selected items, the total amount displayed in the PIN modal should equal the sum of (itemPrice × quantity) for all selected items.
**Validates: Requirements 3.2**

### Property 6: Successful void removes selected items from cart
*For any* set of selected items that are successfully voided, those items should no longer appear in the cart after the operation completes.
**Validates: Requirements 3.3, 3.4**

## Error Handling

| Scenario | Handling |
|----------|----------|
| Empty cart | Void button disabled, cannot open modal |
| No items selected | "Void Items" button disabled |
| Invalid PIN | Error message displayed, user can retry |
| Network error during void | Error logged, items still removed from cart (matches existing behavior) |
| Modal closed unexpectedly | State reset, no items voided |

## Testing Strategy

### Unit Tests
- VoidTransactionModal renders correctly with cart items
- Checkbox selection toggles item state
- Cancel button closes modal without changes
- Void button disabled state based on cart

### Property-Based Tests
Using a property-based testing library (e.g., fast-check), the following properties will be tested:

1. **Property 1**: Generate random cart states (empty and non-empty), verify button disabled state matches cart emptiness
2. **Property 2**: Generate random cart items, verify modal displays all items
3. **Property 3**: Generate random click sequences on checkboxes, verify double-click returns to original state
4. **Property 4**: Generate random selection states, verify button disabled matches empty selection
5. **Property 5**: Generate random item selections, verify total calculation
6. **Property 6**: Generate random void operations, verify items removed from cart

Each property-based test will be configured to run a minimum of 100 iterations and will be tagged with the format: `**Feature: void-transaction-button, Property {number}: {property_text}**`
