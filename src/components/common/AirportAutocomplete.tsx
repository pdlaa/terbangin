'use client';

import { useState, useRef, useEffect } from 'react';

interface Airport {
    id: string;
    iataCode: string;
    name: string;
    city: string;
    country: string;
    imageUrl: string | null;
}

interface AirportAutocompleteProps {
    label: string;
    placeholder: string;
    icon: React.ReactNode;
    iconColor: string;
    focusColor: string;
    value: string;
    onChange: (airport: Airport | null) => void;
    exclude?: string;
}

export default function AirportAutocomplete({
    label,
    placeholder,
    icon,
    iconColor,
    focusColor,
    value,
    onChange,
    exclude,
}: AirportAutocompleteProps) {
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState<Airport[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Airport | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (selected) {
            setQuery(`${selected.city} (${selected.iataCode})`);
        }
    }, [selected]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        setSelected(null);
        onChange(null);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (val.trim().length < 1) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/airports/search?q=${encodeURIComponent(val)}`);
                const data = await res.json();
                let filtered = data.airports || [];
                if (exclude) {
                    filtered = filtered.filter((a: Airport) => a.iataCode !== exclude);
                }
                setResults(filtered);
                setIsOpen(filtered.length > 0);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    };

    const handleSelect = (airport: Airport) => {
        setSelected(airport);
        onChange(airport);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wider">{label}</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: iconColor }}>
                    {icon}
                </span>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                    className={`w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:${focusColor}/30 focus:border-${focusColor} transition-all text-sm`}
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-sky border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full glass-card rounded-2xl border border-white/60 shadow-glass-hover overflow-hidden animate-fade-in-down">
                    {results.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-foreground/50 text-center">
                            {loading ? 'Mencari...' : 'Bandara tidak ditemukan'}
                        </div>
                    ) : (
                        <ul className="max-h-60 overflow-y-auto divide-y divide-white/20">
                            {results.map((airport) => (
                                <li
                                    key={airport.id}
                                    onClick={() => handleSelect(airport)}
                                    className="px-4 py-3 hover:bg-white/40 cursor-pointer transition-colors flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky/20 to-cyan/20 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold text-sky">{airport.iataCode}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm truncate">{airport.city}</div>
                                        <div className="text-xs text-foreground/50 truncate">
                                            {airport.name} — {airport.country}
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-sky bg-sky/10 px-2 py-1 rounded-lg">
                                        {airport.iataCode}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}