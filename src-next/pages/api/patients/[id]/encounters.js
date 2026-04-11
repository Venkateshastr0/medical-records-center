export default async function handler(req, res) {
  const { id } = req.query
  const { method } = req

  if (!id) {
    return res.status(400).json({ error: 'Patient ID is required' })
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Mock data for clinical encounters
    // In a real implementation, this would query your database
    const mockEncounters = [
      {
        id: '1',
        patient_id: id,
        visit_date: '2026-04-02',
        chief_complaint: 'Routine diabetes follow-up',
        assessment: 'Blood sugar levels slightly elevated. Continue current medication regimen.',
        diagnosis: 'Type 2 diabetes, uncontrolled',
        treatment_plan: 'Continue Metformin 500mg twice daily. Dietary counseling provided.',
        doctor_id: '1',
        doctor_name: 'Dr. Ramesh Iyer',
        status: 'COMPLETED',
        created_at: '2026-04-02T10:30:00Z',
        updated_at: '2026-04-02T11:00:00Z'
      },
      {
        id: '2',
        patient_id: id,
        visit_date: '2026-03-15',
        chief_complaint: 'Headache and fatigue',
        assessment: 'Patient reports increased stress. Blood pressure elevated.',
        diagnosis: 'Hypertension',
        treatment_plan: 'Started Amlodipine 5mg once daily. Lifestyle modifications discussed.',
        doctor_id: '2',
        doctor_name: 'Dr. Sarah Chen',
        status: 'COMPLETED',
        created_at: '2026-03-15T14:20:00Z',
        updated_at: '2026-03-15T15:00:00Z'
      },
      {
        id: '3',
        patient_id: id,
        visit_date: '2026-02-28',
        chief_complaint: 'Annual checkup',
        assessment: 'Patient in stable condition. All vitals within normal range.',
        diagnosis: 'Type 2 diabetes, controlled',
        treatment_plan: 'Continue current medications. Follow up in 3 months.',
        doctor_id: '1',
        doctor_name: 'Dr. Ramesh Iyer',
        status: 'COMPLETED',
        created_at: '2026-02-28T09:15:00Z',
        updated_at: '2026-02-28T09:45:00Z'
      }
    ]

    if (method === 'GET') {
      // Return encounters for this patient
      return res.status(200).json(mockEncounters)
    }
    
    if (method === 'POST') {
      // Create a new clinical encounter
      const newEncounter = {
        id: String(Date.now()),
        patient_id: id,
        ...req.body,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // In a real implementation, save to database
      mockEncounters.push(newEncounter)
      
      return res.status(201).json(newEncounter)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: `Method ${method} not allowed` })

  } catch (error) {
    console.error('Error in encounters API:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
