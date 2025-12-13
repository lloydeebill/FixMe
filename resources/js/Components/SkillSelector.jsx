import React from 'react';

export default function SkillSelector({ availableSkills, selectedSkills, onChange }) {
    
    const toggleSkill = (skillId) => {
        // If already selected, remove it. If not, add it.
        if (selectedSkills.includes(skillId)) {
            onChange(selectedSkills.filter(id => id !== skillId));
        } else {
            onChange([...selectedSkills, skillId]);
        }
    };

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {availableSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill.id);

                return (
                    <button
                        key={skill.id}
                        type="button" // Important: prevents form submission
                        onClick={() => toggleSkill(skill.id)}
                        className={`
                            relative flex items-center justify-center px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-200
                            ${isSelected 
                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md transform scale-105' // Active Style
                                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50' // Inactive Style
                            }
                        `}
                    >
                        {/* The "Circle Border" Effect (Ring) */}
                        {isSelected && (
                            <div className="absolute inset-0 rounded-xl ring-2 ring-blue-200 ring-offset-2"></div>
                        )}

                        <span>{skill.name}</span>
                        
                        {/* Checkmark Icon for extra clarity */}
                        {isSelected && (
                            <svg className="w-4 h-4 ml-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        )}
                    </button>
                );
            })}
        </div>
    );
}