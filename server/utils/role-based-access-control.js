const crypto = require('crypto');

class RoleBasedAccessControl {
  constructor() {
    this.rolePermissions = new Map();
    this.initializeRolePermissions();
  }

  // Initialize comprehensive role permissions
  initializeRolePermissions() {
    // Hospital Server Roles
    this.rolePermissions.set('Doctor', {
      server: 'hospital',
      permissions: {
        // Patient Management
        'patients.view': true,
        'patients.create': true,
        'patients.update': true,
        'patients.delete': false,
        
        // Medical Records
        'records.view': true,
        'records.create': true,
        'records.update': true,
        'records.delete': false,
        'records.export': true,
        
        // Reports
        'reports.create': true,
        'reports.view': true,
        'reports.send': true,
        'reports.receive': false,
        
        // System
        'system.users': false,
        'system.admin': false,
        'system.backup': false,
        'system.logs': false,
        
        // Communication
        'sip.send_to_admin': true,
        'sip.receive_from_admin': false,
        'sip.assign': false
      },
      dataAccess: {
        patients: 'own',
        records: 'own',
        reports: 'own',
        system: 'none'
      }
    });

    this.rolePermissions.set('Hospital Reception', {
      server: 'hospital',
      permissions: {
        // Patient Management
        'patients.view': true,
        'patients.create': true,
        'patients.update': true,
        'patients.delete': false,
        
        // Medical Records
        'records.view': true,
        'records.create': false,
        'records.update': false,
        'records.delete': false,
        'records.export': false,
        
        // Reports
        'reports.create': false,
        'reports.view': true,
        'reports.send': true,
        'reports.receive': false,
        
        // System
        'system.users': false,
        'system.admin': false,
        'system.backup': false,
        'system.logs': false,
        
        // Communication
        'sip.send_to_admin': true,
        'sip.receive_from_admin': false,
        'sip.assign': false
      },
      dataAccess: {
        patients: 'all',
        records: 'view_only',
        reports: 'view_only',
        system: 'none'
      }
    });

    // Company Server Roles
    this.rolePermissions.set('Admin', {
      server: 'company',
      permissions: {
        // User Management
        'users.view': true,
        'users.create': true,
        'users.update': true,
        'users.delete': true,
        'users.assign': true,
        
        // Data Management
        'data.view': true,
        'data.create': true,
        'data.update': true,
        'data.delete': true,
        'data.export': true,
        'data.import': true,
        
        // System Administration
        'system.admin': true,
        'system.backup': true,
        'system.restore': true,
        'system.logs': true,
        'system.config': true,
        
        // Communication
        'sip.receive_from_hospital': true,
        'sip.send_to_hospital': true,
        'sip.assign_to_tl': true,
        'sip.view_all_storage': true,
        
        // Main Server Access
        'main_server.read': true,
        'main_server.write': true,
        'main_server.delete': true
      },
      dataAccess: {
        users: 'all',
        data: 'all',
        system: 'all',
        main_server: 'full'
      }
    });

    this.rolePermissions.set('Team Lead', {
      server: 'company',
      permissions: {
        // User Management
        'users.view': true,
        'users.create': false,
        'users.update': false,
        'users.delete': false,
        'users.assign': false,
        
        // Data Management
        'data.view': true,
        'data.create': false,
        'data.update': true,
        'data.delete': false,
        'data.export': true,
        'data.import': false,
        
        // System Administration
        'system.admin': false,
        'system.backup': false,
        'system.restore': false,
        'system.logs': false,
        'system.config': false,
        
        // Communication
        'sip.receive_from_admin': true,
        'sip.send_to_admin': false,
        'sip.assign_to_analyst': true,
        'sip.view_own_storage': true,
        
        // Main Server Access
        'main_server.read': false,
        'main_server.write': false,
        'main_server.delete': false
      },
      dataAccess: {
        users: 'team_only',
        data: 'assigned',
        system: 'none',
        main_server: 'none'
      }
    });

    this.rolePermissions.set('Analyst', {
      server: 'company',
      permissions: {
        // User Management
        'users.view': false,
        'users.create': false,
        'users.update': false,
        'users.delete': false,
        'users.assign': false,
        
        // Data Management
        'data.view': true,
        'data.create': true,
        'data.update': true,
        'data.delete': false,
        'data.export': false,
        'data.import': false,
        
        // System Administration
        'system.admin': false,
        'system.backup': false,
        'system.restore': false,
        'system.logs': false,
        'system.config': false,
        
        // Communication
        'sip.receive_from_tl': true,
        'sip.send_to_tl': false,
        'sip.send_to_main': true,
        'sip.view_own_storage': true,
        
        // Main Server Access
        'main_server.read': false,
        'main_server.write': true,
        'main_server.delete': false
      },
      dataAccess: {
        users: 'none',
        data: 'assigned',
        system: 'none',
        main_server: 'write_only'
      }
    });

    this.rolePermissions.set('Production', {
      server: 'company',
      permissions: {
        // User Management
        'users.view': false,
        'users.create': false,
        'users.update': false,
        'users.delete': false,
        'users.assign': false,
        
        // Data Management
        'data.view': true,
        'data.create': false,
        'data.update': false,
        'data.delete': false,
        'data.export': true,
        'data.import': false,
        
        // System Administration
        'system.admin': false,
        'system.backup': false,
        'system.restore': false,
        'system.logs': false,
        'system.config': false,
        
        // Communication
        'sip.receive_from_analyst': false,
        'sip.send_to_analyst': false,
        'sip.view_main_data': true,
        
        // Main Server Access
        'main_server.read': true,
        'main_server.write': false,
        'main_server.delete': false
      },
      dataAccess: {
        users: 'none',
        data: 'main_server_only',
        system: 'none',
        main_server: 'read_only'
      }
    });

    // Development Server Role
    this.rolePermissions.set('Developer', {
      server: 'development',
      permissions: {
        // System Development
        'system.admin': true,
        'system.config': true,
        'system.logs': true,
        'system.debug': true,
        'system.deploy': true,
        
        // Code Management
        'code.view': true,
        'code.edit': true,
        'code.deploy': true,
        'code.test': true,
        
        // Database Development
        'database.view': true,
        'database.modify': true,
        'database.backup': true,
        'database.restore': true,
        
        // Security Testing
        'security.test': true,
        'security.audit': true,
        'security.pen_test': true
      },
      dataAccess: {
        system: 'full',
        database: 'development_only',
        code: 'full'
      }
    });
  }

  // Check if user has permission for specific action
  hasPermission(role, permission, userId = null, resourceId = null) {
    const roleConfig = this.rolePermissions.get(role);
    
    if (!roleConfig) {
      return {
        allowed: false,
        reason: 'Role not found'
      };
    }

    const hasPermission = roleConfig.permissions[permission] || false;
    
    if (!hasPermission) {
      return {
        allowed: false,
        reason: 'Permission denied for role'
      };
    }

    // Check data access level
    const dataAccessCheck = this.checkDataAccess(role, permission, userId, resourceId);
    if (!dataAccessCheck.allowed) {
      return dataAccessCheck;
    }

    return {
      allowed: true,
      reason: 'Permission granted'
    };
  }

  // Check data access level
  checkDataAccess(role, permission, userId, resourceId) {
    const roleConfig = this.rolePermissions.get(role);
    const dataAccess = roleConfig.dataAccess;

    // Extract resource type from permission
    const resourceType = permission.split('.')[0];
    const accessLevel = dataAccess[resourceType];

    if (!accessLevel || accessLevel === 'none') {
      return {
        allowed: false,
        reason: 'No data access for this resource type'
      };
    }

    // Implement specific access logic based on level
    switch (accessLevel) {
      case 'all':
        return { allowed: true, reason: 'Full access granted' };
      
      case 'own':
        if (!userId || !resourceId) {
          return {
            allowed: false,
            reason: 'User ID and Resource ID required for own data access'
          };
        }
        return this.checkOwnership(userId, resourceId);
      
      case 'assigned':
        if (!userId || !resourceId) {
          return {
            allowed: false,
            reason: 'User ID and Resource ID required for assigned data access'
          };
        }
        return this.checkAssignment(userId, resourceId);
      
      case 'team_only':
        return this.checkTeamAccess(userId);
      
      case 'view_only':
        const isReadOnly = permission.includes('view') || permission.includes('read');
        return {
          allowed: isReadOnly,
          reason: isReadOnly ? 'Read-only access granted' : 'Write access denied'
        };
      
      case 'read_only':
        const isReadOperation = permission.includes('view') || permission.includes('read');
        return {
          allowed: isReadOperation,
          reason: isReadOperation ? 'Read-only access granted' : 'Write access denied'
        };
      
      case 'write_only':
        const isWriteOperation = permission.includes('create') || permission.includes('write') || permission.includes('send');
        return {
          allowed: isWriteOperation,
          reason: isWriteOperation ? 'Write-only access granted' : 'Read access denied'
        };
      
      case 'full':
        return { allowed: true, reason: 'Full access granted' };
      
      default:
        return {
          allowed: false,
          reason: 'Unknown access level'
        };
    }
  }

  // Check if user owns the resource
  checkOwnership(userId, resourceId) {
    // In production, implement actual ownership check
    // For now, return a placeholder
    return {
      allowed: true,
      reason: 'Ownership check passed'
    };
  }

  // Check if resource is assigned to user
  checkAssignment(userId, resourceId) {
    // In production, implement actual assignment check
    // For now, return a placeholder
    return {
      allowed: true,
      reason: 'Assignment check passed'
    };
  }

  // Check team access
  checkTeamAccess(userId) {
    // In production, implement actual team membership check
    // For now, return a placeholder
    return {
      allowed: true,
      reason: 'Team access granted'
    };
  }

  // Get all permissions for a role
  getRolePermissions(role) {
    const roleConfig = this.rolePermissions.get(role);
    
    if (!roleConfig) {
      return {
        error: 'Role not found'
      };
    }

    return {
      role: role,
      server: roleConfig.server,
      permissions: roleConfig.permissions,
      dataAccess: roleConfig.dataAccess
    };
  }

  // Validate role-based endpoint access
  validateEndpointAccess(role, endpoint, method, userId = null) {
    const roleConfig = this.rolePermissions.get(role);
    
    if (!roleConfig) {
      return {
        allowed: false,
        reason: 'Role not found'
      };
    }

    // Check server access
    if (endpoint.startsWith('/api/hospital') && roleConfig.server !== 'hospital') {
      return {
        allowed: false,
        reason: 'Server access denied'
      };
    }

    if (endpoint.startsWith('/api/company') && roleConfig.server !== 'company') {
      return {
        allowed: false,
        reason: 'Server access denied'
      };
    }

    // Map endpoints to permissions
    const permission = this.mapEndpointToPermission(endpoint, method);
    
    if (!permission) {
      return {
        allowed: false,
        reason: 'Endpoint not mapped to permission'
      };
    }

    return this.hasPermission(role, permission, userId);
  }

  // Map endpoint to permission
  mapEndpointToPermission(endpoint, method) {
    const endpointMap = {
      // Patient endpoints
      '/api/patients': {
        'GET': 'patients.view',
        'POST': 'patients.create',
        'PUT': 'patients.update',
        'DELETE': 'patients.delete'
      },
      
      // Medical records endpoints
      '/api/medical': {
        'GET': 'records.view',
        'POST': 'records.create',
        'PUT': 'records.update',
        'DELETE': 'records.delete'
      },
      
      // User management endpoints
      '/api/admin/users': {
        'GET': 'users.view',
        'POST': 'users.create',
        'PUT': 'users.update',
        'DELETE': 'users.delete'
      },
      
      // System endpoints
      '/api/system': {
        'GET': 'system.admin',
        'POST': 'system.admin',
        'PUT': 'system.config'
      },
      
      // SIP endpoints
      '/api/sip/send-to-admin': {
        'POST': 'sip.send_to_admin'
      },
      
      '/api/sip/assign-to-tl': {
        'POST': 'sip.assign_to_tl'
      },
      
      '/api/sip/assign-to-analyst': {
        'POST': 'sip.assign_to_analyst'
      },
      
      '/api/sip/send-to-main': {
        'POST': 'sip.send_to_main'
      },
      
      // Main server endpoints
      '/api/sip/main/data': {
        'GET': 'main_server.read',
        'POST': 'main_server.write',
        'DELETE': 'main_server.delete'
      }
    };

    // Find matching endpoint
    for (const [endpointPattern, permissions] of Object.entries(endpointMap)) {
      if (endpoint.startsWith(endpointPattern)) {
        return permissions[method];
      }
    }

    return null;
  }

  // Get role summary
  getRoleSummary(role) {
    const roleConfig = this.rolePermissions.get(role);
    
    if (!roleConfig) {
      return {
        error: 'Role not found'
      };
    }

    const permissions = roleConfig.permissions;
    const summary = {
      role: role,
      server: roleConfig.server,
      totalPermissions: Object.keys(permissions).length,
      grantedPermissions: Object.values(permissions).filter(p => p === true).length,
      deniedPermissions: Object.values(permissions).filter(p => p === false).length,
      keyCapabilities: []
    };

    // Identify key capabilities
    if (permissions['system.admin']) summary.keyCapabilities.push('System Administration');
    if (permissions['patients.create']) summary.keyCapabilities.push('Patient Management');
    if (permissions['records.create']) summary.keyCapabilities.push('Medical Records');
    if (permissions['sip.send_to_admin']) summary.keyCapabilities.push('Hospital Communication');
    if (permissions['sip.assign_to_tl']) summary.keyCapabilities.push('Team Management');
    if (permissions['sip.send_to_main']) summary.keyCapabilities.push('Data Processing');
    if (permissions['main_server.read']) summary.keyCapabilities.push('Main Server Access');

    return summary;
  }

  // Validate cross-server access
  validateCrossServerAccess(role, targetServer, action) {
    const roleConfig = this.rolePermissions.get(role);
    
    if (!roleConfig) {
      return {
        allowed: false,
        reason: 'Role not found'
      };
    }

    // Define cross-server permissions
    const crossServerPermissions = {
      'Doctor': {
        'company': 'none',
        'hospital': 'full'
      },
      'Hospital Reception': {
        'company': 'none',
        'hospital': 'full'
      },
      'Admin': {
        'company': 'full',
        'hospital': 'limited'
      },
      'Team Lead': {
        'company': 'full',
        'hospital': 'none'
      },
      'Analyst': {
        'company': 'full',
        'hospital': 'none'
      },
      'Production': {
        'company': 'full',
        'hospital': 'none'
      },
      'Developer': {
        'company': 'full',
        'hospital': 'full'
      }
    };

    const accessLevel = crossServerPermissions[role]?.[targetServer];
    
    if (!accessLevel || accessLevel === 'none') {
      return {
        allowed: false,
        reason: 'Cross-server access denied'
      };
    }

    return {
      allowed: true,
      accessLevel: accessLevel,
      reason: 'Cross-server access granted'
    };
  }
}

module.exports = new RoleBasedAccessControl();
