# ConexZap Webhook API Documentation & Testing

This document provides examples for testing the `conexzap-webhook` Edge Function. The function receives lead data from ConexZap, creates new leads or updates existing ones with message history.

**Endpoint URL:** `https://[your-project-ref].supabase.co/functions/v1/conexzap-webhook`  
**Method:** `POST`  
**Headers:**  
- `Content-Type: application/json`
- `x-api-key: [your-api-key]` (Default test key: `conexzap_test_key_12345`)

## Test Scenarios

### Test 1: Create New Lead (Valid Data)
Creates a new lead when the phone number is not found in the database.

**Request:**