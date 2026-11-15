import '../skilllink.css';
import React, { useState } from 'react';
import AiProviderSuggestion from './AiProviderSuggestion';

const ProjectPlanner = ({ onBack, onFindFixer, catalogCategories, onSelectCategory }) => {
    const [projectIdea, setProjectIdea] = useState("");
    const [isPlanning, setIsPlanning] = useState(false);
    const [planResult, setPlanResult] = useState("");
    const [planSucceeded, setPlanSucceeded] = useState(false);

    const handleBack = () => {
        setProjectIdea("");
        setPlanResult("");
        setPlanSucceeded(false);
        onBack();
    };

    const generatePlan = async () => {
        if (!projectIdea.trim()) return;
        setIsPlanning(true);
        setPlanResult("");
        setPlanSucceeded(false);

        try {
            // We call your Laravel backend route we defined in api.php
            const response = await fetch('/api/plan-project', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? ''
                },
                body: JSON.stringify({ project: projectIdea })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                setPlanResult(response.status === 401 ? 'Please sign in again to use the planner.'
                    : response.status === 419 ? 'Your session expired. Refresh the page and try again.'
                    : response.status === 429 ? 'Too many requests right now. Wait a minute and try again.'
                    : 'The AI service is temporarily unavailable. Please try again later.');
                return;
            }

            // Extract text from Google's response structure
            const resultText = data.candidates?.[0]?.content?.parts
                ?.filter(part => !part.thought && typeof part.text === 'string')
                .map(part => part.text).join('\n').trim();
            if (!resultText) {
                setPlanResult("No plan was returned. Please try again.");
                return;
            }
            setPlanResult(resultText);
            setPlanSucceeded(true);

        } catch {
            setPlanResult("System busy. Please try again in a moment.");
        } finally {
            setIsPlanning(false);
        }
    };

    return (
        <div className="skilllink-ai animate-slide-up w-full flex-1 flex flex-col h-full">
            <div className="sl-ai-panel w-full rounded-2xl border border-white/20 shadow-sm overflow-hidden flex flex-col relative">

                {/* Header */}
                <div className="flex items-center p-4 border-b border-gray-200 gap-4">
                    <button onClick={handleBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[#172335] active:scale-95 transition-transform font-bold text-lg">
                        ←
                    </button>
                    <div className="flex items-center gap-2 text-[#172335]">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm">🏗️</div>
                        <h2 className="font-bold text-base">AI Project Planner</h2>
                    </div>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-5">

                    {/* Input Area */}
                    {!planResult && (
                        <>
                            <div className="sl-ai-card rounded-2xl p-4 border border-white/50 text-[#172335] shadow-sm">
                                <h3 className="font-bold text-sm mb-2">What are we building?</h3>
                                <p className="text-xs font-medium text-gray-700 mb-4">
                                    Describe your renovation, repair, or building idea. The AI can suggest steps and service types to consider.
                                </p>

                                <textarea
                                    value={projectIdea}
                                    onChange={(e) => setProjectIdea(e.target.value)}
                                    placeholder="e.g., I want to turn my garage into a guest bedroom with a small bathroom..."
                                    className="w-full bg-white/50 border border-white/60 rounded-xl p-3 text-sm text-[#172335] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0965e8]/50 resize-none h-32 shadow-inner"
                                />
                            </div>

                            <button
                                onClick={generatePlan}
                                disabled={isPlanning || !projectIdea.trim()}
                                className={`w-full py-3.5 text-sm flex justify-center items-center gap-2 font-bold rounded-xl transition-all ${
                                    projectIdea.trim() ? 'sl-ai-primary shadow-md' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {isPlanning ? "✨ Architecting your plan..." : "Generate Project Blueprint"}
                            </button>
                        </>
                    )}

                    {/* Result Area */}
                    {planResult && (
                        <div className="sl-ai-card rounded-2xl p-4 border border-white/50 text-[#172335] shadow-sm flex flex-col gap-4">
                            <div className="flex items-center gap-2 border-b border-black/5 pb-3">
                                <span className="section-badge bg-[#c8a97a]/20 text-lg">📋</span>
                                <div>
                                    <h3 className="font-bold text-sm">{planSucceeded ? 'Your Project Blueprint' : 'Planner unavailable'}</h3>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-0.5">Step-by-step breakdown</p>
                                </div>
                            </div>

                            <div className="text-xs leading-relaxed space-y-3 whitespace-pre-line font-medium text-gray-700">
                                {planResult}
                            </div>

                            {planSucceeded && (catalogCategories ? <AiProviderSuggestion categories={catalogCategories} resultText={planResult} onSelectCategory={onSelectCategory} /> : <div className="mt-2 text-center border-t border-black/10 pt-4">
                                <p className="text-xs text-gray-500 font-bold mb-3">Ready to start step 1?</p>
                                <button onClick={onFindFixer} className="sl-ai-primary py-3 w-full text-xs">
                                    Browse Professionals
                                </button>
                            </div>)}
                            <button onClick={() => { setPlanResult(""); setPlanSucceeded(false); }} className="mt-3 text-xs font-bold text-[#0965e8] active:opacity-70 transition-opacity">
                                Plan another project
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectPlanner;
