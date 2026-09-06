import { useRef, useState } from "react";

const categories = [
  { name: "Khaja Sets", icon: "/images/snack_bowl.jpg" },
  { name: "Momo", icon: "/images/snack_bowl.jpg" },
  { name: "Chowmein", icon: "/images/snack_bowl.jpg" },
  { name: "Sekuwa", icon: "/images/snack_bowl.jpg" },
  { name: "Beverages", icon: "/images/snack_bowl.jpg" },
];

export default function CategorySlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    
    // Maximum possible scroll left
    const maxScrollLeft = scrollWidth - clientWidth;
    
    if (maxScrollLeft <= 0) {
      setActiveIndex(0);
      return;
    }
    
    const progress = scrollLeft / maxScrollLeft;
    
    // We have 3 dots, so 3 segments: 0-0.33, 0.33-0.66, 0.66-1.0
    if (progress < 0.33) {
      setActiveIndex(0);
    } else if (progress < 0.66) {
      setActiveIndex(1);
    } else {
      setActiveIndex(2);
    }
  };

  return (
    <>
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex justify-start md:justify-center gap-6 md:gap-24 overflow-x-auto pb-4 pt-4 px-4 md:px-0 hide-scrollbar snap-x snap-mandatory" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((cat) => (
          <div key={cat.name} className="flex flex-col items-center gap-3 min-w-[72px] md:min-w-[80px] cursor-pointer group flex-shrink-0 snap-start">
            <div className="w-[72px] h-[72px] md:w-[100px] md:h-[100px] rounded-full bg-[#f8f8f8] flex items-center justify-center overflow-hidden shadow-sm border border-stone-100 group-hover:border-primary transition-colors p-2 md:p-3">
               <div className="relative w-full h-full rounded-full overflow-hidden">
                 <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" />
               </div>
            </div>
            <span className="text-xs md:text-[15px] font-bold text-stone-800">{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Mobile Carousel Indicators */}
      <div className="flex justify-center items-center gap-1.5 mb-8 md:hidden mt-2">
        <div className={`rounded-full transition-all duration-300 ${activeIndex === 0 ? "w-5 h-1 bg-black" : "w-1.5 h-1.5 bg-stone-300"}`}></div>
        <div className={`rounded-full transition-all duration-300 ${activeIndex === 1 ? "w-5 h-1 bg-black" : "w-1.5 h-1.5 bg-stone-300"}`}></div>
        <div className={`rounded-full transition-all duration-300 ${activeIndex === 2 ? "w-5 h-1 bg-black" : "w-1.5 h-1.5 bg-stone-300"}`}></div>
      </div>
    </>
  );
}
