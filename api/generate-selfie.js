import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST method is allowed" });
    }

    const { prompt, imageBase64 } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error:
          "Gemini API key missing. Set GEMINI_API_KEY in your Vercel Project Settings.",
      });
    }

    if (!prompt || !imageBase64) {
      return res
        .status(400)
        .json({ error: "prompt and imageBase64 are required." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ],
    });

    const response = await result.response;
    const outputImage = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!outputImage) {
      return res.status(500).json({
        error: "Gemini did not return an image.",
      });
    }

    res.status(200).json({
      success: true,
      imageBase64: outputImage.data, // FRONTEND bunu alıp gösteriyor
    });
  } catch (err) {
    console.error("Backend error:", err);
    res.status(500).json({ error: err.message });
  }
}
