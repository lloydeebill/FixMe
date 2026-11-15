import React, { useState } from 'react';
import { FiChevronDown, FiHome, FiMonitor, FiCoffee, FiUser, FiTool } from 'react-icons/fi';
import {
    LuBrickWall, LuCake, LuCarFront, LuCircuitBoard, LuConciergeBell,
    LuCookingPot, LuHammer, LuMartini, LuMonitor, LuPaintRoller,
    LuScissors, LuSnowflake, LuWrench, LuZap,
} from 'react-icons/lu';
import { TbMassage, TbNeedleThread, TbSteeringWheel, TbVacuumCleaner } from 'react-icons/tb';
import { groupCategories } from './catalog';

export const groupIcons = {
    'Home & Construction': FiHome,
    'Repair & Technology': FiMonitor,
    'Food & Events': FiCoffee,
    'Personal Services': FiUser,
};

export const categoryIcons = {
    plumbing: LuWrench,
    electrical: LuZap,
    carpentry: LuHammer,
    masonry: LuBrickWall,
    painting: LuPaintRoller,
    cleaning: TbVacuumCleaner,
    'aircon-services': LuSnowflake,
    'appliance-repair': LuCircuitBoard,
    'computer-services': LuMonitor,
    'automotive-services': LuCarFront,
    'cooking-food-preparation': LuCookingPot,
    'baking-pastry': LuCake,
    'event-setup-food-service': LuConciergeBell,
    bartending: LuMartini,
    tailoring: TbNeedleThread,
    'hair-beauty': LuScissors,
    'wellness-massage': TbMassage,
    driving: TbSteeringWheel,
};

export default function ServiceCatalog({ categories, selectedCategory, onSelectCategory }) {
    const groups = groupCategories(categories);
    const [expandedGroup, setExpandedGroup] = useState(null);

    return <div className="skilllink-service-catalog">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {Object.entries(groups).map(([name, items]) => {
                const Icon = groupIcons[name] || FiTool;
                const expanded = expandedGroup === name;
                return <button type="button" key={name} aria-expanded={expanded}
                    onClick={() => setExpandedGroup(expanded ? null : name)}
                    className={`flex min-h-20 items-center gap-2.5 rounded-xl border p-3 text-left transition-colors ${expanded ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 bg-white text-gray-800 hover:border-blue-300'}`}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-700"><Icon aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1"><strong className="block text-xs leading-snug sm:text-sm">{name}</strong><small className="text-[11px] text-gray-500">{items.length} services</small></span>
                    <FiChevronDown aria-hidden="true" className={`shrink-0 text-xs transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>;
            })}
        </div>
        {expandedGroup && groups[expandedGroup] && <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:grid-cols-2" aria-label={`${expandedGroup} services`}>
            {groups[expandedGroup].map(category => {
                const Icon = categoryIcons[category.slug] || FiTool;
                const active = selectedCategory?.slug === category.slug;
                return <button type="button" key={category.slug} aria-pressed={active}
                    onClick={() => onSelectCategory(active ? null : category)}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left ${active ? 'border-blue-500 bg-blue-100 text-blue-800' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}`}>
                    <Icon aria-hidden="true" className="shrink-0 text-blue-600" />
                    <span className="text-xs font-semibold sm:text-sm">{category.name}{category.description && <small className="block font-normal text-gray-600">{category.description}</small>}</span>
                </button>;
            })}
        </div>}
    </div>;
}
