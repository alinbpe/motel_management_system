import React from 'react';
import { 
    Home, Mountain, Bird, Flower, Cloud, Feather, TreePine, TreeDeciduous, Crown, Sun
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  "Mountain": Mountain,
  "Bird": Bird,
  "Flower": Flower,
  "Cloud": Cloud,
  "Feather": Feather,
  "TreePine": TreePine,
  "TreeDeciduous": TreeDeciduous,
  "Crown": Crown,
  "Sun": Sun,
  "Home": Home
};

interface CabinIconProps {
    iconName?: string;
    className?: string;
}

export const CabinIcon: React.FC<CabinIconProps> = ({ iconName, className }) => {
    // Default to 'Home' if iconName is undefined or not in the map
    const Icon = (iconName && ICON_MAP[iconName]) ? ICON_MAP[iconName] : Home;
    return <Icon className={className} />;
};