// resources/js/Pages/DesktopLanding.jsx

import React, { useState, useRef, useEffect } from "react";
import { Link } from '@inertiajs/react';
import CardFloatingIcons from "@/Components/CardFloatingIcons";

// --- DATA ---

const topServices = [
  { name: "Plumber", color: "from-[#b86c45] to-[#8f5231]", icon: "🛠️", image: "/landingimage/plumber.jpg" },
  { name: "Electrical", color: "from-[#a78d8a] to-[#7d6764]", icon: "⚡", image: "/landingimage/electrical.jpg" },
  { name: "Electronics Repair", color: "from-[#e18a7a] to-[#c26d5c]", icon: "🔧", image: "/landingimage/electronics.jpg" },
  { name: "Cellphone Repair", color: "from-[#348aeb] to-[#206bc4]", icon: "📱", image: "/landingimage/cellphone.jpg" }
];

const belowBannerServices = [
  { name: "Aircon Cleaner", color: "from-[#c0d8e3] to-[#9bbccb]", icon: "❄️", image: "/landingimage/aircon.jpg" },
  { name: "Tailoring", color: "from-[#b86c45] to-[#8f5231]", icon: "🧵", image: "/landingimage/tailoring.jpg" },
  { name: "Carpenter", color: "from-[#dcb6a2] to-[#bfa08e]", icon: "🔨", image: "/landingimage/carpenter.jpg" },
  { name: "Shoe & Bag Repair", color: "from-[#eddad1] to-[#d6bea8]", icon: "👞", image: "/landingimage/shoerepair.jpg" },
];

const fullServices = [
  {
    id: "plumber",
    name: "The Plumber",
    person: "Rico",
    color: "bg-gradient-to-br from-[#b86c45] to-[#8f5231]",
    icon: "🛠️",
    image: "/landingimage/plumber.jpg",
    description: "Rico wakes up before dawn, tools in hand, ready to tackle leaky pipes and clogged drains. His hands are often wet and calloused, but he takes pride in knowing every faucet and pipe he fixes brings comfort to families. With over 10 years of experience, he has become the go-to plumber in his barangay. Reliable and honest, Rico always ensures work is done correctly the first time."
  },

  {
    id: "electrical",
    name: "The Electrician",
    person: "Marvin",
    color: "bg-gradient-to-br from-[#a78d8a] to-[#7d6764]",
    icon: "⚡",
    image: "/landingimage/electrical.jpg",
    description: "Marvin grew up fascinated by circuits and lights. Today, he climbs rooftops, crawls into attics, and safely installs electrical systems in homes and small businesses. After 7 years of hard work, he has become skilled enough to handle complex installations without supervision. Known for his attention to detail and safety-first approach, Marvin gives clients peace of mind."
  },

  {
    id: "electronics-repair",
    name: "Electronics Repair",
    person: "Pedro",
    color: "bg-gradient-to-br from-[#e18a7a] to-[#c26d5c]",
    icon: "🔧",
    image: "/landingimage/electronics.jpg",
    description: "Pedro spends his days hunched over a table full of circuit boards and tiny screws. He repairs televisions, radios, and refrigerators, bringing broken appliances back to life. With 5 years of experience, he is known in his neighborhood as the 'electronics fixer.' Dependable and meticulous, Pedro guarantees that each appliance is restored to full function."
  },

  {
    id: "cellphone-repair",
    name: "Cellphone Repair",
    person: "Jun",
    color: "bg-gradient-to-br from-[#eeb9a2] to-[#cf9880]",
    icon: "📱",
    image: "/landingimage/cellphone.jpg",
    description: "Jun’s workspace is small but full of precision tools. Screens, batteries, and tiny screws litter his desk as he carefully restores smartphones to perfect working order. After 3 years in the trade, he has mastered even the most complicated repairs. Clients trust Jun because of his honesty and the care he gives every device. He earns about ₱25,000 a month."
  },

  {
    id: "aircon-cleaner",
    name: "Aircon Specialist",
    person: "Eric",
    color: "bg-gradient-to-br from-[#c0d8e3] to-[#9abccb]",
    icon: "❄️",
    image: "/landingimage/aircon.jpg",
    description: "Eric starts his mornings with a checklist of air conditioning units to service. With a keen eye for detail, he disassembles each unit, cleans the filters, checks the refrigerant levels, and ensures optimal performance. Over his 4 years in the field, Eric has built a reputation for thoroughness and reliability. His clients appreciate his professionalism."
  },

  {
    id: "tailoring",
    name: "Master Tailor",
    person: "Aling Nina",
    color: "bg-gradient-to-br from-[#ca9174] to-[#a8765c]",
    icon: "🧵",
    image: "/landingimage/tailoring.jpg",
    description: "Aling Nina sits by her sewing machine, threads and fabrics surrounding her. With nimble fingers and 8 years of experience, she alters clothes, sews uniforms, and creates custom outfits. Known for her precision and honesty, clients trust her not just to fix a tear, but to make garments look brand new. Each stitch tells the story of her skill and passion."
  },

  {
    id: "carpenter",
    name: "The Carpenter",
    person: "Ka Ben",
    color: "bg-gradient-to-br from-[#dcb6a2] to-[#be9a87]",
    icon: "🔨",
    image: "/landingimage/carpenter.jpg",
    description: "Carpenter foreman Ka Ben wakes up at 5 a.m., overseeing his team building furniture and repairing homes. With 15 years in the field, he not only works with wood but guides younger carpenters to craft strong, beautiful structures. Known for his reliability and fairness, clients trust Ka Ben to deliver lasting results."
  },

  {
    id: "shoe-bag-repair",
    name: "Shoe Repairman",
    person: "Mang Ramon",
    color: "bg-gradient-to-br from-[#eddad1] to-[#cfbdaf]",
    icon: "👞",
    image: "/landingimage/shoerepair.jpg",
    description: "Mang Ramon has a small workshop tucked in a busy market. The smell of leather and polish fills the air as he carefully repairs shoes and bags. After 7 years of perfecting his craft, he can make old shoes feel new and bags last another season. Clients trust his honesty and meticulous attention to detail."
  },
];

export default function DesktopLanding() {
  const [flipped, setFlipped] = useState({});
  const cardRefs = useRef([]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const observer = new IntersectionObserver(
      (entries) => {
        const scrollDown = window.scrollY > lastScrollY;
        lastScrollY = window.scrollY;

        entries.forEach((entry) => {
          const index = entry.target.dataset.index;
          if (index === undefined) return;

          if (entry.isIntersecting) {
            if (scrollDown && !flipped[index]) {
              setFlipped((prev) => ({ ...prev, [index]: true }));
            } else if (!scrollDown && flipped[index]) {
              setFlipped((prev) => ({ ...prev, [index]: false }));
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => {
      cardRefs.current.forEach((card) => {
        if (card) observer.unobserve(card);
      });
    };
  }, [flipped]);

  return (
    <div className="w-full bg-[#faf9f6] text-slate-800 font-sans">


    {/* --- FLIP SECTION --- */}
    <div className="w-full flex flex-col">

      {/* WELCOME BANNER - HERO DESIGN */}
      <section className="relative w-full h-screen flex flex-col items-center justify-center bg-[#f2e8d9] overflow-hidden">

        {/* 1. Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'linear-gradient(#5d4037 1px, transparent 1px), linear-gradient(90deg, #5d4037 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* 2. Ambient Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-[#dcb6a2] to-transparent opacity-30 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-[#a57c52] to-transparent opacity-20 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3"></div>

        {/* 3. Main Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl">

          {/* Top Label */}
          <div className="mb-6 overflow-hidden">
            <p className="text-[#a57c52] font-bold tracking-[0.3em] text-xs md:text-sm uppercase animate-fade-in-up opacity-80">
              Trusted • Skilled • Local
            </p>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-8xl font-black text-[#5d4037] mb-2 tracking-tighter leading-[0.9] drop-shadow-sm">
            WELCOME TO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b86c45] via-[#8c6745] to-[#5d4037]">
              FIX ME
            </span>
          </h1>

          {/* Divider */}
          <div className="w-16 h-1.5 bg-[#5d4037] mx-auto my-8 rounded-full opacity-80"></div>

          {/* Subtitle */}
          <p className="text-2xl md:text-4xl font-serif text-[#8c6745] italic max-w-3xl mx-auto leading-normal opacity-90">
            "Hear the stories of our mamayan's daily work."
          </p>

          {/* CTA Button - Inertia Link to Login */}
          <div className="mt-12 group">
            <Link href="/login" className="relative px-8 py-4 bg-[#5d4037] text-[#f2e8d9] font-bold rounded-full overflow-hidden shadow-xl transition-transform transform group-hover:-translate-y-1 inline-block">
              <span className="relative z-10 tracking-widest uppercase text-sm">Find a Worker</span>
              <div className="absolute inset-0 bg-[#8c6745] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out"></div>
            </Link>
          </div>

        </div>
      </section>

       {/* --- INTRO SECTION --- */}
      <div className="h-screen w-full bg-[#333] relative overflow-hidden flex flex-row justify-between">

        {/*  LEFT COLUMN */}
        <div className="w-1/3 h-full train-col overflow-hidden relative border-r-4 border-[#fff]/10 bg-[#faf9f6]">
           <div className="train-track-vertical animate-up py-4">
              {[...topServices, ...topServices, ...topServices].map((s, i) => (
                <div key={i} className="my-1 mx-auto w-[85%] md:w-[70%] flex-shrink-0 flex flex-col gap-4">
                  <div
                    className={`bg-gradient-to-br ${s.color} rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center text-center text-white
                      transform hover:scale-105 transition-transform duration-300 h-[220px] border-4 border-white/20`}
                  >

                    <div className="bg-white/20 p-4 rounded-full text-4xl mb-3 backdrop-blur-sm shadow-inner">
                      {s.icon}
                    </div>
                    <p className="font-bold tracking-wide text-xl uppercase">{s.name}</p>
                  </div>
                  <div className="h-[220px] rounded-2xl overflow-hidden shadow-lg border-4 border-white/20">
                      <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/*  MIDDLE COLUMN */}
        <div className="w-1/3 h-full train-col overflow-hidden relative bg-[#faf9f6] opacity-90">
           <div className="train-track-vertical animate-down py-4">
              {[...belowBannerServices, ...belowBannerServices, ...belowBannerServices].map((s, i) => (
                <div key={i} className="my-1 mx-auto w-[85%] md:w-[70%] flex-shrink-0 flex flex-col gap-4">
                  <div className="h-[220px] rounded-2xl overflow-hidden shadow-lg border-4 border-white/20">
                      <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                  </div>
                  <div
                    className={`bg-gradient-to-br ${s.color} rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center text-center text-white
                      transform hover:scale-105 transition-transform duration-300 h-[220px] border-4 border-white/20`}
                  >
                    <div className="bg-white/20 p-4 rounded-full text-4xl mb-3 backdrop-blur-sm shadow-inner">
                      {s.icon}
                    </div>
                    <p className="font-bold tracking-wide text-xl uppercase">{s.name}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-1/3 h-full train-col overflow-hidden relative border-l-4 border-[#fff]/10 bg-[#faf9f6]">
           <div className="train-track-vertical animate-up py-4">
              {[...topServices, ...topServices, ...topServices].map((s, i) => (
                <div key={i} className="my-1 mx-auto w-[85%] md:w-[70%] flex-shrink-0 flex flex-col gap-4">
                  <div
                    className={`bg-gradient-to-br ${s.color} rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center text-center text-white
                      transform hover:scale-105 transition-transform duration-300 h-[220px] border-4 border-white/20`}
                  >
                    <div className="bg-white/20 p-4 rounded-full text-4xl mb-3 backdrop-blur-sm shadow-inner">
                      {s.icon}
                    </div>
                    <p className="font-bold tracking-wide text-xl uppercase">{s.name}</p>
                  </div>
                  <div className="h-[220px] rounded-2xl overflow-hidden shadow-lg border-4 border-white/20">
                      <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* CENTER */}
<div className="absolute top-1/2 left-0 transform -translate-y-1/2 z-20 w-full pointer-events-none">
  <div className="bg-gradient-to-r from-[#4A86BD] via-[#5A96CD] to-[#4A86BD] opacity-95 backdrop-blur-xl shadow-2xl transform -skew-y-3 border-y-[6px] border-white/30 overflow-hidden">
   
    {/*  Subtle Inner Glow/Highlight */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/10 pointer-events-none" />

    <div className="transform skew-y-2 py-10 text-center relative z-10 px-4">
      <h2 className="text-6xl md:text-7xl font-black tracking-widest uppercase text-white drop-shadow-md">
        FixMe
      </h2>

      <div className="flex items-center justify-center gap-4 mt-2 opacity-90">
        <span className="hidden md:block h-[2px] w-12 bg-blue-100/50 rounded-full"></span>
        <p className="text-lg md:text-2xl font-medium tracking-[0.3em] uppercase text-blue-50 text-shadow-sm">
          Bridging Skills • Building Communities
        </p>
        <span className="hidden md:block h-[2px] w-12 bg-blue-100/50 rounded-full"></span>
      </div>
    </div>
  </div>
</div>

      </div>


      {/* DYNAMIC SERVICE PAGES */}
       {fullServices.map((s, i) => (
         <div
           key={s.id}
           data-index={i}
           ref={(el) => (cardRefs.current[i] = el)}
           className="h-screen w-full flex items-center justify-center perspective-1000 relative overflow-hidden"
         >

          {/* PAGE 1: THE COVER (Front) */}
           <div
             className={`absolute w-full h-full transition-all transform backface-hidden ${
               flipped[i] 
                 ? "duration-10000 rotate-y-180 opacity-0 z-0" 
                 : "duration-2000 rotate-y-0 opacity-100 z-10"   
             }`}
           >
              <div className={`${s.color} w-full h-full flex flex-col md:flex-row items-center justify-center relative`}>
               
                {/* --- 3D Icons --- */}
                <CardFloatingIcons icon={s.icon} />

                {/* Left: Title */}
                <div className="flex-1 flex flex-col items-center justify-center text-center z-10 p-10">
                  <div className="bg-white/20 backdrop-blur-md p-6 rounded-full shadow-inner mb-8">
                     <span className="text-8xl drop-shadow-md">{s.icon}</span>
                  </div>
                  <h2 className="font-black text-6xl md:text-7xl text-white drop-shadow-lg tracking-tight uppercase">
                    {s.name}
                  </h2>
                </div>

                {/* Right: Image */}
                <div className="flex-1 flex items-center justify-center h-full p-10 md:p-20 z-10">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-white opacity-30 rounded-2xl blur group-hover:opacity-50 transition"></div>
                    <img
                      src={s.image}
                      alt={s.name}
                      className="relative rounded-xl object-cover h-[50vh] w-auto shadow-2xl border-4 border-white/50 transform rotate-2 hover:rotate-0 transition duration-500"
                    />
                  </div>
                </div>
               </div>
           </div>

           {/*PAGE 2: THE STORY (Back/Description) */}
           <div
              className={`absolute w-full h-full transition-all duration-3000 transform backface-hidden ${
               flipped[i] ? "rotate-y-0 opacity-100 z-10" : "-rotate-y-180 opacity-0 z-0"
             }`}
           >
             <div className="w-full h-full flex flex-col md:flex-row bg-[#faf9f6]">
               
               {/* Left: Hero */}
               <div className="hidden md:flex flex-1 relative overflow-hidden">
                 <div className="absolute inset-0 bg-black/10 z-10"></div>
                 <img
                   src={s.image}
                   alt={s.name}
                   className="w-full h-full object-cover transform hover:scale-105 transition duration-[3000ms]"
                 />
                 <div className="absolute bottom-10 left-10 z-20 text-white">
                   <p className="text-lg font-light uppercase tracking-widest">Featured Worker</p>
                   <h3 className="text-5xl font-bold">{s.person}</h3>
                 </div>
               </div>

               {/* Right: Content/Text */}
               <div className="flex-1 flex flex-col justify-center p-12 md:p-24 relative">
                 
                 {/*Watermark Icon */}
                 <div className="absolute top-10 right-10 text-9xl opacity-5 grayscale">
                   {s.icon}
                 </div>

                 <div className="max-w-xl z-10">
                   <div className="flex items-center gap-4 mb-6">
                     <span className="h-1 w-20 bg-[#a57c52]"></span>
                     <span className="text-[#a57c52] font-bold tracking-widest uppercase">A Day in the Life</span>
                   </div>

                   <h2 className="text-5xl font-serif text-slate-800 mb-8 leading-tight">
                     Meet <span className="text-[#b86c45] decoration-2 underline-offset-4">{s.person}</span>,<br/> the {s.name}.
                   </h2>
                   
                   <p className="text-xl md:text-2xl leading-relaxed text-slate-600 font-serif border-l-4 border-[#dcb6a2] pl-6 italic">
                     "{s.description}"
                   </p>

                   <div className="mt-12 flex gap-4">
                     <button className="bg-slate-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-[#b86c45] transition shadow-lg">
                       Book {s.person} Now
                     </button>
                   </div>
                 </div>
               </div>

             </div>
           </div>

        </div>
       ))}
    </div>

    {/* --- CONTACT SECTION ---- */}
    <div className="h-screen w-full bg-[#faf9f6] flex flex-col md:flex-row relative overflow-hidden">
     
      {/* Decorative Background Elements (Blobs) */}
      <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-[#dcb6a2] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[0%] w-[500px] h-[500px] bg-[#a57c52] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>

      {/* Contact Left (Info Panel) */}
      <div className="bg-gradient-to-br from-[#8c6745] to-[#5d4037] p-12 md:w-2/5 h-full text-white flex flex-col justify-center relative z-10">
         
          {/* Texture Overlay */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%">
                <pattern id="pattern-circles" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="currentColor" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#pattern-circles)" />
            </svg>
          </div>

          <div className="relative z-10 max-w-md mx-auto w-full">
            <h2 className="text-5xl font-bold mb-6 tracking-tight">Let's Connect</h2>
            <p className="text-white/80 mb-12 font-light text-lg leading-relaxed">
              Ready to get things fixed? Reach out to our community of skilled workers. We are here to help.
            </p>
           
            <div className="space-y-8">
              <div className="flex items-center gap-6 group cursor-pointer">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                </div>
                <span className="font-medium text-xl tracking-wide">0912 345 6789</span>
              </div>

              <div className="flex items-center gap-6 group cursor-pointer">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <span className="font-medium text-xl tracking-wide">fixme@gmail.com</span>
              </div>

              <div className="flex items-center gap-6 group cursor-pointer">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                <span className="font-medium text-xl tracking-wide">Butuan City, Philippines</span>
              </div>
            </div>
          </div>
      </div>

      {/* Contact Right (Form) */}
      <div className="p-10 md:p-24 md:w-3/5 h-full bg-white flex flex-col justify-center relative z-10">
          <div className="max-w-xl mx-auto w-full">
            <h3 className="text-4xl font-bold text-[#5d4037] mb-3">Send us a message</h3>
            <p className="text-gray-500 mb-10 text-lg">We usually reply within 24 hours.</p>
           
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">First Name</label>
                  <input type="text" className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 focus:border-[#a57c52] focus:bg-white focus:ring-4 focus:ring-[#a57c52]/10 outline-none transition-all" placeholder="Juan" />
                </div>
                <div className="relative">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Last Name</label>
                <input type="text" className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 focus:border-[#a57c52] focus:bg-white focus:ring-4 focus:ring-[#a57c52]/10 outline-none transition-all" placeholder="Dela Cruz" />
                </div>
              </div>

              <div className="relative">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Email Address</label>
                  <input type="email" className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 focus:border-[#a57c52] focus:bg-white focus:ring-4 focus:ring-[#a57c52]/10 outline-none transition-all" placeholder="juan@example.com" />
              </div>

              <div className="relative">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Message</label>
                  <textarea rows="4" className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 focus:border-[#a57c52] focus:bg-white focus:ring-4 focus:ring-[#a57c52]/10 outline-none transition-all resize-none" placeholder="How can we help you?"></textarea>
              </div>

              <button className="w-full bg-gradient-to-r from-[#a57c52] to-[#8c6745] text-white font-bold py-5 rounded-lg shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 flex items-center justify-center gap-3 text-lg">
                <span>Send Message</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </form>
          </div>
      </div>

    </div>

    </div>
  );
}
