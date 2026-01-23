// WorldOTA Voucher Download Edge Function
// Downloads voucher PDF directly from WorldOTA API

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VoucherDownloadRequest {
  partner_order_id: string;
  language?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { partner_order_id, language = "en" }: VoucherDownloadRequest = await req.json();

    if (!partner_order_id) {
      return new Response(
        JSON.stringify({ status: "error", error: { message: "partner_order_id is required" } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[worldota-voucher-download] Downloading voucher for: ${partner_order_id}`);

    // Get WorldOTA credentials
    const keyId = Deno.env.get("WORLDOTA_KEY_ID");
    const apiKey = Deno.env.get("WORLDOTA_API_KEY");

    if (!keyId || !apiKey) {
      console.error("[worldota-voucher-download] Missing WorldOTA credentials");
      return new Response(
        JSON.stringify({ status: "error", error: { message: "WorldOTA credentials not configured" } }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Basic Auth header
    const authHeader = `Basic ${btoa(`${keyId}:${apiKey}`)}`;

    // Build query params - WorldOTA uses GET with query params
    const dataParam = JSON.stringify({
      partner_order_id: partner_order_id,
      language: language,
    });
    const encodedData = encodeURIComponent(dataParam);
    const voucherUrl = `https://api.worldota.net/api/b2b/v3/hotel/order/document/voucher/download/?data=${encodedData}`;

    console.log(`[worldota-voucher-download] Calling WorldOTA API...`);

    const response = await fetch(voucherUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
      },
    });

    // Check if response is a PDF (binary)
    const contentType = response.headers.get("content-type") || "";
    
    if (contentType.includes("application/pdf")) {
      // Success - return PDF as base64
      const pdfBuffer = await response.arrayBuffer();
      const base64Pdf = btoa(
        new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      console.log(`[worldota-voucher-download] Successfully downloaded voucher PDF (${pdfBuffer.byteLength} bytes)`);

      return new Response(
        JSON.stringify({
          status: "ok",
          data: {
            partner_order_id,
            language,
            content_type: "application/pdf",
            pdf_base64: base64Pdf,
            file_name: `voucher-${partner_order_id}.pdf`,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If not PDF, it's likely an error response (JSON)
    const errorData = await response.json();
    console.error(`[worldota-voucher-download] API error:`, errorData);

    // Handle specific WorldOTA errors
    const errorCode = errorData.error?.code || errorData.error;
    let userMessage = "Failed to download voucher";
    
    switch (errorCode) {
      case "failed_to_generate_document":
        userMessage = "Voucher is still being generated. Please try again in a few moments.";
        break;
      case "order_not_found":
        userMessage = "Order not found. Please check the order ID.";
        break;
      case "pending":
        userMessage = "Voucher is being processed. Please try again shortly.";
        break;
      case "voucher_is_not_downloadable":
        userMessage = "Voucher is not yet available. The order may still be processing or payment pending.";
        break;
    }

    // If 401, try with swapped credentials
    if (response.status === 401) {
      console.log("[worldota-voucher-download] Retrying with swapped credentials...");
      const swappedAuthHeader = `Basic ${btoa(`${apiKey}:${keyId}`)}`;
      
      const retryResponse = await fetch(voucherUrl, {
        method: "GET",
        headers: {
          "Authorization": swappedAuthHeader,
        },
      });

      const retryContentType = retryResponse.headers.get("content-type") || "";
      
      if (retryContentType.includes("application/pdf")) {
        const pdfBuffer = await retryResponse.arrayBuffer();
        const base64Pdf = btoa(
          new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );

        console.log(`[worldota-voucher-download] Success with swapped credentials (${pdfBuffer.byteLength} bytes)`);

        return new Response(
          JSON.stringify({
            status: "ok",
            data: {
              partner_order_id,
              language,
              content_type: "application/pdf",
              pdf_base64: base64Pdf,
              file_name: `voucher-${partner_order_id}.pdf`,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        status: "error", 
        error: { 
          message: userMessage,
          code: errorCode,
          details: errorData,
        } 
      }),
      { status: response.status >= 400 ? response.status : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[worldota-voucher-download] Error:", error);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        error: { message: error instanceof Error ? error.message : "Unknown error" } 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
