# R2 Module

Cloudflare R2 object storage integration for media file uploads.

## Files

- **mod.rs** — R2 client initialization and operations

## Key Functions

- `get_signed_upload_url()` — Generate short-lived PUT URL for file uploads
- `delete_object()` — Remove uploaded files from R2
- `get_object_metadata()` — Fetch file info (size, mime type, etc.)

## Signed URLs

- Generated on-demand for each upload request
- Expire within minutes (configurable via `R2_SIGNED_URL_EXPIRY`)
- Allow mobile clients to PUT directly to R2 without backend relay
- Reduces bandwidth and backend load

## Bucket Configuration

- Bucket name: `fluxenite-media`
- Public access via custom domain (e.g., `media.yourdomain.com`)
- Access controlled by R2 API credentials in `.env`
- Media URLs stored in Firestore message records

## Upload Flow

1. Mobile requests signed URL: `POST /uploads/signed-url`
2. Backend generates URL with constraints (file size, media type)
3. Mobile uploads directly to R2 via signed URL
4. Mobile sends message with media URL reference
5. Server stores media URL in Firestore alongside encrypted message
