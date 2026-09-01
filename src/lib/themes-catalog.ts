export interface ThemeItem {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: "popular" | "latest" | "block" | "favorites";
  tags: string[];
  hasUpdate?: boolean;
  updateVersion?: string;
  previewImage: string;
  headlineText?: string;
}

const IMAGES = [
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
];

const BASE_NAMES = [
  "Twenty Twenty-Four", "Twenty Twenty-Five", "Hello Elementor", "Astra", "Kadence",
  "Twenty Twenty-Three", "OceanWP", "Neve", "GeneratePress", "Blocksy",
  "Frost", "Ollie", "Storefront", "Divi Starter", "Hestia",
  "ColorMag", "PopularFX", "Sydney", "Inspiro", "Shapely",
  "Customify", "Phlox", "OnePress", "Hueman", "Colibri WP",
  "Virtue", "Allegiant", "Vantage", "Mesmerize", "Zakra",
  "Customizr", "Royal Kit", "Popular News", "Newspaper Lite", "News Portal",
  "Online Paper", "Clean Magazine", "Minimalist Blog", "Writing Blog", "Foodie Blog",
  "Travel Minimal", "Fashionista", "Lifestyle Pro", "Corporate Business", "Tech Startups",
  "SaaS Modern", "App Landing", "Software Showcase", "Digital Agency", "Creative Studio",
  "Studio Dark", "Architecture Minimal", "Interior Design", "Construction Pro", "Real Estate One",
  "Property Showcase", "E-commerce Mart", "SuperMarket Lite", "MegaShop", "Fashion Store",
  "Digital Mart", "Electronics Hub", "Organic Food Store", "Fitness Gym", "Yoga Studio",
  "Medical Health", "Dental Care", "Clinic Pro", "Education Academy", "School Lite",
  "University Hub", "Online Course", "LMS Minimal", "Restaurant Bistro", "Cafe Coffee",
  "Food Delivery", "Bakery Sweet", "Hotel Resort", "Travel Agency", "Tour Operator",
  "Event Conference", "Wedding Day", "Photography Studio", "Video Producer", "Music Band",
  "Podcast Showcase", "Gaming Clan", "Esports Arena", "Automotive Repair", "Car Rental",
  "Logistics Express", "Finance Advisory", "Law Firm Pro", "Consulting Group", "NonProfit Charity",
  "Church Community", "Environmental Green", "Energy Solar", "AI Tech Startup", "Crypto Web3",
  "Cyber Security", "SaaS Automation", "Social Poster Pro", "Twenty Twenty-Two"
];

const AUTHORS = [
  "the WordPress team", "Elementor Team", "Brainstorm Force", "Kadence WP",
  "ThemeIsle", "OceanWP Team", "Tom Usborne", "CreativeThemes", "Automattic",
  "AThemes", "Colorlib", "ArtisticWP", "SiteOrigin", "FastPress", "CodeinWP"
];

export const FULL_THEMES_CATALOG: ThemeItem[] = BASE_NAMES.map((name, i) => {
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const category: ThemeItem["category"] = i % 4 === 0 ? "block" : i % 3 === 0 ? "latest" : i % 5 === 0 ? "favorites" : "popular";
  const image = IMAGES[i % IMAGES.length];
  const author = AUTHORS[i % AUTHORS.length];

  return {
    id,
    name,
    version: `${(i % 5) + 1}.${i % 9}.${i % 3}`,
    author,
    category,
    description: `${name} is a high performance, fully customizable WordPress theme designed for high speed publishing, modern layouts, and responsive block editing.`,
    tags: ["Full Site Editing", "Custom Colors", "Responsive", "Fast Loading", "Block Editor Patterns"],
    hasUpdate: i === 0,
    updateVersion: i === 0 ? "1.6" : undefined,
    previewImage: image,
    headlineText: i === 0 ? "A commitment to innovation and sustainability" : `${name} — Premium Modern Layout`,
  };
});
