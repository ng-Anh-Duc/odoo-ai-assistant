// 1. IMPORT AND INITIALIZE
const { GoogleGenAI } = require('@google/genai');

// Initialize Google Generative AI SDK
// The SDK automatically uses the GEMINI_API_KEY environment variable
const ai = new GoogleGenAI({});

// 2. KNOWLEDGE BASE (In-Context Learning Content)
const POLICY_KNOWLEDGE = `
[START COMPANY POLICY]

1. HR Policies
   1.2. Leave Policy
   • Annual Leave: 12 days/year.
   • Process: Submit request on system → Manager approval → HR confirmation.

2. IT & Security Policies
   2.1. Password Policy
   • Change password every 90 days.
   • Password minimum 8 characters (must include upper, lower, and numbers).

[END COMPANY POLICY]
`;

// 3. MAIN HANDLER
exports.handler = async (event) => {
  // 3.1. Handle CORS Preflight (OPTIONS) Request
  // This allows the browser to communicate with the Netlify function from any domain
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    // 3.2. Parse user query from request body
    const { user_query } = JSON.parse(event.body);

    if (!user_query) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Missing user_query in request body" })
      };
    }

    // 3.3. Define system role and construct prompt
    const systemPrompt = `You are a strict internal policy assistant. Answer employee questions ONLY based on the following policy document. If the information is not explicitly found in the document, reply with: "Sorry, I cannot find this information in the