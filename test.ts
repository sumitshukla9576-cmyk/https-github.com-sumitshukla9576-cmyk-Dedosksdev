import { GoogleGenAI, File } from "@google/genai";
const ai = new GoogleGenAI({});
async function main() {
    const res = await ai.files.upload({ file: "a.txt", config: { mimeType: "text/plain" } });
    console.log(res);
}
