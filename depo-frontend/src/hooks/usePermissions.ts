import { useMemo } from 'react';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'BRANCH_MANAGER' | 'STAFF' | 'VIEWER';

interface User {
    role: UserRole;
    canCreateProduct?: boolean;
    autoApprove?: boolean;
}

interface Permissions {
    // Role checks
    isSuperAdmin: boolean;
    isAdmin: boolean;
    isBranchManager: boolean;
    isStaff: boolean;
    isViewer: boolean;
    
    // Combined permissions
    canManageAll: boolean;        // SUPER_ADMIN, ADMIN
    canManageBranch: boolean;     // SUPER_ADMIN, ADMIN, BRANCH_MANAGER
    canCreateContent: boolean;    // SUPER_ADMIN, ADMIN, STAFF
    
    // Specific permissions
    canCreateProduct: boolean;
    canEditProduct: boolean;
    canDeleteProduct: boolean;
    canApproveProduct: boolean;
    
    canCreateUser: boolean;
    canEditUser: boolean;
    canDeleteUser: boolean;
    
    canManageBranches: boolean;
    canManageSuppliers: boolean;
    canManageSettings: boolean;
    canViewFinance: boolean;
    canManageOrders: boolean;
    
    // Raw role for edge cases
    role: UserRole;
}

/**
 * Central permissions hook - replaces scattered role checks
 * Usage: const { canManageAll, canCreateProduct } = usePermissions();
 */
export function usePermissions(): Permissions {
    const user = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) as User : null;
    }, []);

    return useMemo(() => {
        const role = user?.role || 'VIEWER';
        
        // Role flags
        const isSuperAdmin = role === 'SUPER_ADMIN';
        const isAdmin = role === 'ADMIN';
        const isBranchManager = role === 'BRANCH_MANAGER';
        const isStaff = role === 'STAFF';
        const isViewer = role === 'VIEWER';
        
        // Combined permissions
        const canManageAll = isSuperAdmin || isAdmin;
        const canManageBranch = canManageAll || isBranchManager;
        const canCreateContent = canManageAll || isStaff;
        
        return {
            // Role checks
            isSuperAdmin,
            isAdmin,
            isBranchManager,
            isStaff,
            isViewer,
            
            // Combined
            canManageAll,
            canManageBranch,
            canCreateContent,
            
            // Product permissions
            canCreateProduct: canCreateContent || user?.canCreateProduct || false,
            canEditProduct: canManageAll,
            canDeleteProduct: canManageAll,
            canApproveProduct: canManageAll,
            
            // User permissions
            canCreateUser: canManageAll,
            canEditUser: canManageAll,
            canDeleteUser: canManageAll,
            
            // Other permissions
            canManageBranches: canManageAll,
            canManageSuppliers: canManageAll,
            canManageSettings: canManageAll,
            canViewFinance: canManageBranch,
            canManageOrders: canManageBranch,
            
            // Raw role
            role
        };
    }, [user]);
}
