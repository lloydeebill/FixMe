// resources/js/Pages/DesktopLanding.jsx

import React, { useState, useRef, useEffect } from "react";
import { Link } from '@inertiajs/react';
import { motion, useScroll, useTransform, useMotionTemplate, useSpring, AnimatePresence } from "framer-motion";

// --- DATA ---
const fullServices = [
  { id: "plumber", name: "The Plumber", person: "Rico", color: "bg-gradient-to-br from-[#b86c45] to-[#8f5231]", icon: "🛠️", image: "/landingimage/plumber.jpg", description: "Rico wakes up before dawn to check his tools. He knows the city's pipes better than the engineers who designed them." },
  { id: "electrical", name: "The Electrician", person: "Marvin", color: "bg-gradient-to-br from-[#a78d8a] to-[#7d6764]", icon: "⚡", image: "/landingimage/electrical.jpg", description: "Marvin grew up fascinated by circuits. He can trace a fault in an old building just by listening to the hum of the wires." },
  { id: "electronics-repair", name: "Electronics Repair", person: "Pedro", color: "bg-gradient-to-br from-[#e18a7a] to-[#c26d5c]", icon: "🔧", image: "/landingimage/electronics.jpg", description: "Pedro spends his days hunched over microchips, breathing life back into devices that others called 'trash'." },
  { id: "cellphone-repair", name: "Cellphone Repair", person: "Jun", color: "bg-gradient-to-br from-[#eeb9a2] to-[#cf9880]", icon: "📱", image: "/landingimage/cellphone.jpg", description: "Jun’s workspace is small, but his hands are steady. He saves memories trapped in broken screens every single day." },
  { id: "aircon-cleaner", name: "Aircon Specialist", person: "Eric", color: "bg-gradient-to-br from-[#c0d8e3] to-[#9abccb]", icon: "❄️", image: "/landingimage/aircon.jpg", description: "Eric starts his mornings on rooftops. He brings the cool breeze back to homes sweltering in the summer heat." },
  { id: "tailoring", name: "Master Tailor", person: "Aling Nina", color: "bg-gradient-to-br from-[#ca9174] to-[#a8765c]", icon: "🧵", image: "/landingimage/tailoring.jpg", description: "Aling Nina sits by her sewing machine, turning simple fabric into armor for the daily grind of her neighbors." },
  { id: "carpenter", name: "The Carpenter", person: "Ka Ben", color: "bg-gradient-to-br from-[#dcb6a2] to-[#be9a87]", icon: "🔨", image: "/landingimage/carpenter.jpg", description: "Foreman Ka Ben builds foundations that last generations, using techniques handed down by his father." },
  { id: "shoe-bag-repair", name: "Shoe Repairman", person: "Mang Ramon", color: "bg-gradient-to-br from-[#eddad1] to-[#cfbdaf]", icon: "👞", image: "/landingimage/shoerepair.jpg", description: "Mang Ramon's small workshop smells of leather and glue. He walks a mile in everyone's shoes before fixing them." },
];

// --- SUB-COMPONENT: FLOATING ICONS (Decoration) ---
const CardFloatingIcons = ({ icon }) => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ 
                        y: [0, -100, -200], 
                        opacity: [0, 0.2, 0],
                        x: Math.random() * 100 - 50 
                    }}
                    transition={{ 
                        duration: 3 + Math.random() * 2, 
                        repeat: Infinity, 
                        delay: i * 0.5 
                    }}
                    className="absolute text-6xl text-white opacity-10"
                    style={{ 
                        left: `${20 + Math.random() * 60}%`, 
                        bottom: '-10%' 
                    }}
                >
                    {icon}
                </motion.div>
            ))}
        </div>
    );
};

// --- UPDATED COMPONENT: POP-UP FLIP MODAL ---
const ServiceModal = ({ s, onClose }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; }
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // 1. CLICKING THE BACKGROUND CLOSES THE MODAL
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
        >
            {/* Close Button (Optional, but good UX) */}
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 z-[110] text-white/50 hover:text-white transition"
            >
                <span className="uppercase tracking-widest text-sm font-bold">Close ✕</span>
            </button>

            {/* 2. THE CARD CONTAINER (Floating, not full screen) */}
            {/* We constrain width/height so there is space outside to click */}
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                // 3. STOP PROPAGATION: Clicking inside here WON'T close the modal
                onClick={(e) => e.stopPropagation()} 
                className="relative w-full max-w-6xl h-[85vh] md:h-[80vh] perspective-1000 shadow-2xl rounded-3xl"
            >
                
                {/* SIDE A: FRONT (The Intro) */}
                <div 
                    onClick={() => setIsFlipped(true)}
                    className={`absolute w-full h-full transition-all duration-1000 transform backface-hidden cursor-pointer rounded-3xl overflow-hidden ${isFlipped ? "rotate-y-180 opacity-0 z-0" : "rotate-y-0 opacity-100 z-10"}`}
                >
                    <div className={`${s.color} w-full h-full flex flex-col md:flex-row items-center justify-center relative rounded-3xl`}>
                        <CardFloatingIcons icon={s.icon} />
                        
                        <div className="flex-1 flex flex-col items-center justify-center text-center z-10 p-10">
                            <div className="bg-white/20 backdrop-blur-md p-6 rounded-full shadow-inner mb-8">
                                <span className="text-8xl drop-shadow-md">{s.icon}</span>
                            </div>
                            <h2 className="font-black text-6xl md:text-7xl text-white drop-shadow-lg tracking-tight uppercase">{s.name}</h2>
                            <p className="mt-4 text-white/80 uppercase tracking-widest text-sm animate-pulse">Click card to meet {s.person}</p>
                        </div>
                        
                        <div className="flex-1 flex items-center justify-center h-full p-10 z-10">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-white opacity-30 rounded-2xl blur group-hover:opacity-50 transition"></div>
                                <img src={s.image} alt={s.name} className="relative rounded-xl object-cover h-[40vh] md:h-[50vh] w-auto shadow-2xl border-4 border-white/50 transform rotate-2 hover:rotate-0 transition duration-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SIDE B: BACK (The Details) */}
                <div className={`absolute w-full h-full transition-all duration-1000 transform backface-hidden rounded-3xl overflow-hidden bg-[#faf9f6] ${isFlipped ? "rotate-y-0 opacity-100 z-10" : "-rotate-y-180 opacity-0 z-0"}`}>
                    <div className="w-full h-full flex flex-col md:flex-row">
                        {/* Left Side Image */}
                        <div className="hidden md:flex flex-1 relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/10 z-10"></div>
                            <img src={s.image} alt={s.name} className="w-full h-full object-cover transform hover:scale-105 transition duration-[3000ms]" />
                            <div className="absolute bottom-10 left-10 z-20 text-white">
                                <p className="text-lg font-light uppercase tracking-widest">Featured Worker</p>
                                <h3 className="text-5xl font-bold">{s.person}</h3>
                            </div>
                            <button onClick={() => setIsFlipped(false)} className="absolute top-10 left-10 z-30 text-white/80 hover:text-white flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm transition">
                                <span>← Flip Back</span>
                            </button>
                        </div>

                        {/* Right Side Text */}
                        <div className="flex-1 flex flex-col justify-center p-8 md:p-16 relative overflow-y-auto">
                            <button onClick={() => setIsFlipped(false)} className="md:hidden absolute top-6 left-6 text-slate-400">← Flip Back</button>
                            
                            <div className="absolute top-10 right-10 text-9xl opacity-5 grayscale pointer-events-none">{s.icon}</div>
                            <div className="max-w-xl z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="h-1 w-20 bg-[#a57c52]"></span>
                                    <span className="text-[#a57c52] font-bold tracking-widest uppercase">A Day in the Life</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-serif text-slate-800 mb-6 leading-tight">
                                    Meet <span className="text-[#b86c45] decoration-2 underline-offset-4">{s.person}</span>,<br/> the {s.name}.
                                </h2>
                                <p className="text-lg md:text-xl leading-relaxed text-slate-600 font-serif border-l-4 border-[#dcb6a2] pl-6 italic mb-8">
                                    "{s.description}"
                                </p>
                                <div className="flex gap-4">
                                    <button className="bg-slate-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-[#b86c45] transition shadow-lg w-full md:w-auto">
                                        Book {s.person} Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </motion.div>
        </motion.div>
    );
};

// --- COMPONENT: SCROLL REVEAL IMAGE (Trigger) ---
const ScrollRevealImage = ({ src, alt, onClick }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const grayscale = useTransform(scrollYProgress, [0.1, 0.4, 0.6, 0.9], [1, 0, 0, 1]);
  const opacity = useTransform(scrollYProgress, [0.1, 0.4, 0.6, 0.9], [0.8, 1, 1, 0.8]);
  const filter = useMotionTemplate`grayscale(${grayscale})`;

  return (
    <motion.div 
      ref={ref}
      style={{ filter, opacity }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      className="rounded-2xl overflow-hidden shadow-lg mb-6 cursor-pointer group relative"
    >
      <img src={src} alt={alt} className="w-full h-[300px] md:h-[400px] object-cover" />
      {/* Small hint overlay on hover */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
        <span className="text-white border border-white px-4 py-2 rounded-full uppercase text-xs tracking-widest">View Profile</span>
      </div>
    </motion.div>
  );
};

// --- COMPONENT: CONTEXT CARD ---
const ContextCard = ({ label, title, children, icon }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-32 last:mb-0 relative pl-8 border-l-2 border-[#dcb6a2]/30"
        >
             <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-[#b86c45] border-4 border-white shadow-sm"></div>
             <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{icon}</span>
                <h4 className="text-[#b86c45] font-bold uppercase tracking-widest text-xs md:text-sm">{label}</h4>
             </div>
             <h3 className="text-3xl md:text-4xl font-serif text-[#5d4037] mb-6 leading-tight">{title}</h3>
             <div className="text-lg text-slate-600 leading-relaxed space-y-4">
                {children}
             </div>
        </motion.div>
    )
}

export default function DesktopLanding() {
  // --- STATE FOR MODAL ---
  const [selectedService, setSelectedService] = useState(null);

  // --- HERO & COLOR LOGIC ---
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const logoOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const logoY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const logoScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const textOpacity = useTransform(scrollYProgress, [0.15, 0.35], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.15, 0.35], [50, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const fixMeBg = useTransform(scrollYProgress, [0.75, 0.95], ["#5d4037", "#ffffff"]);
  const fixMeText = useTransform(scrollYProgress, [0.75, 0.95], ["#ffffff", "#5d4037"]);

  // --- DRAWING LINE LOGIC ---
  const contextRef = useRef(null);
  const { scrollYProgress: contextProgress } = useScroll({ target: contextRef, offset: ["start center", "end center"] });
  const pathLength = useSpring(contextProgress, { stiffness: 400, damping: 90 });
  const certifiedOpacity = useTransform(pathLength, [0.8, 1], [0.3, 1]);
  const certifiedScale = useTransform(pathLength, [0.8, 1], [0.9, 1.1]);

  return (
    <div className="w-full bg-[#faf9f6] text-slate-800 font-sans">
      
      {/* MODAL OVERLAY */}
      <AnimatePresence>
        {selectedService && (
            <ServiceModal 
                s={selectedService} 
                onClose={() => setSelectedService(null)} 
            />
        )}
      </AnimatePresence>

      {/* LAYER 0: THE "FIXME" DIV */}
      <motion.div 
        style={{ backgroundColor: fixMeBg, color: fixMeText }}
        className="fixed inset-0 z-0 flex flex-col items-center justify-center text-center"
      >
         <div className="px-4 mt-20">
            <motion.h2 
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 1 }}
                className="text-8xl md:text-[12rem] font-black uppercase tracking-tighter mb-4 leading-none"
            >
              FixMe
            </motion.h2>
            <div className="text-2xl md:text-4xl font-serif italic opacity-90 flex flex-wrap justify-center gap-x-3">
               <span>Built with</span>
               <span className="font-bold">Heart,</span>
               <span className="font-bold">Skill,</span>
               <span>&</span>
               <span className="font-bold">Trust.</span>
            </div>
         </div>
      </motion.div>

      {/* LAYER 1: SCROLLYTELLING HERO */}
      <div ref={containerRef} className="relative z-10 h-[350vh] bg-[#f2e8d9] mb-[120vh] rounded-b-[60px] shadow-2xl">
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
             <motion.div style={{ y: bgY }} className="absolute inset-0 opacity-[0.03] pointer-events-none"
               style={{ backgroundImage: 'linear-gradient(#5d4037 1px, transparent 1px), linear-gradient(90deg, #5d4037 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </motion.div>
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-[#dcb6a2] to-transparent opacity-30 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-[#a57c52] to-transparent opacity-20 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

          <motion.div style={{ opacity: logoOpacity, y: logoY, scale: logoScale }} className="absolute z-20 flex flex-col items-center text-center px-4">
             <p className="text-[#a57c52] font-bold tracking-[0.3em] text-xs md:text-sm uppercase mb-4">Trusted • Skilled • Local</p>
             <h1 className="text-6xl md:text-8xl font-black text-[#5d4037] mb-2 tracking-tighter leading-[0.9] drop-shadow-sm uppercase">Welcome to <br /> Fix Me</h1>
             <div className="mt-8 animate-bounce text-[#5d4037] opacity-50 text-sm uppercase tracking-widest">Scroll to explore</div>
          </motion.div>

          <motion.div style={{ opacity: textOpacity, y: textY }} className="relative z-10 text-center px-6 max-w-5xl">
            <div className="w-16 h-1.5 bg-[#5d4037] mx-auto my-8 rounded-full opacity-80"></div>
            <h2 className="text-3xl md:text-5xl font-serif text-[#5d4037] leading-tight mb-6">We believe true skill isn't always <br /><span className="italic text-[#8c6745]">written on paper.</span></h2>
            <p className="text-lg md:text-2xl font-light text-slate-600 max-w-3xl mx-auto leading-relaxed">
              We bridge the gap for the <strong className="text-[#b86c45] font-bold">uncertified but undeniable</strong> experts of our community. 
              We are here to empower the Filipino <i>mamayan</i>—valuing <span className="inline-block bg-[#dcb6a2]/30 px-2 rounded mx-1 font-medium text-[#5d4037]">craft over certificates</span>.
            </p>
             <div className="mt-12 group pointer-events-auto">
                <Link href="/login" className="relative px-8 py-4 bg-[#5d4037] text-[#f2e8d9] font-bold rounded-full overflow-hidden shadow-xl transition-transform transform group-hover:-translate-y-1 inline-block">
                  <span className="relative z-10 tracking-widest uppercase text-sm">Find a Worker</span>
                  <div className="absolute inset-0 bg-[#8c6745] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out"></div>
                </Link>
             </div>
          </motion.div>
        </div>
      </div>

      {/* LAYER 2: SCROLLING MISSION SECTION */}
      <div className="relative z-10 bg-white w-full py-24 md:py-0">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
            {/* Left: Images */}
            <div className="w-full md:w-1/2 p-6 md:p-12 grid grid-cols-2 gap-6">
               <div className="flex flex-col gap-6">
                  {fullServices.slice(0, 4).map((service, i) => (
                    <ScrollRevealImage key={i} src={service.image} alt={service.name} onClick={() => setSelectedService(service)} />
                  ))}
               </div>
               <div className="flex flex-col gap-6 mt-20">
                  {fullServices.slice(4, 8).map((service, i) => (
                    <ScrollRevealImage key={i} src={service.image} alt={service.name} onClick={() => setSelectedService(service)} />
                  ))}
               </div>
            </div>
            {/* Right: Sticky Text */}
            <div className="w-full md:w-1/2 md:h-screen md:sticky md:top-0 flex flex-col justify-center p-8 md:p-20 bg-white">
               <div className="relative">
                  <div className="absolute -top-12 -left-8 text-[#f2e8d9] text-9xl font-serif leading-none opacity-50">“</div>
                  <h3 className="text-4xl md:text-6xl font-serif text-[#5d4037] leading-tight mb-8">
                     Every Filipino <br/>
                     <span className="italic text-[#b86c45]">manggagawa</span> <br/>
                     has a story.
                  </h3>
                  <div className="space-y-6 text-lg md:text-2xl font-light text-slate-600">
                     <p>An edge. A calling. A spark.</p>
                     <p>Our work is to bring yours to life through:</p>
                  </div>
                  <div className="mt-10 flex flex-wrap gap-4">
                     {['Trust', 'Skill', 'Heart'].map((word) => (
                        <span key={word} className="px-6 py-2 border border-[#dcb6a2] text-[#8c6745] rounded-full uppercase tracking-widest text-sm hover:bg-[#5d4037] hover:text-white transition-colors cursor-default">
                           {word}
                        </span>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* LAYER 3: THE CONTEXT & ECOSYSTEM */}
      <div ref={contextRef} className="relative z-10 bg-[#f9f5f0] w-full py-24 md:py-32">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
            <div className="w-full md:w-5/12 px-8 md:px-12 md:h-[80vh] md:sticky md:top-20 flex flex-col justify-start">
               <h2 className="text-4xl md:text-6xl font-serif text-[#5d4037] mb-6 leading-none">Why we <br/><span className="italic text-[#b86c45]">built this.</span></h2>
               <p className="text-slate-500 text-lg max-w-sm mb-12">A platform designed to change how labor is valued in the Philippines.</p>
               <div className="flex flex-col justify-center items-center md:items-start pl-2">
                   <div className="flex items-center gap-4 mb-2">
                      <div className="text-left"><h3 className="text-xl font-bold text-[#5d4037]">Skilled</h3><p className="text-sm text-slate-500 uppercase tracking-widest">Informal & Raw</p></div>
                   </div>
                   <div className="relative w-14 h-[400px] flex justify-center overflow-hidden my-2">
                      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 50 400" preserveAspectRatio="none"><path d="M 25 0 Q 55 100 25 200 T 25 400" fill="none" stroke="#dcb6a2" strokeWidth="4" strokeDasharray="8 8" className="opacity-50" /></svg>
                      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 50 400" preserveAspectRatio="none"><motion.path d="M 25 0 Q 55 100 25 200 T 25 400" fill="none" stroke="#b86c45" strokeWidth="4" strokeLinecap="round" style={{ pathLength }} /></svg>
                   </div>
                   <motion.div style={{ opacity: certifiedOpacity, scale: certifiedScale }} className="flex items-center gap-4 mt-2">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#b86c45] to-[#8f5231] text-white rounded-full flex items-center justify-center shadow-xl z-10"><span className="text-3xl">🏅</span></div>
                      <div className="text-left"><h3 className="text-2xl font-bold text-[#b86c45]">Certified</h3><p className="text-sm text-[#5d4037] font-semibold uppercase tracking-widest">Formal & Trusted</p></div>
                   </motion.div>
               </div>
            </div>
            <div className="w-full md:w-7/12 px-8 md:px-16 pt-12 md:pt-0">
               <ContextCard label="The Problem" title="Excellent skill, hidden by informality." icon="🏚️">
                  <p>In the Philippines, we have thousands of skilled 'handymen'—plumbers, electricians, technicians—who are excellent at what they do but lack formal employment or certifications (NCII).</p>
                  <p>Because they work informally, they struggle to build a verifiable career, and customers struggle to trust them.</p>
               </ContextCard>
               <ContextCard label="The Solution" title="Bridging the Gap." icon="🌉">
                  <p><strong>FixMe</strong> is not just an ‘Grab for Repairs'; it is a Professional Development & Dispatch Platform.</p>
                  <p>We built this system to bridge the gap between the informal gig economy and formal agency employment, giving value to every job done.</p>
               </ContextCard>
               <ContextCard label="Core Objective: Client" title="Safe, Trackable, & Trusted." icon="🛡️">
                  <p>We provide a safe way to find local help using <strong>Geolocation</strong> and <strong>Real-time Communication</strong>.</p>
                  <ul className="list-disc pl-5 space-y-2 opacity-80">
                      <li>See who is coming to your home.</li>
                      <li>Track their arrival in real-time.</li>
                      <li>Pay securely and rate honestly.</li>
                  </ul>
               </ContextCard>
               <ContextCard label="Core Objective: Worker" title="Gigs into a Digital Resume." icon="👷">
                  <p>Every booking accepted and completed on our platform becomes a verified record of reliability and skill.</p>
                  <p className="p-4 bg-white rounded-xl shadow-sm border border-[#dcb6a2]/20 italic text-[#5d4037]">"This data can eventually be used to secure TESDA/NCII certifications or formal agency contracts."</p>
               </ContextCard>
               <div className="h-32"></div>
            </div>
         </div>
      </div>

      {/* --- CONTACT SECTION (Remains exactly the same) --- */}
      <div className="h-screen w-full bg-[#faf9f6] flex flex-col md:flex-row relative overflow-hidden z-10">
        <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-[#dcb6a2] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[0%] w-[500px] h-[500px] bg-[#a57c52] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
        <div className="bg-gradient-to-br from-[#8c6745] to-[#5d4037] p-12 md:w-2/5 h-full text-white flex flex-col justify-center relative z-10">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"><svg width="100%" height="100%"><pattern id="pattern-circles" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="currentColor" /></pattern><rect width="100%" height="100%" fill="url(#pattern-circles)" /></svg></div>
          <div className="relative z-10 max-w-md mx-auto w-full">
            <h2 className="text-5xl font-bold mb-6 tracking-tight">Let's Connect</h2>
            <p className="text-white/80 mb-12 font-light text-lg leading-relaxed">Ready to get things fixed? Reach out to our community of skilled workers.</p>
            {/* ...icons... */}
          </div>
        </div>
        <div className="p-10 md:p-24 md:w-3/5 h-full bg-white flex flex-col justify-center relative z-10">
          <div className="max-w-xl mx-auto w-full">
            <h3 className="text-4xl font-bold text-[#5d4037] mb-3">Send us a message</h3>
            <p className="text-gray-500 mb-10 text-lg">We usually reply within 24 hours.</p>
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <input type="text" className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 focus:border-[#a57c52] focus:bg-white focus:ring-4 focus:ring-[#a57c52]/10 outline-none" placeholder="First Name" />
                <input type="text" className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 focus:border-[#a57c52] focus:bg-white focus:ring-4 focus:ring-[#a57c52]/10 outline-none" placeholder="Last Name" />
              </div>
              <input type="email" className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 focus:border-[#a57c52] focus:bg-white focus:ring-4 focus:ring-[#a57c52]/10 outline-none" placeholder="Email Address" />
              <textarea rows="4" className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 focus:border-[#a57c52] focus:bg-white focus:ring-4 focus:ring-[#a57c52]/10 outline-none" placeholder="Message"></textarea>
              <button className="w-full bg-gradient-to-r from-[#a57c52] to-[#8c6745] text-white font-bold py-5 rounded-lg shadow-lg">Send Message</button>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
}