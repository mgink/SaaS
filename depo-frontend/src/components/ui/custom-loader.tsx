import { cn } from "@/lib/utils";
import { Package2 } from "lucide-react";

interface LoaderProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

export function CustomLoader({ className, size = "md" }: LoaderProps) {

    // Boyut Ayarları
    const sizeClasses = {
        sm: "h-5 w-5",   // Buton içi
        md: "h-8 w-8",   // Kart içi
        lg: "h-12 w-12", // Bölüm yükleme
        xl: "h-16 w-16"  // Tam ekran
    };

    const iconSizes = {
        sm: 12,
        md: 18,
        lg: 24,
        xl: 32
    };

    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            {/* Dönen Dış Halka */}
            <div
                className={cn(
                    "animate-spin rounded-full border-2 border-t-transparent border-blue-600 opacity-80",
                    sizeClasses[size]
                )}
            />

            {/* Ortadaki Sabit Kutu İkonu */}
            <div className="absolute inset-0 flex items-center justify-center">
                <Package2
                    size={iconSizes[size]}
                    className="text-blue-600 animate-pulse"
                    strokeWidth={2.5}
                />
            </div>
        </div>
    );
}