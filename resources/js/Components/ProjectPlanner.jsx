import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const ProjectPlanner = ({ onBack, onFindFixer }) => {
    const [projectIdea, setProjectIdea] = useState("");
    const [isPlanning, setIsPlanning] = useState(false);
    const [planResult, setPlanResult] = useState("");

    const handleBack = () => {
        setProjectIdea("");
        setPlanResult("");
        onBack();
    };

    const generatePlan = async () => {
        if (!projectIdea.trim()) return;
        setIsPlanning(true);
        setPlanResult("");

        try {
            // We call your Laravel backend route we defined in api.php
            const response = await fetch('/api/plan-project', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' 
                },
                body: JSON.stringify({ project: projectIdea })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate plan");
            }

            // Extract text from Google's response structure
            const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No plan generated.";
            setPlanResult(resultText);

        } catch (error) {
            console.error("Backend Error:", error);
            setPlanResult("System busy. Please try again in a moment.");
        } finally {
            setIsPlanning(false);
        }
    };

    return (
        <div className="animate-slide-up w-full flex-1 flex flex-col h-full">
            <div className="glass-dark w-full rounded-[32px] border border-white/20 shadow-xl overflow-hidden flex flex-col relative">
                
                {/* Header */}
                <div className="flex items-center p-4 border-b border-white/10 gap-4">
                    <button onClick={handleBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/90 active:scale-95 transition-transform font-bold text-lg">
                        ←
                    </button>
                    <div className="flex items-center gap-2 text-white">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm">🏗️</div>
                        <h2 className="font-bold text-base">AI Project Planner</h2>
                    </div>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-5">
                    
                    {/* Input Area */}
                    {!planResult && (
                        <>
                            <div className="glass rounded-2xl p-4 border border-white/50 text-[#3b2314] shadow-sm">
                                <h3 className="font-bold text-sm mb-2">What are we building?</h3>
                                <p className="text-xs font-medium text-gray-700 mb-4">
                                    Describe your renovation, repair, or building idea. The AI will map out the steps and tell you exactly who you need to hire.
                                </p>
                                
                                <textarea 
                                    value={projectIdea}
                                    onChange={(e) => setProjectIdea(e.target.value)}
                                    placeholder="e.g., I want to turn my garage into a guest bedroom with a small bathroom..."
                                    className="w-full bg-white/50 border border-white/60 rounded-xl p-3 text-sm text-[#3b2314] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b07d4a]/50 resize-none h-32 shadow-inner"
                                />
                            </div>

                            <button 
                                onClick={generatePlan} 
                                disabled={isPlanning || !projectIdea.trim()} 
                                className={`w-full py-3.5 text-sm flex justify-center items-center gap-2 font-bold rounded-xl transition-all ${
                                    projectIdea.trim() ? 'btn-caramel shadow-md' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {isPlanning ? "✨ Architecting your plan..." : "Generate Project Blueprint"}
                            </button>
                        </>
                    )}

                    {/* Result Area */}
                    {planResult && (
                        <div className="glass rounded-2xl p-4 border border-white/50 text-[#3b2314] shadow-sm flex flex-col gap-4">
                            <div className="flex items-center gap-2 border-b border-black/5 pb-3">
                                <span className="section-badge bg-[#c8a97a]/20 text-lg">📋</span>
                                <div>
                                    <h3 className="font-bold text-sm">Your Project Blueprint</h3>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-0.5">Step-by-step breakdown</p>
                                </div>
                            </div>
                            
                            <div className="text-xs leading-relaxed space-y-3 whitespace-pre-line font-medium text-gray-700">
                                {planResult}
                            </div>
                            
                            <div className="mt-2 text-center border-t border-black/10 pt-4">
                                <p className="text-xs text-gray-500 font-bold mb-3">Ready to start step 1?</p>
                                <button onClick={onFindFixer} className="btn-dark py-3 w-full text-xs">
                                    Browse Professionals
                                </button>
                                <button onClick={() => setPlanResult("")} className="mt-3 text-xs font-bold text-[#b07d4a] active:opacity-70 transition-opacity">
                                    Plan another project
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectPlanner;