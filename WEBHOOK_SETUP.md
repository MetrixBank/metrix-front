# ConexZap Webhook Integration Guide

This document outlines how to configure and use the Supabase Edge Function to receive webhooks from ConexZap.

---

## 1. ConexZap Webhook Configuration

Configure your ConexZap account to send webhook events to your Supabase project.

### Endpoint Details

*   **URL:** `https://[YOUR_PROJECT_ID].supabase.co/functions/v1/conexzap`
*   **Method:** `POST`
*   **Content-Type:** `application/json`

### Authentication (Required)

You **MUST** include the following header in all requests. Requests without this header will be rejected with `401 Unauthorized`.

*   **Header Name:** `X-API-Key`
*   **Header Value:** `[YOUR_GENERATED_API_KEY]` (Must match an active key in `distributor_api_keys`)

---

## 2. Request Format

The webhook expects a JSON body with the following structure: