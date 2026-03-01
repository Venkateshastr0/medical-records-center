using System;
using System.Windows;
using MedicalRecordsCenter.Data.Models;

namespace MedicalRecordsCenter.Views
{
    public partial class AddPatientWindow : Window
    {
        public AddPatientWindow()
        {
            InitializeComponent();
            
            // Set default values
            DateOfBirthDatePicker.SelectedDate = DateTime.Today.AddYears(-30); // Default to 30 years ago
            GenderComboBox.SelectedIndex = 0; // Default to Male
            BloodTypeComboBox.SelectedIndex = 0; // Default to A+
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }

        private void CancelButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }

        private async void SaveButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                // Validate required fields
                if (string.IsNullOrWhiteSpace(FirstNameTextBox.Text))
                {
                    StatusTextBlock.Text = "First name is required";
                    StatusTextBlock.Foreground = System.Windows.Media.Brushes.Red;
                    return;
                }

                if (string.IsNullOrWhiteSpace(LastNameTextBox.Text))
                {
                    StatusTextBlock.Text = "Last name is required";
                    StatusTextBlock.Foreground = System.Windows.Media.Brushes.Red;
                    return;
                }

                if (DateOfBirthDatePicker.SelectedDate == null)
                {
                    StatusTextBlock.Text = "Date of birth is required";
                    StatusTextBlock.Foreground = System.Windows.Media.Brushes.Red;
                    return;
                }

                // Create patient object
                var patient = new Patient
                {
                    FirstName = FirstNameTextBox.Text.Trim(),
                    LastName = LastNameTextBox.Text.Trim(),
                    DateOfBirth = DateOfBirthDatePicker.SelectedDate.Value.ToString("yyyy-MM-dd"),
                    Gender = GenderComboBox.SelectedItem?.ToString() ?? "Other",
                    PhoneNumber = PhoneNumberTextBox.Text.Trim(),
                    Email = EmailTextBox.Text.Trim(),
                    Address = AddressTextBox.Text.Trim(),
                    BloodType = BloodTypeComboBox.SelectedItem?.ToString() ?? "O+",
                    EmergencyContact = EmergencyContactTextBox.Text.Trim(),
                    Allergies = AllergiesTextBox.Text.Trim(),
                    MedicalHistory = MedicalHistoryTextBox.Text.Trim(),
                    CurrentMedications = CurrentMedicationsTextBox.Text.Trim(),
                    PrimaryCarePhysician = PrimaryCarePhysicianTextBox.Text.Trim(),
                    Notes = NotesTextBox.Text.Trim(),
                    InsuranceProvider = InsuranceProviderTextBox.Text.Trim(),
                    InsurancePolicyNumber = PolicyNumberTextBox.Text.Trim(),
                    HospitalId = "HOSPITAL-001", // TODO: Get from current session
                    CreatedBy = "SYSTEM", // TODO: Get from current session
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Validate patient data
                // TODO: Add validation logic

                StatusTextBlock.Text = "Patient created successfully";
                StatusTextBlock.Foreground = System.Windows.Media.Brushes.Green;

                // Close window with success
                DialogResult = true;
                Close();
            }
            catch (Exception ex)
            {
                StatusTextBlock.Text = $"Error saving patient: {ex.Message}";
                StatusTextBlock.Foreground = System.Windows.Media.Brushes.Red;
            }
        }
    }
}
