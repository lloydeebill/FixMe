import React from 'react';
import SkillSelector from '@/Components/SkillSelector'; 

// Receive 'availableSkills' from the parent (which gets it from the Controller)
export default function RepairerFormFields({ data, setData, errors, availableSkills, pilotAreas = {}, collapseSkillGroups = false }) {
    
    return (
        <div className="space-y-5">
            {/* 1. Business Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Business / Display Name</label>
                <input
                    type="text"
                    value={data.business_name}
                    onChange={(e) => setData('business_name', e.target.value)}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g. John's Fix-It"
                />
                {errors.business_name && <p role="alert" className="mt-1 text-xs text-red-700">{errors.business_name}</p>}
            </div>

            <fieldset>
                <legend className="mb-2 text-sm font-medium text-gray-700">Pilot areas you serve</legend>
                <p className="mb-2 text-xs text-gray-500">Choose every area where you accept jobs, regardless of your saved service pin.</p>
                <div className="grid gap-2 sm:grid-cols-3">{Object.entries(pilotAreas).map(([slug, label]) => <label key={slug} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-sm"><input type="checkbox" checked={(data.service_areas || []).includes(slug)} onChange={event => setData('service_areas', event.target.checked ? [...(data.service_areas || []), slug] : (data.service_areas || []).filter(area => area !== slug))} />{label}</label>)}</div>
                {errors.service_areas && <p role="alert" className="mt-1 text-xs text-red-700">{errors.service_areas}</p>}
            </fieldset>

            {/* 2. SKILLS SELECTOR (Replaces the old dropdown) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Your Skills <span className="text-gray-400 font-normal">(Pick at least one)</span>
                </label>
                
                <SkillSelector 
                    availableSkills={availableSkills || []} // Safety check
                    selectedSkills={data.skills || []}      // Ensure 'skills' array exists in your useForm
                    onChange={(newSkills) => setData('skills', newSkills)}
                    collapsible={collapseSkillGroups}
                />
                
                {errors.skills && <p role="alert" className="mt-1 text-xs text-red-700">{errors.skills}</p>}
            </div>

            {/* 3. Bio */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Short Bio</label>
                <textarea
                    rows="3"
                    value={data.bio}
                    onChange={(e) => setData('bio', e.target.value)}
                    className="mt-1 block w-full rounded-lg border-gray-300 px-3 py-3 shadow-sm focus:border-[#0965e8] focus:ring-[#0965e8]"
                    placeholder="Briefly describe your experience..."
                />
                {errors.bio && <p role="alert" className="mt-1 text-xs text-red-700">{errors.bio}</p>}
            </div>
        </div>
    );
}
