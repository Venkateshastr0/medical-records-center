# Dashboard Modifications for Data Server

## Overview
Modify the Medical Records Center dashboard to display server statistics and real-time data monitoring.

## Required Modifications

### 1. Server Status Dashboard
Add new dashboard section to monitor server health and performance.

### 2. Real-time Data Visualization
Implement live data updates and charts for server metrics.

### 3. Data Analytics
Add comprehensive analytics for hospital operations.

## Implementation Steps

### Step 1: Server Monitoring Dashboard

#### 1.1 Add Server Status View
```csharp
// New ViewModel: ServerStatusViewModel.cs
public class ServerStatusViewModel : ObservableObject
{
    [ObservableProperty]
    private ServerMetrics _serverMetrics;
    
    [ObservableProperty]
    private ObservableCollection<DatabaseMetrics> _databaseMetrics;
    
    [ObservableProperty]
    private ObservableCollection<PerformanceMetric> _performanceMetrics;
    
    // Real-time server monitoring
    public async Task StartMonitoring()
    {
        // Monitor CPU, Memory, Disk usage
        // Monitor database connections
        // Monitor active users
        // Monitor data transfer rates
    }
}
```

#### 1.2 Add Server Status View
```xml
<!-- Views/ServerStatusWindow.xaml -->
<UserControl x:Class="MedicalRecordsCenter.Views.ServerStatusWindow">
    <Grid>
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>
        
        <!-- Server Metrics Cards -->
        <Grid Grid.Row="0" Margin="20,15">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>
            
            <!-- CPU Usage -->
            <Border Grid.Column="0" Style="{StaticResource StatisticsCard}">
                <StackPanel>
                    <TextBlock Text="CPU Usage" Style="{StaticResource Caption1}"/>
                    <TextBlock Text="{Binding ServerMetrics.CpuUsage, StringFormat='{}%'}" 
                               Style="{StaticResource Header4}"/>
                    <ProgressBar Value="{Binding ServerMetrics.CpuUsage}" Maximum="100"/>
                </StackPanel>
            </Border>
            
            <!-- Memory Usage -->
            <Border Grid.Column="1" Style="{StaticResource StatisticsCard}">
                <StackPanel>
                    <TextBlock Text="Memory Usage" Style="{StaticResource Caption1}"/>
                    <TextBlock Text="{Binding ServerMetrics.MemoryUsage, StringFormat='{}%'}" 
                               Style="{StaticResource Header4}"/>
                    <ProgressBar Value="{Binding ServerMetrics.MemoryUsage}" Maximum="100"/>
                </StackPanel>
            </Border>
            
            <!-- Disk Usage -->
            <Border Grid.Column="2" Style="{StaticResource StatisticsCard}">
                <StackPanel>
                    <TextBlock Text="Disk Usage" Style="{StaticResource Caption1}"/>
                    <TextBlock Text="{Binding ServerMetrics.DiskUsage, StringFormat='{}%'}" 
                               Style="{StaticResource Header4}"/>
                    <ProgressBar Value="{Binding ServerMetrics.DiskUsage}" Maximum="100"/>
                </StackPanel>
            </Border>
            
            <!-- Active Connections -->
            <Border Grid.Column="3" Style="{StaticResource StatisticsCard}">
                <StackPanel>
                    <TextBlock Text="Active Users" Style="{StaticResource Caption1}"/>
                    <TextBlock Text="{Binding ServerMetrics.ActiveConnections}" 
                               Style="{StaticResource Header4}"/>
                </StackPanel>
            </Border>
        </Grid>
        
        <!-- Performance Charts -->
        <Grid Grid.Row="1" Margin="20,15">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>
            
            <!-- CPU History Chart -->
            <Border Grid.Column="0" Style="{StaticResource BasicCard}" Margin="0,0,10,0">
                <StackPanel>
                    <TextBlock Text="CPU Usage History" Style="{StaticResource Header6}"/>
                    <Chart:LineChart ItemsSource="{Binding CpuHistory}" 
                                       XValuePath="Timestamp" 
                                       YValuePath="Value"/>
                </StackPanel>
            </Border>
            
            <!-- Memory History Chart -->
            <Border Grid.Column="1" Style="{StaticResource BasicCard}" Margin="10,0,0,0">
                <StackPanel>
                    <TextBlock Text="Memory Usage History" Style="{StaticResource Header6}"/>
                    <Chart:LineChart ItemsSource="{Binding MemoryHistory}" 
                                       XValuePath="Timestamp" 
                                       YValuePath="Value"/>
                </StackPanel>
            </Border>
        </Grid>
    </Grid>
</UserControl>
```

### Step 2: Database Analytics Dashboard

#### 2.1 Add Database Analytics ViewModel
```csharp
public class DatabaseAnalyticsViewModel : ObservableObject
{
    [ObservableProperty]
    private ObservableCollection<DatabaseMetric> _databaseMetrics;
    
    [ObservableProperty]
    private ObservableCollection<DataGrowthMetric> _dataGrowthMetrics;
    
    [ObservableProperty]
    private ObservableCollection<QueryPerformanceMetric> _queryPerformanceMetrics;
    
    public async Task LoadDatabaseMetrics()
    {
        // Load database size, table sizes, index usage
        // Load query performance metrics
        // Load data growth trends
        // Load backup status
    }
}
```

#### 2.2 Add Database Analytics View
```xml
<!-- Views/DatabaseAnalyticsWindow.xaml -->
<UserControl x:Class="MedicalRecordsCenter.Views.DatabaseAnalyticsWindow">
    <Grid>
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>
        
        <!-- Database Overview -->
        <Border Grid.Row="0" Style="{StaticResource BasicCard}" Margin="20,15">
            <Grid>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>
                
                <!-- Database Size -->
                <StackPanel Grid.Column="0">
                    <TextBlock Text="Database Size" Style="{StaticResource Caption1}"/>
                    <TextBlock Text="{Binding DatabaseSize, StringFormat='{} GB'}" 
                               Style="{StaticResource Header4}"/>
                </StackPanel>
                
                <!-- Total Records -->
                <StackPanel Grid.Column="1">
                    <TextBlock Text="Total Records" Style="{StaticResource Caption1}"/>
                    <TextBlock Text="{Binding TotalRecords}" 
                               Style="{StaticResource Header4}"/>
                </StackPanel>
                
                <!-- Active Connections -->
                <StackPanel Grid.Column="2">
                    <TextBlock Text="Active Connections" Style="{StaticResource Caption1}"/>
                    <TextBlock Text="{Binding ActiveConnections}" 
                               Style="{StaticResource Header4}"/>
                </StackPanel>
                
                <!-- Last Backup -->
                <StackPanel Grid.Column="3">
                    <TextBlock Text="Last Backup" Style="{StaticResource Caption1}"/>
                    <TextBlock Text="{Binding LastBackup}" 
                               Style="{StaticResource Header4}"/>
                </StackPanel>
            </Grid>
        </Border>
        
        <!-- Detailed Analytics -->
        <TabControl Grid.Row="1" Margin="20,15">
            <!-- Table Sizes -->
            <TabItem Header="Table Sizes">
                <DataGrid ItemsSource="{Binding TableSizes}" 
                          AutoGenerateColumns="False">
                    <DataGrid.Columns>
                        <DataGridTextColumn Header="Table Name" Binding="{Binding TableName}"/>
                        <DataGridTextColumn Header="Record Count" Binding="{Binding RecordCount}"/>
                        <DataGridTextColumn Header="Size (MB)" Binding="{Binding SizeMB}"/>
                        <DataGridTextColumn Header="Growth %" Binding="{Binding GrowthPercentage}"/>
                    </DataGrid.Columns>
                </DataGrid>
            </TabItem>
            
            <!-- Query Performance -->
            <TabItem Header="Query Performance">
                <DataGrid ItemsSource="{Binding QueryPerformance}" 
                          AutoGenerateColumns="False">
                    <DataGrid.Columns>
                        <DataGridTextColumn Header="Query" Binding="{Binding QueryText}"/>
                        <DataGridTextColumn Header="Avg Duration" Binding="{Binding AverageDuration}"/>
                        <DataGridTextColumn Header="Executions" Binding="{Binding ExecutionCount}"/>
                        <DataGridTextColumn Header="CPU Time" Binding="{Binding CpuTime}"/>
                    </DataGrid.Columns>
                </DataGrid>
            </TabItem>
            
            <!-- Data Growth -->
            <TabItem Header="Data Growth">
                <Chart:LineChart ItemsSource="{Binding DataGrowthMetrics}" 
                                   XValuePath="Date" 
                                   YValuePath="SizeGB"/>
            </TabItem>
        </TabControl>
    </Grid>
</UserControl>
```

### Step 3: Real-time Data Updates

#### 3.1 Add SignalR Hub for Real-time Updates
```csharp
// Hubs/MonitoringHub.cs
[Hub]
public class MonitoringHub : Hub
{
    public async Task JoinMonitoringGroup(string hospitalId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Hospital_{hospitalId}");
    }
    
    public async Task SendServerMetrics(ServerMetrics metrics)
    {
        await Clients.Group($"Hospital_{metrics.HospitalId}")
                   .SendAsync("ReceiveServerMetrics", metrics);
    }
    
    public async Task SendDatabaseMetrics(DatabaseMetrics metrics)
    {
        await Clients.Group($"Hospital_{metrics.HospitalId}")
                   .SendAsync("ReceiveDatabaseMetrics", metrics);
    }
}
```

#### 3.2 Add Real-time Monitoring Service
```csharp
public class RealTimeMonitoringService : BackgroundService
{
    private readonly IHubContext<MonitoringHub> _hubContext;
    private readonly ILogger<RealTimeMonitoringService> _logger;
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Collect server metrics
                var serverMetrics = await CollectServerMetrics();
                
                // Collect database metrics
                var databaseMetrics = await CollectDatabaseMetrics();
                
                // Send to connected clients
                await _hubContext.Clients.All.SendAsync("ReceiveServerMetrics", serverMetrics);
                await _hubContext.Clients.All.SendAsync("ReceiveDatabaseMetrics", databaseMetrics);
                
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in real-time monitoring");
            }
        }
    }
}
```

### Step 4: Data Visualization Enhancements

#### 4.1 Add Chart Controls
```xml
<!-- Add to App.xaml -->
<ResourceDictionary>
    <ResourceDictionary.MergedDictionaries>
        <ResourceDictionary Source="pack://application:,,,/LiveCharts.Wpf;component/Themes/Default.xaml" />
    </ResourceDictionary.MergedDictionaries>
</ResourceDictionary>
```

#### 4.2 Add Custom Chart Components
```csharp
// Controls/MetricChart.xaml.cs
public partial class MetricChart : UserControl
{
    public static readonly DependencyProperty TitleProperty =
        DependencyProperty.Register("Title", typeof(string), typeof(MetricChart));
    
    public static readonly DependencyProperty DataPointsProperty =
        DependencyProperty.Register("DataPoints", typeof(ObservableCollection<DataPoint>), typeof(MetricChart));
    
    public string Title
    {
        get => (string)GetValue(TitleProperty);
        set => SetValue(TitleProperty, value);
    }
    
    public ObservableCollection<DataPoint> DataPoints
    {
        get => (ObservableCollection<DataPoint>)GetValue(DataPointsProperty);
        set => SetValue(DataPointsProperty, value);
    }
    
    public MetricChart()
    {
        InitializeComponent();
    }
}
```

### Step 5: Integration with Main Application

#### 5.1 Update MainWindowViewModel
```csharp
public partial class MainWindowViewModel : ObservableObject
{
    // Add new navigation items
    public ObservableCollection<NavigationItem> NavigationItems { get; } = new()
    {
        // Existing items...
        new NavigationItem { Name = "Server Status", Icon = "Server", Command = NavigateToServerStatusCommand },
        new NavigationItem { Name = "Database Analytics", Icon = "Database", Command = NavigateToDatabaseAnalyticsCommand },
        new NavigationItem { Name = "Real-time Monitoring", Icon = "Monitor", Command = NavigateToRealTimeMonitoringCommand }
    };
    
    [RelayCommand]
    private async Task NavigateToServerStatus()
    {
        var serverStatusViewModel = new ServerStatusViewModel(_logger);
        CurrentView = serverStatusViewModel;
        await serverStatusViewModel.StartMonitoring();
    }
    
    [RelayCommand]
    private async Task NavigateToDatabaseAnalytics()
    {
        var databaseAnalyticsViewModel = new DatabaseAnalyticsViewModel(_logger);
        CurrentView = databaseAnalyticsViewModel;
        await databaseAnalyticsViewModel.LoadDatabaseMetrics();
    }
}
```

### Step 6: Configuration Updates

#### 6.1 Add Monitoring Configuration
```json
// appsettings.json
{
  "Monitoring": {
    "EnableRealTimeMonitoring": true,
    "MetricsCollectionInterval": 5,
    "DataRetentionDays": 30,
    "AlertThresholds": {
      "CpuUsage": 80,
      "MemoryUsage": 85,
      "DiskUsage": 90,
      "ActiveConnections": 100
    }
  },
  "Database": {
    "EnableQueryLogging": true,
    "EnablePerformanceMonitoring": true,
    "SlowQueryThreshold": 1000
  }
}
```

### Step 7: Alert System

#### 7.1 Add Alert Service
```csharp
public class AlertService : IAlertService
{
    public async Task CheckThresholds(ServerMetrics metrics)
    {
        var alerts = new List<Alert>();
        
        if (metrics.CpuUsage > 80)
        {
            alerts.Add(new Alert
            {
                Type = "CPU_HIGH",
                Message = $"CPU usage is {metrics.CpuUsage}%",
                Severity = "Warning",
                Timestamp = DateTime.Now
            });
        }
        
        if (metrics.MemoryUsage > 85)
        {
            alerts.Add(new Alert
            {
                Type = "MEMORY_HIGH",
                Message = $"Memory usage is {metrics.MemoryUsage}%",
                Severity = "Critical",
                Timestamp = DateTime.Now
            });
        }
        
        // Send alerts to dashboard
        await SendAlertsToDashboard(alerts);
    }
}
```

## Testing and Deployment

### 1. Unit Testing
- Test server metrics collection
- Test database analytics
- Test real-time updates
- Test alert system

### 2. Integration Testing
- Test dashboard integration
- Test data flow
- Test performance under load
- Test error handling

### 3. Performance Testing
- Test with large datasets
- Test concurrent users
- Test real-time updates
- Test memory usage

### 4. Deployment
- Update application configuration
- Deploy monitoring services
- Configure alerts
- Test production environment

## Benefits

1. **Real-time Monitoring**: Live server performance tracking
2. **Database Analytics**: Comprehensive database insights
3. **Alert System**: Proactive issue detection
4. **Data Visualization**: Intuitive charts and graphs
5. **Scalability**: Handle increased data volume
6. **Performance**: Optimized query performance
7. **Reliability**: Improved system reliability

## Future Enhancements

1. **Machine Learning**: Predictive analytics
2. **Mobile Dashboard**: Mobile monitoring app
3. **API Integration**: Third-party monitoring tools
4. **Cloud Integration**: Cloud-based monitoring
5. **Advanced Analytics**: Business intelligence features
