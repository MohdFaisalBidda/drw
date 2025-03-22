import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    const { prompt } = await req.json()
    if (!prompt) return NextResponse.json({ message: "prompt is required" });

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        })

        const structuredPrompt = `
        You are an AI assistant for a collaborative whiteboard application.
        Your task is to generate **valid JSON data** describing different shapes for a whiteboard.
        
        🔹 **Supported Shapes:**
        - **rect**: Rectangle (requires width & height)
        - **circle**: Circle (requires radius)
        - **pencil**: Freehand drawing (requires points array)
        - **line**: Straight line (requires startX, startY, endX, endY)
        - **text**: Text element (requires text content, fontSize)
        - **arrow**: Arrow line (requires startX, startY, endX, endY)
        - **diamond**: Diamond shape (requires width & height)
        - **draw**: Hand-drawn shape (requires points array)
        
        🔹 **JSON Schema:**
        Each shape should follow this structure:
        {
            "id": "unique-uuid",
            "type": "rect | circle | pencil | line | text | arrow | diamond | draw",
            "x": number,  // X coordinate (0 to 1920)
            "y": number,  // Y coordinate (0 to 1080)
            "color": "#ffffff",  // Stroke color (default: white)
            "bgColor": "#FF0000",  // Background color (default: red, except transparent for text & pencil)
            "strokeWidth": number,  // Stroke width (1 to 10)
            "strokeStyle": "solid | dashed | dotted",
            "opacity": number,  // Opacity (0.1 to 1.0)
            "details": {  // Shape-specific details
                "width": number,  // For rectangles, diamonds
                "height": number,  // For rectangles, diamonds
                "radius": number,  // For circles
                "text": "string",  // For text elements
                "fontSize": number,  // For text elements
                "startX": number, "startY": number, "endX": number, "endY": number,  // For lines & arrows
                "points": [[x, y], [x, y], ...]  // For pencil & draw shapes
            }
        }
        
        🔹 **Rules:**
        - Respond with **valid JSON** only. No explanations or additional text.
        - Ensure 'color: "#ffffff"' for stroke color.  
        - Generate 1-5 shapes with random positions within 1920x1080 bounds.
        - Do not include extra properties outside the schema.
        
        User request: "${prompt}"
      `;



        const response = await model.generateContent(structuredPrompt);
        console.log(response, "res here");

        let aiResponse = response.response.text();


        if (!aiResponse) {
            return NextResponse.json({ message: "No valid response from AI" });
        }

        aiResponse = aiResponse
            .replace(/```json/g, '')    // Remove starting code block
            .replace(/```/g, '')        // Remove ending code block
            .replace(/\\n/g, '')        // Remove newline escape characters
            .trim();

        console.log(aiResponse, "Cleaned AI Response");

        return NextResponse.json({ shapes: JSON.parse(aiResponse).shapes });
    } catch (error) {
        console.log(error);
        NextResponse.json({ message: "Internal Server Error", status: 500 });
    }

}