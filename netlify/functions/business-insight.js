const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

exports.handler = async (event) => {
    // 1. Xử lý CORS
    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS_HEADERS, body: "" };
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        // 2. Đọc file CSV dữ liệu (Nằm ngay trong folder project)
        // Lưu ý: Trên Netlify, đường dẫn file cần xử lý khéo léo
        const csvPath = path.resolve(__dirname, '../../sales_data.csv'); 
        
        let csvData = "";
        try {
            csvData = fs.readFileSync(csvPath, 'utf8');
        } catch (e) {
            // Nếu không đọc được file (trường hợp deploy), ta dùng dữ liệu mẫu (Fallback)
            csvData = `
            Customer,Product,Total,Date
            Dr. Tran,TurtleBot 4, 150000000, 2025-11-20
            Regional Bank,Synology NAS, 400000000, 2025-11-22
            Coffee Chain,Ubiquiti Wifi, 50000000, 2025-11-25
            CodeCamp,Raspberry Pi, 120000000, 2025-11-26
            `;
        }

        // 3. Kết nối Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 4. Prompt: Ra lệnh cho Gemini đóng vai CEO
        const prompt = `
        You are the Chief Strategy Officer of StarLense (B2B Tech Company).
        Analyze the following Sales Data (CSV format) and give a strategic report.
        
        DATA:
        ${csvData}
        
        REQUEST:
        1. Identify the Top Selling Product Line.
        2. Identify the Best Customer Segment.
        3. Give 3 actionable tips to increase revenue next month.
        4. Format the output using HTML tags (<h3>, <ul>, <li>, <b>) for nice display on a website.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ insight: text })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: error.message })
        };
    }
};