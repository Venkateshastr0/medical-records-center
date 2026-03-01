# Laptop Data Server Setup Guide

## Overview
Convert your laptop into a dedicated data server for the Medical Records Center application.

## Prerequisites
- Windows 10/11 Laptop
- Administrative privileges
- Stable internet connection
- At least 50GB free disk space

## Step 1: Server Configuration

### 1.1 Enable Windows Features
1. Open "Turn Windows features on or off"
2. Enable:
   - Internet Information Services (IIS)
   - Windows Authentication
   - .NET Framework 4.8
   - Telnet Client (for testing)

### 1.2 Configure Network
1. Set static IP address
2. Configure firewall rules
3. Enable port forwarding if needed

### 1.3 Install Required Software
- SQL Server Express
- Node.js (for web server)
- Git (for version control)

## Step 2: Database Setup

### 2.1 Install SQL Server Express
```sql
-- Create database
CREATE DATABASE MedicalRecordsDB;
GO

-- Create tables (see database-schema.sql)
```

### 2.2 Configure Database
- Enable remote connections
- Set up authentication
- Create backup schedule

## Step 3: Web Server Setup

### 3.1 Configure IIS
1. Open IIS Manager
2. Create new website
3. Set up HTTPS certificate
4. Configure application pool

### 3.2 Deploy Application
- Copy application files
- Configure web.config
- Test connectivity

## Step 4: Security Configuration

### 4.1 Windows Security
- Enable Windows Defender
- Configure firewall rules
- Set up user accounts

### 4.2 Application Security
- Configure SSL certificates
- Set up authentication
- Enable audit logging

## Step 5: Monitoring Setup

### 5.1 Performance Monitoring
- Set up Windows Performance Monitor
- Configure database monitoring
- Set up log monitoring

### 5.2 Backup Strategy
- Configure automatic backups
- Set up off-site backup
- Test recovery procedures

## Step 6: Testing

### 6.1 Connectivity Testing
- Test local connections
- Test remote connections
- Test mobile access

### 6.2 Performance Testing
- Load testing
- Stress testing
- Security testing

## Maintenance

### Daily Tasks
- Check server status
- Review logs
- Verify backups

### Weekly Tasks
- Update security patches
- Clean up old logs
- Performance optimization

### Monthly Tasks
- Security audit
- Capacity planning
- Disaster recovery testing

## Troubleshooting

### Common Issues
- Connection refused
- Authentication failed
- Database connection issues
- Performance problems

### Solutions
- Check firewall settings
- Verify credentials
- Test database connectivity
- Monitor resource usage
