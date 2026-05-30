import {
    AirVent,
    BookOpen,
    Camera,
    Monitor,
    PaintBucket,
    Printer,
    Smartphone,
} from "lucide-react";

const ICON_MAP = {
    AirVent,
    Printer,
    BookOpen,
    PaintBucket,
    Smartphone,
    Monitor,
    Camera,
};

export const getServiceIcon = (iconKey, size = 32) => {
    const Icon = ICON_MAP[iconKey] || Monitor;
    return <Icon size={size} className="text-white" />;
};

export const SERVICE_ICON_OPTIONS = Object.keys(ICON_MAP);
