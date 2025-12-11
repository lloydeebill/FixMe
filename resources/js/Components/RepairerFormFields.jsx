import React from 'react';

export default function RepairerFormFields({ data, setData, errors }) {
    return (
        <div className="space-y-6">
            {/* Business Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name / Display Name</label>
                <input
                    type="text"
                    value={data.business_name}
                    onChange={(e) => setData('business_name', e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g. Manny's Electric or Manuel Reyes"
                />
                {errors.business_name && <p className="text-red-500 text-xs mt-1">{errors.business_name}</p>}
            </div>

            {/* Focus Area */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Skill (Focus Area)</label>
                <select
                    value={data.focus_area}
                    onChange={(e) => setData('focus_area', e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                >
                    <option value="" disabled>Select your expertise...</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Appliances">Appliances</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Computer">Computer/IT</option>
                </select>
                {errors.focus_area && <p className="text-red-500 text-xs mt-1">{errors.focus_area}</p>}
            </div>

            {/* Bio */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio</label>
                <textarea
                    value={data.bio}
                    onChange={(e) => setData('bio', e.target.value)}
                    rows="4"
                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Tell customers about your experience, certifications, or guarantees..."
                ></textarea>
                {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
            </div>
        </div>
    );
}