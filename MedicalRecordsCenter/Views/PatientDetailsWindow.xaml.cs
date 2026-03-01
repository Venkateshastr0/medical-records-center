using System.Windows;
using MedicalRecordsCenter.Data.Models;

namespace MedicalRecordsCenter.Views
{
    public partial class PatientDetailsWindow : Window
    {
        public PatientDetailsWindow()
        {
            InitializeComponent();
        }

        public PatientDetailsWindow(Patient patient) : this()
        {
            LoadPatientData(patient);
        }

        private void LoadPatientData(Patient patient)
        {
            try
            {
                // Patient Summary
                PatientNameTextBlock.Text = patient.FullName;
                PatientAgeTextBlock.Text = $"Age: {patient.Age}";
                PatientGenderTextBlock.Text = $"Gender: {patient.Gender}";
                PatientBloodTypeTextBlock.Text = $"Blood Type: {patient.BloodType}";
                PatientIdTextBlock.Text = $"ID: {patient.Id}";

                // Contact Information
                PatientPhoneTextBlock.Text = patient.PhoneNumber ?? "Not provided";
                PatientEmailTextBlock.Text = patient.Email ?? "Not provided";
                PatientAddressTextBlock.Text = patient.Address ?? "Not provided";

                // Medical Information
                PatientDOBTextBlock.Text = patient.DateOfBirth;
                PatientEmergencyContactTextBlock.Text = patient.EmergencyContact ?? "Not provided";
                PatientPCPTextBlock.Text = patient.PrimaryCarePhysician ?? "Not provided";
                PatientInsuranceTextBlock.Text = !string.IsNullOrEmpty(patient.InsuranceProvider) 
                    ? $"{patient.InsuranceProvider} - {patient.InsurancePolicyNumber}"
                    : "Not provided";

                // Medical Information
                PatientMedicalHistoryTextBlock.Text = !string.IsNullOrEmpty(patient.MedicalHistory)
                    ? patient.MedicalHistory
                    : "No significant medical history.";

                PatientAllergiesTextBlock.Text = !string.IsNullOrEmpty(patient.Allergies)
                    ? patient.Allergies
                    : "No known allergies.";

                PatientMedicationsTextBlock.Text = !string.IsNullOrEmpty(patient.CurrentMedications)
                    ? patient.CurrentMedications
                    : "No current medications.";

                PatientNotesTextBlock.Text = !string.IsNullOrEmpty(patient.Notes)
                    ? patient.Notes
                    : "No additional notes.";
            }
            catch (Exception ex)
            {
                StatusTextBlock.Text = $"Error loading patient data: {ex.Message}";
                StatusTextBlock.Foreground = System.Windows.Media.Brushes.Red;
            }
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void EditButton_Click(object sender, RoutedEventArgs e)
        {
            // TODO: Implement edit patient functionality
            StatusTextBlock.Text = "Edit functionality not yet implemented";
            StatusTextBlock.Foreground = System.Windows.Media.Brushes.Orange;
        }

        private void PrintButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                // TODO: Implement print functionality
                StatusTextBlock.Text = "Print functionality not yet implemented";
                StatusTextBlock.Foreground = System.Windows.Media.Brushes.Orange;
            }
            catch (Exception ex)
            {
                StatusTextBlock.Text = $"Error printing: {ex.Message}";
                StatusTextBlock.Foreground = System.Windows.Media.Brushes.Red;
            }
        }
    }
}
