import React from 'react';
import SkillSelector from '@/Components/SkillSelector'; // 👈 Import it

// Receive 'availableSkills' from the parent (which gets it from the Controller)
export default function RepairerFormFields({ data, setData, errors, availableSkills }) {
    
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
                {errors.business_name && <p className="text-red-500 text-xs mt-1">{errors.business_name}</p>}
            </div>

            {/* 2. SKILLS SELECTOR (Replaces the old dropdown) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Your Skills <span className="text-gray-400 font-normal">(Pick at least one)</span>
                </label>
                
                <SkillSelector 
                    availableSkills={availableSkills || []} // Safety check
                    selectedSkills={data.skills || []}      // Ensure 'skills' array exists in your useForm
                    onChange={(newSkills) => setData('skills', newSkills)}
                />
                
                {errors.skills && <p className="text-red-500 text-xs mt-1">{errors.skills}</p>}
            </div>

            {/* 3. Bio */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Short Bio</label>
                <textarea
                    rows="3"
                    value={data.bio}
                    onChange={(e) => setData('bio', e.target.value)}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Briefly describe your experience..."
                />
                {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
            </div>
        </div>
    );
}