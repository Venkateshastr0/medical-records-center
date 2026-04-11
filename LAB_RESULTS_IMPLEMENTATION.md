# Lab Results File Upload Feature Implementation

## Overview
This implementation adds a comprehensive file upload feature for lab results that allows nurse users to upload lab result files for patients and displays them in the doctor's patient management interface.

## Features Implemented

### 1. Database Schema Updates
- **File**: `src-tauri/src/database.rs`
- **Changes**: Added file storage columns to `lab_results` table:
  - `file_path TEXT` - Path to stored file
  - `file_name TEXT` - Original filename
  - `file_size INTEGER` - File size in bytes
  - `mime_type TEXT` - MIME type of the file

### 2. Backend API Commands
- **File**: `src-tauri/src/commands/lab_results.rs`
- **New Commands**:
  - `get_lab_results()` - Retrieve lab results with optional filtering
  - `get_lab_result(id)` - Get specific lab result
  - `create_lab_result(request)` - Create lab result with file upload
  - `update_lab_result(request)` - Update existing lab result
  - `delete_lab_result(id)` - Delete lab result and associated file
  - `get_lab_result_file(id)` - Download lab result file

### 3. File Upload Component
- **File**: `src-next/pages/lab-results/add.tsx`
- **Features**:
  - Drag-and-drop file upload
  - File validation (size: max 10MB, types: PDF, JPG, PNG, GIF, TXT)
  - File preview and removal
  - Integration with lab result form
  - Pre-fills patient ID when coming from patient page

### 4. Patient Details Integration
- **File**: `src-next/pages/patients/[id].tsx`
- **Features**:
  - Real-time lab results display using Tauri API
  - File download functionality for each lab result
  - Filterable lab results by category and status
  - "Add Lab Result" button for nurse users
  - Visual indicators for abnormal results

### 5. Security & Permissions
- **File**: `src-tauri/tauri.conf.json`
- **Updates**:
  - File system permissions for uploads directory
  - Scoped file access for security

## User Workflow

### For Nurse Users:
1. Navigate to patient details page
2. Click "Lab Results" tab
3. Click "Add Lab Result" button
4. Fill in lab result information
5. Upload lab result file (optional)
6. Submit form

### For Doctor Users:
1. Navigate to patient details page
2. Click "Lab Results" tab
3. View all lab results with file attachments
4. Click download link to view uploaded files
5. Filter results by category or status

## Technical Implementation Details

### File Storage
- Files are stored in `uploads/lab_results/` directory
- Filenames are generated with timestamp and UUID for uniqueness
- File metadata is stored in database for retrieval

### File Upload Process
1. Frontend validates file (size, type)
2. File is converted to Uint8Array
3. Data is sent to Tauri backend
4. Backend saves file to disk and stores metadata in database
5. Success response returns lab result details

### File Download Process
1. User clicks download link
2. Frontend calls `get_lab_result_file` command
3. Backend reads file from disk and returns binary data
4. Frontend creates blob and triggers download

## Testing

### Manual Testing Steps:
1. Start the Tauri application
2. Navigate to `/test-lab-upload` to run automated tests
3. Test file upload workflow:
   - Go to `/lab-results/add?patient_id=[patient-id]`
   - Fill form and upload a test PDF
   - Verify submission success
4. Test file display and download:
   - Go to `/patients/[patient-id]`
   - Click "Lab Results" tab
   - Verify uploaded result appears
   - Test file download functionality

### Test Files Recommended:
- Small PDF file (< 1MB)
- JPEG image file
- Text file
- Large file (> 5MB) to test size validation

## Configuration Notes

### Tauri Configuration
- File system permissions are scoped to uploads directory
- Database file access is properly configured
- Dialog permissions are enabled for file operations

### Frontend Dependencies
- React Query for data fetching
- Heroicons for UI components
- Existing Tailwind CSS for styling

## Security Considerations
- File type validation prevents executable uploads
- File size limits prevent storage abuse
- Scoped file system access prevents unauthorized file access
- File names are sanitized and made unique

## Future Enhancements
- File preview in browser (PDF viewer, image viewer)
- Batch file upload for multiple lab results
- File compression for storage optimization
- Audit logging for file access
- Integration with external lab systems

## Troubleshooting

### Common Issues:
1. **File upload fails**: Check file size and type validation
2. **Download doesn't work**: Verify file exists in uploads directory
3. **Lab results not showing**: Check database connection and API calls
4. **Permission errors**: Verify Tauri configuration file permissions

### Debug Steps:
1. Check browser console for frontend errors
2. Check Tauri devtools for backend errors
3. Verify database schema is updated
4. Check file permissions in uploads directory
