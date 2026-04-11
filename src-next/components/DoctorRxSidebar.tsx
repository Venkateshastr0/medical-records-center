import { useState, useEffect } from 'react'

interface Patient {
    id: string
    patient_id?: string
    first_name: string
    last_name: string
    phone: string
    date_of_birth: string
    context?: string // For displaying queue matched context
}

interface Medication {
    medication_name: string
    dosage: string
    quantity: string
    frequency: string
    route: string
    duration: string
    instructions: string
}

type MedicationType = 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'INHALER' | 'UNKNOWN'
type FrequencyMode = 'time-based' | 'interval-based'

interface MedicationMetadata {
    type: MedicationType
    defaultRoute: string
    supportsIntervalFrequency: boolean
}

interface DoctorRxSidebarProps {
    onClose: () => void
    doctorId: string
    initialPatient?: Patient | null
    onPrescriptionTransmitted?: () => void // Callback to refresh queue
}

const DEFAULT_MEDICATION: Medication = {
    medication_name: '',
    dosage: '',
    quantity: '',
    frequency: '',
    instructions: '',
    duration: '7 Days',
    route: 'Oral'
}

export default function DoctorRxSidebar({ onClose, doctorId, initialPatient = null, onPrescriptionTransmitted }: DoctorRxSidebarProps) {
    const [search, setSearch] = useState('')
    const [patients, setPatients] = useState<Patient[]>([])
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialPatient)
    
    const [medications, setMedications] = useState<Medication[]>([{ ...DEFAULT_MEDICATION }])
    const [activeMedDropdown, setActiveMedDropdown] = useState<number | null>(null)
    
    const [quantityEdited, setQuantityEdited] = useState<boolean[]>([false])
    const [frequencyEdited, setFrequencyEdited] = useState<boolean[]>([false])
    const [durationEdited, setDurationEdited] = useState<boolean[]>([false])
    const [medicationTypes, setMedicationTypes] = useState<MedicationType[]>(['TABLET'] as MedicationType[])
    const [frequencyModes, setFrequencyModes] = useState<FrequencyMode[]>(['time-based'])
    const [intervalHours, setIntervalHours] = useState<string[]>([''])
    
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const commonMedications = [
        'Amoxicillin 500mg', 'Lisinopril 10mg', 'Metformin 500mg', 'Atorvastatin 20mg',
        'Amlodipine 5mg', 'Metoprolol 25mg', 'Omeprazole 20mg', 'Losartan 50mg',
        'Gabapentin 300mg', 'Sertraline 50mg', 'Azithromycin 250mg', 'Ibuprofen 400mg',
        'Hydrochlorothiazide 25mg', 'Albuterol 90mcg Inhaler', 'Levothyroxine 50mcg',
        'Pantoprazole 40mg', 'Citalopram 20mg', 'Trazodone 50mg', 'Montelukast 10mg',
        'Fluticasone 50mcg', 'Amoxicillin/Clavulanate 875mg/125mg', 'Meloxicam 15mg',
        'Insulin 100U/mL', 'Morphine 10mg/mL', 'Fentanyl 25mcg/hour', 'Heparin 5000U'
    ].sort()

    const medicationMetadata: Record<string, MedicationMetadata> = {
        'amoxicillin': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'lisinopril': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'metformin': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'atorvastatin': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'amlodipine': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'metoprolol': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'omeprazole': { type: 'CAPSULE', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'losartan': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'gabapentin': { type: 'CAPSULE', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'sertraline': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'azithromycin': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'ibuprofen': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'hydrochlorothiazide': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'albuterol': { type: 'INHALER', defaultRoute: 'Inhaled', supportsIntervalFrequency: false },
        'levothyroxine': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'pantoprazole': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'citalopram': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'trazodone': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'montelukast': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'fluticasone': { type: 'INHALER', defaultRoute: 'Inhaled', supportsIntervalFrequency: false },
        'meloxicam': { type: 'TABLET', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'insulin': { type: 'INJECTION', defaultRoute: 'Injection', supportsIntervalFrequency: true },
        'morphine': { type: 'INJECTION', defaultRoute: 'Injection', supportsIntervalFrequency: true },
        'fentanyl': { type: 'INJECTION', defaultRoute: 'Injection', supportsIntervalFrequency: true },
        'heparin': { type: 'INJECTION', defaultRoute: 'Injection', supportsIntervalFrequency: true },
        'syrup': { type: 'SYRUP', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'liquid': { type: 'SYRUP', defaultRoute: 'Oral', supportsIntervalFrequency: false },
        'solution': { type: 'SYRUP', defaultRoute: 'Oral', supportsIntervalFrequency: false }
    }

    const detectMedicationType = (medicationName: string): MedicationType => {
        const name = medicationName.toLowerCase()
        
        if (name.includes('syrup') || name.includes('liquid') || name.includes('solution')) {
            return 'SYRUP'
        }
        if (name.includes('inhaler') || name.includes('inhalation') || name.includes('puffer')) {
            return 'INHALER'
        }
        if (name.includes('injection') || name.includes('inject') || name.includes('iv') || name.includes('im') || name.includes('sc')) {
            return 'INJECTION'
        }
        if (name.includes('capsule') || name.includes('cap')) {
            return 'CAPSULE'
        }
        
        for (const [key, metadata] of Object.entries(medicationMetadata)) {
            if (name.includes(key)) {
                return metadata.type as MedicationType
            }
        }
        
        return 'TABLET'
    }

    const getDosesPerDay = (frequency: string, mode: FrequencyMode, intervalHour: string): number => {
        if (!frequency) return 0
        
        const timeOptions = ['Morning', 'Afternoon', 'Night']
        const selectedTimes = frequency.split(', ').filter(Boolean)
        
        if (mode === 'time-based') {
            return selectedTimes.length
        } else {
            const hours = parseInt(intervalHour)
            if (hours && hours > 0) {
                return Math.round(24 / hours)
            }
        }
        
        return 0
    }

    const parseDuration = (duration: string): number => {
        if (!duration) return 0
        
        const numericMatch = duration.match(/^(\d+)/)
        if (numericMatch) {
            const value = parseInt(numericMatch[1])
            const unit = duration.toLowerCase()
            
            if (unit.includes('week')) return value * 7
            if (unit.includes('month')) return value * 30
            if (unit.includes('year')) return value * 365
            return value
        }
        
        return 0
    }

    const calculateQuantity = (frequency: string, duration: string, mode: FrequencyMode, intervalHour: string): string => {
        const dosesPerDay = getDosesPerDay(frequency, mode, intervalHour)
        const durationDays = parseDuration(duration)
        
        if (dosesPerDay > 0 && durationDays > 0) {
            return (dosesPerDay * durationDays).toString()
        }
        
        return ''
    }

    const calculateDuration = (frequency: string, quantity: string, mode: FrequencyMode, intervalHour: string): string => {
        const dosesPerDay = getDosesPerDay(frequency, mode, intervalHour)
        const quantityNum = parseInt(quantity)
        
        if (dosesPerDay > 0 && quantityNum > 0) {
            const days = Math.round(quantityNum / dosesPerDay)
            return `${days} Days`
        }
        
        return ''
    }

    const normalizeDuration = (duration: string): string => {
        const numericMatch = duration.match(/^(\d+)$/)
        if (numericMatch) {
            return `${numericMatch[1]} Days`
        }
        return duration
    }

    useEffect(() => {
        if (search.length > 0) {
            const timer = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/patients/search?q=${search}&doctor_id=${doctorId}`)
                    const data = await res.json()
                    // If the user typed exactly a digit and the first result has 'context' (queue match),
                    // auto-select it if it's an exact match length-wise to prevent annoying auto-selects,
                    // but wait, standard search just shows the list. Let's let the user click it.
                    setPatients(data)
                } catch (e) {
                    console.error('Search error:', e)
                }
            }, 300)
            return () => clearTimeout(timer)
        } else {
            setPatients([])
        }
    }, [search, doctorId])

    // Automatic calculations and medication type detection
    useEffect(() => {
        const newMedicationTypes = medications.map(med => detectMedicationType(med.medication_name))
        setMedicationTypes(newMedicationTypes)
        
        // Auto-fill route based on medication
        const newMedications = medications.map((med, index) => {
            const medName = med.medication_name.toLowerCase()
            for (const [key, metadata] of Object.entries(medicationMetadata)) {
                if (medName.includes(key)) {
                    return { ...med, route: metadata.defaultRoute }
                }
            }
            return med
        })
        setMedications(newMedications)
    }, [medications.map(m => m.medication_name).join(',')])

    // Auto-switch frequency mode based on route
    useEffect(() => {
        const newFrequencyModes = medications.map(med => {
            if (med.route === 'Injection') {
                return 'interval-based' as FrequencyMode
            } else {
                return 'time-based' as FrequencyMode
            }
        })
        setFrequencyModes(newFrequencyModes)
    }, [medications.map(m => m.route).join(',')])

    // Bidirectional calculations
    useEffect(() => {
        const newMedications = [...medications]
        medications.forEach((med, index) => {
            if (frequencyEdited[index] && durationEdited[index] && !quantityEdited[index]) {
                const calculatedQuantity = calculateQuantity(med.frequency, med.duration, frequencyModes[index], intervalHours[index])
                if (calculatedQuantity && (medicationTypes[index] as MedicationType) !== 'SYRUP') {
                    newMedications[index] = { ...newMedications[index], quantity: calculatedQuantity }
                }
            }
        })
        setMedications(newMedications)
    }, [medications.map(m => `${m.frequency}-${m.duration}`).join(','), frequencyEdited, durationEdited])

    useEffect(() => {
        const newMedications = [...medications]
        medications.forEach((med, index) => {
            if (frequencyEdited[index] && quantityEdited[index] && !durationEdited[index]) {
                const calculatedDuration = calculateDuration(med.frequency, med.quantity, frequencyModes[index], intervalHours[index])
                if (calculatedDuration) {
                    newMedications[index] = { ...newMedications[index], duration: calculatedDuration }
                }
            }
        })
        setMedications(newMedications)
    }, [medications.map(m => `${m.frequency}-${m.quantity}`).join(','), frequencyEdited, quantityEdited])

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
        const newMeds = [...medications];
        newMeds[index][field] = value;
        
        // Update tracking flags to prevent infinite loops
        if (field === 'quantity') {
            const newQuantityEdited = [...quantityEdited]
            newQuantityEdited[index] = true
            setQuantityEdited(newQuantityEdited)
            const newFrequencyEdited = [...frequencyEdited]
            newFrequencyEdited[index] = false
            setFrequencyEdited(newFrequencyEdited)
            const newDurationEdited = [...durationEdited]
            newDurationEdited[index] = false
            setDurationEdited(newDurationEdited)
        } else if (field === 'frequency') {
            const newFrequencyEdited = [...frequencyEdited]
            newFrequencyEdited[index] = true
            setFrequencyEdited(newFrequencyEdited)
            const newQuantityEdited = [...quantityEdited]
            newQuantityEdited[index] = false
            setQuantityEdited(newQuantityEdited)
            const newDurationEdited = [...durationEdited]
            newDurationEdited[index] = false
            setDurationEdited(newDurationEdited)
        } else if (field === 'duration') {
            const normalizedDuration = normalizeDuration(value)
            newMeds[index].duration = normalizedDuration
            const newDurationEdited = [...durationEdited]
            newDurationEdited[index] = true
            setDurationEdited(newDurationEdited)
            const newFrequencyEdited = [...frequencyEdited]
            newFrequencyEdited[index] = false
            setFrequencyEdited(newFrequencyEdited)
            const newQuantityEdited = [...quantityEdited]
            newQuantityEdited[index] = false
            setQuantityEdited(newQuantityEdited)
        } else if (field === 'route') {
            // Clear frequency when route changes
            newMeds[index].frequency = ''
        }
        
        setMedications(newMeds);
    }

    const handleIntervalHoursChange = (index: number, value: string) => {
        const newIntervalHours = [...intervalHours]
        newIntervalHours[index] = value
        setIntervalHours(newIntervalHours)
        
        const hours = parseInt(value)
        if (hours && hours > 0) {
            const frequencyText = `Every ${hours} hours`
            updateMedication(index, 'frequency', frequencyText)
        }
    }

    const addMedication = () => {
        setMedications([...medications, { ...DEFAULT_MEDICATION }])
    }

    const removeMedication = (index: number) => {
        if (medications.length > 1) {
            setMedications(medications.filter((_, i) => i !== index))
            setActiveMedDropdown(null)
        }
    }

    const timeOptions = ['Morning', 'Afternoon', 'Night']
    const frequencyAbbreviations = { Morning: 'M', Afternoon: 'A', Night: 'N' }
    
    const convertFrequencyToAbbrev = (freqString: string): string => {
        if (!freqString) return '';
        const times = freqString.split(', ').filter(Boolean);
        const abbrevs = times.map((t: string) => frequencyAbbreviations[t as keyof typeof frequencyAbbreviations] || t);
        return abbrevs.join('/');
    }
    
    const handleTimeToggle = (medIndex: number, time: string) => {
        let currentFreq = medications[medIndex].frequency || ''
        let selectedTimes = currentFreq ? currentFreq.split(', ').filter(Boolean) : []
        
        if (selectedTimes.includes(time)) {
            selectedTimes = selectedTimes.filter(t => t !== time)
        } else {
            selectedTimes.push(time)
        }
        
        selectedTimes = timeOptions.filter(t => selectedTimes.includes(t)) // keep order
        updateMedication(medIndex, 'frequency', selectedTimes.join(', '))
    }

    const frequencyPresets = [
        { label: 'OD', description: 'Once Daily', times: ['Morning'] },
        { label: 'BD', description: 'Twice Daily', times: ['Morning', 'Night'] },
        { label: 'TDS', description: 'Three Times Daily', times: ['Morning', 'Afternoon', 'Night'] }
    ]

    const handlePresetClick = (medIndex: number, preset: typeof frequencyPresets[0]) => {
        updateMedication(medIndex, 'frequency', preset.times.join(', '))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!selectedPatient) {
            alert('Please select a patient first');
            return;
        }

        // Filter out empty rows
        const validMeds = medications.filter(m => m.medication_name.trim() !== '');
        if (validMeds.length === 0) {
            alert('Please add at least one medication with a name');
            return;
        }

        console.log('Submitting prescription:', {
            selectedPatient,
            validMeds,
            doctorId
        });

        setLoading(true)
        try {
            const primaryMed = validMeds[0];
            const payload = {
                ...primaryMed,
                frequency: convertFrequencyToAbbrev(primaryMed.frequency),
                patient_id: selectedPatient.patient_id || selectedPatient.id,
                doctor_id: doctorId
            };

            console.log('Prescription payload:', payload);

            const res = await fetch('/api/prescriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            console.log('Prescription response status:', res.status);
            const responseData = await res.json();
            console.log('Prescription response data:', responseData);

            if (res.ok) {
                setSuccess(true)
                // Notify parent component to refresh queue
                if (onPrescriptionTransmitted) {
                    onPrescriptionTransmitted();
                }
                setTimeout(() => {
                    onClose()
                }, 1500)
            } else {
                const errorMsg = responseData.error || 'Failed to transmit prescription';
                console.error('Prescription creation failed:', responseData);
                alert(`Error: ${errorMsg}`);
                setLoading(false);
                return;
            }
        } catch (e) {
            console.error('Prescription error:', e);
            alert(`Network error: ${e.message}`);
            setLoading(false);
            return;
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="rx-sidebar-overlay" onClick={onClose}>
            <div className="rx-sidebar" onClick={e => e.stopPropagation()}>
                <div className="rx-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="rx-icon">
                            <span className="material-symbols-outlined">medication</span>
                        </div>
                        <div>
                            <div className="rx-title">New Prescription</div>
                            <div className="rx-subtitle">Pharmacy Pipeline</div>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="rx-body">
                    {success ? (
                        <div className="rx-success animate-fade-in">
                            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#10b981' }}>check_circle</span>
                            <h3>Rx Sent Successfully!</h3>
                            <p>Sent to Pharmacist Mainnet</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Patient Search */}
                            <div>
                                <label className="rx-label text-brand">PATIENT DISCOVERY (Name/Queue #/ID)</label>
                                {!selectedPatient ? (
                                    <div className="search-container">
                                        <input
                                            type="text"
                                            className="rx-input"
                                            placeholder="To auto-fill today's queue, type Queue # (e.g., '1')"
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            autoFocus
                                        />
                                        {patients.length > 0 && (
                                            <div className="search-results">
                                                {patients.map(p => (
                                                    <div key={p.id} className="search-row flex-col" onClick={() => setSelectedPatient(p)}>
                                                        {p.context && (
                                                            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--brand))', fontWeight: 800, marginBottom: '2px' }}>
                                                                MATCH: {p.context}
                                                            </div>
                                                        )}
                                                        <div style={{ fontWeight: 700 }}>{p.first_name} {p.last_name}</div>
                                                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Mobile: {p.phone} | ID: {p.patient_id || p.id}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="selected-patient">
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 800 }}>{selectedPatient.first_name} {selectedPatient.last_name}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>ID: {selectedPatient.patient_id || selectedPatient.id} • Mobile: {selectedPatient.phone}</div>
                                        </div>
                                        <button className="btn btn-ghost" type="button" onClick={() => setSelectedPatient(null)} style={{ padding: '0.4rem' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>edit</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Rx Details - Multiple Medications */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {medications.map((med, index) => (
                                    <div key={index} className="rx-grid rx-medication-card relative">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <label className="rx-label mb-0" style={{ color: 'hsl(var(--text-primary))' }}>MEDICATION {index + 1}</label>
                                            {medications.length > 1 && (
                                                <button type="button" onClick={() => removeMedication(index)} className="btn-ghost text-red-500" style={{ padding: '0.2rem' }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                                <label className="rx-label text-xs">MEDICATION NAME</label>
                                                <input
                                                    type="text"
                                                    className="rx-input relative z-20"
                                                    required
                                                    autoComplete="off"
                                                    placeholder="e.g. Amoxicillin 500mg"
                                                    value={med.medication_name}
                                                    onChange={e => updateMedication(index, 'medication_name', e.target.value)}
                                                    onFocus={() => setActiveMedDropdown(index)}
                                                    onBlur={() => setTimeout(() => setActiveMedDropdown(null), 250)}
                                                    onClick={() => setActiveMedDropdown(index)}
                                                />
                                                {activeMedDropdown === index && (
                                                    <div className="absolute z-[9999] left-0 top-full w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md mt-1 max-h-48 overflow-auto shadow-xl">
                                                        <ul className="py-1">
                                                            {commonMedications
                                                                .filter(m => m.toLowerCase().includes(med.medication_name.toLowerCase()))
                                                                .map(m => (
                                                                    <li
                                                                        key={m}
                                                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                                                                        onMouseDown={(e) => {
                                                                            e.preventDefault()
                                                                            e.stopPropagation()
                                                                        }}
                                                                        onClick={() => {
                                                                            updateMedication(index, 'medication_name', m)
                                                                            setActiveMedDropdown(null)
                                                                        }}
                                                                    >
                                                                        {m}
                                                                    </li>
                                                                ))}
                                                            {commonMedications.filter(m => m.toLowerCase().includes(med.medication_name.toLowerCase())).length === 0 && (
                                                                <li className="px-4 py-2 text-sm text-gray-500 italic">No exact matches (will save custom)</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label className="rx-label text-xs">DOSAGE</label>
                                                <input
                                                    type="text"
                                                    className="rx-input"
                                                    placeholder="1 capsule"
                                                    value={med.dosage}
                                                    onChange={e => updateMedication(index, 'dosage', e.target.value)}
                                                />
                                            </div>
                                            {(medicationTypes[index] as MedicationType) !== 'SYRUP' && (
                                                <div>
                                                    <label className="rx-label text-xs">
                                                        QUANTITY {medicationTypes[index] === 'TABLET' || medicationTypes[index] === 'CAPSULE' ? '(total units)' : '(total containers)'} *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="rx-input"
                                                        placeholder={medicationTypes[index] === 'TABLET' || medicationTypes[index] === 'CAPSULE' ? 'e.g., 21 tablets' : 'e.g., 2 bottles'}
                                                        value={med.quantity}
                                                        onChange={e => updateMedication(index, 'quantity', e.target.value)}
                                                        disabled={(medicationTypes[index] as MedicationType) === 'SYRUP'}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="rx-label text-xs">FREQUENCY</label>
                                            {frequencyModes[index] === 'time-based' ? (
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap gap-2">
                                                        {timeOptions.map((time) => {
                                                            const isSelected = (med.frequency || '').split(', ').includes(time)
                                                            return (
                                                                <div key={time} className="checkbox-wrapper-53">
                                                                    <label className="container">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={isSelected}
                                                                            onChange={() => handleTimeToggle(index, time)}
                                                                        />
                                                                        <div className="checkmark"></div>
                                                                        <span className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">{time}</span>
                                                                    </label>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        <span className="text-xs text-gray-500">Quick presets:</span>
                                                        {frequencyPresets.map((preset) => (
                                                            <button
                                                                key={preset.label}
                                                                type="button"
                                                                onClick={() => handlePresetClick(index, preset)}
                                                                className="px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
                                                                title={preset.description}
                                                            >
                                                                {preset.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="24"
                                                            value={intervalHours[index] || ''}
                                                            onChange={(e) => handleIntervalHoursChange(index, e.target.value)}
                                                            className="rx-input w-20"
                                                            placeholder="6"
                                                        />
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">hours interval</span>
                                                    </div>
                                                    {intervalHours[index] && (
                                                        <p className="text-xs text-gray-500">
                                                            Approximately {Math.round(24 / parseInt(intervalHours[index]))} doses per day
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {med.frequency && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Current: {med.frequency} ({getDosesPerDay(med.frequency, frequencyModes[index], intervalHours[index])} doses/day)
                                                </p>
                                            )}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label className="rx-label text-xs">ROUTE</label>
                                                <select className="rx-input" value={med.route} onChange={e => updateMedication(index, 'route', e.target.value)}>
                                                    <option>Oral</option>
                                                    <option>Injection</option>
                                                    <option>IV</option>
                                                    <option>IM</option>
                                                    <option>SC</option>
                                                    <option>Topical</option>
                                                    <option>Inhaled</option>
                                                </select>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Detected type: <span className="font-medium">{medicationTypes[index]}</span>
                                                </p>
                                            </div>
                                            <div>
                                                <label className="rx-label text-xs">DURATION</label>
                                                <input
                                                    type="text"
                                                    className="rx-input"
                                                    placeholder="7 Days"
                                                    value={med.duration}
                                                    onChange={e => updateMedication(index, 'duration', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="rx-label text-xs">WHEN TO TAKE</label>
                                            <div className="flex flex-col gap-2">
                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={(med.instructions || '').includes('Before meals')}
                                                        onChange={(e) => {
                                                            let currentInstructions = med.instructions || ''
                                                            if (e.target.checked) {
                                                                currentInstructions = currentInstructions.replace('After meals', '').trim() + ' Before meals'
                                                            } else {
                                                                currentInstructions = currentInstructions.replace('Before meals', '').trim()
                                                            }
                                                            updateMedication(index, 'instructions', currentInstructions.trim())
                                                        }}
                                                        style={{ width: '1rem', height: '1rem', accentColor: 'hsl(var(--brand))' }}
                                                    />
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Before meals</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={(med.instructions || '').includes('After meals')}
                                                        onChange={(e) => {
                                                            let currentInstructions = med.instructions || ''
                                                            if (e.target.checked) {
                                                                currentInstructions = currentInstructions.replace('Before meals', '').trim() + ' After meals'
                                                            } else {
                                                                currentInstructions = currentInstructions.replace('After meals', '').trim()
                                                            }
                                                            updateMedication(index, 'instructions', currentInstructions.trim())
                                                        }}
                                                        style={{ width: '1rem', height: '1rem', accentColor: 'hsl(var(--brand))' }}
                                                    />
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">After meals</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button 
                                    type="submit" 
                                    className="btn-rx-submit" 
                                    disabled={!selectedPatient || loading || !medications[0]?.medication_name?.trim() || !medications[0]?.dosage?.trim() || ((medicationTypes[0] as MedicationType) !== 'SYRUP' && !medications[0]?.quantity?.trim())}
                                    title={!selectedPatient ? 'Select a patient' : !medications[0]?.medication_name ? 'Enter medication name' : !medications[0]?.dosage ? 'Enter dosage' : (medicationTypes[0] as MedicationType) !== 'SYRUP' && !medications[0]?.quantity ? 'Enter quantity for solid medications' : 'Transmit prescription to pharmacy'}
                                >
                                {loading ? 'SENDING...' : 'TRANSMIT TO PHARMACY'}
                                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>send</span>
                            </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <style jsx>{`
                .rx-sidebar-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    z-index: 2000;
                    display: flex;
                    justify-content: flex-end;
                }
                .rx-sidebar {
                    width: 480px;
                    max-width: 100%;
                    background: hsl(var(--surface-1));
                    border-left: 1px solid hsl(var(--border) / 0.5);
                    box-shadow: -10px 0 50px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .rx-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid hsl(var(--border) / 0.5);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(to bottom, hsl(var(--surface-2)), hsl(var(--surface-1)));
                }
                .rx-icon {
                    width: 40px;
                    height: 40px;
                    background: hsl(var(--brand) / 0.1);
                    color: hsl(var(--brand));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                }
                .rx-title { font-size: 1.1rem; font-weight: 800; color: hsl(var(--text-primary)); }
                .rx-subtitle { font-size: 0.75rem; font-weight: 700; color: hsl(var(--brand)); text-transform: uppercase; letter-spacing: 0.1em; }
                .btn-close { background: none; border: none; color: hsl(var(--text-muted)); cursor: pointer; border-radius: 8px; padding: 4px; }
                .btn-close:hover { background: hsl(var(--surface-3)); }

                .rx-body { padding: 1.5rem; flex: 1; overflow-y: auto; }
                .rx-label { display: block; font-size: 0.65rem; font-weight: 800; color: hsl(var(--text-muted)); margin-bottom: 0.5rem; letter-spacing: 0.05em; }
                .text-brand { color: hsl(var(--brand)); font-weight: 900; }
                
                .rx-input {
                    width: 100%;
                    background: hsl(var(--surface-2));
                    border: 1px solid hsl(var(--border) / 0.5);
                    border-radius: 10px;
                    padding: 0.75rem 1rem;
                    color: hsl(var(--text-primary));
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: border-color 0.2s;
                }
                .rx-input:focus { outline: none; border-color: hsl(var(--brand) / 0.5); background: hsl(var(--surface-3)); }
                
                .search-container { position: relative; }
                .search-results {
                    position: absolute;
                    top: calc(100% + 4px);
                    left: 0; right: 0;
                    background: hsl(var(--surface-1));
                    border: 1px solid hsl(var(--border));
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    z-index: 10;
                    overflow: hidden;
                }
                .search-row {
                    padding: 0.8rem 1rem;
                    cursor: pointer;
                    transition: background 0.2s;
                    border-bottom: 1px solid hsl(var(--border) / 0.3);
                }
                .search-row:hover { background: hsl(var(--surface-2)); }
                
                .selected-patient {
                    display: flex;
                    align-items: center;
                    background: hsl(var(--brand) / 0.05);
                    border: 1px solid hsl(var(--brand) / 0.2);
                    border-radius: 12px;
                    padding: 0.75rem 1rem;
                    color: hsl(var(--text-primary));
                }

                .rx-medication-card {
                    background: hsl(var(--surface-2) / 0.3);
                    border: 1px solid hsl(var(--border) / 0.5);
                    padding: 1rem;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .btn-rx-submit {
                    width: 100%;
                    background: hsl(var(--brand));
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 1rem;
                    font-weight: 800;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 15px hsl(var(--brand) / 0.4);
                    margin-top: 1rem;
                }
                .btn-rx-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px hsl(var(--brand) / 0.5); }
                .btn-rx-submit:active:not(:disabled) { transform: translateY(0); }
                .btn-rx-submit:disabled { opacity: 0.5; cursor: not-allowed; }

                .rx-success {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    gap: 1rem;
                }

                .slide-down-anim {
                    animation: slideDown 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    transform-origin: top;
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: scaleY(0.9) translateY(-4px); }
                    to { opacity: 1; transform: scaleY(1) translateY(0); }
                }
                
                .checkbox-wrapper-53 input[type="checkbox"] {
                    visibility: hidden;
                    display: none;
                }

                .checkbox-wrapper-53 .container {
                    display: flex;
                    align-items: center;
                    position: relative;
                    cursor: pointer;
                    font-size: 14px;
                    user-select: none;
                }

                .checkbox-wrapper-53 .checkmark {
                    position: relative;
                    top: 0;
                    left: 0;
                    height: 1.2em;
                    width: 1.2em;
                    background-color: #ccc;
                    border-radius: 100%;
                    background: #e8e8e8;
                    box-shadow: 2px 2px 4px #c5c5c5,
                                -2px -2px 4px #ffffff;
                    transition: all 0.3s ease;
                }

                .checkbox-wrapper-53 .container input:checked ~ .checkmark {
                    box-shadow: inset 2px 2px 4px #c5c5c5,
                                inset -2px -2px 4px #ffffff;
                    background: linear-gradient(145deg, #f0f0f0, #d0d0d0);
                }

                .checkbox-wrapper-53 .checkmark:after {
                    content: "";
                    position: absolute;
                    opacity: 0;
                }

                .checkbox-wrapper-53 .container input:checked ~ .checkmark:after {
                    opacity: 1;
                }

                .checkbox-wrapper-53 .container .checkmark:after {
                    left: 0.4em;
                    top: 0.2em;
                    width: 0.2em;
                    height: 0.4em;
                    border: solid #4a5568;
                    border-width: 0 0.12em 0.12em 0;
                    transform: rotate(45deg);
                    transition: all 250ms;
                }
                
                @media (prefers-color-scheme: dark) {
                    .checkbox-wrapper-53 .checkmark {
                        background: #2d3748;
                        box-shadow: 2px 2px 4px #1a202c,
                                    -2px -2px 4px #4a5568;
                    }
                    
                    .checkbox-wrapper-53 .container input:checked ~ .checkmark {
                        box-shadow: inset 2px 2px 4px #1a202c,
                                    inset -2px -2px 4px #4a5568;
                        background: linear-gradient(145deg, #2d3748, #1a202c);
                    }
                    
                    .checkbox-wrapper-53 .container .checkmark:after {
                        border-color: #e2e8f0;
                    }
                }
            `}</style>
        </div>
    )
}
