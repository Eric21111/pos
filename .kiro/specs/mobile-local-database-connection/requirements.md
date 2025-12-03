# Requirements Document

## Introduction

This feature ensures the mobile application connects to the local MongoDB database through the backend API, restricts PIN authentication to owner-role accounts only, and properly fetches and displays all data from the local database including products, transactions, analytics, and inventory information.

## Glossary

- **Mobile_App**: The React Native/Expo mobile application for the POS system
- **Backend_API**: The Express.js server running on port 5000 that connects to MongoDB
- **Local_Database**: The MongoDB instance running locally on the same network
- **Owner**: An employee with the "Owner" role who has full access to the mobile app
- **PIN**: A 6-digit numeric code used for authentication
- **API_Base_URL**: The configurable IP address and port for connecting to the backend

## Requirements

### Requirement 1

**User Story:** As a mobile app user, I want to connect to the local database through the backend API, so that I can access real-time data from the POS system.

#### Acceptance Criteria

1. WHEN the mobile app starts THEN the Mobile_App SHALL connect to the Backend_API using the configured API_Base_URL
2. WHEN the Backend_API is unreachable THEN the Mobile_App SHALL display a clear error message indicating connection failure
3. WHEN the connection is established THEN the Mobile_App SHALL be able to make API requests to all available endpoints

### Requirement 2

**User Story:** As a system administrator, I want only owner accounts to access the mobile app, so that sensitive business data is protected from unauthorized access.

#### Acceptance Criteria

1. WHEN a user enters a valid PIN THEN the Mobile_App SHALL verify the PIN against the Backend_API
2. WHEN the PIN belongs to an Owner role account THEN the Mobile_App SHALL grant access and navigate to the main dashboard
3. WHEN the PIN belongs to a non-Owner role account THEN the Mobile_App SHALL reject access and display "Only owner account can access the mobile app"
4. WHEN the PIN is invalid THEN the Mobile_App SHALL display an error message and clear the PIN input
5. WHEN the PIN verification request fails due to network issues THEN the Mobile_App SHALL display a connection error message

### Requirement 3

**User Story:** As an owner, I want to view all products from the inventory, so that I can monitor stock levels and product information.

#### Acceptance Criteria

1. WHEN the inventory screen loads THEN the Mobile_App SHALL fetch all products from the Backend_API
2. WHEN products are fetched successfully THEN the Mobile_App SHALL display product name, SKU, brand, category, price, and stock quantity
3. WHEN a product has low stock (less than 5 units) THEN the Mobile_App SHALL highlight the stock quantity in red
4. WHEN the user pulls down to refresh THEN the Mobile_App SHALL re-fetch products from the Backend_API

### Requirement 4

**User Story:** As an owner, I want to view all transactions, so that I can monitor sales activity.

#### Acceptance Criteria

1. WHEN the transaction screen loads THEN the Mobile_App SHALL fetch all transactions from the Backend_API
2. WHEN transactions are fetched successfully THEN the Mobile_App SHALL display receipt number, cashier name, items, status, total amount, and date
3. WHEN the user searches for a transaction THEN the Mobile_App SHALL filter results by receipt number, date, or status
4. WHEN the user pulls down to refresh THEN the Mobile_App SHALL re-fetch transactions from the Backend_API

### Requirement 5

**User Story:** As an owner, I want to view dashboard statistics, so that I can get a quick overview of business performance.

#### Acceptance Criteria

1. WHEN the dashboard screen loads THEN the Mobile_App SHALL display the logged-in owner's name in the welcome message
2. WHEN the dashboard loads THEN the Mobile_App SHALL fetch and display total sales, transaction count, average transaction value, and low stock item count from the Backend_API
3. WHEN the user pulls down to refresh THEN the Mobile_App SHALL re-fetch dashboard statistics from the Backend_API

### Requirement 6

**User Story:** As an owner, I want to view analytics data, so that I can analyze sales trends and product performance.

#### Acceptance Criteria

1. WHEN the analytics screen loads THEN the Mobile_App SHALL display sales charts with daily, monthly, and yearly views
2. WHEN the user switches between chart views THEN the Mobile_App SHALL update the chart data accordingly
3. WHEN the analytics screen loads THEN the Mobile_App SHALL display low stock and out-of-stock items list
