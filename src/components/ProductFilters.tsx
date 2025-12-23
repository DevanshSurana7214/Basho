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
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
      {/* Price Range Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group"
      >
        <div className="relative flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border/60 rounded px-2 py-1.5 min-w-[200px] hover:border-primary/30 transition-all duration-300">
          <SlidersHorizontal className="h-3 w-3 text-primary flex-shrink-0" />
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium tracking-wide uppercase text-muted-foreground">
                Price
              </span>
              <motion.span 
                key={`${localRange[0]}-${localRange[1]}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-[10px] font-semibold tabular-nums ${isFiltered ? 'text-primary' : 'text-foreground'}`}
              >
                ₹{localRange[0].toLocaleString()} – ₹{localRange[1].toLocaleString()}
              </motion.span>
            </div>
            
            <Slider
              value={localRange}
              min={minPrice}
              max={maxPrice}
              step={100}
              onValueChange={handleSliderChange}
              onValueCommit={handleSliderCommit}
              className="w-full"
            />
          </div>
          
          {isFiltered && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full"
            />
          )}
        </div>
      </motion.div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-5 bg-border/60" />

      {/* Sort Dropdown */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative group"
      >
        <div className="relative flex items-center gap-1.5 bg-card/80 backdrop-blur-sm border border-border/60 rounded hover:border-primary/30 transition-all duration-300">
          <ArrowUpDown className="h-3 w-3 text-amber ml-2 flex-shrink-0" />
          
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[110px] h-6 text-[10px] border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 pr-2 pl-0">
              <div className="flex items-center gap-1">
                <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Sort:</span>
                <SelectValue placeholder="Sort" />
              </div>
            </SelectTrigger>
            <SelectContent 
              className="bg-card/95 backdrop-blur-lg border-border/60 shadow-elevated rounded overflow-hidden min-w-[140px]"
              align="end"
            >
              {sortOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="cursor-pointer text-[11px] py-1.5 transition-colors data-[highlighted]:bg-primary/10 data-[state=checked]:bg-primary/15 data-[state=checked]:text-primary"
                >
                  <span className="flex items-center gap-1">
                    <span className="text-[10px] opacity-70">{option.icon}</span>
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