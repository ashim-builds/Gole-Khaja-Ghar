import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  name: string;
  slug: string;
  imageColor: string;
  itemCount: number;
}

export default function CategoryCard({ name, slug, imageColor, itemCount }: CategoryCardProps) {
  return (
    <a 
      href={`#category-${slug}`}
      className="group relative flex flex-col justify-end overflow-hidden rounded-2xl h-64 sm:h-80 w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
    >
      {/* Colored background */}
      <div className={`absolute inset-0 ${imageColor} opacity-90 transition-opacity duration-300 group-hover:opacity-100`}></div>
      
      {/* Pattern overlay for texture */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent mix-blend-overlay"></div>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

      {/* Content */}
      <div className="relative p-6 flex flex-col justify-end h-full">
        <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-accent transition-colors">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-white/80 text-sm font-medium">{itemCount} Items</p>
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </a>
  );
}
