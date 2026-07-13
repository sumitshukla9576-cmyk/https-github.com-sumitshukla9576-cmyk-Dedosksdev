import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({});
async function main() {
    console.log("running");
    try {
        const res = await ai.files.upload({ file: "test.txt", config: { mimeType: "text/plain" } });
        console.log("URI", res.uri);
        console.log("MIME", res.mimeType);
    } catch (e: any) {
        console.log("Error", e.message);
    }
}
main();
