using System.Windows;
using MedicalRecordsCenter.ViewModels;

namespace MedicalRecordsCenter.Views
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            DataContext = new MainWindowViewModel();
        }
    }
}
