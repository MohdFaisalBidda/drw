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
        Your task is to generate JSON describing shapes for a whiteboard.

        Example:
        {
            "shapes": [
                {"id":"373763d1-ab2e-45cc-8d3c-d31e8457dc5b","type":"rect","strokeColor":"#ffffff","strokeWidth":1,"fillColor":"transparent","x":419,"y":265,"details":{"width":326,"height":122}},
                {"id":"1f546dc6-82bc-4cc3-b2fb-63f622f56391","type":"circle","strokeColor":"#ffffff","strokeWidth":1,"fillColor":"transparent","x":1033,"y":219,"details":{"radius":97}}
            ]
        }

        User request: "${prompt}"
        Respond with only JSON, without explanations or additional text and with #ffffff strokeColor.
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