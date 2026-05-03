# Roles and Register Request - Documentation

This document describes the available `role` values, the `sellerType` enum, and the expected `RegisterRequest` payloads produced by the frontend in this repository. It includes validation notes, conditional requirements, example JSON payloads for each role (including seller subtypes), and a JSON Schema / OpenAPI fragment you can reuse.

**Location (frontend):** `src/types/index.ts` — `UserRole`, `SellerType`, and `RegisterRequest` definitions.

---

## Enums

- `UserRole` (string enum)
  - `ADMIN`
  - `SELLER`
  - `CUSTOMER`
  - `DELIVERY_AGENT`

- `SellerType` (string enum)
  - `INDIVIDUAL`
  - `BUSINESS`
  - `FARMER`
  - `WHOLESALER`
  - `RETAILER`

These enums are defined in `src/types/index.ts` and are the canonical values used by the frontend.

**Note:** SellerType values are stored in the database (`seller_profiles` table), not as Keycloak roles. All sellers have the single `SELLER` role in Keycloak.

---

### Fields Made Mandatory (summary)

- **Global (all roles):** `username`, `email`, `password`, `firstName`, `lastName`, `role`, **`phone`** (note: `phone` was changed from optional to required on the frontend).
- **Client-only (form):** `confirmPassword` — required in the client form for validation but **stripped** before sending to the API.
- **When `role === "SELLER"`:** `sellerType` is required.
- **When `sellerType === "FARMER"`:** `aadharNumber` and `farmingLandArea` are required; `shopName` and `businessName` are **not required** for farmers.
- **When `role === "SELLER"` and `sellerType !== "FARMER"`:** `shopName` and `businessName` are required.
- **When `role === "DELIVERY_AGENT"`:** `vehicleType` is required.

See `app/auth/register/page.tsx` for the Zod form schema (`finalRegisterSchema`) and `src/types/index.ts` for the TypeScript `RegisterRequest` type.

## RegisterRequest (frontend shape)

Core fields (required for all users):

- `username` (string, min 3)
- `email` (string, valid email)
- `password` (string, min 6)
- `confirmPassword` (string, client-side only; must equal `password`)
- `firstName` (string, min 2)
- `lastName` (string, min 2)
- `role` (one of `UserRole` values)
- `phone` (string, required)
- `address` (optional string)

TypeScript `RegisterRequest` (frontend) excerpt (see `src/types/index.ts`):

```ts
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string; // now required on frontend
  address?: string;
  // seller/delivery fields omitted for brevity
}
```

Seller-specific optional fields (present only when `role` is `SELLER`):

- `sellerType` (one of `SellerType`) — required when `role === SELLER`.
- `shopName` (string) — required for sellers except when `sellerType === FARMER`.
- `businessName` (string) — required for sellers except when `sellerType === FARMER`.
- `businessType` (string, optional)
- `panNumber` (string, optional)
- `gstinNumber` (string, optional)

Farmer-specific fields (when `sellerType === FARMER`):

- `aadharNumber` (string, 12 digits recommended) — required for farmers.
- `farmingLandArea` (string) — required for farmers.

Delivery agent fields (when `role === DELIVERY_AGENT`):

- `vehicleType` (string) — required for delivery agents.

Notes:

- The client Zod schema performs the above conditional validations. The frontend form displays fields conditionally and performs validation accordingly.
- `confirmPassword` is only used client-side to validate password equality and is removed before the payload is sent to the API (`confirmPassword` is stripped on submit). The API payload therefore does not include `confirmPassword` by default.

---

## Client behavior / special handling

- Legacy UI option: previously the UI had a `role: "FARMER"` choice. For backward compatibility the client converts legacy `role === "FARMER"` into the canonical payload:
  - Converted payload sent to API:
    - `role: "SELLER"`
    - `sellerType: "FARMER"`

  This conversion happens only on the client prior to sending the request to the backend.

- Empty strings are removed from the payload before sending (the client filters `""` and `null`).

- `confirmPassword` is validated by the Zod schema but removed from the sent payload:
  ```ts
  const { confirmPassword, ...registerData } = data;
  // clean empty strings
  Object.keys(registerData).forEach((k) => {
    if (registerData[k] === '' || registerData[k] === null) delete registerData[k];
  });
  // send registerData to API
  ```

Actual API payload example (what the backend receives) — note `confirmPassword` is removed and empty strings stripped:

```json
{
  "username": "jaya123",
  "email": "jaya@example.com",
  "password": "StrongP@ss1",
  "firstName": "Jaya",
  "lastName": "Sharma",
  "role": "CUSTOMER",
  "phone": "9876501234",
  "address": "12 Green Street, City"
}
```

---

## Example payloads

These examples include `confirmPassword` as it appears in the client form. The frontend removes `confirmPassword` before sending the payload.

### Customer

```json
{
  "username": "jaya123",
  "email": "jaya@example.com",
  "password": "StrongP@ss1",
  "confirmPassword": "StrongP@ss1",
  "firstName": "Jaya",
  "lastName": "Sharma",
  "role": "CUSTOMER",
  "phone": "9876501234",
  "address": "12 Green Street, City"
}
```

### Delivery Agent

```json
{
  "username": "ram_driver",
  "email": "ram.driver@example.com",
  "password": "DriverP@ss2",
  "confirmPassword": "DriverP@ss2",
  "firstName": "Ram",
  "lastName": "Kumar",
  "role": "DELIVERY_AGENT",
  "phone": "9123456789",
  "address": "45 Fleet Lane",
  "vehicleType": "Bike"
}
```

### Admin

```json
{
  "username": "admin01",
  "email": "admin@example.com",
  "password": "AdminP@ssw0rd!",
  "confirmPassword": "AdminP@ssw0rd!",
  "firstName": "Site",
  "lastName": "Admin",
  "role": "ADMIN",
  "phone": "9000001111",
  "address": "Head Office, Admin Building"
}
```

### Sellers — Farmer (example)

```json
{
  "username": "ram_farmer",
  "email": "ram.farmer@example.com",
  "password": "FarmP@ss123",
  "confirmPassword": "FarmP@ss123",
  "firstName": "Ram",
  "lastName": "Kumar",
  "role": "SELLER",
  "sellerType": "FARMER",
  "aadharNumber": "123412341234",
  "farmingLandArea": "2 acres",
  "phone": "9876543210",
  "address": "Green Village"
}
```

### Sellers — Retailer

```json
{
  "username": "anita_retailer",
  "email": "anita.retailer@example.com",
  "password": "RetailP@ss1",
  "confirmPassword": "RetailP@ss1",
  "firstName": "Anita",
  "lastName": "Shah",
  "role": "SELLER",
  "sellerType": "RETAILER",
  "shopName": "Anita's Grocery",
  "businessName": "Anita Groceries",
  "businessType": "proprietorship",
  "panNumber": "ABCDE1234F",
  "gstinNumber": "22ABCDE1234F1Z5",
  "phone": "9876501234",
  "address": "Market Road 12"
}
```

### Sellers — WHOLESALER (example)

```json
{
  "username": "wholesale_inc",
  "email": "wholesale@example.com",
  "password": "WholesaleP@ss1",
  "confirmPassword": "WholesaleP@ss1",
  "firstName": "Vijay",
  "lastName": "Kumar",
  "role": "SELLER",
  "sellerType": "WHOLESALER",
  "shopName": "Vijay Wholesalers",
  "businessName": "Vijay Agro Traders",
  "businessType": "partnership",
  "panNumber": "ABCDE1234F",
  "gstinNumber": "27ABCDE1234F1Z7",
  "phone": "9988776655",
  "address": "Industrial Estate, City",
  "warehouseLocation": "Plot 12, Zona Industrial",
  "bulkPricingAgreement": true
}
```

### Sellers — SHOP (example)

```json
{
  "username": "local_shop1",
  "email": "local.shop@example.com",
  "password": "ShopP@ss1",
  "confirmPassword": "ShopP@ss1",
  "firstName": "Sita",
  "lastName": "Devi",
  "role": "SELLER",
  "sellerType": "SHOP",
  "shopName": "Sita's Corner Store",
  "businessName": "Sita Corner Store",
  "businessType": "proprietorship",
  "panNumber": "BCDEA9876K",
  "gstinNumber": "29BCDEA9876K1Z2",
  "phone": "9876012345",
  "address": "High Street 5"
}
```

(Other seller types follow similar shape to `RETAIL` with different `sellerType` and optional tax details.)

---

## JSON Schema (simplified)

Below is a simplified JSON Schema that documents the basic shape and conditional requirements. This is intended as a starting point for generating OpenAPI or server validation logic.

````json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "RegisterRequest",
  "type": "object",
  # Roles and Register Request - Documentation

  This document describes the available `role` values, the `sellerType` enum, and the expected `RegisterRequest` payloads produced by the frontend in this repository. It includes validation notes, conditional requirements, example JSON payloads for each role (including seller subtypes), and a JSON Schema / OpenAPI fragment you can reuse.

  **Location (frontend):** `src/types/index.ts` — `UserRole`, `SellerType`, and `RegisterRequest` definitions.

  ---

  ## Enums

  - `UserRole` (string enum)
    - `ADMIN`
    - `SELLER`
    - `CUSTOMER`
    - `DELIVERY_AGENT`

  - `SellerType` (string enum)
    - `FARMER`
    - `RETAIL`
    - `WHOLESALER`
    - `SHOP`

  These enums are defined in `src/types/index.ts` and are the canonical values used by the frontend.

  ---

  ## RegisterRequest (frontend shape)

  Core fields (required for all users):
  - `username` (string, min 3)
  - `email` (string, valid email)
  - `password` (string, min 6)
  - `confirmPassword` (string, client-side only; must equal `password`)
  - `firstName` (string, min 2)
  - `lastName` (string, min 2)
  - `role` (one of `UserRole` values)
  - `phone` (string, required)
  - `address` (optional string)

  Seller-specific optional fields (present only when `role` is `SELLER`):
  - `sellerType` (one of `SellerType`) — required when `role === SELLER`.
  - `shopName` (string) — required for sellers except when `sellerType === FARMER`.
  - `businessName` (string) — required for sellers except when `sellerType === FARMER`.
  - `businessType` (string, optional)
  - `panNumber` (string, optional)
  - `gstinNumber` (string, optional)

  Farmer-specific fields (when `sellerType === FARMER`):
  - `aadharNumber` (string, 12 digits recommended) — required for farmers.
  - `farmingLandArea` (string) — required for farmers.

  Delivery agent fields (when `role === DELIVERY_AGENT`):
  - `vehicleType` (string) — required for delivery agents.

  Notes:
  - The client Zod schema performs the above conditional validations. The frontend form displays fields conditionally and performs validation accordingly.
  - `confirmPassword` is only used client-side to validate password equality and is removed before the payload is sent to the API (`confirmPassword` is stripped on submit). The API payload therefore does not include `confirmPassword` by default.

  ---

  ## Client behavior / special handling

  - Legacy UI option: previously the UI had a `role: "FARMER"` choice. For backward compatibility the client converts legacy `role === "FARMER"` into the canonical payload:

    - Converted payload sent to API:
      - `role: "SELLER"`
      - `sellerType: "FARMER"`

    This conversion happens only on the client prior to sending the request to the backend.

  - Empty strings are removed from the payload before sending (the client filters `""` and `null`).

  - `confirmPassword` is validated by the Zod schema but removed from the sent payload:
    ```ts
    const { confirmPassword, ...registerData } = data;
    // clean empty strings
    Object.keys(registerData).forEach(k => { if (registerData[k] === '' || registerData[k] === null) delete registerData[k]; });
    // send registerData to API
    ```

  ---

  ## Example payloads

  These examples include `confirmPassword` as it appears in the client form. The frontend removes `confirmPassword` before sending the payload.

  ### Customer

  ```json
  {
    "username": "jaya123",
    "email": "jaya@example.com",
    "password": "StrongP@ss1",
    "confirmPassword": "StrongP@ss1",
    "firstName": "Jaya",
    "lastName": "Sharma",
    "role": "CUSTOMER",
    "phone": "9876501234",
    "address": "12 Green Street, City"
  }
````

### Delivery Agent

```json
{
  "username": "ram_driver",
  "email": "ram.driver@example.com",
  "password": "DriverP@ss2",
  "confirmPassword": "DriverP@ss2",
  "firstName": "Ram",
  "lastName": "Kumar",
  "role": "DELIVERY_AGENT",
  "phone": "9123456789",
  "address": "45 Fleet Lane",
  "vehicleType": "Bike"
}
```

### Admin

```json
{
  "username": "admin01",
  "email": "admin@example.com",
  "password": "AdminP@ssw0rd!",
  "confirmPassword": "AdminP@ssw0rd!",
  "firstName": "Site",
  "lastName": "Admin",
  "role": "ADMIN",
  "phone": "9000001111",
  "address": "Head Office, Admin Building"
}
```

### Sellers — Farmer (example)

```json
{
  "username": "ram_farmer",
  "email": "ram.farmer@example.com",
  "password": "FarmP@ss123",
  "confirmPassword": "FarmP@ss123",
  "firstName": "Ram",
  "lastName": "Kumar",
  "role": "SELLER",
  "sellerType": "FARMER",
  "aadharNumber": "123412341234",
  "farmingLandArea": "2 acres",
  "phone": "9876543210",
  "address": "Green Village"
}
```

### Sellers — Retail

```json
{
  "username": "anita_retail",
  "email": "anita.retail@example.com",
  "password": "RetailP@ss1",
  "confirmPassword": "RetailP@ss1",
  "firstName": "Anita",
  "lastName": "Shah",
  "role": "SELLER",
  "sellerType": "RETAIL",
  "shopName": "Anita's Grocery",
  "businessName": "Anita Groceries",
  "businessType": "proprietorship",
  "panNumber": "ABCDE1234F",
  "gstinNumber": "22ABCDE1234F1Z5",
  "phone": "9876501234",
  "address": "Market Road 12"
}
```

(Other seller types follow similar shape to `RETAIL` with different `sellerType` and optional tax details.)

---

## JSON Schema (simplified)

Below is a simplified JSON Schema that documents the basic shape and conditional requirements. This is intended as a starting point for generating OpenAPI or server validation logic.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "RegisterRequest",
  "type": "object",
  "required": [
    "username",
    "email",
    "password",
    "confirmPassword",
    "firstName",
    "lastName",
    "role",
    "phone"
  ],
  "properties": {
    "username": { "type": "string", "minLength": 3 },
    "email": { "type": "string", "format": "email" },
    "password": { "type": "string", "minLength": 6 },
    "confirmPassword": { "type": "string" },
    "firstName": { "type": "string", "minLength": 2 },
    "lastName": { "type": "string", "minLength": 2 },
    "role": { "type": "string", "enum": ["ADMIN", "SELLER", "CUSTOMER", "DELIVERY_AGENT"] },

    "sellerType": { "type": "string", "enum": ["FARMER", "RETAIL", "WHOLESALER", "SHOP"] },
    "shopName": { "type": "string" },
    "businessName": { "type": "string" },
    "panNumber": { "type": "string" },
    "gstinNumber": { "type": "string" },
    "businessType": { "type": "string" },

    "aadharNumber": { "type": "string" },
    "farmingLandArea": { "type": "string" },

    "vehicleType": { "type": "string" }
  },
  "allOf": [
    {
      "if": { "properties": { "role": { "const": "SELLER" } } },
      "then": { "required": ["sellerType"] }
    },
    {
      "if": {
        "properties": { "role": { "const": "SELLER" }, "sellerType": { "const": "FARMER" } }
      },
      "then": { "required": ["aadharNumber", "farmingLandArea"] }
    },
    {
      "if": {
        "properties": {
          "role": { "const": "SELLER" },
          "sellerType": { "not": { "const": "FARMER" } }
        }
      },
      "then": { "required": ["shopName", "businessName"] }
    },
    {
      "if": { "properties": { "role": { "const": "DELIVERY_AGENT" } } },
      "then": { "required": ["vehicleType"] }
    }
  ]
}
```

Notes about this schema:

- The schema includes conditional `allOf`/`if-then` rules to express role-dependent fields. It is simplified and intended as a reference; adapt as needed for your server validation library.
- You may want to drop `confirmPassword` from the API schema if you prefer it to be client-only.

---

## OpenAPI snippet (components/schema) — minimal

```yaml
RegisterRequest:
  type: object
  required: [username, email, password, firstName, lastName, role, phone]
  properties:
    username:
      type: string
      minLength: 3
    email:
      type: string
      format: email
    password:
      type: string
      minLength: 6
    firstName:
      type: string
    lastName:
      type: string
    role:
      type: string
      enum: [ADMIN, SELLER, CUSTOMER, DELIVERY_AGENT]
    sellerType:
      type: string
      enum: [FARMER, RETAIL, WHOLESALER, SHOP]
    shopName:
      type: string
    businessName:
      type: string
    aadharNumber:
      type: string
    farmingLandArea:
      type: string
    vehicleType:
      type: string
```

Conditional requirements (seller/agent) must be added using `oneOf`/`allOf` at the operation level or validated server-side.

---

## Recommended next steps

- If you want the backend to accept `sellerType`, ensure your server `RegisterRequest`/DTO includes `sellerType` (the frontend types are already updated; update server DTO accordingly).
- Confirm whether you want `confirmPassword` sent to the backend. The recommended approach is to keep it client-only (the frontend validates and strips it).
- If you want automated dev setup I can:
  - Add a dedicated `openapi.yaml` fragment under `src/docs` and wire it to your API docs.
  - Add a local seed script (`scripts/seed-dev.ts`) to create the sample test accounts in your dev database (safe for local use only).

Note: The frontend now uses `finalRegisterSchema` as the `useForm` resolver and `phone` is required; `npm run type-check` was run and passed in the current workspace.

---

Document created by the frontend team helper. If you'd like changes (formatting, more examples, stricter JSON Schema, or server DTO updates), tell me which and I'll apply them.

---

## Sample Test Accounts

Use these sample accounts for local development and manual testing. Do NOT use real credentials in production; remove or rotate these before deploying.

| Role             | Seller Type  | Username     | Password       | Email                      |
| ---------------- | ------------ | ------------ | -------------- | -------------------------- |
| `ADMIN`          |              | `admin`      | `admin123`     | `admin@ecommerce.com`      |
| `CUSTOMER`       |              | `customer1`  | `customer123`  | `customer1@ecommerce.com`  |
| `SELLER`         | `FARMER`     | `farmer1`    | `farmer123`    | `farmer1@ecommerce.com`    |
| `SELLER`         | `RETAIL`     | `retail1`    | `retail123`    | `retail1@ecommerce.com`    |
| `SELLER`         | `WHOLESALER` | `wholesale1` | `wholesale123` | `wholesale1@ecommerce.com` |
| `SELLER`         | `SHOP`       | `shop1`      | `shop123`      | `shop1@ecommerce.com`      |
| `DELIVERY_AGENT` |              | `delivery1`  | `delivery123`  | `delivery1@ecommerce.com`  |

If you want, I can also add these accounts to a local seed script or `fixtures` file for automated test setup.
