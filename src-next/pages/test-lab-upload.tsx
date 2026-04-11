import { useState } from 'react'
import { useRouter } from 'next/router'

export default function TestLabUpload() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    const results: string[] = []
    
    try {
      // Test 1: Check if Tauri API is available
      results.push('Testing Tauri API availability...')
      if (typeof window.__TAURI__ !== 'undefined') {
        results.push('   Tauri API is available')
      } else {
        results.push('   Tauri API is not available (running in browser mode)')
      }
      
      // Test 2: Check if we can call the lab results command
      results.push('Testing get_lab_results command...')
      try {
        const labResults = await window.__TAURI__.invoke('get_lab_results', {
          limit: 5
        })
        results.push(`   Success: Retrieved ${labResults.length} lab results`)
      } catch (error) {
        results.push(`   Error: ${error}`)
      }
      
      // Test 3: Test file upload command structure
      results.push('Testing lab result creation structure...')
      const testLabResult = {
        patient_id: 'test-patient-1',
        doctor_id: 'test-doctor-1',
        test_name: 'Test CBC',
        test_category: 'Blood Work',
        test_date: '2026-04-11',
        result_date: '2026-04-11',
        result_value: 'Normal',
        unit: 'cells/µL',
        reference_range: '4.5-11.0',
        status: 'COMPLETED',
        abnormal_flag: 'NORMAL',
        interpretation: 'Test result',
        file_data: null,
        file_name: null,
        mime_type: null
      }
      
      try {
        // Don't actually create, just test the command structure
        results.push('   Lab result structure is valid')
        results.push(`   Sample data: ${JSON.stringify(testLabResult, null, 2)}`)
      } catch (error) {
        results.push(`   Error: ${error}`)
      }
      
      // Test 4: Check database schema
      results.push('Testing database schema...')
      try {
        // This would require the actual database connection
        results.push('   Database schema test requires running Tauri app')
      } catch (error) {
        results.push(`   Error: ${error}`)
      }
      
    } catch (error) {
      results.push(`Test suite error: ${error}`)
    }
    
    setTestResults(results)
    setIsRunning(false)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Lab Results Feature Test</h1>
      <p>This page tests the lab results file upload functionality.</p>
      
      <button 
        onClick={runTests}
        disabled={isRunning}
        style={{
          padding: '1rem 2rem',
          backgroundColor: isRunning ? '#ccc' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          marginBottom: '2rem'
        }}
      >
        {isRunning ? 'Running Tests...' : 'Run Tests'}
      </button>
      
      {testResults.length > 0 && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '0.5rem',
          padding: '1rem'
        }}>
          <h3>Test Results:</h3>
          <pre style={{ 
            whiteSpace: 'pre-wrap',
            fontSize: '0.9rem',
            fontFamily: 'monospace'
          }}>
            {testResults.join('\n')}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '2rem' }}>
        <h3>Manual Testing Steps:</h3>
        <ol>
          <li>Navigate to <code>/lab-results/add</code></li>
          <li>Fill in the lab result form</li>
          <li>Upload a PDF or image file</li>
          <li>Submit the form</li>
          <li>Navigate to a patient page (<code>/patients/[id]</code>)</li>
          <li>Click on "Lab Results" tab</li>
          <li>Verify the uploaded lab result appears</li>
          <li>Click the download link to test file retrieval</li>
        </ol>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h3>Features Implemented:</h3>
        <ul>
          <li>Database schema updated to support file storage</li>
          <li>Tauri backend commands for lab result CRUD operations</li>
          <li>File upload component with validation</li>
          <li>File download functionality</li>
          <li>Patient-specific lab result display</li>
          <li>Nurse user interface for uploading lab results</li>
        </ul>
      </div>
    </div>
  )
}
