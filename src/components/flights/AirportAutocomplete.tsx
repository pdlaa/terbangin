'use client';

import { useState, useEffect, useRef } from 'react';

interface Airport {
  iataCode: string;
  city: string;
  name: string;
  country: string;
}

interface AirportAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  excludeCode?: string;
}

const POPULAR_AIRPORTS: Airport[] = [
  { iataCode: 'CGK', city: 'Jakarta', name: 'Soekarno-Hatta', country: 'Indonesia' },
  { iataCode: 'DPS', city: 'Bali', name: 'Ngurah Rai', country: 'Indonesia' },
  { iataCode: 'SUB', city: 'Surabaya', name: 'Juanda', country: 'Indonesia' },
  { iataCode: 'UPG', city: 'Makassar', name: 'Sultan Hasanuddin', country: 'Indonesia' },
  { iataCode: 'MES', city: 'Medan', name: 'Kualanamu', country: 'Indonesia' },
  { iataCode: 'BTH', city: 'Batam', name: 'Hang Nadim', country: 'Indonesia' },
  { iataCode: 'PDG', city: 'Padang', name: 'Minangkabau', country: 'Indonesia' },
  { iataCode: 'PLM', city: 'Palembang', name: 'Sultan Mahmud Badaruddin II', country: 'Indonesia' },
  { iataCode: 'BDO', city: 'Bandung', name: 'Husein Sastranegara', country: 'Indonesia' },
  { iataCode: 'SRG', city: 'Semarang', name: 'Ahmad Yani', country: 'Indonesia' },
  { iataCode: 'JOG', city: 'Yogyakarta', name: 'Adisutcipto', country: 'Indonesia' },
  { iataCode: 'SIN', city: 'Singapore', name: 'Changi', country: 'Singapore' },
  { iataCode: 'KUL', city: 'Kuala Lumpur', name: 'KLIA', country: 'Malaysia' },
  { iataCode: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi', country: 'Thailand' },
  { iataCode: 'HKG', city: 'Hong Kong', name: 'Hong Kong Intl', country: 'Hong Kong' },
  { iataCode: 'NRT', city: 'Tokyo', name: 'Narita', country: 'Japan' },
  { iataCode: 'ICN', city: 'Seoul', name: 'Incheon', country: 'South Korea' },
  { iataCode: 'PVG', city: 'Shanghai', name: 'Pudong', country: 'China' },
  { iataCode: 'MEL', city: 'Melbourne', name: 'Tullamarine', country: 'Australia' },
  { iataCode: 'SYD', city: 'Sydney', name: 'Kingsford Smith', country: 'Australia' },
];

export default function AirportAutocomplete({
  label,
  value,
  onChange,
  placeholder,
  icon,
  excludeCode,
}: AirportAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredAirports, setFilteredAirports] = useState<Airport[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const airport = POPULAR_AIRPORTS.find(a => a.iataCode === value);
      if (airport) {
        setInputValue(`${airport.city} (${airport.iataCode})`);
      }
    } else {
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    if (!inputValue) {
      setFilteredAirports(POPULAR_AIRPORTS.filter(a => a.iataCode !== excludeCode));
      return;
    }

    const search = inputValue.toLowerCase();
    const filtered = POPULAR_AIRPORTS.filter(airport => {
      if (airport.iataCode === excludeCode) return false;
      return (
        airport.iataCode.toLowerCase().includes(search) ||
        airport.city.toLowerCase().includes(search) ||
        airport.name.toLowerCase().includes(search) ||
        airport.country.toLowerCase().includes(search)
      );
    });
    setFilteredAirports(filtered);
  }, [inputValue, excludeCode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (airport: Airport) => {
    onChange(airport.iataCode);
    setInputValue(`${airport.city} (${airport.iataCode})`);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredAirports.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredAirports[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-foreground/70">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sky">
          {icon}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky transition-all"
        />
      </div>

      {isOpen && filteredAirports.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-white/60 rounded-2xl shadow-glass-hover max-h-64 overflow-y-auto">
          {filteredAirports.map((airport, index) => (
            <button
              key={airport.iataCode}
              type="button"
              onClick={() => handleSelect(airport)}
              className={`w-full px-4 py-3 text-left hover:bg-sky/10 transition-colors flex items-center gap-3 ${
                index === selectedIndex ? 'bg-sky/10' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky/20 to-cyan/20 flex items-center justify-center text-sky font-bold text-sm">
                {airport.iataCode}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground text-sm">
                  {airport.city}
                </div>
                <div className="text-xs text-foreground/60">
                  {airport.name} • {airport.country}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && inputValue && filteredAirports.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-white/60 rounded-2xl shadow-glass-hover p-4 text-center">
          <div className="text-foreground/60 text-sm">Bandara tidak ditemukan</div>
        </div>
      )}
    </div>
  );
}