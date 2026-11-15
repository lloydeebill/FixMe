import React, { useState } from 'react';

export default function SkillSelector({ availableSkills, selectedSkills, onChange, collapsible = false }) {
    const [expandedGroup, setExpandedGroup] = useState(null);
    const groups = availableSkills.reduce((result, skill) => {
        const group = skill.service_group || 'Other services';
        (result[group] ??= []).push(skill);
        return result;
    }, {});
    
    const toggleSkill = (skillId) => {
        // If already selected, remove it. If not, add it.
        if (selectedSkills.includes(skillId)) {
            onChange(selectedSkills.filter(id => id !== skillId));
        } else {
            onChange([...selectedSkills, skillId]);
        }
    };

    return (
        <div className="space-y-5">
            {Object.entries(groups).map(([group, skills]) => <section key={group}>
                {collapsible ? <button type="button" aria-expanded={expandedGroup === group} onClick={() => setExpandedGroup(current => current === group ? null : group)} className="flex w-full items-center justify-between rounded-xl border border-[#d7e6fb] bg-[#f8fbff] px-4 py-3 text-left text-sm font-semibold text-[#172335] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0965e8]"><span>{group}</span><span className="text-xs font-medium text-[#0965e8]">{skills.filter(skill => selectedSkills.includes(skill.id)).length} selected <span aria-hidden="true">{expandedGroup === group ? '−' : '+'}</span></span></button> : <h3 className="mb-2 text-sm font-semibold text-gray-700">{group}</h3>}
                {(!collapsible || expandedGroup === group) && <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {skills.map((skill) => {
                const isSelected = selectedSkills.includes(skill.id);

                return (
                    <button
                        key={skill.id}
                        type="button" // Important: prevents form submission
                        aria-pressed={isSelected}
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

                        <span>{skill.name}{skill.description && <small className="block mt-1 font-normal">{skill.description}</small>}</span>
                        
                        {/* Checkmark Icon for extra clarity */}
                        {isSelected && (
                            <svg className="w-4 h-4 ml-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        )}
                    </button>
                );
            })}
                </div>}
            </section>)}
        </div>
    );
}
