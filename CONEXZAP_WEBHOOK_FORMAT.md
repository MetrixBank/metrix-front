# ConexZap Webhook Integration Guide

This document describes the expected format, supported fields, and response codes for the ConexZap Webhook integration used in the Horizons CRM system.

## Endpoint

**URL:** `[YOUR_SUPABASE_URL]/functions/v1/conexzap`  
**Method:** `POST`  
**Content-Type:** `application/json`

## Authentication

Authentication is handled via the `X-API-Key` header.

- **Header:** `X-API-Key: <YOUR_API_KEY>`

## Request Format

The webhook supports two formats: the **Standard ConexZap Structure (Recommended)** and a Legacy/Simple format. The system automatically detects the format.

### 1. Standard ConexZap Structure (Recommended)

This format is expected for contact synchronization events (`contact-create-update`).

**Structure:**