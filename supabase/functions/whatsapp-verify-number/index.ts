import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.98.0';
import { getCorsHeaders, optionsResponse } from '../_shared/cors.ts';

/**
 * Validates that a phone number is in international format.
 * Accepts formats like +225XXXXXXXXXX, +33XXXXXXXXX, etc.
 */
function validatePhoneFormat(phone: string): {
  valid: boolean;
  formatted: string;
  country_code: string;
  error?: string;
} {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Must start with +
  if (!cleaned.startsWith('+')) {
    return {
      valid: false,
      formatted: cleaned,
      country_code: '',
      error: 'Phone number must start with + (international format)',
    };
  }

  // Must be digits after the +
  const digits = cleaned.slice(1);
  if (!/^\d{7,15}$/.test(digits)) {
    return {
      valid: false,
      formatted: cleaned,
      country_code: '',
      error: 'Phone number must contain 7-15 digits after the country code',
    };
  }

  // Extract country code (common codes for West Africa and others)
  const countryCodes: Record<string, string> = {
    '225': 'CI', // Cote d'Ivoire
    '33': 'FR', // France
    '1': 'US', // United States
    '44': 'GB', // United Kingdom
    '221': 'SN', // Senegal
    '223': 'ML', // Mali
    '226': 'BF', // Burkina Faso
    '228': 'TG', // Togo
    '229': 'BJ', // Benin
    '233': 'GH', // Ghana
    '234': 'NG', // Nigeria
    '237': 'CM', // Cameroon
  };

  let countryCode = '';
  for (const [code, country] of Object.entries(countryCodes)) {
    if (digits.startsWith(code)) {
      countryCode = country;
      break;
    }
  }

  return {
    valid: true,
    formatted: cleaned,
    country_code: countryCode || 'UNKNOWN',
  };
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';

  if (req.method === 'OPTIONS') {
    return optionsResponse(origin);
  }

  const cors = getCorsHeaders(origin);

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization')!;
    const {
      data: { user },
    } = await createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    }).auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { phone } = await req.json();

    if (!phone) {
      return new Response(JSON.stringify({ error: 'phone is required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Validate format
    const validation = validatePhoneFormat(phone);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          valid: false,
          phone: phone,
          formatted: validation.formatted,
          error: validation.error,
        }),
        {
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if number is reachable via WhatsApp using the contacts API
    const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN');
    const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID');

    let whatsapp_registered = false;

    if (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID) {
      try {
        const contactResponse = await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/contacts`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              blocking: 'wait',
              contacts: [validation.formatted],
            }),
          }
        );

        if (contactResponse.ok) {
          const contactResult = await contactResponse.json();
          const contact = contactResult.contacts?.[0];
          whatsapp_registered = contact?.status === 'valid';
        }
      } catch {
        // If the contacts API call fails, we still return the format validation
      }
    }

    return new Response(
      JSON.stringify({
        valid: true,
        phone: validation.formatted,
        country_code: validation.country_code,
        whatsapp_registered,
      }),
      {
        headers: { ...cors, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
