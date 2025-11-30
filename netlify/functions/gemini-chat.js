const { GoogleGenerativeAI } = require("@google/generative-ai");
//code gemini chat for odoo
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*", // Cho phép Odoo gọi vào
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

exports.handler = async (event) => {
    // 1. Xử lý CORS (Bắt buộc để web Odoo không bị chặn)
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: CORS_HEADERS, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // 2. Lấy câu hỏi từ Odoo gửi lên
        const { message } = JSON.parse(event.body);
        
        // 3. Kết nối Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

        // 4. Prompt Engineering (Dạy con Bot khôn lên)
        // Đây là chỗ bạn nhồi nhét kiến thức về StarLense cho nó
        const systemPrompt = `
        You are an expert AI Sales Assistant for StarLense - a B2B Technology Distributor.
        Your tone is professional, technical, and helpful.
        
        WE SELL THESE PRODUCTS (Do not recommend others):
        1. Infrastructure: Ubiquiti UniFi U6 Pro, Cisco Meraki MR36, Synology NAS DS923+.
        2. IoT & Industrial: Teltonika RUT950 Router, Dragino LoRaWAN Sensors.
        3. Robotics & R&D: TurtleBot 4, NVIDIA Jetson Orin Nano, Unitree Go2 Robot Dog.
        
        RULES:
        - Only answer questions related to technology, B2B sales, or our products.
        - If asked for price, say "Please contact sales@starlense.com for a B2B quote".
        - Keep answers short (under 100 words).
        
        Customer Question: ${message}
        `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ reply: text })
        };

    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Lỗi kết nối AI: " + error.message })
        };
    }
};