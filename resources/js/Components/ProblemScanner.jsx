import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";


const ProblemScanner = ({ onBack, onFindFixer }) => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState("");
    const fileInputRef = useRef(null);

    const handleBack = () => {
        setImageFile(null);
        setImagePreview(null);
        setAnalysisResult("");
        onBack();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
            setAnalysisResult(""); 
        }
    };

    const fileToGenerativePart = async (file) => {
        const base64EncodedDataPromise = new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
        };
    };

    const analyzeImage = async () => {
        if (!imageFile) return;
        setIsAnalyzing(true);
        setAnalysisResult("");

        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const imagePart = await fileToGenerativePart(imageFile);
            const prompt = "You are a home repair expert. Look at this image and identify the problem. Explain briefly what is broken, what might have caused it, and what type of professional (e.g., Plumber, Electrician, Carpenter) is needed to fix it. Keep it concise and helpful. Format your response in short paragraphs using plain text only. Do NOT use any asterisks, bolding, bullet points, or markdown formatting.";

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            setAnalysisResult(response.text());
        } catch (error) {
            console.error("Gemini API Error:", error);
            setAnalysisResult("Sorry, I encountered an error trying to analyze the image. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="animate-slide-up w-full flex-1 flex flex-col h-full">
            <div className="glass-dark w-full rounded-[32px] border border-white/20 shadow-xl overflow-hidden flex flex-col relative">
                
                {/* Header with Back Button */}
                <div className="flex items-center p-4 border-b border-white/10 gap-4">
                    <button onClick={handleBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/90 active:scale-95 transition-transform font-bold text-lg">
                        ←
                    </button>
                    <div className="flex items-center gap-2 text-white">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm">📸</div>
                        <h2 className="font-bold text-base">AI Problem Scanner</h2>
                    </div>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-5">
                    
                    {/* INSTRUCTIONS AREA */}
                    {!imagePreview && (
                        <div className="glass rounded-2xl p-4 border border-white/50 text-[#3b2314] shadow-sm">
                            <h3 className="font-bold text-sm mb-3">How it works:</h3>
                            <ul className="text-xs space-y-3 font-medium text-gray-700 m-0 pl-1">
                                <li className="flex items-start gap-2">
                                    <span className="text-[#b07d4a] font-bold">1.</span> 
                                    Take a clear, well-lit photo of the broken item or issue.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#b07d4a] font-bold">2.</span> 
                                    Let the AI diagnose the problem instantly.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#b07d4a] font-bold">3.</span> 
                                    Connect with local experts if you need a hand.
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* Image Uploader */}
                    <div className="w-full aspect-[4/3] rounded-[20px] border-2 border-dashed border-white/30 flex flex-col items-center justify-center bg-white/5 relative overflow-hidden active:bg-white/10 transition-colors" onClick={() => fileInputRef.current?.click()}>
                        {imagePreview ? (
                            <img src={imagePreview} alt="To analyze" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center text-white/60 p-4">
                                <div className="text-3xl mb-2">📥</div>
                                <p className="text-sm font-bold">Tap to upload or take a photo</p>
                                <p className="text-xs mt-1">JPEG, PNG supported</p>
                            </div>
                        )}
                        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                    </div>

                    {/* Action Button */}
                    {imagePreview && !analysisResult && (
                        <button onClick={analyzeImage} disabled={isAnalyzing} className="btn-caramel w-full py-3.5 text-sm flex justify-center items-center gap-2">
                            {isAnalyzing ? "✨ Analyzing with AI..." : "Scan Problem"}
                        </button>
                    )}

                    {/* Result Output */}
                    {analysisResult && (
                        <div className="glass rounded-2xl p-4 border border-white/50 text-[#3b2314]">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="section-badge bg-[#c8a97a]/20 text-lg">🤖</span>
                                <h3 className="font-bold text-sm">Diagnosis Complete</h3>
                            </div>
                            <div className="text-xs leading-relaxed space-y-2 whitespace-pre-line font-medium text-gray-700">
                                {analysisResult}
                            </div>
                            
                            <div className="mt-5 text-center border-t border-black/10 pt-4">
                                <p className="text-xs text-gray-500 font-bold mb-3">Having a hard time fixing this?</p>
                                <button onClick={onFindFixer} className="btn-dark py-3 w-full text-xs">
                                    Find a Local Repairer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProblemScanner; 