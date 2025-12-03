# Implementation Plan

- [x] 1. Create VoidTransactionModal component



  - [x] 1.1 Create the VoidTransactionModal.jsx file with basic modal structure

    - Create file at `frontend/src/components/terminal/VoidTransactionModal.jsx`
    - Implement modal overlay with backdrop blur matching existing modals
    - Add header with "Void Transaction" title and close button (red document icon)
    - _Requirements: 2.1_
  - [x] 1.2 Implement cart items list with checkboxes

    - Display each cart item with image, name, SKU, size, color, and price
    - Add checkbox for each item with red styling when selected
    - Style items in rounded cards matching the design mockup
    - _Requirements: 2.2, 2.3_

  - [ ] 1.3 Implement selection state management
    - Track selected items using useState
    - Toggle selection on checkbox click
    - Calculate total amount of selected items

    - _Requirements: 2.3, 2.4, 2.5_
  - [ ] 1.4 Add Cancel and Void Items buttons
    - Cancel button closes modal without changes
    - Void Items button disabled when no items selected
    - Void Items button calls onConfirm with selected items
    - _Requirements: 2.4, 2.5, 2.6_
  - [ ]* 1.5 Write property test for checkbox toggle idempotence
    - **Property 3: Checkbox toggle is idempotent**
    - **Validates: Requirements 2.3**
  - [ ]* 1.6 Write property test for Void Items button state
    - **Property 4: Void Items button state reflects selection**
    - **Validates: Requirements 2.4, 2.5**

- [-] 2. Modify OrderSummary component to add void button

  - [x] 2.1 Add void button icon next to Order Summary heading


    - Import red document icon (use react-icons FaFileAlt or similar)
    - Position button to the right of "Order Summary" text
    - Style with red color matching the design mockup
    - _Requirements: 1.1_

  - [ ] 2.2 Implement void button disabled state
    - Disable button when cart is empty
    - Apply gray/muted styling when disabled
    - Enable button when cart has items
    - _Requirements: 1.2, 1.3_
  - [ ]* 2.3 Write property test for void button state
    - **Property 1: Void button state reflects cart emptiness**
    - **Validates: Requirements 1.2, 1.3**

- [-] 3. Integrate VoidTransactionModal with OrderSummary

  - [x] 3.1 Add state and handlers for void modal

    - Add `isVoidModalOpen` state
    - Add `itemsToVoid` state for selected items
    - Implement `handleVoidButtonClick` to open modal
    - _Requirements: 2.1_
  - [x] 3.2 Implement void confirmation flow

    - `handleVoidItemsConfirm` receives selected items from modal
    - Store selected items in state
    - Close VoidTransactionModal and open RemoveItemPinModal
    - _Requirements: 3.1_

  - [ ] 3.3 Implement bulk void processing
    - Modify `handleRemoveConfirm` to handle multiple items
    - Loop through selected items and create void transactions
    - Remove all voided items from cart
    - _Requirements: 3.3, 3.4_
  - [ ]* 3.4 Write property test for void amount calculation
    - **Property 5: Void amount equals sum of selected items**
    - **Validates: Requirements 3.2**
  - [ ]* 3.5 Write property test for cart state after void
    - **Property 6: Successful void removes selected items from cart**
    - **Validates: Requirements 3.3, 3.4**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Wire up modal rendering and final integration


  - [x] 5.1 Add VoidTransactionModal to OrderSummary render

    - Import VoidTransactionModal component
    - Render modal with isOpen, onClose, onConfirm, and cartItems props
    - _Requirements: 2.1_

  - [ ] 5.2 Update RemoveItemPinModal usage for bulk void
    - Pass synthetic item object with total amount for bulk void
    - Ensure PIN modal displays correct total
    - _Requirements: 3.2_
  - [ ]* 5.3 Write property test for modal displaying all cart items
    - **Property 2: Modal displays all cart items**
    - **Validates: Requirements 2.1, 2.2**

- [ ] 6. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
