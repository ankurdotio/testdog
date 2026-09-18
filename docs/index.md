# Testdog API Documentation

Testdog is a free API platform for users, products, carts, and payments.

## Use This Documentation on GitHub Pages

This site uses Markdown. It works directly with GitHub Pages, is easy to edit in pull requests, and needs no extra build tool. In the repository settings, set **Pages** to deploy from the `/docs` folder on your chosen branch.

## Quick Start

Replace `<base-url>` with the URL where this server is running. All API routes start with `/api/v1`.

```bash
curl <base-url>/api/v1/store/products
```

Send JSON request bodies with this header:

```http
Content-Type: application/json
```

For protected routes, send the access token from login or registration:

```http
Authorization: Bearer <access-token>
```

The server also sets `accessToken` and `refreshToken` as secure, HTTP-only cookies. Browser clients that use these cookies must send requests with credentials.

## Response Basics

Most routes return this success format:

```json
{
  "success": true,
  "message": "A short message",
  "data": {}
}
```

Payment routes use `status` instead of the top-level `success` field:

```json
{
  "status": "success",
  "message": "A short message",
  "data": {}
}
```

### Errors

Most errors use this format:

```json
{
  "success": false,
  "status": "fail",
  "message": "What went wrong"
}
```

Routes using the shared request validator return field errors with status `422`:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Please provide a valid email"
  }
}
```

Payment request validation returns status `400` and combines validation messages in `message`.

| Status | Meaning                                                                          |
| ------ | -------------------------------------------------------------------------------- |
| `400`  | The request is invalid, or cannot be completed.                                  |
| `401`  | Sign in is required, the token is invalid, or the token has expired.             |
| `403`  | Your account does not have permission.                                           |
| `404`  | The requested item does not exist.                                               |
| `409`  | A product with this name already exists.                                         |
| `422`  | One or more fields did not pass validation.                                      |
| `429`  | Too many requests. Check the `RateLimit-*` response headers before trying again. |
| `500`  | An unexpected server or payment-provider error occurred.                         |

The whole API is limited to 100 requests per 15 minutes per IP address. Auth routes are limited to 20 requests per 15 minutes, registration to 5 per minute, and product creation to 10 per 10 minutes.

## Data Shapes

### User

```json
{
  "_id": "66a1...",
  "username": "jane_doe",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "avatar": "https://...",
  "createdAt": "2026-09-18T10:00:00.000Z",
  "updatedAt": "2026-09-18T10:00:00.000Z"
}
```

Passwords, email-verification state, and verification tokens are not returned. Admin user lists also include `role`.

### Product

```json
{
  "_id": "66a1...",
  "product_name": "Everyday Backpack",
  "description": "A lightweight bag for daily use.",
  "initial_price": 100,
  "final_price": 80,
  "currency": "USD",
  "in_stock": true,
  "main_image": "https://example.com/bag.jpg",
  "category_tree": ["Accessories", "Bags"],
  "image_count": 1,
  "image_urls": ["https://example.com/bag.jpg"],
  "other_attributes": [{ "name": "material", "value": "canvas" }],
  "rating": 0,
  "root_category": "Accessories",
  "category": "Bags",
  "all_available_sizes": ["M"],
  "discount_amount": 20,
  "discount_percentage": 20,
  "createdAt": "2026-09-18T10:00:00.000Z",
  "updatedAt": "2026-09-18T10:00:00.000Z"
}
```

`discount_amount` and `discount_percentage` are calculated response fields. `root_category`, `category`, `image_count`, and `all_available_sizes` can be filled from the request data by the server.

### Cart

```json
{
  "_id": "66a1...",
  "items": [
    {
      "_id": "66a2...",
      "product": "66a3...",
      "quantity": 2,
      "price": 80,
      "selectedSize": "M",
      "selectedColor": "Black",
      "subtotal": 160
    }
  ],
  "totalItems": 2,
  "totalAmount": 160,
  "currency": "USD",
  "updatedAt": "2026-09-18T10:00:00.000Z"
}
```

`subtotal` is calculated for each cart item. Product availability and current prices are checked whenever a cart is read.

### Shipping Address

All shipping-address fields are optional. When supplied, use this shape:

```json
{
  "shippingAddress": {
    "fullName": "Jane Doe",
    "address": "12 Market Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India",
    "phone": "+919876543210"
  }
}
```

`fullName` is 2-100 characters; `address` is 5-200; `city`, `state`, and `country` are 2-50; `zipCode` is 5-10 digits; and `phone` is an international phone number.

## Authentication

### Register

`POST /api/v1/auth/register`

**Request body**

| Field      | Required | Rules                                                                            |
| ---------- | -------- | -------------------------------------------------------------------------------- |
| `email`    | Yes      | A valid email address.                                                           |
| `password` | Yes      | At least 8 characters, with uppercase, lowercase, number, and special character. |
| `username` | No       | 3-30 letters, numbers, or underscores.                                           |
| `name`     | No       | 2-50 characters.                                                                 |

```json
{
  "username": "jane_doe",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Example123!"
}
```

**Success: `201`**

```json
{
  "success": true,
  "data": {
    "_id": "66a1...",
    "username": "jane_doe",
    "email": "jane@example.com"
  },
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

**Possible errors:** `400` email is already registered or username is taken; `422` invalid fields; `429` too many registration attempts.

### Login

`POST /api/v1/auth/login`

**Request body**

```json
{
  "email": "jane@example.com",
  "password": "Example123!"
}
```

Both fields are required. Password must be at least 8 characters.

**Success: `200`** returns `success`, the user in `data`, `accessToken`, and `refreshToken`, with the same shape as registration.

**Possible errors:** `401` invalid email or password; `422` missing or invalid fields; `429` too many authentication attempts.

### Get Current User

`GET /api/v1/auth/getme` - protected

**Request body:** none.

**Success: `200`**

```json
{ "success": true, "data": { "_id": "66a1...", "email": "jane@example.com" } }
```

**Possible errors:** `401` missing, invalid, or expired token; `404` user not found.

### Refresh Access Token

`GET /api/v1/auth/access-token`

**Request body:** none. Send the `refreshToken` cookie created at login or registration.

**Success: `200`**

```json
{ "success": true, "accessToken": "<new-jwt>" }
```

**Possible errors:** `401` no refresh token, or the refresh token is invalid, expired, revoked, or does not match the saved token.

### Logout

`GET /api/v1/auth/logout` - protected

**Request body:** none.

**Success: `200`**

```json
{ "success": true, "message": "Logged out successfully" }
```

**Possible errors:** `401` missing, invalid, or expired access token.

### Send Verification Email

`POST /api/v1/auth/verify-email`

**Request body**

```json
{ "email": "jane@example.com" }
```

`email` is required and must be valid.

**Success: `200`**

```json
{ "success": true, "message": "Verification email sent" }
```

**Possible errors:** `404` user not found; `422` invalid email; `429` too many authentication attempts.

### Confirm Verification Email

`GET /api/v1/auth/verify-email?token=<verification-token>`

**Request body:** none. The `token` query parameter is required.

**Success: `200`**

```json
{
  "success": true,
  "message": "Email verified successfully",
  "user": { "_id": "66a1...", "email": "jane@example.com" }
}
```

**Possible errors:** `401` invalid or expired token; `422` missing token; `429` too many authentication attempts.

### Sign In with Google

`GET /api/v1/auth/google`

**Request body:** none. Open this URL in a browser. It redirects to Google.

`GET /api/v1/auth/google/callback`

Google calls this URL after the user accepts or declines. A successful callback returns `200`, secure token cookies, the user ID/name/email, and both tokens:

```json
{
  "success": true,
  "message": "Authentication successful",
  "user": { "id": "66a1...", "name": "Jane Doe", "email": "jane@example.com" },
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

**Possible errors:** `401` authentication failed. Passport redirects failed Google authentication to `/login-failed`.

## Users

### Update Your User

`PATCH /api/v1/users/update` - protected

**Request body** - send one or more fields:

```json
{
  "username": "jane_doe",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "avatar": "https://example.com/jane.jpg"
}
```

`username` is 3-30 characters, `name` is 2-50, `email` must be valid, and `avatar` must be a URL. The service only updates `username`, `name`, and `email`; `avatar` is accepted by validation but is not currently saved. Password changes are not supported by this route.

**Success: `200`**

```json
{
  "success": true,
  "data": {
    "_id": "66a1...",
    "username": "jane_doe",
    "email": "jane@example.com"
  }
}
```

**Possible errors:** `400` password cannot be updated directly; `401` unauthenticated; `404` user not found; `422` invalid field.

### Get a Random User

`GET /api/v1/users/getrandomuser`

**Request body:** none.

**Success: `200`** returns `{ "success": true, "data": <user> }`.

**Possible errors:** `404` no users found; `429` too many user-route requests.

### List Users

`GET /api/v1/users/all` - admin only

**Request body:** none.

**Query parameters**

| Field   | Required | Rules                           | Default |
| ------- | -------- | ------------------------------- | ------- |
| `page`  | No       | Positive integer starting at 1. | `1`     |
| `limit` | No       | 1-50.                           | `10`    |

**Success: `200`**

```json
{
  "success": true,
  "data": [
    {
      "_id": "66a1...",
      "username": "jane_doe",
      "email": "jane@example.com",
      "role": "user"
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
}
```

**Possible errors:** `401` unauthenticated; `403` not an admin; `400` page is past the final page; `422` invalid page or limit.

## Products

### List Products

`GET /api/v1/store/products`

**Request body:** none.

**Query parameters:** `page` is zero-based and defaults to `0`. `limit` defaults to `20` and must be 1-100.

**Success: `200`**

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": ["<product>"],
    "pagination": {
      "currentPage": 0,
      "limit": 20,
      "totalProducts": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

**Possible errors:** `400` page is negative or limit is outside 1-100.

### Get One Product

`GET /api/v1/store/products/:id`

**Request body:** none. `id` is the product ID.

**Success: `200`** returns `{ "success": true, "message": "Product retrieved successfully", "data": { "product": "<product>" } }`.

**Possible errors:** `400` invalid product ID format; `404` product not found.

### Search Products

`GET /api/v1/store/products/search?q=<text>&limit=<number>`

**Request body:** none. `q` is required and cannot be blank. `limit` defaults to `20`.

**Success: `200`**

```json
{
  "success": true,
  "message": "Search completed successfully",
  "data": { "keyword": "backpack", "products": ["<product>"], "total": 1 }
}
```

**Possible errors:** `400` search keyword is missing.

### Autocomplete Products

`GET /api/v1/store/products/autocomplete?q=<text>&limit=<number>`

**Request body:** none. `q` must contain at least 2 characters. `limit` defaults to `7`.

**Success: `200`**

```json
{
  "success": true,
  "message": "Autocomplete suggestions retrieved successfully",
  "data": { "keyword": "ba", "suggestions": ["<suggestion>"] }
}
```

**Possible errors:** `400` keyword is missing or shorter than 2 characters.

### Get a Random Product

`GET /api/v1/store/products/random`

**Request body:** none.

**Success: `200`** returns `{ "success": true, "message": "Random product retrieved successfully", "data": { "product": "<product>" } }`.

**Possible errors:** `404` no products are available.

### Create a Product

`POST /api/v1/store/products` - admin only

**Request body**

```json
{
  "product_name": "Everyday Backpack",
  "description": "A lightweight bag for daily use.",
  "initial_price": 100,
  "final_price": 80,
  "currency": "USD",
  "main_image": "https://example.com/bag.jpg",
  "in_stock": true,
  "color": "Black",
  "size": "M",
  "category_tree": ["Accessories", "Bags"],
  "image_urls": ["https://example.com/bag.jpg"],
  "other_attributes": [{ "name": "material", "value": "canvas" }],
  "all_available_sizes": ["S", "M", "L"]
}
```

| Field                        | Required | Rules                                                                               |
| ---------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `product_name`               | Yes      | 3-100 characters.                                                                   |
| `description`                | Yes      | 10-1000 characters.                                                                 |
| `initial_price`              | Yes      | Number greater than or equal to 0.                                                  |
| `final_price`                | Yes      | Number greater than or equal to 0, and no more than `initial_price`.                |
| `currency`                   | Yes      | `USD`, `INR`, `EUR`, or `GBP`.                                                      |
| `main_image`                 | Yes      | Valid URL.                                                                          |
| `in_stock`                   | No       | Boolean; defaults to `true`.                                                        |
| `color` / `size`             | No       | Up to 50 / 20 characters.                                                           |
| `category_tree`              | No       | Array of up to 10 strings, each 1-50 characters.                                    |
| `image_count`                | No       | Integer from 1 to 20.                                                               |
| `image_urls`                 | No       | Array of up to 20 valid URLs.                                                       |
| `other_attributes`           | No       | Array of up to 50 `{ "name", "value" }` pairs. Name is 1-100 chars; value is 1-200. |
| `root_category` / `category` | No       | Strings up to 100 characters.                                                       |
| `all_available_sizes`        | No       | Array of strings, each up to 20 characters.                                         |

**Success: `201`** returns `{ "success": true, "message": "Product created successfully", "data": { "product": "<product>" } }`.

**Possible errors:** `401` unauthenticated; `403` not an admin; `400` price, category, image-count, or minimum 1% discount rule failed; `409` duplicate product name; `422` invalid request fields; `429` too many product-creation requests.

## Cart

All cart routes require an access token.

### Get Cart

`GET /api/v1/store/cart`

**Request body:** none.

**Success: `200`** returns `{ "success": true, "message": "Cart retrieved successfully", "data": { "cart": "<cart>" } }`. An empty cart is created when needed.

**Possible errors:** `401` unauthenticated.

### Add to Cart

`POST /api/v1/store/cart`

**Request body**

```json
{
  "productId": "66a1b2c3d4e5f67890123456",
  "quantity": 2,
  "selectedSize": "M",
  "selectedColor": "Black"
}
```

`productId` is required and must be a MongoDB ObjectId. `quantity` is optional and defaults to `1`; it must be 1-50. `selectedSize` is 1-20 characters and `selectedColor` is 1-50 characters when provided.

**Success: `200`** returns `{ "success": true, "message": "Product added to cart successfully", "data": { "cart": "<cart>" } }`.

**Possible errors:** `400` product is out of stock, selected size is unavailable, or item quantity would exceed 50; `401` unauthenticated; `404` product not found; `422` invalid input.

### Update Cart Item Quantity

`PATCH /api/v1/store/cart/:id`

**Request body**

```json
{ "quantity": 3 }
```

`id` is the cart item's ID. `quantity` is required and must be 1-50.

**Success: `200`** returns `{ "success": true, "message": "Cart item updated successfully", "data": { "cart": "<cart>" } }`.

**Possible errors:** `400` product is no longer available; `401` unauthenticated; `404` cart or cart item not found; `422` invalid ID or quantity.

### Remove Cart Item

`DELETE /api/v1/store/cart/:id`

**Request body:** none. `id` is the cart item's ID.

**Success: `200`** returns `{ "success": true, "message": "Cart item removed successfully", "data": { "cart": "<cart>" } }`.

**Possible errors:** `401` unauthenticated; `404` cart or cart item not found; `422` invalid item ID.

### Clear Cart

`DELETE /api/v1/store/cart`

**Request body:** none.

**Success: `200`** returns `{ "success": true, "message": "Cart cleared successfully", "data": { "cart": "<cart>" } }`.

**Possible errors:** `401` unauthenticated.

### Get Cart Summary

`GET /api/v1/store/cart/summary`

**Request body:** none.

**Success: `200`**

```json
{
  "success": true,
  "message": "Cart summary retrieved successfully",
  "data": {
    "summary": {
      "totalItems": 2,
      "totalAmount": 160,
      "currency": "USD",
      "itemCount": 1
    }
  }
}
```

**Possible errors:** `401` unauthenticated.

## Payments

All payment routes except the webhook require an access token. Orders are created in INR for Razorpay. In order responses, `amount` is in paise, while amounts named `totalAmountINR` and refund `refundAmount` are rupees.

### Create a Cart Order

`POST /api/v1/payments/orders/cart`

**Request body**

```json
{
  "shippingAddress": {
    "fullName": "Jane Doe",
    "address": "12 Market Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India",
    "phone": "+919876543210"
  },
  "notes": "Leave at the front desk"
}
```

Both fields are optional. `notes` can contain up to 500 characters.

**Success: `201`**

```json
{
  "status": "success",
  "message": "Cart order created successfully",
  "data": {
    "success": true,
    "orderId": "order_...",
    "amount": 16000,
    "currency": "INR",
    "receipt": "ORDER_...",
    "paymentId": "66a1...",
    "cartSummary": {
      "totalItems": 2,
      "totalAmount": 160,
      "totalAmountINR": 160,
      "items": []
    }
  }
}
```

**Possible errors:** `400` cart is empty or contains out-of-stock products; `401` unauthenticated; `400` invalid validated fields; `500` Razorpay/order creation failed.

### Create a Single-Product Order

`POST /api/v1/payments/orders/single-product`

**Request body**

```json
{
  "productId": "66a1b2c3d4e5f67890123456",
  "quantity": 2,
  "selectedSize": "M",
  "selectedColor": "Black",
  "shippingAddress": { "fullName": "Jane Doe", "address": "12 Market Street" },
  "notes": "Gift wrap it"
}
```

`productId` is required. `quantity` is optional and defaults to `1` (1-50). `selectedSize` is up to 10 characters, `selectedColor` is up to 20, and `notes` is up to 500. The shipping address uses the shared rules above.

**Success: `201`** returns `status: "success"` and `data` with `orderId`, paise `amount`, `currency`, `receipt`, `paymentId`, and `productSummary` (`productName`, original price/currency, INR price, quantity, totals, size, and color).

**Possible errors:** `400` product is out of stock or quantity is invalid; `401` unauthenticated; `404` product not found; `400` invalid validated fields; `500` order creation failed.

### Verify a Payment

`POST /api/v1/payments/verify`

**Request body**

```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "signature-from-razorpay"
}
```

All three fields are required.

**Success: `200`** returns `status: "success"` and verification data: `paymentId`, internal `orderId`, paise `amount`, payment `status`, `paidAt`, and Razorpay payment details (`id`, `amount`, `currency`, `method`, `status`, and `captured`). Cart payments clear the cart after successful verification.

**Possible errors:** `400` invalid signature, missing data, or payment already verified; `401` unauthenticated; `404` payment record not found; `500` provider verification failed.

### Get Payment Details

`GET /api/v1/payments/details/:paymentId`

**Request body:** none. `paymentId` must be a MongoDB ObjectId.

**Success: `200`** returns `{ "status": "success", "data": { "payment": "<payment>" } }`. The payment includes order IDs, amount, currency, status, order type, items, shipping address, notes, timestamps, refund information, and populated product/user details where available.

**Possible errors:** `400` invalid ID; `401` unauthenticated; `403` payment belongs to another user; `404` payment not found.

### Get Payment History

`GET /api/v1/payments/history`

**Request body:** none.

**Query parameters**

| Field    | Required | Rules                                                                 | Default      |
| -------- | -------- | --------------------------------------------------------------------- | ------------ |
| `status` | No       | `created`, `attempted`, `paid`, `failed`, `cancelled`, or `refunded`. | All statuses |
| `page`   | No       | Positive integer.                                                     | `1`          |
| `limit`  | No       | 1-100.                                                                | `10`         |

**Success: `200`**

```json
{
  "status": "success",
  "data": {
    "payments": ["<payment>"],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

**Possible errors:** `401` unauthenticated; `400` invalid query fields; `500` history lookup failed.

### Request a Refund

`POST /api/v1/payments/refund/:paymentId`

**Request body**

```json
{ "refundAmount": 80, "reason": "Item arrived damaged" }
```

Both fields are optional. `refundAmount` is in rupees and must be greater than `0.01`; leave it out for a full refund. `reason` is 1-200 characters when supplied. The payment owner or an admin may make this request.

**Success: `200`**

```json
{
  "status": "success",
  "message": "Refund processed successfully",
  "data": {
    "success": true,
    "refundId": "rfnd_...",
    "refundAmount": 80,
    "status": "processed"
  }
}
```

**Possible errors:** `400` invalid ID/body, refund amount exceeds the paid amount (the server processes the full payment amount), or payment cannot be refunded; `401` unauthenticated; `403` not the owner or an admin; `404` payment not found; `500` refund failed.

### Payment Statistics

`GET /api/v1/payments/stats` - admin only

**Request body:** none.

**Query parameters:** optional `startDate` and `endDate`, each an ISO 8601 date, for example `2026-09-01T00:00:00.000Z`.

**Success: `200`** returns `status: "success"` and `data`:

```json
{
  "overview": {
    "totalPayments": 10,
    "totalAmount": 100000,
    "successfulPayments": 8,
    "failedPayments": 1,
    "refundedPayments": 1,
    "averageAmount": 10000,
    "successRate": 80,
    "totalAmountFormatted": 1000,
    "averageAmountFormatted": 100
  },
  "paymentMethods": [
    { "_id": "card", "count": 8, "amount": 80000, "amountFormatted": 800 }
  ],
  "orderTypes": [
    { "_id": "cart", "count": 6, "amount": 60000, "amountFormatted": 600 }
  ]
}
```

Raw `amount` fields are paise. `*Formatted` values are rupees.

**Possible errors:** `400` invalid dates; `401` unauthenticated; `403` not an admin.

### Razorpay Webhook

`POST /api/v1/payments/webhook`

This endpoint is for Razorpay, not browser clients. It does not require a user token.

**Request headers**

```http
x-razorpay-signature: <signature>
```

**Request body:** send the Razorpay webhook JSON unchanged. The server handles `payment.captured`, `payment.failed`, and `refund.processed` events.

**Success: `200`**

```json
{
  "status": "success",
  "message": "Webhook processed successfully",
  "data": { "success": true, "message": "Webhook processed successfully" }
}
```

**Possible errors:** `400` signature header is missing; `500` signature verification or webhook processing failed.

## Server Status

`GET /`

**Request body:** none.

**Success: `200`**

```json
{
  "status": "success",
  "message": "Welcome to the TestDog API",
  "environment": "development",
  "documentation": "docs.testdog.in"
}
```

Unknown routes return `404` with a message that names the requested URL.
