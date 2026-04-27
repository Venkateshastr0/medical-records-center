import { useState, useEffect as ReactUseEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeftIcon,
  DocumentIcon,
  FolderIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface LabResultFormData {
  patient_id: string
  file_data: Uint8Array | null
  file_name: string | null
  display_name: string | null
  upload_time: string | null
  mime_type: string | null
}

export default function AddLabResultPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Get patient ID from query params
  const { patient_id } = router.query
  const [formData, setFormData] = useState<LabResultFormData>({
    patient_id: (patient_id as string) || '',
    file_data: null,
    file_name: null,
    display_name: null,
    upload_time: new Date().toISOString(),
    mime_type: null
  })

  // State for patient search autocomplete
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isDragOver, setIsDragOver] = useState(false)

  // Real patients data from API
  const { data: patientsResponse, isLoading: patientsLoading, error: patientsError } = useQuery<any>({
    queryKey: ['patients'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await fetch('/api/patients?limit=1000', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch patients (${response.status})`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching patients:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  // Extract patients array from response
  const patients = patientsResponse?.data || [];

  // Filter patients based on search query
  const filteredPatients = patients?.filter(patient => {
    if (!patientSearchQuery || patientSearchQuery.length < 2) return false;
    const searchLower = patientSearchQuery.toLowerCase();
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const firstName = patient.first_name.toLowerCase();
    const lastName = patient.last_name.toLowerCase();
    const email = patient.email?.toLowerCase() || '';
    const patientId = patient.patient_id?.toLowerCase() || '';
    
    return fullName.includes(searchLower) || 
           firstName.includes(searchLower) || 
           lastName.includes(searchLower) || 
           email.includes(searchLower) ||
           patientId.includes(searchLower);
  }) || [];

  // Helper function to get patient initials
  const getPatientInitials = (patient: any) => {
    if (!patient) return '---';
    return `${(patient.first_name || '')[0]}${(patient.last_name || '')[0]}`.toUpperCase();
  };

  // Event handlers for patient selection
  const handlePatientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPatientSearchQuery(value);
    setShowPatientDropdown(value.length >= 2);
    setHighlightedIndex(-1);
    
    if (selectedPatient && value !== `${selectedPatient.first_name} ${selectedPatient.last_name}`) {
      setSelectedPatient(null);
      setFormData(prev => ({ ...prev, patient_id: '' }));
    }
  };

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setPatientSearchQuery(`${patient.first_name} ${patient.last_name}`);
    setShowPatientDropdown(false);
    setHighlightedIndex(-1);
    setFormData(prev => ({ ...prev, patient_id: patient.patient_id }));
  };

  const handlePatientInputFocus = () => {
    if (patientSearchQuery.length >= 2) {
      setShowPatientDropdown(true);
    }
  };

  const handlePatientInputBlur = () => {
    setTimeout(() => {
      if (!document.activeElement?.closest('.patient-dropdown')) {
        setShowPatientDropdown(false);
      }
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPatientDropdown || filteredPatients.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev + 1;
          return newIndex >= filteredPatients.length ? 0 : newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev - 1;
          return newIndex < 0 ? filteredPatients.length - 1 : newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredPatients[highlightedIndex]) {
          handlePatientSelect(filteredPatients[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowPatientDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setPatientSearchQuery('');
    setFormData(prev => ({ ...prev, patient_id: '' }));
  };

  // File handling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File exceeds 10 MB limit.')
      return
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain']
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      alert('Unsupported file type.')
      return
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      setFormData(prev => ({
        ...prev,
        file_data: uint8Array,
        file_name: file.name,
        display_name: file.name.replace(/\.[^.]+$/, ''), // Remove extension
        mime_type: file.type,
        upload_time: new Date().toISOString()
      }))
    } catch (error) {
      alert('Failed to process file. Please try again.')
    }
  }

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      file_data: null,
      file_name: null,
      display_name: null,
      mime_type: null,
      upload_time: null
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      // Simulate file input change
      const event = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>
      handleFileUpload(event)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !formData.file_data) return

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 20
        })
      }, 300)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Lab result submitted:', formData);
      
      // Show success state
      setShowSuccess(true)
    } catch (error) {
      alert('Error uploading lab result. Please try again.')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const handleUploadAnother = () => {
    // Reset form
    setSelectedPatient(null)
    setPatientSearchQuery('')
    setFormData({
      patient_id: '',
      file_data: null,
      file_name: null,
      display_name: null,
      upload_time: new Date().toISOString(),
      mime_type: null
    })
    setShowSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCancel = () => {
    router.push('/lab-results')
  }

  const isFormReady = selectedPatient && formData.file_data

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background-secondary, hsl(222 24% 11%))' }}>
      <div className="max-w-[680px] mx-auto px-4 py-8 sm:px-6 lg:px-8" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="flex items-center mb-2">
            <div className="text-xs" style={{ color: 'var(--color-text-secondary, hsl(215 15% 60%))', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Medical Records
              <span style={{ color: 'var(--color-text-tertiary, hsl(215 12% 40%))' }}>›</span>
              Lab Results
              <span style={{ color: 'var(--color-text-tertiary, hsl(215 12% 40%))' }}>›</span>
              Upload
            </div>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--color-text-primary, hsl(210 20% 96%))' }}>
            Upload lab result
          </h1>
          <p className="subtitle" style={{ fontSize: '14px', color: 'var(--color-text-secondary, hsl(215 15% 60%))', marginTop: '4px' }}>
            Attach a lab result file to a patient's medical record.
          </p>
        </div>

        {/* Success State */}
        {showSuccess ? (
          <div className="success-msg text-center py-12" style={{ padding: '2rem 1rem' }}>
            <div className="success-icon" style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-background-success, #dcfce7)', borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px', color: 'var(--color-text-success, #16a34a)' }}>
                <path d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-text-primary, hsl(210 20% 96%))', marginBottom: '6px' }}>Lab result uploaded</h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary, hsl(215 15% 60%))' }}>
              {formData.file_name} linked to {selectedPatient?.first_name} {selectedPatient?.last_name}.
            </p>
            <button
              onClick={handleUploadAnother}
              className="submit-btn"
              style={{ marginTop: '1.5rem', maxWidth: '220px' }}
            >
              Upload another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Patient Selection Card */}
            <div className="card" style={{ background: 'var(--color-background-primary, hsl(222 28% 8%))', border: '0.5px solid var(--color-border-tertiary, hsl(222 18% 18%))', borderRadius: 'var(--border-radius-lg, 0.5rem)', padding: '1.5rem', marginBottom: '1rem' }}>
              <div className="section-label" style={{ fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary, hsl(215 15% 60%))', marginBottom: '12px' }}>
                1 {'\u2014'} Patient
              </div>
              
              {!selectedPatient ? (
                <div>
                  <label className="block" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary, hsl(210 20% 96%))', marginBottom: '6px' }}>
                    Patient <span className="req" style={{ color: 'var(--color-text-danger, #dc2626)', marginLeft: '2px' }}>*</span>
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        className="text-input"
                        style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: '14px', border: '0.5px solid var(--color-border-secondary, hsl(222 18% 22%))', borderRadius: 'var(--border-radius-md, 0.375rem)', backgroundColor: 'var(--color-background-primary, hsl(222 28% 8%))', color: 'var(--color-text-primary, hsl(210 20% 96%))', outline: 'none', transition: 'border-color 0.15s' }}
                        value={patientSearchQuery}
                        onChange={handlePatientSearchChange}
                        onFocus={(e) => {
                          handlePatientInputFocus()
                          e.target.style.borderColor = 'var(--color-border-primary, hsl(210 100% 56%))'
                          e.target.style.boxShadow = '0 0 0 3px rgba(99,99,99,0.08)'
                        }}
                        onBlur={(e) => {
                          handlePatientInputBlur()
                          e.target.style.borderColor = 'var(--color-border-secondary, hsl(222 18% 22%))'
                          e.target.style.boxShadow = 'none'
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Search by name, email, or ID\u2026"
                        disabled={patientsLoading}
                      />
                    </div>
                    
                    {/* Dropdown */}
                    {showPatientDropdown && filteredPatients.length > 0 && (
                      <div className="dropdown" style={{ border: '0.5px solid var(--color-border-secondary, hsl(222 18% 22%))', borderRadius: 'var(--border-radius-md, 0.375rem)', backgroundColor: 'var(--color-background-primary, hsl(222 28% 8%))', marginTop: '4px', overflow: 'hidden', position: 'absolute', zIndex: 10, width: '100%', maxHeight: '240px', overflow: 'auto' }}>
                        {filteredPatients.map((patient, index) => (
                          <div
                            key={patient.patient_id}
                            className={`dropdown-item ${
                              highlightedIndex === index ? 'active' : ''
                            }`}
                            style={{ padding: '10px 12px', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.1s', backgroundColor: highlightedIndex === index ? 'var(--color-background-secondary, hsl(222 24% 11%))' : 'transparent' }}
                            onClick={() => handlePatientSelect(patient)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                          >
                            <span className="name" style={{ fontWeight: '500', color: 'var(--color-text-primary, hsl(210 20% 96%))' }}>
                              {patient.first_name} {patient.last_name}
                            </span>
                            <span className="meta" style={{ fontSize: '12px', color: 'var(--color-text-secondary, hsl(215 15% 60%))' }}>
                              {patient.patient_id} \u00b7 {patient.email}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* No results */}
                    {showPatientDropdown && patientSearchQuery.length > 0 && filteredPatients.length === 0 && (
                      <div className="dropdown" style={{ border: '0.5px solid var(--color-border-secondary, hsl(222 18% 22%))', borderRadius: 'var(--border-radius-md, 0.375rem)', backgroundColor: 'var(--color-background-primary, hsl(222 28% 8%))', marginTop: '4px', overflow: 'hidden', position: 'absolute', zIndex: 10, width: '100%' }}>
                        <div className="dropdown-item" style={{ padding: '10px 12px', fontSize: '14px', color: 'var(--color-text-secondary, hsl(215 15% 60%))' }}>
                          No patients found matching "{patientSearchQuery}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="selected-patient" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: 'var(--color-background-secondary, hsl(222 24% 11%))', border: '0.5px solid var(--color-border-tertiary, hsl(222 18% 18%))', borderRadius: 'var(--border-radius-md, 0.375rem)' }}>
                  <div className="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-background-info, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-info, #1e40af)', flexShrink: 0 }}>
                    {getPatientInitials(selectedPatient)}
                  </div>
                  <div className="patient-info" style={{ flex: 1 }}>
                    <div className="pname" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary, hsl(210 20% 96%))' }}>
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </div>
                    <div className="pid" style={{ fontSize: '12px', color: 'var(--color-text-secondary, hsl(215 15% 60%))' }}>
                      {selectedPatient.patient_id} \u00b7 {selectedPatient.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearPatient}
                    className="clear-btn"
                    style={{ fontSize: '12px', color: 'var(--color-text-secondary, hsl(215 15% 60%))', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--border-radius-md, 0.375rem)', border: '0.5px solid var(--color-border-tertiary, hsl(222 18% 18%))', backgroundColor: 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-background-primary, hsl(222 28% 8%))'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* File Upload Card */}
            <div className="card" style={{ background: 'var(--color-background-primary, hsl(222 28% 8%))', border: '0.5px solid var(--color-border-tertiary, hsl(222 18% 18%))', borderRadius: 'var(--border-radius-lg, 0.5rem)', padding: '1.5rem', marginBottom: '1rem' }}>
              <div className="section-label" style={{ fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary, hsl(215 15% 60%))', marginBottom: '12px' }}>
                2 {'\u2014'} File
              </div>
              
              {!formData.file_name ? (
                <div>
                  <label className="block" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary, hsl(210 20% 96%))', marginBottom: '6px' }}>
                    Lab result file <span className="req" style={{ color: 'var(--color-text-danger, #dc2626)', marginLeft: '2px' }}>*</span>
                  </label>
                  <div
                    className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
                    style={{ border: '1.5px dashed var(--color-border-secondary, hsl(222 18% 22%))', borderRadius: 'var(--border-radius-md, 0.375rem)', padding: '2rem 1rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s', borderColor: isDragOver ? 'var(--color-border-primary, hsl(210 100% 56%))' : 'var(--color-border-secondary, hsl(222 18% 22%))', backgroundColor: isDragOver ? 'var(--color-background-secondary, hsl(222 24% 11%))' : 'transparent' }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <svg className="drop-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '32px', height: '32px', margin: '0 auto 10px', color: 'var(--color-text-tertiary, hsl(215 12% 40%))' }}>
                      <path d="M16 22V10M10 16l6-6 6 6"/>
                      <rect x="4" y="24" width="24" height="4" rx="2"/>
                    </svg>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary, hsl(215 15% 60%))', marginBottom: '4px' }}>
                      <strong>Drag & drop</strong> or click to browse
                    </p>
                    <p className="hint" style={{ fontSize: '12px', color: 'var(--color-text-tertiary, hsl(215 12% 40%))' }}>
                      PDF, JPG, PNG, GIF, TXT \u2014 max 10 MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.txt"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="file-preview" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: 'var(--color-background-secondary, hsl(222 24% 11%))', border: '0.5px solid var(--color-border-tertiary, hsl(222 18% 18%))', borderRadius: 'var(--border-radius-md, 0.375rem)', marginBottom: '1rem' }}>
                    <div className="file-icon" style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-background-danger, #fef2f2)', borderRadius: 'var(--border-radius-md, 0.375rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <DocumentIcon style={{ width: '16px', height: '16px', color: 'var(--color-text-danger, #dc2626)' }} />
                    </div>
                    <div className="file-info" style={{ flex: 1 }}>
                      <div className="fname" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary, hsl(210 20% 96%))' }}>
                        {formData.file_name}
                      </div>
                      <div className="fmeta" style={{ fontSize: '12px', color: 'var(--color-text-secondary, hsl(215 15% 60%))' }}>
                        {formData.mime_type} \u00b7 {formData.file_data ? `${(formData.file_data.length / 1024).toFixed(1)} KB` : 'Unknown size'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="clear-btn"
                      style={{ fontSize: '12px', color: 'var(--color-text-secondary, hsl(215 15% 60%))', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--border-radius-md, 0.375rem)', border: '0.5px solid var(--color-border-tertiary, hsl(222 18% 18%))', backgroundColor: 'transparent', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-background-primary, hsl(222 28% 8%))'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div>
                    <label className="block" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary, hsl(210 20% 96%))', marginBottom: '6px' }}>
                      Display name
                    </label>
                    <input
                      type="text"
                      className="text-input"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '14px', border: '0.5px solid var(--color-border-secondary, hsl(222 18% 22%))', borderRadius: 'var(--border-radius-md, 0.375rem)', backgroundColor: 'var(--color-background-primary, hsl(222 28% 8%))', color: 'var(--color-text-primary, hsl(210 20% 96%))', outline: 'none', transition: 'border-color 0.15s' }}
                      value={formData.display_name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--color-border-primary, hsl(210 100% 56%))'
                        e.target.style.boxShadow = '0 0 0 3px rgba(99,99,99,0.08)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--color-border-secondary, hsl(222 18% 22%))'
                        e.target.style.boxShadow = 'none'
                      }}
                      placeholder="e.g. Blood panel \u2013 March 2025"
                    />
                    <p className="helper" style={{ fontSize: '12px', color: 'var(--color-text-tertiary, hsl(215 12% 40%))', marginTop: '5px' }}>
                      How this file will appear in the patient's records. Defaults to the original filename.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Card */}
            {isFormReady && (
              <div className="card" id="summary-card" style={{ background: 'var(--color-background-primary, hsl(222 28% 8%))', border: '0.5px solid var(--color-border-tertiary, hsl(222 18% 18%))', borderRadius: 'var(--border-radius-lg, 0.5rem)', padding: '1.5rem', marginBottom: '1rem' }}>
                <div className="section-label" style={{ fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary, hsl(215 15% 60%))', marginBottom: '12px' }}>
                  Summary
                </div>
                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: '14px', borderBottom: '0.5px solid var(--color-border-tertiary, hsl(222 18% 18%))' }}>
                  <span className="skey" style={{ color: 'var(--color-text-secondary, hsl(215 15% 60%))' }}>Patient</span>
                  <span className="sval" style={{ color: 'var(--color-text-primary, hsl(210 20% 96%))', fontWeight: '500' }}>
                    {selectedPatient.first_name} {selectedPatient.last_name} ({selectedPatient.patient_id})
                  </span>
                </div>
                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: '14px', borderBottom: '0.5px solid var(--color-border-tertiary, hsl(222 18% 18%))' }}>
                  <span className="skey" style={{ color: 'var(--color-text-secondary, hsl(215 15% 60%))' }}>File</span>
                  <span className="sval" style={{ color: 'var(--color-text-primary, hsl(210 20% 96%))', fontWeight: '500' }}>{formData.file_name}</span>
                </div>
                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: '14px', borderBottom: '0.5px solid var(--color-border-tertiary, hsl(222 18% 18%))' }}>
                  <span className="skey" style={{ color: 'var(--color-text-secondary, hsl(215 15% 60%))' }}>Display name</span>
                  <span className="sval" style={{ color: 'var(--color-text-primary, hsl(210 20% 96%))', fontWeight: '500' }}>
                    {formData.display_name || formData.file_name}
                  </span>
                </div>
                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: '14px' }}>
                  <span className="skey" style={{ color: 'var(--color-text-secondary, hsl(215 15% 60%))' }}>Upload time</span>
                  <span className="sval" style={{ color: 'var(--color-text-primary, hsl(210 20% 96%))', fontWeight: '500' }}>
                    {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isSubmitting && (
              <div className="upload-progress" style={{ height: '3px', background: 'var(--color-border-tertiary, hsl(222 18% 18%))', borderRadius: '99px', marginTop: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div 
                  className="upload-progress-bar"
                  style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--color-text-primary, hsl(210 20% 96%))', borderRadius: '99px', transition: 'width 1.5s ease' }}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              style={{ width: '100%', padding: '11px', fontSize: '15px', fontWeight: '500', borderRadius: 'var(--border-radius-md, 0.375rem)', border: 'none', background: 'var(--color-text-primary, hsl(210 20% 96%))', color: 'var(--color-background-primary, hsl(222 28% 8%))', cursor: (!isFormReady || isSubmitting) ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s', marginTop: '0.5rem', opacity: (!isFormReady || isSubmitting) ? 0.35 : 1 }}
              disabled={!isFormReady || isSubmitting}
              onMouseEnter={(e) => {
                if (isFormReady && !isSubmitting) {
                  e.target.style.opacity = '0.85'
                }
              }}
              onMouseLeave={(e) => {
                if (isFormReady && !isSubmitting) {
                  e.target.style.opacity = '1'
                }
              }}
            >
              {isSubmitting ? 'Uploading...' : 'Upload lab result'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
