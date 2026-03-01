using System;
using System.Windows;
using MedicalRecordsCenter.Data.Models;

namespace MedicalRecordsCenter.Views
{
    public partial class EditPatientWindow : Window
    {
        private readonly Patient _patient;

        public EditPatientWindow()
        {
            InitializeComponent();
        }

        public EditPatientWindow(Patient patient) : this()
        {
            _patient = patient;
            LoadPatientData();
        }

        private void LoadPatientData()
        {
            try
            {
                // Personal Information
                FirstNameTextBox.Text = _patient.FirstName;
                LastNameTextBox.Text = _patient.LastName;
                
                if (DateTime.TryParse(_patient.DateOfBirth, out DateTime dob))
                {
                    DateOfBirthDatePicker.SelectedDate = dob;
                }
                
                GenderComboBox.SelectedItem = _patient.Gender ?? "Other";
                PhoneNumberTextBox.Text = _patient.PhoneNumber;
                EmailTextBox.Text = _patient.Email;
                AddressTextBox.Text = _patient.Address;

                // Medical Information
                BloodTypeComboBox.SelectedItem = _patient.BloodType ?? "O+";
                EmergencyContactTextBox.Text = _patient.EmergencyContact;
                AllergiesTextBox.Text = _patient.Allergies;
                MedicalHistoryTextBox.Text = _patient.MedicalHistory;
                CurrentMedicationsTextBox.Text = _patient.CurrentMedications;
                PrimaryCarePhysicianTextBox.Text = _patient.PrimaryCarePhysician;
                NotesTextBox.Text = _patient.Notes;

                // Insurance Information
                InsuranceProviderTextBox.Text = _patient.InsuranceProvider;
                PolicyNumberTextBox.Text = _patient.InsurancePolicyNumber;
            }
            catch (Exception ex)
            {
                StatusTextBlock.Text = $"Error loading patient data: {ex.Message}";
                StatusTextBlock.Foreground = System.Windows.Media.Brushes.Red;
            }
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

                // Update patient object
                _patient.FirstName = FirstNameTextBox.Text.Trim();
                _patient.LastName = LastNameTextBox.Text.Trim();
                _patient.DateOfBirth = DateOfBirthDatePicker.SelectedDate.Value.ToString("yyyy-MM-dd");
                _patient.Gender = GenderComboBox.SelectedItem?.ToString() ?? "Other";
                _patient.PhoneNumber = PhoneNumberTextBox.Text.Trim();
                _patient.Email = EmailTextBox.Text.Trim();
                _patient.Address = AddressTextBox.Text.Trim();
                _patient.BloodType = BloodTypeComboBox.SelectedItem?.ToString() ?? "O+";
                _patient.EmergencyContact = EmergencyContactTextBox.Text.Trim();
                _patient.Allergies = AllergiesTextBox.Text.Trim();
                _patient.MedicalHistory = MedicalHistoryTextBox.Text.Trim();
                _patient.CurrentMedications = CurrentMedicationsTextBox.Text.Trim();
                _patient.PrimaryCarePhysician = PrimaryCarePhysicianTextBox.Text.Trim();
                _patient.Notes = NotesTextBox.Text.Trim();
                _patient.InsuranceProvider = InsuranceProviderTextBox.Text.Trim();
                _patient.InsurancePolicyNumber = PolicyNumberTextBox.Text.Trim();
                _patient.UpdatedAt = DateTime.UtcNow;

                // Validate patient data
                // TODO: Add validation logic

                StatusTextBlock.Text = "Patient updated successfully";
                StatusTextBlock.Foreground = System.Windows.Media.Brushes.Green;

                // Close window with success
                DialogResult = true;
                Close();
            }
            catch (Exception ex)
            {
                StatusTextBlock.Text = $"Error updating patient: {ex.Message}";
                StatusTextBlock.Foreground = System.Windows.Media.Brushes.Red;
            }
        }
    }
}
