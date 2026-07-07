'use client';

export interface PassengerFormData {
    fullName: string;
    gender: 'male' | 'female' | '';
    birthDate: string;
    passportNumber: string;
}

interface PassengerFormProps {
    index: number;
    data: PassengerFormData;
    seatNumber?: string;
    errors?: Partial<Record<keyof PassengerFormData, string>>;
    onChange: (index: number, field: keyof PassengerFormData, value: string) => void;
}

export default function PassengerForm({ index, data, seatNumber, errors, onChange }: PassengerFormProps) {
    const inputClass =
        'w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky/30';

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Penumpang {index + 1}</h3>
                {seatNumber && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky/10 text-sky">
                        Kursi {seatNumber}
                    </span>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">Nama Lengkap</label>
                    <input
                        type="text"
                        value={data.fullName}
                        onChange={(e) => onChange(index, 'fullName', e.target.value)}
                        placeholder="Sesuai KTP/Paspor"
                        className={inputClass}
                        required
                    />
                    {errors?.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Jenis Kelamin</label>
                        <select
                            value={data.gender}
                            onChange={(e) => onChange(index, 'gender', e.target.value)}
                            className={inputClass}
                            required
                        >
                            <option value="">Pilih</option>
                            <option value="male">Laki-laki</option>
                            <option value="female">Perempuan</option>
                        </select>
                        {errors?.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Tanggal Lahir</label>
                        <input
                            type="date"
                            value={data.birthDate}
                            onChange={(e) => onChange(index, 'birthDate', e.target.value)}
                            className={inputClass}
                            max={new Date().toISOString().split('T')[0]}
                            required
                        />
                        {errors?.birthDate && <p className="text-xs text-red-500 mt-1">{errors.birthDate}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">Nomor KTP/Paspor</label>
                    <input
                        type="text"
                        value={data.passportNumber}
                        onChange={(e) => onChange(index, 'passportNumber', e.target.value.toUpperCase())}
                        placeholder="Contoh: C1234567 atau NIK"
                        className={inputClass}
                        required
                    />
                    {errors?.passportNumber && (
                        <p className="text-xs text-red-500 mt-1">{errors.passportNumber}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
