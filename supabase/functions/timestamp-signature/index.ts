/**
 * Edge Function: timestamp-signature
 * Modules 2 & 3 — Horodatage serveur certifie + Sceau d'integrite
 *
 * Compute le timestamp serveur, le hash du document, le hash de la signature,
 * et le sceau d'integrite liant cryptographiquement la signature au document.
 *
 * Le timestamp SERVEUR est incontestable (vs new Date() cote navigateur).
 */
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.98.0';
import { getCorsHeaders, optionsResponse } from '../_shared/cors.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function hashSHA256(data: string | Uint8Array): Promise<string> {
  const encoded = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';

  if (req.method === 'OPTIONS') {
    return optionsResponse(origin);
  }

  const cors = getCorsHeaders(origin);

  function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Auth check — verify the caller has a valid JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { document_id, signer_id, signature_image_base64 } = await req.json();

    if (!document_id || !signer_id || !signature_image_base64) {
      return jsonResponse(
        { error: 'document_id, signer_id, and signature_image_base64 are required' },
        400
      );
    }

    // -----------------------------------------------------------------------
    // 1. SERVER TIMESTAMP — authoritative, not client
    // -----------------------------------------------------------------------
    const serverTimestamp = new Date().toISOString();

    // -----------------------------------------------------------------------
    // 2. DOCUMENT HASH — SHA-256 of the document file at signing time
    // -----------------------------------------------------------------------

    // Get document file path from DB
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('file_path, title, organization_id')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      return jsonResponse({ error: 'Document not found' }, 404);
    }

    let documentHash: string;

    if (document.file_path) {
      // Download file from Storage and compute hash
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (downloadError || !fileData) {
        // If file not downloadable, hash the metadata as fallback
        documentHash = await hashSHA256(
          JSON.stringify({
            id: document_id,
            title: document.title,
            timestamp: serverTimestamp,
          })
        );
      } else {
        const arrayBuffer = await fileData.arrayBuffer();
        documentHash = await hashSHA256(new Uint8Array(arrayBuffer));
      }
    } else {
      // No file path — hash metadata
      documentHash = await hashSHA256(
        JSON.stringify({
          id: document_id,
          title: document.title,
          timestamp: serverTimestamp,
        })
      );
    }

    // -----------------------------------------------------------------------
    // 3. SIGNATURE IMAGE HASH — SHA-256 of the signature image data
    // -----------------------------------------------------------------------
    const signatureImageHash = await hashSHA256(signature_image_base64);

    // -----------------------------------------------------------------------
    // 4. INTEGRITY SEAL — cryptographic binding of signature to document
    // SHA-256(documentHash | signatureImageHash | signerId | serverTimestamp)
    // -----------------------------------------------------------------------
    const sealPayload = [documentHash, signatureImageHash, signer_id, serverTimestamp].join('|');
    const integritySeal = await hashSHA256(sealPayload);

    return jsonResponse({
      server_timestamp: serverTimestamp,
      document_hash: documentHash,
      signature_image_hash: signatureImageHash,
      integrity_seal: integritySeal,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
