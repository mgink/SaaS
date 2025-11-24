import { CustomLoader } from "@/components/ui/custom-loader";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md">
            {/* Logo ve Loader */}
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                <div className="p-6 bg-white rounded-2xl shadow-xl border border-slate-100">
                    <CustomLoader size="xl" />
                </div>
                <p className="text-sm font-medium text-slate-500 animate-pulse">Depo Hazırlanıyor...</p>
            </div>
        </div>
    );
}