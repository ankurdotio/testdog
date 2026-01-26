# Developer Error Simulation API

This API module is designed to help frontend and mobile developers test their applications against various failure scenarios. Instead of hoping your app handles errors correctly, you can use these endpoints to force specific errors, delays, or chaotic behavior.

**Base URL**: `/api/v1/simulation`
**Module Location**: `src/services/simulation.service.js`

> **Note**: This API is for **testing and simulation purposes only**. It should NOT be used in production environments as it intentionally generates errors and delays.

---

## 1. Random Error Generator

Get a random realistic error to test your global error handling or specific error screens.

**Endpoint**: `GET /random`

### Query Parameters

| Param  | Type   | Description                                                                       |
| :----- | :----- | :-------------------------------------------------------------------------------- |
| `type` | string | _(Optional)_ Filter by category. See [Error Categories](#error-categories) below. |

### Examples

**Request (Any random error):**
`GET /api/v1/simulation/random`

**Response:**

```json
{
  "error": true,
  "type": "database",
  "statusCode": 503,
  "message": "DB Connection Timeout",
  "hint": "Database is taking a nap (timeout). Check your connection string or network.",
  "timestamp": "2026-01-26T07:15:00.000Z"
}
```

**Request (Specific category):**
`GET /api/v1/simulation/random?type=auth`

**Response:**

```json
{
  "error": true,
  "type": "auth",
  "statusCode": 401,
  "message": "Token Expired",
  "hint": "Your session expired. Hit the refresh endpoint to get a shiny new token.",
  "timestamp": "2026-01-26T07:16:00.000Z"
}
```

---

## 2. Custom Status Code

Force the API to return a specific HTTP status code. Useful for testing how your UI handles specific edge cases like 429 (Too Many Requests) or 418 (I'm a teapot).

**Endpoint**: `GET /custom`

### Query Parameters

| Param  | Type   | Description                                                                 |
| :----- | :----- | :-------------------------------------------------------------------------- |
| `code` | number | **(Required)** The HTTP status code you want returned (e.g. 404, 500, 201). |

### Example

**Request:**
`GET /api/v1/simulation/custom?code=429`

**Response:**

```json
{
  "statusCode": 429,
  "error": true,
  "type": "custom",
  "message": "Simulated 429 Response",
  "hint": "You asked for a 429, you got a 429.",
  "timestamp": "2026-01-26T07:20:00.000Z"
}
```

---

## 3. Latency Simulation (Delay)

Simulate a slow network connection to test your loading spinners, skeleton screens, and timeout logic.

**Endpoint**: `GET /delay`

### Query Parameters

| Param | Type   | Description                                                                   |
| :---- | :----- | :---------------------------------------------------------------------------- |
| `ms`  | number | _(Optional)_ Milliseconds to delay. Defaults to 1000ms. Max limit is 10000ms. |

### Example

**Request (Wait for 3 seconds):**
`GET /api/v1/simulation/delay?ms=3000`

**Response (Returns after 3 seconds):**

```json
{
  "error": false,
  "message": "Sorry for the wait! I was napping for 3000ms.",
  "delay": 3000,
  "timestamp": "2026-01-26T07:25:00.000Z"
}
```

---

## 4. Chaos Mode

This endpoint is for stability testing ("Chaos Engineering"). It randomly decides what to return based on a weighted probability distribution.

**Endpoint**: `GET /chaos`

### Behavior Distribution

- **40% Success**: Returns standard 200 OK.
- **40% Error**: Returns a random error from the catalog.
- **20% High Latency**: Waits between 1s and 5s, then returns success.

### Example

**Request:**
`GET /api/v1/simulation/chaos`

**Possible Response (Chaos Error):**

```json
{
  "error": true,
  "type": "mode_chaos_error",
  "originalType": "payment",
  "statusCode": 402,
  "message": "Payment Required",
  "hint": "Card declined or insufficient funds. Money makes the world go round.",
  "timestamp": "2026-01-26T07:30:00.000Z"
}
```

**Possible Response (Chaos Success):**

```json
{
  "error": false,
  "type": "mode_chaos_success",
  "statusCode": 200,
  "message": "Survived the chaos! Operation successful.",
  "timestamp": "2026-01-26T07:31:00.000Z"
}
```

---

## Error Categories

These are the valid values for the `type` parameter in the Random Error endpoint:

- `auth`: Authentication and authorization issues (401, 403).
- `database`: DB connection timeouts, duplicate entries (503, 409).
- `network`: Gateway timeouts, bad gateways (502, 504).
- `validation`: Bad requests, missing fields (400, 422).
- `payment`: Payment required, card errors (402).
- `server`: Generic internal server errors (500).

---

## Quick Test URLs (Localhost)

Copy-paste these into your browser or Postman to test immediately:

- **Random Error**: `http://localhost:3000/api/v1/simulation/random`
- **Auth Error**: `http://localhost:3000/api/v1/simulation/random?type=auth`
- **Database Error**: `http://localhost:3000/api/v1/simulation/random?type=database`
- **Force 418 (Teapot)**: `http://localhost:3000/api/v1/simulation/custom?code=418`
- **Delay (3 Seconds)**: `http://localhost:3000/api/v1/simulation/delay?ms=3000`
- **Chaos Mode**: `http://localhost:3000/api/v1/simulation/chaos`

---

## Author

Implemented by **[TABREZ RABBANI]** as a contribution to the Open Source community.
