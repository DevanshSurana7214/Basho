// Centralized mapping for product name -> bundled asset image.
// This avoids duplicating the same imports across multiple pages/components.

import cuppedHandsSculpture from "@/assets/products/cupped-hands-sculpture.jpg";
import earthToneServingPlates from "@/assets/products/earth-tone-serving-plates.jpg";
import organicEdgePlatters from "@/assets/products/organic-edge-platters.jpg";
import forestGreenTeaSet from "@/assets/products/forest-green-tea-set.jpg";
import minimalistCreamMugs from "@/assets/products/minimalist-cream-mugs.jpg";
import rusticDuoMugSet from "@/assets/products/rustic-duo-mug-set.jpg";
import indigoPlanters from "@/assets/products/indigo-planters.jpg";
import fortuneCookieKeepsakes from "@/assets/products/fortune-cookie-keepsakes.jpg";
import hexagonalPastelPlates from "@/assets/products/hexagonal-pastel-plates.jpg";
import songbirdTeaSet from "@/assets/products/songbird-tea-set.jpg";
import oceanPaletteBowls from "@/assets/products/ocean-palette-bowls.jpg";
import prayingHandsCollection from "@/assets/products/praying-hands-collection.jpg";
import terracottaFruitBowls from "@/assets/products/terracotta-fruit-bowls.jpg";
import birdLidStorageJars from "@/assets/products/bird-lid-storage-jars.jpg";
import turquoiseGeometricMugs from "@/assets/products/turquoise-geometric-mugs.jpg";
import oceanBlueMugs from "@/assets/products/ocean-blue-mugs.jpg";
import ceramicGraterPlates from "@/assets/products/ceramic-grater-plates.jpg";
import cloudServingPlatters from "@/assets/products/cloud-serving-platters.jpg";
import ribbedDualToneBowls from "@/assets/products/ribbed-dual-tone-bowls.jpg";
import meadowFlowerMugs from "@/assets/products/meadow-flower-mugs.jpg";

export const productImages: Record<string, string> = {
  "Cupped Hands Sculpture": cuppedHandsSculpture,
  "Earth Tone Serving Plates": earthToneServingPlates,
  "Organic Edge Platters": organicEdgePlatters,
  "Forest Green Tea Set": forestGreenTeaSet,
  "Minimalist Cream Mugs": minimalistCreamMugs,
  "Rustic Duo Mug Set": rusticDuoMugSet,
  "Indigo Planters": indigoPlanters,
  "Fortune Cookie Keepsakes": fortuneCookieKeepsakes,
  "Hexagonal Pastel Plates": hexagonalPastelPlates,
  "Songbird Tea Set": songbirdTeaSet,
  "Ocean Palette Bowls": oceanPaletteBowls,
  "Praying Hands Collection": prayingHandsCollection,
  "Terracotta Fruit Bowls": terracottaFruitBowls,
  "Bird Lid Storage Jars": birdLidStorageJars,
  "Turquoise Geometric Mugs": turquoiseGeometricMugs,
  "Ocean Blue Mugs": oceanBlueMugs,
  "Ceramic Grater Plates": ceramicGraterPlates,
  "Cloud Serving Platters": cloudServingPlatters,
  "Ribbed Dual-Tone Bowls": ribbedDualToneBowls,
  "Meadow Flower Mugs": meadowFlowerMugs,
};

export function resolveProductImageUrl(
  name: string,
  fallbackUrl: string | null | undefined
): string | null {
  return productImages[name] ?? fallbackUrl ?? null;
}
