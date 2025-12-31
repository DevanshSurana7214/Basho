import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";

export function WishlistNavButton() {
  const { itemCount } = useWishlist();

  return (
    <Link to="/wishlist">
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full hover:bg-muted transition-all duration-300"
      >
        <Heart className="h-4 w-4" />
        {itemCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center"
          >
            {itemCount > 9 ? "9+" : itemCount}
          </motion.span>
        )}
      </Button>
    </Link>
  );
}
