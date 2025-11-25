import React, { useState } from 'react';

// Mocked data structure for placeholder repairers
const REPAIRERS_DATA = {
    Electrical: [
        { id: 1, name: "Manuel 'Manny' Reyes", rating: 4.9, status: 'Available Now' },
        { id: 2, name: "Jasmine 'Jas' Cruz", rating: 4.7, status: '15 mins away' },
        { id: 3, name: "Benito 'Ben' Lopez", rating: 4.5, status: 'Busy until 17:00' },
    ],
    Appliances: [
        { id: 4, name: "Teresa 'Tess' Santos", rating: 4.8, status: 'Available Now' },
        { id: 5, name: "Ramon 'Mon' Garcia", rating: 4.6, status: '30 mins away' },
    ],
    Clothes: [
        { id: 6, name: "Aling Nena", rating: 5.0, status: 'Ready for pickup' },
        { id: 7, name: "The Seamstress Sisters", rating: 4.9, status: 'Busy until 14:00' },
    ],
    Plumbing: [
        { id: 8, name: "Kuya Popoy", rating: 4.8, status: 'Available Now' },
    ],
};

const CATEGORIES = ['Electrical', 'Appliances', 'Clothes', 'Plumbing'];

// 🚨 Added 'gridConfig' prop with a smart default
const RepairerFinder = ({ className = "", onRepairerSelect, gridConfig = "grid-cols-1 md:grid-cols-2" }) => {
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
    const activeRepairers = REPAIRERS_DATA[activeCategory] || [];

    const ProfileIcon = (color) => (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${color} shrink-0`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </div>
    );

    return (
        <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-100 ${className}`}>
            <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-1">Book a Repairer</h2>
                <p className="text-sm text-gray-500">Select a category to find available experts nearby.</p>
            </div>
            
            {/* --- Category Tabs --- */}
            <div className="flex space-x-2 overflow-x-auto pb-4 no-scrollbar">
                {CATEGORIES.map((category) => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-5 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap border
                            ${activeCategory === category 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* --- Repairer Grid --- */}
            {/* 🚨 We use the dynamic 'gridConfig' prop here */}
            <div className={`grid gap-4 pt-2 ${gridConfig}`}>
                {activeRepairers.length > 0 ? (
                    activeRepairers.map((repairer) => (
                        <div 
                            key={repairer.id} 
                            // Main card click
                            onClick={() => onRepairerSelect && onRepairerSelect(repairer)}
                            className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition group cursor-pointer"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                {ProfileIcon(repairer.status.includes('Available') ? 'bg-green-500' : 'bg-red-500')}
                                
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition">{repairer.name}</p>
                                    <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                        <span className="flex items-center text-yellow-600 font-bold mr-2">
                                            ★ {repairer.rating}
                                        </span>
                                        <span className={`truncate ${repairer.status.includes('Available') ? 'text-green-600' : 'text-red-500'}`}>
                                            {repairer.status}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            
                            <button 
                                // Explicitly attach handler to button as well to be safe, preventing propagation issues
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent double-firing if parent also fires
                                    onRepairerSelect && onRepairerSelect(repairer);
                                }}
                                className="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition"
                            >
                                Book
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full p-8 bg-gray-50 rounded-xl text-center text-gray-500">
                        No repairers found for {activeCategory} at the moment.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RepairerFinder;