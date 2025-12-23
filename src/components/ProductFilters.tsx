import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, ArrowUpDown, Sparkles } from "lucide-react";

interface ProductFiltersProps {
  minPrice: number;
  maxPrice: number;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const sortOptions = [
  { value: "newest", label: "Newest First", icon: "✨" },
  { value: "oldest", label: "Oldest First", icon: "📜" },
  { value: "price-low", label: "Price: Low to High", icon: "↑" },
  { value: "price-high", label: "Price: High to Low", icon: "↓" },
  { value: "name-asc", label: "Name: A to Z", icon: "🔤" },
  { value: "name-desc", label: "Name: Z to A", icon: "🔠" },
];

const ProductFilters = ({
  minPrice,
  maxPrice,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange,
}: ProductFiltersProps) => {
  const [localRange, setLocalRange] = useState<[number, number]>(priceRange);

  useEffect(() => {
    setLocalRange(priceRange);
  }, [priceRange]);

  const handleSliderChange = (values: number[]) => {
    setLocalRange([values[0], values[1]]);
  };

  const handleSliderCommit = (values: number[]) => {
    onPriceRangeChange([values[0], values[1]]);
  };

  const isFiltered = localRange[0] > minPrice || localRange[1] < maxPrice;

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-center">
      {/* Price Range Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group"
      >
        {/* Subtle glow on interaction */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-terracotta/10 to-amber/10 rounded-xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500" />
        
        <div className="relative flex items-center gap-4 bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl px-4 py-3 min-w-[320px] hover:border-primary/30 transition-all duration-300">
          {/* Icon container */}
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-terracotta/10 border border-primary/10">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
          </div>
          
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                Price Range
              </span>
              <motion.span 
                key={`${localRange[0]}-${localRange[1]}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-sm font-semibold tabular-nums ${isFiltered ? 'text-primary' : 'text-foreground'}`}
              >
                ₹{localRange[0].toLocaleString()} – ₹{localRange[1].toLocaleString()}
              </motion.span>
            </div>
            
            <div className="relative pt-1">
              <Slider
                value={localRange}
                min={minPrice}
                max={maxPrice}
                step={100}
                onValueChange={handleSliderChange}
                onValueCommit={handleSliderCommit}
                className="w-full"
              />
              {/* Price labels below slider */}
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-muted-foreground/70">₹{minPrice.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground/70">₹{maxPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {/* Active filter indicator */}
          {isFiltered && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"
            />
          )}
        </div>
      </motion.div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-10 bg-gradient-to-b from-transparent via-border to-transparent" />

      {/* Sort Dropdown */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-amber/10 via-primary/10 to-terracotta/10 rounded-xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500" />
        
        <div className="relative flex items-center gap-3 bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl hover:border-primary/30 transition-all duration-300 overflow-hidden">
          {/* Icon container */}
          <div className="flex items-center justify-center w-9 h-9 ml-1 rounded-lg bg-gradient-to-br from-amber/10 to-primary/10 border border-amber/10">
            <ArrowUpDown className="h-4 w-4 text-amber" />
          </div>
          
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[170px] h-11 text-sm border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 pr-4">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground mr-1">Sort:</span>
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent 
              className="bg-card/95 backdrop-blur-lg border-border/60 shadow-elevated rounded-xl overflow-hidden"
              align="end"
            >
              <div className="px-2 py-1.5 border-b border-border/40 mb-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Sort Options
                </span>
              </div>
              {sortOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="rounded-lg mx-1 my-0.5 cursor-pointer transition-colors data-[highlighted]:bg-primary/10 data-[state=checked]:bg-primary/15 data-[state=checked]:text-primary"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm opacity-70">{option.icon}</span>
                    <span>{option.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductFilters;