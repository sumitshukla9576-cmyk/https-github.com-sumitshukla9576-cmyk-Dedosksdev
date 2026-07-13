import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({});
async function main() {
    const res = await ai.files.upload({ file: "test.txt", config: { mimeType: "text/plain" } });
    console.log(res.uri, res.mimeType);
}
