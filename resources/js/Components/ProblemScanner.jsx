import '../skilllink.css';
import React, { useState, useRef } from 'react';
import AiProviderSuggestion from './AiProviderSuggestion';


const ProblemScanner = ({ onBack, onFindFixer, catalogCategories, onSelectCategory }) => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState("");
    const [analysisSucceeded, setAnalysisSucceeded] = useState(false);
    const fileInputRef = useRef(null);

    const handleBack = () => {
        setImageFile(null);
        setImagePreview(null);
        setAnalysisResult("");
        setAnalysisSucceeded(false);
        onBack();
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
                setImageFile(null);
                setImagePreview(null);
                setAnalysisResult('Choose a JPEG or PNG photo up to 5 MB.');
                setAnalysisSucceeded(false);
                e.target.value = '';
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
            setAnalysisResult("");
            setAnalysisSucceeded(false);
        }
    };

    const analyzeImage = async () => {
        if (!imageFile || isAnalyzing) return;
        setIsAnalyzing(true);
        setAnalysisResult("");
        setAnalysisSucceeded(false);

        try {
            // Convert file to base64
            const base64Data = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(imageFile);
            });

            // Call your Laravel backend instead of Google
            const response = await fetch('/api/scan-problem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({ image: base64Data, mime_type: imageFile.type })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                const message = response.status === 422
                    ? (data.errors?.image?.[0] || data.errors?.mime_type?.[0] || 'Choose a valid JPEG or PNG photo up to 5 MB.')
                    : response.status === 401 ? 'Please sign in again to use the scanner.'
                    : response.status === 419 ? 'Your session expired. Refresh the page and try again.'
                    : response.status === 429 ? 'Too many scans right now. Wait a minute and try again.'
                    : 'The AI service is temporarily unavailable. Please try again later.';
                setAnalysisResult(message);
                return;
            }

            const resultText = data.candidates?.[0]?.content?.parts
                ?.filter(part => !part.thought && typeof part.text === 'string')
                .map(part => part.text).join('\n').trim();
            if (!resultText) {
                setAnalysisResult("No assessment was returned. Please try again.");
                return;
            }
            setAnalysisResult(resultText);
            setAnalysisSucceeded(true);

        } catch {
            setAnalysisResult("System busy. Please try again in a moment.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="skilllink-ai animate-slide-up w-full flex-1 flex flex-col h-full">
            <div className="sl-ai-panel w-full rounded-2xl border border-white/20 shadow-sm overflow-hidden flex flex-col relative">

                {/* Header with Back Button */}
                <div className="flex items-center p-4 border-b border-gray-200 gap-4">
                    <button onClick={handleBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[#172335] active:scale-95 transition-transform font-bold text-lg">
                        ←
                    </button>
                    <div className="flex items-center gap-2 text-[#172335]">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm">📸</div>
                        <h2 className="font-bold text-base">AI Problem Scanner</h2>
                    </div>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-5">

                    {/* INSTRUCTIONS AREA */}
                    {!imagePreview && (
                        <div className="sl-ai-card rounded-2xl p-4 border border-white/50 text-[#172335] shadow-sm">
                            <h3 className="font-bold text-sm mb-3">How it works:</h3>
                            <ul className="text-xs space-y-3 font-medium text-gray-700 m-0 pl-1">
                                <li className="flex items-start gap-2">
                                    <span className="text-[#0965e8] font-bold">1.</span>
                                    Take a clear, well-lit photo of the broken item or issue.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#0965e8] font-bold">2.</span>
                                    Get an initial assessment from the photo.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#0965e8] font-bold">3.</span>
                                    Connect with local experts if you need a hand.
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* Image Uploader */}
                    <div className="w-full aspect-[4/3] rounded-[20px] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-white/5 relative overflow-hidden active:bg-white/10 transition-colors" onClick={() => fileInputRef.current?.click()}>
                        {imagePreview ? (
                            <img src={imagePreview} alt="To analyze" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center text-[#647084] p-4">
                                <div className="text-3xl mb-2">📥</div>
                                <p className="text-sm font-bold">Tap to upload or take a photo</p>
                                <p className="text-xs mt-1">JPEG, PNG supported</p>
                            </div>
                        )}
                        <input type="file" accept="image/jpeg,image/png" capture="environment" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                    </div>

                    {/* Action Button */}
                    {imagePreview && !analysisSucceeded && (
                        <button onClick={analyzeImage} disabled={isAnalyzing} className="sl-ai-primary w-full py-3.5 text-sm flex justify-center items-center gap-2">
                            {isAnalyzing ? "✨ Analyzing with AI..." : analysisResult ? 'Retry scan' : "Scan Problem"}
                        </button>
                    )}

                    {/* Result Output */}
                    {analysisResult && (
                        <div className="sl-ai-card rounded-2xl p-4 border border-white/50 text-[#172335]">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="section-badge bg-[#c8a97a]/20 text-lg">🤖</span>
                                <h3 className="font-bold text-sm">{analysisSucceeded ? 'Initial assessment' : 'Assessment unavailable'}</h3>
                            </div>
                            <div role={analysisSucceeded ? 'status' : 'alert'} className="text-xs leading-relaxed space-y-2 whitespace-pre-line font-medium text-gray-700">
                                {analysisResult}
                            </div>

                            {analysisSucceeded && (catalogCategories ? <AiProviderSuggestion categories={catalogCategories} resultText={analysisResult} onSelectCategory={onSelectCategory} /> : <div className="mt-5 text-center border-t border-black/10 pt-4">
                                <p className="text-xs text-gray-500 font-bold mb-3">Having a hard time fixing this?</p>
                                <button onClick={onFindFixer} className="sl-ai-primary py-3 w-full text-xs">
                                    Find a Local Repairer
                                </button>
                            </div>)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProblemScanner;
