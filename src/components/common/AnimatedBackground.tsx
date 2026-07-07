export default function AnimatedBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gradient Orbs */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-cyan/30 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute top-40 right-20 w-96 h-96 bg-sky/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-warm/20 rounded-full blur-3xl animate-float-fast" />

            {/* Animated Clouds */}
            <div className="absolute top-32 -left-20 opacity-60 animate-cloud-drift">
                <Cloud size="large" />
            </div>
            <div className="absolute top-64 -left-40 opacity-40 animate-cloud-drift-slow" style={{ animationDelay: '20s' }}>
                <Cloud size="medium" />
            </div>
            <div className="absolute top-20 -left-60 opacity-50 animate-cloud-drift" style={{ animationDelay: '40s' }}>
                <Cloud size="small" />
            </div>

            {/* Flying Plane */}
            <div className="absolute top-1/3 animate-plane-fly">
                <Plane />
            </div>
        </div>
    );
}

function Cloud({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
    const sizes = {
        small: 'w-32 h-16',
        medium: 'w-48 h-24',
        large: 'w-64 h-32',
    };

    return (
        <svg className={`${sizes[size]} text-white`} viewBox="0 0 200 100" fill="currentColor">
            <path d="M20,70 Q20,50 40,50 Q40,30 60,30 Q80,30 80,50 Q100,50 100,70 Z" />
            <path d="M60,70 Q60,50 80,50 Q80,30 100,30 Q120,30 120,50 Q140,50 140,70 Z" />
            <path d="M100,70 Q100,55 115,55 Q115,40 130,40 Q145,40 145,55 Q160,55 160,70 Z" />
        </svg>
    );
}

function Plane() {
    return (
        <svg className="w-16 h-16 text-sky drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
    );
}