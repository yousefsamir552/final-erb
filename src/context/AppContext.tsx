import { api } from '../api/client';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  User,
  AuditLog,
  SizeDef,
  Supplier,
  Fabric,
  FabricColor,
  FabricTransaction,
  DesignModel,
  ModelRequirement,
  ModelAccessory,
  CuttingRecord,
  QCRecord,
  QCStageType,
  PrintDispatch,
  DispatchStatus,
  CustomRole,
  SystemSectionKey,
  RolePermissions,
  AccessoryType,
  AccessoryItem,
  AccessoryTransaction,
  AccessoryUnit,
  AccessoryUsageType,
  ModelTimelineEvent,
  SewingDispatch,
  AppNotification,
  InternalMessage
} from '../types';

interface FlashMessage {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  text: string;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshState: () => Promise<void>;
  isLoadingState: boolean;
  users: User[];
  roles: CustomRole[];
  auditLogs: AuditLog[];
  sizeDefs: SizeDef[];
  suppliers: Supplier[];
  fabrics: Fabric[];
  fabricColors: FabricColor[];
  fabricTransactions: FabricTransaction[];
  models: DesignModel[];
  requirements: ModelRequirement[];
  accessories: ModelAccessory[];
  modelAccessories: ModelAccessory[];
  cuttingRecords: CuttingRecord[];
  qcRecords: QCRecord[];
  printDispatches: PrintDispatch[];
  sewingDispatches: SewingDispatch[];
  appNotifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  flashMessages: FlashMessage[];
  addFlashMessage: (text: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
  removeFlashMessage: (id: string) => void;

  // Dynamic Role Management
  addRole: (data: Omit<CustomRole, 'id'>) => void;
  updateRole: (id: string, updates: Partial<CustomRole>) => void;
  deleteRole: (id: string) => { success: boolean; message: string };

  // Permission helper with all system sections + legacy shortcuts
  hasPermission: (
    module: SystemSectionKey | 'warehouse' | 'design' | 'cutting' | 'qc' | 'reports',
    requireEdit?: boolean
  ) => boolean;

  // Internal Messaging System
  internalMessages: InternalMessage[];
  unreadMessagesCount: number;
  sendInternalMessage: (receiverId: string, content: string) => { success: boolean; message: string };
  markMessageRead: (messageId: string) => void;

  // Financial & Sensitive Permissions Checkers
  canViewFabricPrices: () => boolean;
  canEditFabricPrices: () => boolean;
  canViewAccessoryPrices: () => boolean;
  canEditAccessoryPrices: () => boolean;
  canViewPrintingCosts: () => boolean;
  canEditPrintingCosts: () => boolean;
  canSendWhatsApp: () => boolean;
  canSendMessages: () => boolean;

  // Warehouse Actions
  addFabricOrColor: (data: {
    fabricId?: string;
    newFabricName?: string;
    unit?: 'توب' | 'كيلو' | 'متر';
    colorCode: string;
    colorName?: string;
    hexCode?: string;
    quantity: number;
    supplierId?: string;
  }) => { success: boolean; message: string; fabricId: string };
  recordTransaction: (data: {
    colorId: string;
    operation: 'add' | 'deduct';
    amount: number;
    modelCodeRef?: string;
    notes?: string;
  }) => { success: boolean; message: string };
  exportWarehouseInventoryCsv: () => void;
  updateColorPrice: (colorId: string, price: number) => void;

  // Accessories Warehouse Actions
  accessoryTypes: AccessoryType[];
  accessoryItems: AccessoryItem[];
  accessoryTransactions: AccessoryTransaction[];
  addAccessoryType: (name: string, description?: string) => string;
  addAccessoryItem: (data: {
    type_id: string;
    type_name?: string;
    code: string;
    name: string;
    image?: string;
    unit: AccessoryUnit;
    quantity: number;
    price_per_unit: number;
    supplier_id?: string;
    min_threshold: number;
    usage_type?: AccessoryUsageType;
    custom_model_code?: string;
    target_quantity?: number;
    delivered_quantity?: number;
  }) => { success: boolean; message: string; itemId: string };
  updateAccessoryItem: (id: string, updates: Partial<AccessoryItem>) => void;
  deleteAccessoryItem: (id: string) => { success: boolean; message: string };
  recordAccessoryTransaction: (data: {
    accessoryId: string;
    operation: 'add' | 'deduct';
    amount: number;
    modelCodeRef?: string;
    notes?: string;
  }) => { success: boolean; message: string };
  exportAccessoryInventoryCsv: () => void;
  markAccessoryWithdrawn: (accessoryId: string) => void;

  // Design Actions
  addDesignModel: (data: {
    modelCode: string;
    modelType: string;
    sizeCategoryId?: string;
    imageUrl?: string;
    targetCutQuantity?: number;
    notesShirt?: string;
    notesPants?: string;
  }) => { success: boolean; message: string; modelId?: string };
  updateModelPlan: (data: {
    modelId: string;
    reqQuantities: Record<string, number>;
    accQuantities: Record<string, number>;
    mainMarkerUrl?: string;
    printMarkerUrl?: string;
    notesShirt?: string;
    notesPants?: string;
    targetCutQuantity?: number;
  }) => { success: boolean; message: string };
  updateModelNotesAndTarget: (
    modelId: string,
    data: {
      target_cut_quantity?: number;
      notes_shirt?: string;
      notes_pants?: string;
    }
  ) => void;
  addModelRequirement: (modelId: string, colorId: string, partName: string) => void;
  deleteModelRequirement: (reqId: string) => void;
  addModelAccessory: (
    modelId: string,
    accessory: {
      id?: string;
      code?: string;
      name: string;
      unit?: string;
      image?: string;
      target_type?: 'shirt' | 'pants';
      piece_consumption?: number;
      planned_quantity?: number;
    }
  ) => { success: boolean; message: string };
  deleteModelAccessory: (accId: string) => void;
  issueFabricToCutting: (modelId: string) => { success: boolean; message: string };
  deleteDesignModel: (modelId: string) => void;

  // Cutting Actions
  addCuttingRecord: (data: {
    modelId: string;
    colorName: string;
    cutterName: string;
    layersCount: number;
    layerWeight: number;
    piecesCount: number;
    shadeDegree?: string;
  }) => void;
  finishCuttingToQC: (modelId: string) => void;
  exportCuttingCsv: (modelId: string) => void;

  // QC Actions & Multi-stage counting
  recordQCData: (data: {
    modelId: string;
    colorName: string;
    size: string;
    goodQty: number;
    defectQty: number;
    defectNotes?: string;
    stage?: QCStageType;
  }) => void;
  addQCRecord: (data: any) => void;
  recordQCStageCount: (data: {
    modelId: string;
    stage: QCStageType;
    piecesCounted: number;
    defectQty: number;
    defectNotes?: string;
    advanceStage?: boolean;
  }) => void;
  finishQCApproval: (modelId: string) => void;
  exportQcCsv: (modelId: string) => void;

  // Printing & Embroidery Actions
  addPrintDispatch: (data: {
    modelId: string;
    shopName: string;
    piecesCount: number;
    printType: string;
    expectedDeliveryDate?: string;
    costPerPiece?: number;
    totalCost?: number;
    notes?: string;
  }) => void;
  updateDispatchStatus: (dispatchId: string, status: DispatchStatus) => void;

  // Sewing Actions
  dispatchModelToSewing: (data: {
    modelId: string;
    workshopName: string;
    piecesCount: number;
    expectedDeliveryDate: string;
    pieceType?: 'shirt' | 'pants';
    pieceLabel?: string;
    notes?: string;
  }) => void;
  receiveModelFromSewing: (dispatchId: string, modelId?: string) => void;
  finishSewingToQC: (modelId: string, notes?: string) => void;
  finishQCToProduction: (modelId: string, notes?: string) => void;

  // Settings Actions
  addSizeDef: (name: string, values: string) => void;
  addSupplier: (name: string, phone: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  toggleUserActive: (userId: string) => { success: boolean; message: string };
  updateUserPermissionsAndPassword: (
    userId: string,
    permissions: User['permissions'],
    newPassword?: string,
    newRole?: string,
    roleId?: string
  ) => void;
  deleteUser: (userId: string) => { success: boolean; message: string };

  // Log & Timeline helper
  logAction: (action: string, details: string) => void;
  addModelTimelineEvent: (modelId: string, event: Omit<ModelTimelineEvent, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// Clear legacy localStorage data keys so the browser never serves stale local data instead of backend data
const LEGACY_STORAGE_KEYS = [
  'factory_erp_roles',
  'factory_erp_users',
  'factory_erp_sizes',
  'factory_erp_suppliers',
  'factory_erp_fabrics',
  'factory_erp_colors',
  'factory_erp_transactions',
  'factory_erp_acc_types',
  'factory_erp_acc_items',
  'factory_erp_acc_transactions',
  'factory_erp_models',
  'factory_erp_requirements',
  'factory_erp_accessories',
  'factory_erp_cutting',
  'factory_erp_qc',
  'factory_erp_print_dispatches',
  'factory_erp_sewing_dispatches',
  'factory_erp_internal_messages',
  'factory_erp_logs'
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clean up legacy local storage caches on mount
  useEffect(() => {
    try {
      LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      // ignore storage errors
    }
  }, []);

  // Only restore session if BOTH a valid auth token and user record exist in localStorage
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      const token = localStorage.getItem('factory_erp_auth_token');
      const storedUser = localStorage.getItem('factory_erp_current_user');
      if (!token || !storedUser) {
        localStorage.removeItem('factory_erp_current_user');
        localStorage.removeItem('factory_erp_auth_token');
        return null;
      }
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  });

  const [isLoadingState, setIsLoadingState] = useState<boolean>(true);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sizeDefs, setSizeDefs] = useState<SizeDef[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [fabricColors, setFabricColors] = useState<FabricColor[]>([]);
  const [fabricTransactions, setFabricTransactions] = useState<FabricTransaction[]>([]);
  const [models, setModels] = useState<DesignModel[]>([]);
  const [requirements, setRequirements] = useState<ModelRequirement[]>([]);
  const [accessories, setAccessories] = useState<ModelAccessory[]>([]);
  const [accessoryTypes, setAccessoryTypes] = useState<AccessoryType[]>([]);
  const [accessoryItems, setAccessoryItems] = useState<AccessoryItem[]>([]);
  const [accessoryTransactions, setAccessoryTransactions] = useState<AccessoryTransaction[]>([]);
  const [cuttingRecords, setCuttingRecords] = useState<CuttingRecord[]>([]);
  const [qcRecords, setQcRecords] = useState<QCRecord[]>([]);
  const [printDispatches, setPrintDispatches] = useState<PrintDispatch[]>([]);
  const [sewingDispatches, setSewingDispatches] = useState<SewingDispatch[]>([]);
  const [internalMessages, setInternalMessages] = useState<InternalMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [flashMessages, setFlashMessages] = useState<FlashMessage[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('erp_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const removeFlashMessage = useCallback((id: string) => {
    setFlashMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addFlashMessage = useCallback(
    (text: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
      const id = 'flash-' + Date.now() + Math.random().toString(36).slice(2, 6);
      setFlashMessages((prev) => [...prev, { id, type, text }]);
      setTimeout(() => {
        removeFlashMessage(id);
      }, 4500);
    },
    [removeFlashMessage]
  );

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    try {
      if (user) {
        localStorage.setItem('factory_erp_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('factory_erp_current_user');
        localStorage.removeItem('factory_erp_auth_token');
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const state = await api.getState();
      if (state) {
        setRoles(Array.isArray(state.roles) ? state.roles : []);
        setUsers(Array.isArray(state.users) ? state.users : []);
        setSizeDefs(Array.isArray(state.sizeDefs) ? state.sizeDefs : []);
        setSuppliers(Array.isArray(state.suppliers) ? state.suppliers : []);
        setFabrics(Array.isArray(state.fabrics) ? state.fabrics : []);
        setFabricColors(Array.isArray(state.fabricColors) ? state.fabricColors : []);
        setFabricTransactions(Array.isArray(state.fabricTransactions) ? state.fabricTransactions : []);
        setAccessoryTypes(Array.isArray(state.accessoryTypes) ? state.accessoryTypes : []);
        setAccessoryItems(Array.isArray(state.accessoryItems) ? state.accessoryItems : []);
        setAccessoryTransactions(
          Array.isArray(state.accessoryTransactions) ? state.accessoryTransactions : []
        );
        setModels(Array.isArray(state.models) ? state.models : []);
        setRequirements(Array.isArray(state.requirements) ? state.requirements : []);
        setAccessories(Array.isArray(state.accessories) ? state.accessories : []);
        setCuttingRecords(Array.isArray(state.cuttingRecords) ? state.cuttingRecords : []);
        setQcRecords(Array.isArray(state.qcRecords) ? state.qcRecords : []);
        setPrintDispatches(Array.isArray(state.printDispatches) ? state.printDispatches : []);
        setSewingDispatches(Array.isArray(state.sewingDispatches) ? state.sewingDispatches : []);
        setInternalMessages(Array.isArray(state.internalMessages) ? state.internalMessages : []);
        setAuditLogs(Array.isArray(state.auditLogs) ? state.auditLogs : []);
      }
    } catch (err) {
      console.error('Failed to sync state from backend:', err);
    } finally {
      setIsLoadingState(false);
    }
  }, []);

  // Verify stored session token with the backend and load live database state on mount
  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const token = localStorage.getItem('factory_erp_auth_token');
      if (token) {
        try {
          const meRes = await api.getMe();
          if (isMounted && meRes?.user) {
            setCurrentUser(meRes.user);
          }
        } catch {
          if (isMounted) {
            setCurrentUser(null);
          }
        }
      }
      if (isMounted) {
        await refreshState();
      }
    }

    bootstrap();

    const handleFocus = () => {
      if (localStorage.getItem('factory_erp_auth_token')) {
        refreshState();
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshState, setCurrentUser]);

  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.login(username, password);
      localStorage.setItem('factory_erp_auth_token', res.token);
      setCurrentUser(res.user);
      await refreshState();
      return { success: true, message: 'تم تسجيل الدخول بنجاح' };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة'
      };
    }
  };

  const logout = useCallback(() => {
    api.logout().catch(() => {});
    setCurrentUser(null);
  }, [setCurrentUser]);

  const logAction = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      userName: currentUser?.real_name || currentUser?.username || 'مستخدم غير معروف',
      userId: currentUser?.id,
      action,
      details,
      ip_address: '127.0.0.1',
      timestamp: new Date().toLocaleString('ar-EG', { hour12: false })
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 200)]);
    api.createAuditLog(newLog).catch((err) => console.error('AuditLog error:', err));
  };

  const addModelTimelineEvent = (
    modelId: string,
    event: Omit<ModelTimelineEvent, 'id' | 'timestamp'>
  ) => {
    const newEvent: ModelTimelineEvent = {
      ...event,
      id: 'tl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      timestamp: new Date().toLocaleString('ar-EG', { hour12: false })
    };
    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== modelId) return m;
        return {
          ...m,
          timeline: [newEvent, ...(m.timeline || [])]
        };
      })
    );
    api.addModelTimeline(modelId, newEvent).catch((err) => console.error('Timeline error:', err));
  };

  // Dynamic Role Management
  const addRole = (data: Omit<CustomRole, 'id'>) => {
    const newRole: CustomRole = {
      ...data,
      id: 'role-' + Date.now(),
      users_count: 0,
      created_at: new Date().toISOString()
    };
    setRoles((prev) => [...prev, newRole]);
    api
      .createRole(newRole)
      .then((saved) => {
        setRoles((prev) => prev.map((r) => (r.id === newRole.id ? saved : r)));
        logAction('الصلاحيات', `إنشاء دور وظيفي جديد: ${newRole.name}`);
        addFlashMessage(`تم إنشاء الدور "${newRole.name}" بنجاح`);
      })
      .catch((err) => {
        setRoles((prev) => prev.filter((r) => r.id !== newRole.id));
        addFlashMessage(err.message || 'فشل إنشاء الدور في الباك إند', 'danger');
      });
  };

  const updateRole = (id: string, updates: Partial<CustomRole>) => {
    const previousRoles = [...roles];
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    api
      .updateRole(id, updates)
      .then((saved) => {
        setRoles((prev) => prev.map((r) => (r.id === id ? saved : r)));
        logAction('الصلاحيات', `تحديث صلاحيات الدور: ${updates.name || id}`);
        addFlashMessage('تم تحديث الدور الوظيفي بنجاح');
      })
      .catch((err) => {
        setRoles(previousRoles);
        addFlashMessage(err.message || 'فشل تحديث الدور في الباك إند', 'danger');
      });
  };

  const deleteRole = (id: string): { success: boolean; message: string } => {
    const roleUsers = users.filter((u) => u.role_id === id);
    if (roleUsers.length > 0) {
      return {
        success: false,
        message: `لا يمكن حذف هذا الدور لوجود ${roleUsers.length} موظف مرتبط به حالياً.`
      };
    }
    const role = roles.find((r) => r.id === id);
    const previousRoles = [...roles];
    setRoles((prev) => prev.filter((r) => r.id !== id));
    api
      .deleteRole(id)
      .then(() => {
        logAction('الصلاحيات', `حذف الدور: ${role?.name || id}`);
        addFlashMessage('تم حذف الدور الوظيفي بنجاح');
      })
      .catch((err) => {
        setRoles(previousRoles);
        addFlashMessage(err.message || 'فشل حذف الدور من الباك إند', 'danger');
      });
    return { success: true, message: 'تم الحذف بنجاح' };
  };

  // Permission Resolver
  const getUserPermissionsObject = (): RolePermissions | null => {
    if (!currentUser) return null;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) {
      return {
        fabric_warehouse_view: true,
        fabric_warehouse_edit: true,
        accessories_warehouse_view: true,
        accessories_warehouse_edit: true,
        production_warehouse_view: true,
        production_warehouse_edit: true,
        design_view: true,
        design_edit: true,
        cutting_view: true,
        cutting_edit: true,
        qc_view: true,
        qc_edit: true,
        printing_view: true,
        printing_edit: true,
        sewing_view: true,
        sewing_edit: true,
        models_tracking_view: true,
        models_tracking_edit: true,
        reports_view: true,
        reports_edit: true,
        view_fabric_prices: true,
        edit_fabric_prices: true,
        view_accessory_prices: true,
        edit_accessory_prices: true,
        view_printing_costs: true,
        edit_printing_costs: true,
        send_whatsapp_requests: true,
        send_internal_messages: true
      };
    }

    if (currentUser.role_id) {
      const role = roles.find((r) => r.id === currentUser.role_id);
      if (role?.permissions) return role.permissions;
    }
    const roleByName = roles.find((r) => r.name === currentUser.role);
    if (roleByName?.permissions) return roleByName.permissions;
    return null;
  };

  const hasPermission = (
    module: SystemSectionKey | 'warehouse' | 'design' | 'cutting' | 'qc' | 'reports',
    requireEdit: boolean = false
  ): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;

    const rolePerms = getUserPermissionsObject();

    if (module === 'warehouse') {
      if (rolePerms) {
        if (requireEdit) {
          return (
            rolePerms.fabric_warehouse_edit ||
            rolePerms.accessories_warehouse_edit ||
            rolePerms.production_warehouse_edit
          );
        }
        return (
          rolePerms.fabric_warehouse_view ||
          rolePerms.accessories_warehouse_view ||
          rolePerms.production_warehouse_view
        );
      }
      const lvl = currentUser.permissions?.warehouse;
      if (!lvl) return false;
      return requireEdit ? lvl === 'edit' : true;
    }

    const key = module as SystemSectionKey;
    if (rolePerms) {
      const viewKey = `${key}_view` as keyof RolePermissions;
      const editKey = `${key}_edit` as keyof RolePermissions;
      if (requireEdit) return Boolean(rolePerms[editKey]);
      return Boolean(rolePerms[viewKey]);
    }

    const legacyLevel = (currentUser.permissions as any)?.[module];
    if (!legacyLevel) return false;
    return requireEdit ? legacyLevel === 'edit' : true;
  };

  const canViewFabricPrices = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.view_fabric_prices !== undefined) return p.view_fabric_prices;
    return Boolean(currentUser.permissions?.view_fabric_prices);
  };

  const canEditFabricPrices = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.edit_fabric_prices !== undefined) return p.edit_fabric_prices;
    return Boolean(currentUser.permissions?.edit_fabric_prices);
  };

  const canViewAccessoryPrices = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.view_accessory_prices !== undefined) return p.view_accessory_prices;
    return Boolean(currentUser.permissions?.view_accessory_prices);
  };

  const canEditAccessoryPrices = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.edit_accessory_prices !== undefined) return p.edit_accessory_prices;
    return Boolean(currentUser.permissions?.edit_accessory_prices);
  };

  const canViewPrintingCosts = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.view_printing_costs !== undefined) return p.view_printing_costs;
    return Boolean(currentUser.permissions?.view_printing_costs);
  };

  const canEditPrintingCosts = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.edit_printing_costs !== undefined) return p.edit_printing_costs;
    return Boolean(currentUser.permissions?.edit_printing_costs);
  };

  const canSendWhatsApp = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.send_whatsapp_requests !== undefined) return p.send_whatsapp_requests;
    return Boolean(currentUser.permissions?.send_whatsapp_requests);
  };

  const canSendMessages = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.username === 'sudo' || currentUser.is_sudo) return true;
    const p = getUserPermissionsObject();
    if (p && p.send_internal_messages !== undefined) return p.send_internal_messages;
    return Boolean(currentUser.permissions?.send_internal_messages);
  };

  const unreadMessagesCount = useMemo(() => {
    if (!currentUser) return 0;
    return internalMessages.filter(
      (m) =>
        (m.receiver_id === currentUser.id || m.receiver_id === currentUser.username) && !m.is_read
    ).length;
  }, [internalMessages, currentUser]);

  const sendInternalMessage = (
    receiverId: string,
    content: string
  ): { success: boolean; message: string } => {
    if (!canSendMessages()) {
      addFlashMessage(
        'ليس لديك صلاحية إرسال الرسائل والمراسلات الداخلية. يرجى مراجعة إدارة Sudo.',
        'danger'
      );
      return { success: false, message: 'ليس لديك صلاحية إرسال الرسائل الداخلية' };
    }
    if (!content.trim()) {
      return { success: false, message: 'لا يمكن إرسال رسالة فارغة' };
    }
    const receiver = users.find((u) => u.id === receiverId || u.username === receiverId);
    if (!receiver) {
      return { success: false, message: 'المستلم المحدد غير موجود' };
    }

    const newMsg: InternalMessage = {
      id: 'msg-' + Date.now(),
      sender_id: currentUser?.id || 'user-sudo',
      sender_name: currentUser?.real_name || 'الإدارة العليا (Sudo)',
      receiver_id: receiver.id,
      receiver_name: receiver.real_name,
      content: content.trim(),
      created_at: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      is_read: false
    };

    setInternalMessages((prev) => [...prev, newMsg]);
    api
      .sendInternalMessage(newMsg)
      .then((saved) => {
        setInternalMessages((prev) => prev.map((m) => (m.id === newMsg.id ? saved : m)));
        logAction('المراسلات الداخلية', `إرسال رسالة من ${currentUser?.real_name} إلى ${receiver.real_name}`);
        addFlashMessage(`تم إرسال الرسالة إلى ${receiver.real_name} بنجاح`, 'success');
      })
      .catch((err) => {
        setInternalMessages((prev) => prev.filter((m) => m.id !== newMsg.id));
        addFlashMessage(err.message || 'فشل إرسال الرسالة عبر الباك إند', 'danger');
      });

    return { success: true, message: 'تم إرسال الرسالة بنجاح' };
  };

  const markMessageRead = (messageId: string) => {
    setInternalMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
    );
    api.markMessageRead(messageId).catch((err) => console.error('Mark message read error:', err));
  };

  // Warehouse Actions
  const addFabricOrColor = (data: {
    fabricId?: string;
    newFabricName?: string;
    unit?: 'توب' | 'كيلو' | 'متر';
    colorCode: string;
    colorName?: string;
    hexCode?: string;
    quantity: number;
    supplierId?: string;
  }) => {
    let targetFabricId = data.fabricId;
    const newFabricClientId = 'fab-' + Date.now();
    const colorClientId = 'col-' + Date.now();

    if (!targetFabricId && data.newFabricName?.trim()) {
      const newFab: Fabric = {
        id: newFabricClientId,
        name: data.newFabricName.trim(),
        description: '',
        unit: data.unit || 'كيلو',
        supplier_id: data.supplierId
      };
      setFabrics((prev) => [...prev, newFab]);
      targetFabricId = newFab.id;
    }

    if (!targetFabricId) {
      return { success: false, message: 'يجب اختيار خامة أو كتابة اسم خامة جديدة', fabricId: '' };
    }

    const cleanCode = data.colorCode.trim().toUpperCase();
    const existingColor = fabricColors.find(
      (c) => c.fabric_id === targetFabricId && c.color_code.toUpperCase() === cleanCode
    );

    if (existingColor) {
      setFabricColors((prev) =>
        prev.map((c) =>
          c.id === existingColor.id
            ? { ...c, quantity: Number((c.quantity + data.quantity).toFixed(2)) }
            : c
        )
      );
    } else {
      const newColor: FabricColor = {
        id: colorClientId,
        fabric_id: targetFabricId,
        color_code: cleanCode,
        color_name: data.colorName || '',
        hex_code: data.hexCode || '#64748b',
        price_per_unit: 0,
        quantity: Math.max(0, data.quantity),
        reserved_quantity: 0
      };
      setFabricColors((prev) => [...prev, newColor]);
    }

    api
      .addFabricOrColor({
        ...data,
        newFabricClientId,
        colorClientId
      })
      .then((res) => {
        if (res.fabric) {
          setFabrics((prev) => {
            const exists = prev.some((f) => f.id === res.fabric.id);
            return exists ? prev.map((f) => (f.id === res.fabric.id ? res.fabric : f)) : [...prev, res.fabric];
          });
        }
        if (res.color) {
          setFabricColors((prev) => {
            const exists = prev.some((c) => c.id === res.color.id);
            return exists ? prev.map((c) => (c.id === res.color.id ? res.color : c)) : [...prev, res.color];
          });
        }
        logAction('المخزن', `استلام كمية ${data.quantity} للون ${cleanCode}`);
        addFlashMessage(`تم حفظ بيانات اللون ${cleanCode} في قاعدة البيانات بنجاح`);
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل حفظ الخامة في الباك إند', 'danger');
      });

    return { success: true, message: 'تم الحفظ بنجاح', fabricId: targetFabricId };
  };

  const recordTransaction = (data: {
    colorId: string;
    operation: 'add' | 'deduct';
    amount: number;
    modelCodeRef?: string;
    notes?: string;
  }) => {
    const color = fabricColors.find((c) => c.id === data.colorId);
    if (!color) return { success: false, message: 'اللون غير موجود' };
    if (data.amount <= 0) return { success: false, message: 'الكمية يجب أن تكون أكبر من صفر' };

    if (data.operation === 'deduct' && color.quantity < data.amount) {
      return { success: false, message: 'الكمية الموجودة بالمخزن لا تكفي للصرف' };
    }

    const trId = 'tr-' + Date.now();
    const timestamp = new Date().toLocaleString('ar-EG', { hour12: false });

    setFabricColors((prev) =>
      prev.map((c) => {
        if (c.id !== data.colorId) return c;
        const newQty =
          data.operation === 'add'
            ? Number((c.quantity + data.amount).toFixed(2))
            : Number((c.quantity - data.amount).toFixed(2));
        return { ...c, quantity: Math.max(0, newQty) };
      })
    );

    const transaction: FabricTransaction = {
      id: trId,
      color_id: data.colorId,
      fabric_id: color.fabric_id,
      model_code_ref: data.modelCodeRef || '',
      notes: data.notes || '',
      operation: data.operation,
      amount: data.amount,
      timestamp
    };
    setFabricTransactions((prev) => [transaction, ...prev]);

    api
      .recordFabricTransaction({
        id: trId,
        colorId: data.colorId,
        operation: data.operation,
        amount: data.amount,
        modelCodeRef: data.modelCodeRef || '',
        notes: data.notes || '',
        timestamp
      })
      .then((res) => {
        if (res.color) {
          setFabricColors((prev) => prev.map((c) => (c.id === res.color.id ? res.color : c)));
        }
        if (res.transaction) {
          setFabricTransactions((prev) =>
            prev.map((t) => (t.id === trId ? res.transaction : t))
          );
        }
        const opText = data.operation === 'add' ? 'إضافة / مرتجع' : 'صرف للمقص';
        logAction('المخزن', `حركة ${opText} بمقدار ${data.amount} للون ${color.color_code}`);
        addFlashMessage(`تم تنفيذ حركة ${opText} بنجاح`);
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تسجيل الحركة في الباك إند', 'danger');
      });

    return { success: true, message: 'تم تنفيذ الحركة بنجاح' };
  };

  const exportWarehouseInventoryCsv = () => {
    const headers = ['الخامة', 'كود اللون', 'اسم اللون', 'الكمية الفعلية', 'الكمية المحجوزة', 'المتاح للتصميم', 'الوحدة'];
    const rows = fabricColors.map((color) => {
      const fabric = fabrics.find((f) => f.id === color.fabric_id);
      const available = color.quantity - color.reserved_quantity;
      return [
        fabric?.name || 'غير معروف',
        color.color_code,
        color.color_name || '-',
        color.quantity.toString(),
        color.reserved_quantity.toString(),
        available.toString(),
        fabric?.unit || 'كيلو'
      ];
    });

    const csvContent =
      '\ufeff' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `warehouse_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logAction('المخزن', 'تصدير تقرير جرد المخزن إلى ملف إكسيل');
    addFlashMessage('تم تحميل شيت جرد المخزن بنجاح');
  };

  const updateColorPrice = (colorId: string, price: number) => {
    setFabricColors((prev) =>
      prev.map((c) => (c.id === colorId ? { ...c, price_per_unit: Math.max(0, price) } : c))
    );
    api
      .updateColorPrice(colorId, Math.max(0, price))
      .then(() => {
        addFlashMessage('تم تحديث سعر خامة القماش بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تحديث السعر في الباك إند', 'danger');
      });
  };

  // Accessories Actions
  const addAccessoryType = (name: string, description: string = '') => {
    const trimmed = name.trim();
    const existing = accessoryTypes.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;
    const newId = 'type-' + Date.now();
    const newType: AccessoryType = {
      id: newId,
      name: trimmed,
      description
    };
    setAccessoryTypes((prev) => [...prev, newType]);
    api
      .createAccessoryType(newType)
      .then((saved) => {
        setAccessoryTypes((prev) => prev.map((t) => (t.id === newId ? saved : t)));
        logAction('مخزن الإكسسوارات', `إضافة تصنيف إكسسوار جديد: ${trimmed}`);
        addFlashMessage(`تم إضافة تصنيف "${trimmed}" بنجاح`);
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل إضافة التصنيف في الباك إند', 'danger');
      });
    return newId;
  };

  const addAccessoryItem = (data: {
    type_id: string;
    type_name?: string;
    code: string;
    name: string;
    image?: string;
    unit: AccessoryUnit;
    quantity: number;
    price_per_unit: number;
    supplier_id?: string;
    min_threshold: number;
    usage_type?: AccessoryUsageType;
    custom_model_code?: string;
    target_quantity?: number;
    delivered_quantity?: number;
  }) => {
    const cleanCode = data.code.trim().toUpperCase();
    const existing = accessoryItems.find((a) => a.code.toUpperCase() === cleanCode);
    if (existing) {
      return { success: false, message: 'كود الإكسسوار مستخدم بالفعل!', itemId: '' };
    }

    const matchedType = accessoryTypes.find((t) => t.id === data.type_id);
    const newItemId = 'acc-' + Date.now();
    const usageType = data.usage_type || 'stock';
    const targetQty =
      usageType === 'custom_model' ? data.target_quantity || data.min_threshold : data.min_threshold;
    const deliveredQty =
      usageType === 'custom_model' ? data.delivered_quantity ?? data.quantity : data.quantity;

    const newItem: AccessoryItem = {
      id: newItemId,
      type_id: data.type_id,
      type_name: matchedType?.name || data.type_name || 'عام',
      code: cleanCode,
      name: data.name.trim(),
      image:
        data.image ||
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=60',
      unit: data.unit,
      quantity: Math.max(0, data.quantity),
      reserved_quantity: 0,
      price_per_unit: Math.max(0, data.price_per_unit),
      supplier_id: data.supplier_id,
      min_threshold: Math.max(0, data.min_threshold),
      usage_type: usageType,
      custom_model_code: data.custom_model_code?.trim(),
      target_quantity: targetQty,
      delivered_quantity: deliveredQty,
      withdrawn_for_model: false,
      created_at: new Date().toISOString().slice(0, 10)
    };

    setAccessoryItems((prev) => [newItem, ...prev]);
    api
      .createAccessory(newItem)
      .then((saved) => {
        setAccessoryItems((prev) => prev.map((it) => (it.id === newItemId ? saved : it)));
        logAction('مخزن الإكسسوارات', `إضافة إكسسوار جديد: ${newItem.name} (${newItem.code})`);
        addFlashMessage(`تم إضافة صنف الإكسسوار "${newItem.name}" بنجاح`);
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل إضافة الإكسسوار في الباك إند', 'danger');
      });

    return { success: true, message: 'تم الحفظ بنجاح', itemId: newItemId };
  };

  const updateAccessoryItem = (id: string, updates: Partial<AccessoryItem>) => {
    setAccessoryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    api
      .updateAccessory(id, updates)
      .then((saved) => {
        setAccessoryItems((prev) => prev.map((item) => (item.id === id ? saved : item)));
        logAction('مخزن الإكسسوارات', `تعديل بيانات الصنف: ${updates.name || id}`);
        addFlashMessage('تم تحديث بيانات الصنف بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تحديث الصنف في الباك إند', 'danger');
      });
  };

  const deleteAccessoryItem = (id: string) => {
    const item = accessoryItems.find((a) => a.id === id);
    if (!item) return { success: false, message: 'الصنف غير موجود' };
    if (item.reserved_quantity > 0) {
      return { success: false, message: 'لا يمكن حذف صنف محجوز منه كميات لموديلات تحت التشغيل!' };
    }
    setAccessoryItems((prev) => prev.filter((a) => a.id !== id));
    api
      .deleteAccessory(id)
      .then(() => {
        logAction('مخزن الإكسسوارات', `حذف صنف إكسسوار: ${item.name}`);
        addFlashMessage('تم حذف الصنف بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل حذف الصنف من الباك إند', 'danger');
      });
    return { success: true, message: 'تم حذف الصنف بنجاح' };
  };

  const markAccessoryWithdrawn = (accessoryId: string) => {
    setAccessoryItems((prev) =>
      prev.map((item) => (item.id === accessoryId ? { ...item, withdrawn_for_model: true } : item))
    );
    api
      .markAccessoryWithdrawn(accessoryId)
      .then(() => {
        addFlashMessage('تم تسجيل سحب الإكسسوار بالكامل للموديل بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تحديث حالة السحب في الباك إند', 'danger');
      });
  };

  const recordAccessoryTransaction = (data: {
    accessoryId: string;
    operation: 'add' | 'deduct';
    amount: number;
    modelCodeRef?: string;
    notes?: string;
  }) => {
    const item = accessoryItems.find((a) => a.id === data.accessoryId);
    if (!item) return { success: false, message: 'الصنف غير موجود' };
    if (data.amount <= 0) return { success: false, message: 'الكمية يجب أن تكون أكبر من صفر' };

    if (data.operation === 'deduct' && item.quantity < data.amount) {
      return { success: false, message: 'الرصيد المتاح لا يكفي للصرف' };
    }

    const trId = 'acc-tr-' + Date.now();
    const timestamp = new Date().toLocaleString('ar-EG', { hour12: false });

    setAccessoryItems((prev) =>
      prev.map((a) => {
        if (a.id !== data.accessoryId) return a;
        const newQty =
          data.operation === 'add'
            ? Number((a.quantity + data.amount).toFixed(2))
            : Number((a.quantity - data.amount).toFixed(2));

        let newDelivered = a.delivered_quantity;
        if (a.usage_type === 'custom_model' && data.operation === 'add') {
          newDelivered = Number(((a.delivered_quantity || 0) + data.amount).toFixed(2));
        }

        return {
          ...a,
          quantity: Math.max(0, newQty),
          delivered_quantity: newDelivered
        };
      })
    );

    const transaction: AccessoryTransaction = {
      id: trId,
      accessory_id: item.id,
      accessory_code: item.code,
      accessory_name: item.name,
      operation: data.operation,
      amount: data.amount,
      model_code_ref: data.modelCodeRef || '',
      notes: data.notes || '',
      timestamp
    };
    setAccessoryTransactions((prev) => [transaction, ...prev]);

    api
      .recordAccessoryTransaction({
        id: trId,
        accessoryId: data.accessoryId,
        operation: data.operation,
        amount: data.amount,
        modelCodeRef: data.modelCodeRef || '',
        notes: data.notes || '',
        timestamp
      })
      .then((res) => {
        if (res.accessory) {
          setAccessoryItems((prev) =>
            prev.map((a) => (a.id === res.accessory.id ? res.accessory : a))
          );
        }
        if (res.transaction) {
          setAccessoryTransactions((prev) =>
            prev.map((t) => (t.id === trId ? res.transaction : t))
          );
        }
        const opText = data.operation === 'add' ? 'إضافة / توريد' : 'صرف للتشغيل';
        logAction('مخزن الإكسسوارات', `حركة ${opText} بمقدار ${data.amount} للصنف ${item.code}`);
        addFlashMessage(`تم تسجيل حركة ${opText} بنجاح`);
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تسجيل حركة الإكسسوار في الباك إند', 'danger');
      });

    return { success: true, message: 'تم تنفيذ الحركة بنجاح' };
  };

  const exportAccessoryInventoryCsv = () => {
    const headers = [
      'التصنيف',
      'الكود',
      'الاسم',
      'النوع',
      'الرصيد الحالي',
      'المحجوز',
      'المتاح',
      'الحد الأدنى / المطلوب',
      'الوحدة'
    ];
    const rows = accessoryItems.map((a) => [
      a.type_name,
      a.code,
      a.name,
      a.usage_type === 'custom_model' ? `خاص بموديل ${a.custom_model_code || ''}` : 'رصيد مستمر',
      a.quantity.toString(),
      a.reserved_quantity.toString(),
      (a.quantity - a.reserved_quantity).toString(),
      (a.usage_type === 'custom_model' ? a.target_quantity || a.min_threshold : a.min_threshold).toString(),
      a.unit
    ]);

    const csvContent =
      '\ufeff' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `accessories_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logAction('مخزن الإكسسوارات', 'تصدير شيت جرد الإكسسوارات إلى إكسيل');
    addFlashMessage('تم تصدير جرد الإكسسوارات بنجاح');
  };

  // Design Actions
  const addDesignModel = (data: {
    modelCode: string;
    modelType: string;
    sizeCategoryId?: string;
    imageUrl?: string;
    targetCutQuantity?: number;
    notesShirt?: string;
    notesPants?: string;
  }) => {
    const cleanCode = data.modelCode.trim().toUpperCase();
    const existing = models.find((m) => !m.is_deleted && m.model_code.toUpperCase() === cleanCode);
    if (existing) {
      addFlashMessage('كود الموديل مستخدم بالفعل!', 'danger');
      return { success: false, message: 'كود الموديل مستخدم بالفعل!' };
    }

    const newModelId = 'mod-' + Date.now();
    const targetCutQty = data.targetCutQuantity || 100;

    const newModel: DesignModel = {
      id: newModelId,
      model_code: cleanCode,
      model_type: data.modelType,
      size_category_id: data.sizeCategoryId,
      image:
        data.imageUrl ||
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60',
      status: 'مرحلة التصميم',
      main_marker_url: '',
      print_marker_url: '',
      target_cut_quantity: targetCutQty,
      notes_shirt: data.notesShirt || '',
      notes_pants: data.notesPants || '',
      created_at: new Date().toISOString(),
      is_deleted: false,
      timeline: [
        {
          id: 'tl-' + Date.now(),
          stage: 'مرحلة التصميم',
          title: 'إنشاء الموديل الجديد',
          description: `تم إنشاء الموديل بالعدد المستهدف للقص: ${targetCutQty} قطعة`,
          user_name: currentUser?.real_name || 'مسؤول التصميم',
          timestamp: new Date().toLocaleString('ar-EG', { hour12: false })
        }
      ]
    };

    setModels((prev) => [newModel, ...prev]);
    api
      .createModel({
        id: newModelId,
        model_code: cleanCode,
        model_type: data.modelType,
        size_category_id: data.sizeCategoryId,
        image: newModel.image,
        target_cut_quantity: targetCutQty,
        notes_shirt: data.notesShirt || '',
        notes_pants: data.notesPants || '',
        user_name: currentUser?.real_name || 'مسؤول التصميم'
      })
      .then((saved) => {
        setModels((prev) => prev.map((m) => (m.id === newModelId ? saved : m)));
        logAction('التصميم', `إنشاء موديل جديد: ${cleanCode}`);
        addFlashMessage(`تم إنشاء الموديل ${cleanCode} بنجاح`);
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل إنشاء الموديل في الباك إند', 'danger');
      });

    return { success: true, message: 'تم إنشاء الموديل بنجاح', modelId: newModelId };
  };

  const updateModelPlan = (data: {
    modelId: string;
    reqQuantities: Record<string, number>;
    accQuantities: Record<string, number>;
    mainMarkerUrl?: string;
    printMarkerUrl?: string;
    notesShirt?: string;
    notesPants?: string;
    targetCutQuantity?: number;
  }) => {
    const model = models.find((m) => m.id === data.modelId);
    if (!model) return { success: false, message: 'الموديل غير موجود' };

    setRequirements((prev) =>
      prev.map((r) => {
        if (r.model_id !== data.modelId) return r;
        const newQty = data.reqQuantities[r.id];
        return newQty !== undefined ? { ...r, planned_quantity: Math.max(0, newQty) } : r;
      })
    );

    setAccessories((prev) =>
      prev.map((a) => {
        if (a.model_id !== data.modelId) return a;
        const newQty = data.accQuantities[a.id];
        return newQty !== undefined ? { ...a, planned_quantity: Math.max(0, newQty) } : a;
      })
    );

    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== data.modelId) return m;
        return {
          ...m,
          main_marker_url: data.mainMarkerUrl ?? m.main_marker_url,
          print_marker_url: data.printMarkerUrl ?? m.print_marker_url,
          notes_shirt: data.notesShirt ?? m.notes_shirt,
          notes_pants: data.notesPants ?? m.notes_pants,
          target_cut_quantity: data.targetCutQuantity ?? m.target_cut_quantity
        };
      })
    );

    api
      .updateModelPlan(data.modelId, data)
      .then((savedModel) => {
        setModels((prev) => prev.map((m) => (m.id === data.modelId ? savedModel : m)));
        logAction('التصميم', `تحديث خطة وخامات الموديل ${model.model_code}`);
        addFlashMessage('تم حفظ تفاصيل وملاحظات الموديل بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل حفظ الخطة في الباك إند', 'danger');
      });

    return { success: true, message: 'تم حفظ الخطة بنجاح' };
  };

  const updateModelNotesAndTarget = (
    modelId: string,
    data: {
      target_cut_quantity?: number;
      notes_shirt?: string;
      notes_pants?: string;
    }
  ) => {
    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== modelId) return m;
        return {
          ...m,
          ...(data.target_cut_quantity !== undefined
            ? { target_cut_quantity: data.target_cut_quantity }
            : {}),
          ...(data.notes_shirt !== undefined ? { notes_shirt: data.notes_shirt } : {}),
          ...(data.notes_pants !== undefined ? { notes_pants: data.notes_pants } : {})
        };
      })
    );
    api
      .updateModel(modelId, data)
      .then((saved) => {
        setModels((prev) => prev.map((m) => (m.id === modelId ? saved : m)));
        addFlashMessage('تم تحديث بيانات وملاحظات التشغيل بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل التحديث في الباك إند', 'danger');
      });
  };

  const addModelRequirement = (modelId: string, colorId: string, partName: string) => {
    const newReq: ModelRequirement = {
      id: 'req-' + Date.now(),
      model_id: modelId,
      color_id: colorId,
      part_name: partName.trim(),
      planned_quantity: 0
    };
    setRequirements((prev) => [...prev, newReq]);
    api
      .createModelRequirement(newReq)
      .then((saved) => {
        setRequirements((prev) => prev.map((r) => (r.id === newReq.id ? saved : r)));
        addFlashMessage('تمت إضافة خامة اللون بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل إضافة الخامة للموديل في الباك إند', 'danger');
      });
  };

  const deleteModelRequirement = (reqId: string) => {
    setRequirements((prev) => prev.filter((r) => r.id !== reqId));
    api
      .deleteModelRequirement(reqId)
      .then(() => {
        addFlashMessage('تم حذف الخامة من الموديل');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل حذف الخامة من الباك إند', 'danger');
      });
  };

  const addModelAccessory = (
    modelId: string,
    accessory: {
      id?: string;
      code?: string;
      name: string;
      unit?: string;
      image?: string;
      target_type?: 'shirt' | 'pants';
      piece_consumption?: number;
      planned_quantity?: number;
    }
  ) => {
    const targetModel = models.find((m) => m.id === modelId);
    const targetCut = targetModel?.target_cut_quantity || 100;
    const pieceConsumption = accessory.piece_consumption || 1;
    const plannedQty = accessory.planned_quantity ?? Math.round(pieceConsumption * targetCut);

    const newAcc: ModelAccessory = {
      id: 'macc-' + Date.now(),
      model_id: modelId,
      accessory_id: accessory.id,
      accessory_code: accessory.code,
      accessory_name: accessory.name,
      unit: accessory.unit || 'قطعة',
      image: accessory.image,
      target_type: accessory.target_type || 'shirt',
      piece_consumption: pieceConsumption,
      planned_quantity: plannedQty
    };
    setAccessories((prev) => [...prev, newAcc]);
    api
      .createModelAccessory(newAcc)
      .then((saved) => {
        setAccessories((prev) => prev.map((a) => (a.id === newAcc.id ? saved : a)));
        addFlashMessage(
          `تمت إضافة إكسسوار "${accessory.name}" إلى ${
            accessory.target_type === 'pants' ? 'البنطلون' : 'التيشرت'
          }`
        );
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل إضافة الإكسسوار للموديل في الباك إند', 'danger');
      });
    return { success: true, message: 'تمت الإضافة بنجاح' };
  };

  const deleteModelAccessory = (accId: string) => {
    setAccessories((prev) => prev.filter((a) => a.id !== accId));
    api
      .deleteModelAccessory(accId)
      .then(() => {
        addFlashMessage('تم إزالة الإكسسوار من الموديل');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل إزالة الإكسسوار من الباك إند', 'danger');
      });
  };

  const issueFabricToCutting = (modelId: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    if (!targetModel) return { success: false, message: 'الموديل غير موجود' };

    setModels((prev) =>
      prev.map((m) =>
        m.id === modelId ? { ...m, status: 'في القص', cut_at: new Date().toISOString() } : m
      )
    );

    api
      .issueFabricToCutting(modelId, currentUser?.real_name || 'مسؤول التصميم')
      .then(async () => {
        await refreshState();
        logAction('التصميم', `صرف خامات وإكسسوارات الموديل ${targetModel.model_code} وتحويله للقص`);
        addFlashMessage('تم صرف الأقمشة والإكسسوارات وتحويل الموديل للقص بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل صرف الخامات في الباك إند', 'danger');
      });

    return { success: true, message: 'تم صرف الخامات والإكسسوارات وتحويل الموديل للقص.' };
  };

  const deleteDesignModel = (modelId: string) => {
    const target = models.find((m) => m.id === modelId);
    if (!target) return;
    setModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, is_deleted: true } : m)));
    api
      .deleteModel(modelId)
      .then(() => {
        logAction('التصميم', `تم حذف الموديل ${target.model_code}`);
        addFlashMessage(`تم حذف الموديل ${target.model_code}`);
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل حذف الموديل من الباك إند', 'danger');
      });
  };

  // Cutting Actions
  const addCuttingRecord = (data: {
    modelId: string;
    colorName: string;
    cutterName: string;
    layersCount: number;
    layerWeight: number;
    piecesCount: number;
    shadeDegree?: string;
  }) => {
    const recId = 'cut-' + Date.now();
    const createdAt = new Date().toLocaleString('ar-EG', { hour12: false });
    const newRecord: CuttingRecord = {
      id: recId,
      model_id: data.modelId,
      color_name: data.colorName,
      colorName: data.colorName,
      cutter_name: data.cutterName.trim(),
      cutterName: data.cutterName.trim(),
      layers_count: Math.max(0, data.layersCount),
      layersCount: Math.max(0, data.layersCount),
      layer_weight: Math.max(0, data.layerWeight),
      layerWeight: Math.max(0, data.layerWeight),
      pieces_count: Math.max(0, data.piecesCount),
      piecesCount: Math.max(0, data.piecesCount),
      shade_degree: data.shadeDegree?.trim() || '',
      shadeDegree: data.shadeDegree?.trim() || '',
      created_at: createdAt
    };
    setCuttingRecords((prev) => [newRecord, ...prev]);

    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== data.modelId) return m;
        const newTotal = (m.actual_cut_count || 0) + data.piecesCount;
        return {
          ...m,
          actual_cut_count: newTotal,
          total_cut_pieces: newTotal,
          cutter_name: data.cutterName.trim()
        };
      })
    );

    api
      .createCuttingRecord({
        id: recId,
        model_id: data.modelId,
        color_name: data.colorName,
        cutter_name: data.cutterName.trim(),
        layers_count: Math.max(0, data.layersCount),
        layer_weight: Math.max(0, data.layerWeight),
        pieces_count: Math.max(0, data.piecesCount),
        shade_degree: data.shadeDegree?.trim() || '',
        created_at: createdAt
      })
      .then((saved) => {
        setCuttingRecords((prev) => prev.map((r) => (r.id === recId ? saved : r)));
        logAction('القص', `تسجيل راق قص للموديل: ${data.piecesCount} قطعة`);
        addFlashMessage(`تم تسجيل الراق بنجاح (${data.piecesCount} قطعة)`);
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تسجيل الراق في الباك إند', 'danger');
      });
  };

  const finishCuttingToQC = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, status: 'العد قبل الطباعة' } : m))
    );

    api
      .finishCuttingToQC(modelId, currentUser?.real_name || 'مسؤول القص')
      .then((savedModel) => {
        setModels((prev) => prev.map((m) => (m.id === modelId ? savedModel : m)));
        logAction('القص', `إنهاء قص الموديل ${model?.model_code} وتحويله للعد والفرز قبل الطباعة`);
        addFlashMessage('تم إنهاء القص وتحويل الموديل لقسم الفرز (العد قبل الطباعة) بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تحويل الموديل في الباك إند', 'danger');
      });
  };

  const exportCuttingCsv = (modelId: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    const records = cuttingRecords.filter((r) => r.model_id === modelId);
    const headers = [
      'كود الموديل',
      'اللون / القطعة',
      'اسم المقصدار',
      'عدد الرقات',
      'وزن الراق (كجم)',
      'القطع المنتجة',
      'درجة الصبغة',
      'تاريخ ووقت التسجيل'
    ];
    const rows = records.map((r) => [
      targetModel?.model_code || modelId,
      r.color_name,
      r.cutter_name,
      r.layers_count.toString(),
      r.layer_weight.toString(),
      r.pieces_count.toString(),
      r.shade_degree || '-',
      r.created_at
    ]);

    const csvContent =
      '\ufeff' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `cutting_${targetModel?.model_code || 'records'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logAction('القص', `تصدير سجل القص للموديل ${targetModel?.model_code} إلى إكسيل`);
    addFlashMessage('تم تصدير سجل القص بنجاح');
  };

  // QC Actions
  const recordQCData = (data: {
    modelId: string;
    colorName: string;
    size: string;
    goodQty: number;
    defectQty: number;
    defectNotes?: string;
    stage?: QCStageType;
  }) => {
    const cleanNotes = data.defectNotes?.trim() || '';
    const stage = data.stage || 'before_print';
    const qcId = 'qc-' + Date.now();
    const createdAt = new Date().toLocaleString('ar-EG', { hour12: false });

    const newQC: QCRecord = {
      id: qcId,
      model_id: data.modelId,
      stage,
      color_name: data.colorName,
      size: data.size,
      good_qty: Math.max(0, data.goodQty),
      defect_qty: Math.max(0, data.defectQty),
      defect_notes: cleanNotes,
      inspector_name: currentUser?.real_name || 'مراقب الجودة',
      created_at: createdAt
    };
    setQcRecords((prev) => [newQC, ...prev]);

    api
      .createQCRecord({
        id: qcId,
        model_id: data.modelId,
        stage,
        color_name: data.colorName,
        size: data.size,
        good_qty: Math.max(0, data.goodQty),
        defect_qty: Math.max(0, data.defectQty),
        defect_notes: cleanNotes,
        inspector_name: currentUser?.real_name || 'مراقب الجودة',
        created_at: createdAt
      })
      .then((saved) => {
        setQcRecords((prev) => prev.map((q) => (q.id === qcId ? saved : q)));
        logAction('الفرز', `تسجيل بيانات فرز (${stage}): سليم: ${data.goodQty}، هالك: ${data.defectQty}`);
        addFlashMessage('تم تسجيل بيانات الفرز والكنترول بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تسجيل بيانات الفرز في الباك إند', 'danger');
      });
  };

  const recordQCStageCount = (data: {
    modelId: string;
    stage: QCStageType;
    piecesCounted: number;
    defectQty: number;
    defectNotes?: string;
    advanceStage?: boolean;
  }) => {
    const model = models.find((m) => m.id === data.modelId);
    if (!model) return;

    const qcId = 'qc-' + Date.now();
    const newQC: QCRecord = {
      id: qcId,
      model_id: data.modelId,
      stage: data.stage,
      color_name: model.model_type || 'الأساسي',
      pieces_cut: model.actual_cut_count || model.target_cut_quantity,
      good_qty: data.piecesCounted,
      defect_qty: data.defectQty,
      defect_notes: data.defectNotes || '',
      inspector_name: currentUser?.real_name || 'مراقب الجودة',
      created_at: new Date().toLocaleString('ar-EG', { hour12: false })
    };
    setQcRecords((prev) => [newQC, ...prev]);

    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== data.modelId) return m;
        if (data.stage === 'before_print') {
          return {
            ...m,
            count_before_print: data.piecesCounted,
            ...(data.advanceStage ? { status: 'جاهز للطباعة / التجميع' } : {})
          };
        }
        if (data.stage === 'after_print') {
          return {
            ...m,
            count_after_print: data.piecesCounted,
            ...(data.advanceStage ? { status: 'في قسم المكن' } : {})
          };
        }
        return {
          ...m,
          count_after_sewing: data.piecesCounted,
          ...(data.advanceStage ? { status: 'مخزن الإنتاج التام' } : {})
        };
      })
    );

    api
      .recordQCStageCount(data.modelId, {
        qc_id: qcId,
        stage: data.stage,
        counted_pieces: data.piecesCounted,
        defect_pieces: data.defectQty,
        notes: data.defectNotes || '',
        advanceStage: data.advanceStage,
        user_name: currentUser?.real_name || 'مراقب الجودة'
      })
      .then((res) => {
        if (res.model) {
          setModels((prev) => prev.map((m) => (m.id === data.modelId ? res.model : m)));
        }
        if (res.qcRecord) {
          setQcRecords((prev) => prev.map((q) => (q.id === qcId ? res.qcRecord : q)));
        }
        addFlashMessage('تم تسجيل بيانات العد والمرحلة بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تسجيل العد في الباك إند', 'danger');
      });
  };

  const finishQCApproval = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, status: 'جاهز للطباعة / التجميع' } : m))
    );
    api
      .finishQCApproval(modelId, currentUser?.real_name || 'مراقب الجودة')
      .then((saved) => {
        setModels((prev) => prev.map((m) => (m.id === modelId ? saved : m)));
        logAction('الفرز', `الاعتماد النهائي للفرز لموديل ${model?.model_code}`);
        addFlashMessage('تم إنهاء الفرز والاعتماد بنجاح، الموديل الآن متاح في قسم المطابع والتطريز');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل الاعتماد في الباك إند', 'danger');
      });
  };

  const exportQcCsv = (modelId: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    const records = qcRecords.filter((r) => r.model_id === modelId);
    const headers = [
      'المرحلة',
      'كود الموديل',
      'المفتش',
      'العدد السليم',
      'العدد الهالك',
      'ملاحظات العيوب',
      'تاريخ ووقت الفرز'
    ];
    const rows = records.map((r) => [
      r.stage === 'before_print'
        ? 'العد قبل الطباعة'
        : r.stage === 'after_print'
        ? 'العد بعد الطباعة'
        : 'العد بعد المكن',
      targetModel?.model_code || modelId,
      r.inspector_name || '-',
      r.good_qty.toString(),
      r.defect_qty.toString(),
      r.defect_notes || '-',
      r.created_at
    ]);

    const csvContent =
      '\ufeff' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `qc_${targetModel?.model_code || 'records'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logAction('الفرز', `تصدير تقرير الجودة للموديل ${targetModel?.model_code} إلى إكسيل`);
    addFlashMessage('تم تصدير تقرير الفرز والجودة بنجاح');
  };

  // Printing & Embroidery Actions
  const addPrintDispatch = (data: {
    modelId: string;
    shopName: string;
    piecesCount: number;
    printType: string;
    expectedDeliveryDate?: string;
    costPerPiece?: number;
    totalCost?: number;
    notes?: string;
  }) => {
    const targetModel = models.find((m) => m.id === data.modelId);
    const dispId = 'disp-' + Date.now();
    const dispatchedAt = new Date().toLocaleString('ar-EG', { hour12: false });

    const newDisp: PrintDispatch = {
      id: dispId,
      model_id: data.modelId,
      shop_name: data.shopName.trim(),
      dispatched_at: dispatchedAt,
      expected_delivery_date: data.expectedDeliveryDate,
      pieces_count: Math.max(0, data.piecesCount),
      print_type: data.printType.trim(),
      cost_per_piece: data.costPerPiece,
      total_cost:
        data.totalCost || (data.costPerPiece ? data.costPerPiece * data.piecesCount : undefined),
      notes: data.notes?.trim() || '',
      status: 'مرسل للمطبعة'
    };
    setPrintDispatches((prev) => [newDisp, ...prev]);

    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== data.modelId) return m;
        return {
          ...m,
          status: 'مرسل للمطبعة',
          print_house_name: data.shopName.trim(),
          print_house: data.shopName.trim(),
          print_cost: data.costPerPiece,
          print_expected_date: data.expectedDeliveryDate
        };
      })
    );

    api
      .createPrintDispatch({
        id: dispId,
        model_id: data.modelId,
        shop_name: data.shopName.trim(),
        pieces_count: Math.max(0, data.piecesCount),
        print_type: data.printType.trim(),
        cost_per_piece: data.costPerPiece || 0,
        expected_delivery_date: data.expectedDeliveryDate || null,
        dispatched_at: dispatchedAt,
        notes: data.notes?.trim() || '',
        user_name: currentUser?.real_name || 'مسؤول المطابع'
      })
      .then((saved) => {
        setPrintDispatches((prev) => prev.map((d) => (d.id === dispId ? saved : d)));
        logAction(
          'المطابع والتطريز',
          `إرسال ${data.piecesCount} قطعة من موديل ${targetModel?.model_code} إلى ${data.shopName}`
        );
        addFlashMessage(`تم إرسال الموديل للمطبعة (${data.shopName}) بنجاح`);
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تسجيل إرسالية المطبعة في الباك إند', 'danger');
      });
  };

  const updateDispatchStatus = (dispatchId: string, status: DispatchStatus) => {
    const disp = printDispatches.find((d) => d.id === dispatchId);
    if (!disp) return;

    setPrintDispatches((prev) =>
      prev.map((d) => {
        if (d.id !== dispatchId) return d;
        const receivedAt =
          status === 'تم الاستلام بالمصنع'
            ? new Date().toLocaleString('ar-EG', { hour12: false })
            : d.received_at;
        return { ...d, status, received_at: receivedAt };
      })
    );

    if (status === 'تم الاستلام بالمصنع') {
      setModels((prev) =>
        prev.map((m) => (m.id === disp.model_id ? { ...m, status: 'العد بعد الطباعة' } : m))
      );
    }

    api
      .updatePrintDispatchStatus(dispatchId, status, currentUser?.real_name || 'مسؤول المطابع')
      .then((saved) => {
        setPrintDispatches((prev) => prev.map((d) => (d.id === dispatchId ? saved : d)));
        logAction('المطابع والتطريز', `تحديث حالة الإرسالية إلى: ${status}`);
        addFlashMessage(`تم تحديث حالة التشغيل إلى "${status}" بنجاح`);
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تحديث حالة الإرسالية في الباك إند', 'danger');
      });
  };

  // Sewing Section Actions
  const dispatchModelToSewing = (data: {
    modelId: string;
    workshopName: string;
    piecesCount: number;
    expectedDeliveryDate: string;
    pieceType?: 'shirt' | 'pants';
    pieceLabel?: string;
    notes?: string;
  }) => {
    const targetModel = models.find((m) => m.id === data.modelId);
    const resolvedType = data.pieceType || 'shirt';
    const resolvedLabel = data.pieceLabel || (resolvedType === 'shirt' ? 'تيشرت' : 'بنطلون');
    const dispId = 'sew-disp-' + Date.now();

    const newDisp: SewingDispatch = {
      id: dispId,
      model_id: data.modelId,
      piece_type: resolvedType,
      piece_label: resolvedLabel,
      workshop_name: data.workshopName.trim(),
      pieces_count: Math.max(0, data.piecesCount),
      dispatched_at: new Date().toLocaleString('ar-EG', { hour12: false }),
      expected_delivery_date: data.expectedDeliveryDate,
      status: 'في ورشة المكن',
      notes: data.notes?.trim() || ''
    };
    setSewingDispatches((prev) => [newDisp, ...prev]);

    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== data.modelId) return m;
        const updates: Partial<DesignModel> = {
          status: 'في قسم المكن',
          sewing_workshop: data.workshopName.trim(),
          sewing_expected_date: data.expectedDeliveryDate,
          sewing_pieces_count: data.piecesCount
        };
        if (resolvedType === 'shirt') {
          updates.sewing_shirt_workshop = data.workshopName.trim();
          updates.sewing_shirt_expected_date = data.expectedDeliveryDate;
          updates.sewing_shirt_status = 'في ورشة المكن';
          updates.sewing_shirt_pieces = data.piecesCount;
        } else {
          updates.sewing_pants_workshop = data.workshopName.trim();
          updates.sewing_pants_expected_date = data.expectedDeliveryDate;
          updates.sewing_pants_status = 'في ورشة المكن';
          updates.sewing_pants_pieces = data.piecesCount;
        }
        return { ...m, ...updates };
      })
    );

    api
      .dispatchModelToSewing(data.modelId, {
        id: dispId,
        workshop_name: data.workshopName.trim(),
        pieces_count: Math.max(0, data.piecesCount),
        expected_delivery_date: data.expectedDeliveryDate,
        piece_type: resolvedType,
        piece_label: resolvedLabel,
        notes: data.notes?.trim() || '',
        user_name: currentUser?.real_name || 'مسؤول خطوط الخياطة'
      })
      .then((saved) => {
        setSewingDispatches((prev) => prev.map((d) => (d.id === dispId ? saved : d)));
        logAction(
          'قسم المكن',
          `إرسال ${data.piecesCount} قطعة [${resolvedLabel}] من موديل ${targetModel?.model_code} إلى ورشة ${data.workshopName}`
        );
        addFlashMessage(`تم تسجيل خروج [${resolvedLabel}] لورشة الخياطة (${data.workshopName}) بنجاح`);
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تسجيل خروج الخياطة في الباك إند', 'danger');
      });
  };

  const receiveModelFromSewing = (dispatchId: string, modelId?: string) => {
    const disp = sewingDispatches.find((d) => d.id === dispatchId);
    const targetModelId = modelId || disp?.model_id;
    if (!targetModelId) return;
    const targetModel = models.find((m) => m.id === targetModelId);
    const pieceType = disp?.piece_type || 'shirt';
    const pieceLabel = disp?.piece_label || (pieceType === 'shirt' ? 'تيشرت' : 'بنطلون');

    const updatedDispatches = sewingDispatches.map((d) => {
      if (d.id !== dispatchId) return d;
      return {
        ...d,
        status: 'تم الاستلام' as const,
        received_at: new Date().toLocaleString('ar-EG', { hour12: false })
      };
    });
    setSewingDispatches(updatedDispatches);

    const otherPending = updatedDispatches.filter(
      (d) => d.model_id === targetModelId && d.id !== dispatchId && d.status !== 'تم الاستلام'
    );
    const allPiecesReceived = otherPending.length === 0;

    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== targetModelId) return m;
        const updates: Partial<DesignModel> = {};
        if (pieceType === 'shirt') {
          updates.sewing_shirt_status = 'تم الاستلام';
        } else {
          updates.sewing_pants_status = 'تم الاستلام';
        }
        if (allPiecesReceived) {
          updates.status = 'العد بعد المكن';
        }
        return { ...m, ...updates };
      })
    );

    api
      .receiveFromSewing(dispatchId, currentUser?.real_name || 'مسؤول الإنتاج')
      .then((saved) => {
        setSewingDispatches((prev) => prev.map((d) => (d.id === dispatchId ? saved : d)));
        logAction(
          'قسم المكن',
          `استلام [${pieceLabel}] موديل ${targetModel?.model_code} من ورشة ${disp?.workshop_name}`
        );
        addFlashMessage(
          `تم استلام [${pieceLabel}] بنجاح${
            allPiecesReceived ? ' واكتمال القطع ونقل الموديل إلى العد بعد المكن بالفرز' : ''
          }`
        );
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تسجيل الاستلام في الباك إند', 'danger');
      });
  };

  const finishSewingToQC = (modelId: string, notes?: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, status: 'العد بعد المكن' } : m))
    );

    api
      .finishSewingToQC(modelId, {
        notes,
        user_name: currentUser?.real_name || 'مسؤول قسم المكن'
      })
      .then((saved) => {
        setModels((prev) => prev.map((m) => (m.id === modelId ? saved : m)));
        logAction('قسم المكن', `إنهاء خياطة الموديل ${targetModel?.model_code} وتحويله للعد النهائي`);
        addFlashMessage('تم إنهاء الخياطة وتحويل الموديل للعد النهائي بعد المكن بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تحديث حالة الخياطة في الباك إند', 'danger');
      });
  };

  const finishQCToProduction = (modelId: string, notes?: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, status: 'مخزن الإنتاج التام' } : m))
    );

    api
      .finishQCToProduction(modelId, {
        notes,
        user_name: currentUser?.real_name || 'مراقب الجودة'
      })
      .then((saved) => {
        setModels((prev) => prev.map((m) => (m.id === modelId ? saved : m)));
        logAction('الإنتاج', `تحويل الموديل ${targetModel?.model_code} إلى مخزن الإنتاج التام`);
        addFlashMessage('تم تحويل الموديل إلى مخزن الإنتاج التام بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تحويل الموديل لمخزن الإنتاج في الباك إند', 'danger');
      });
  };

  // Settings Actions
  const addSizeDef = (name: string, values: string) => {
    const newSize: SizeDef = {
      id: 'size-' + Date.now(),
      name: name.trim(),
      values: values.trim()
    };
    setSizeDefs((prev) => [...prev, newSize]);
    api
      .createSizeDef(newSize)
      .then((saved) => {
        setSizeDefs((prev) => prev.map((s) => (s.id === newSize.id ? saved : s)));
        logAction('الإعدادات', `تعريف فئة مقاسات جديدة: ${name}`);
        addFlashMessage('تمت إضافة فئة المقاسات بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل حفظ المقاس في الباك إند', 'danger');
      });
  };

  const addSupplier = (name: string, phone: string) => {
    const newSup: Supplier = {
      id: 'sup-' + Date.now(),
      name: name.trim(),
      phone: phone.trim()
    };
    setSuppliers((prev) => [...prev, newSup]);
    api
      .createSupplier(newSup)
      .then((saved) => {
        setSuppliers((prev) => prev.map((s) => (s.id === newSup.id ? saved : s)));
        logAction('الإعدادات', `إضافة مورد جديد: ${name}`);
        addFlashMessage('تمت إضافة المورد بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل حفظ المورد في الباك إند', 'danger');
      });
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: 'user-' + Date.now()
    };
    setUsers((prev) => [...prev, newUser]);
    api
      .createUser(newUser)
      .then((saved) => {
        setUsers((prev) => prev.map((u) => (u.id === newUser.id ? saved : u)));
        logAction('إدارة الحسابات', `إنشاء حساب جديد للموظف: ${newUser.username}`);
        addFlashMessage(`تم إنشاء حساب جديد للموظف ${newUser.real_name} وحفظه في قاعدة البيانات`);
      })
      .catch((err) => {
        setUsers((prev) => prev.filter((u) => u.id !== newUser.id));
        addFlashMessage(err.message || 'فشل إنشاء الحساب في الباك إند', 'danger');
      });
  };

  const toggleUserActive = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'المستخدم غير موجود' };
    if (targetUser.username === 'sudo' || targetUser.is_sudo) {
      return { success: false, message: 'لا يمكن تعطيل حساب الإدارة العليا (Sudo)' };
    }

    const nextState = !targetUser.is_active;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: nextState } : u))
    );
    const actText = nextState ? 'تفعيل' : 'إيقاف';

    api
      .toggleUserActive(userId)
      .then((saved) => {
        setUsers((prev) => prev.map((u) => (u.id === userId ? saved : u)));
        logAction('إدارة الحسابات', `${actText} حساب المستخدم: ${targetUser.username}`);
        addFlashMessage(`تم ${actText} الحساب بنجاح`);
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || `فشل ${actText} الحساب في الباك إند`, 'danger');
      });

    return { success: true, message: `تم ${actText} الحساب بنجاح` };
  };

  const updateUserPermissionsAndPassword = (
    userId: string,
    permissions: User['permissions'],
    newPassword?: string,
    newRole?: string,
    roleId?: string
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        return {
          ...u,
          permissions: { ...u.permissions, ...permissions },
          ...(newRole ? { role: newRole } : {}),
          ...(roleId ? { role_id: roleId } : {})
        };
      })
    );

    api
      .updateUser(userId, {
        permissions,
        ...(newPassword ? { password: newPassword } : {}),
        ...(newRole ? { role: newRole } : {}),
        ...(roleId ? { role_id: roleId } : {})
      })
      .then((saved) => {
        setUsers((prev) => prev.map((u) => (u.id === userId ? saved : u)));
        if (currentUser?.id === userId) {
          setCurrentUser(saved);
        }
        logAction('إدارة الحسابات', `تحديث بيانات وصلاحيات الموظف (ID: ${userId})`);
        addFlashMessage('تم حفظ تعديلات المستخدم في قاعدة البيانات بنجاح');
      })
      .catch((err) => {
        refreshState();
        addFlashMessage(err.message || 'فشل تحديث المستخدم في الباك إند', 'danger');
      });
  };

  const deleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'المستخدم غير موجود' };
    if (target.username === 'sudo' || target.is_sudo) {
      return { success: false, message: 'لا يمكن حذف حساب الإدارة العليا (Sudo)' };
    }
    const previousUsers = [...users];
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    api
      .deleteUser(userId)
      .then(() => {
        logAction('إدارة الحسابات', `حذف المستخدم: ${target.username}`);
        addFlashMessage(`تم حذف المستخدم ${target.real_name} نهائياً من قاعدة البيانات`);
      })
      .catch((err) => {
        setUsers(previousUsers);
        addFlashMessage(err.message || 'فشل حذف المستخدم من الباك إند', 'danger');
      });
    return { success: true, message: 'تم الحذف بنجاح' };
  };

  const markNotificationRead = (id: string) => {
    setReadNotificationIds((prev) => {
      const updated = prev.includes(id) ? prev : [...prev, id];
      try {
        localStorage.setItem('erp_read_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Smart Real-time In-App Notifications for Expected Delivery Dates
  const appNotifications = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    printDispatches.forEach((disp) => {
      if (disp.status === 'تم الاستلام بالمصنع' || !disp.expected_delivery_date) return;
      const model = models.find((m) => m.id === disp.model_id);
      const modelCode = model?.model_code || 'موديل';

      const expDate = new Date(disp.expected_delivery_date);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const notifId = `notif-print-${disp.id}-${disp.expected_delivery_date}`;

      if (diffDays < 0) {
        list.push({
          id: notifId,
          model_id: disp.model_id,
          model_code: modelCode,
          stage: 'printing',
          source_name: disp.shop_name,
          expected_date: disp.expected_delivery_date,
          urgency: 'overdue',
          days_diff: diffDays,
          title: `🚨 تأخر استلام من المطبعة (${modelCode})`,
          message: `تخطى موعد استلام الموديل ${modelCode} من مطبعة ${disp.shop_name} بمقدار ${Math.abs(diffDays)} يوم، ولم يتم تسجيل الاستلام بعد!`,
          is_read: readNotificationIds.includes(notifId),
          created_at: disp.dispatched_at
        });
      } else if (diffDays === 0) {
        list.push({
          id: notifId,
          model_id: disp.model_id,
          model_code: modelCode,
          stage: 'printing',
          source_name: disp.shop_name,
          expected_date: disp.expected_delivery_date,
          urgency: 'today',
          days_diff: 0,
          title: `⏰ موعد استلام اليوم (${modelCode})`,
          message: `اليوم موعد استلام الموديل ${modelCode} من مطبعة ${disp.shop_name}.`,
          is_read: readNotificationIds.includes(notifId),
          created_at: disp.dispatched_at
        });
      } else if (diffDays === 1) {
        list.push({
          id: notifId,
          model_id: disp.model_id,
          model_code: modelCode,
          stage: 'printing',
          source_name: disp.shop_name,
          expected_date: disp.expected_delivery_date,
          urgency: 'tomorrow',
          days_diff: 1,
          title: `📅 موعد استلام غداً (${modelCode})`,
          message: `غداً موعد استلام الموديل ${modelCode} من مطبعة ${disp.shop_name}.`,
          is_read: readNotificationIds.includes(notifId),
          created_at: disp.dispatched_at
        });
      }
    });

    sewingDispatches.forEach((disp) => {
      if (disp.status === 'تم الاستلام' || !disp.expected_delivery_date) return;
      const model = models.find((m) => m.id === disp.model_id);
      const modelCode = model?.model_code || 'موديل';
      const pieceLabel = disp.piece_label ? ` [${disp.piece_label}]` : '';

      const expDate = new Date(disp.expected_delivery_date);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const notifId = `notif-sew-${disp.id}-${disp.expected_delivery_date}`;

      if (diffDays < 0) {
        list.push({
          id: notifId,
          model_id: disp.model_id,
          model_code: modelCode,
          stage: 'sewing',
          source_name: disp.workshop_name,
          expected_date: disp.expected_delivery_date,
          urgency: 'overdue',
          days_diff: diffDays,
          title: `🚨 تأخر استلام من ورشة المكن${pieceLabel} (${modelCode})`,
          message: `تخطى موعد استلام ${modelCode}${pieceLabel} من ورشة ${disp.workshop_name} بمقدار ${Math.abs(diffDays)} يوم، ولم يتم تسجيل الاستلام بعد!`,
          is_read: readNotificationIds.includes(notifId),
          created_at: disp.dispatched_at
        });
      } else if (diffDays === 0) {
        list.push({
          id: notifId,
          model_id: disp.model_id,
          model_code: modelCode,
          stage: 'sewing',
          source_name: disp.workshop_name,
          expected_date: disp.expected_delivery_date,
          urgency: 'today',
          days_diff: 0,
          title: `⏰ موعد استلام اليوم${pieceLabel} (${modelCode})`,
          message: `اليوم موعد استلام الموديل ${modelCode}${pieceLabel} من ورشة المكن (${disp.workshop_name}).`,
          is_read: readNotificationIds.includes(notifId),
          created_at: disp.dispatched_at
        });
      } else if (diffDays === 1) {
        list.push({
          id: notifId,
          model_id: disp.model_id,
          model_code: modelCode,
          stage: 'sewing',
          source_name: disp.workshop_name,
          expected_date: disp.expected_delivery_date,
          urgency: 'tomorrow',
          days_diff: 1,
          title: `📅 موعد استلام غداً${pieceLabel} (${modelCode})`,
          message: `غداً موعد استلام الموديل ${modelCode}${pieceLabel} من ورشة المكن (${disp.workshop_name}).`,
          is_read: readNotificationIds.includes(notifId),
          created_at: disp.dispatched_at
        });
      }
    });

    const priorityOrder = { overdue: 0, today: 1, tomorrow: 2 };
    return list.sort((a, b) => priorityOrder[a.urgency] - priorityOrder[b.urgency]);
  }, [printDispatches, sewingDispatches, models, readNotificationIds]);

  const unreadNotificationsCount = useMemo(() => {
    return appNotifications.filter((n) => n.urgency === 'overdue' || !n.is_read).length;
  }, [appNotifications]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        logout,
        refreshState,
        isLoadingState,
        users,
        roles,
        auditLogs,
        sizeDefs,
        suppliers,
        fabrics,
        fabricColors,
        fabricTransactions,
        models,
        requirements,
        accessories,
        modelAccessories: accessories,
        cuttingRecords,
        qcRecords,
        printDispatches,
        sewingDispatches,
        appNotifications,
        unreadNotificationsCount,
        markNotificationRead,
        flashMessages,
        addFlashMessage,
        removeFlashMessage,
        addRole,
        updateRole,
        deleteRole,
        hasPermission,
        canViewFabricPrices,
        canEditFabricPrices,
        canViewAccessoryPrices,
        canEditAccessoryPrices,
        canViewPrintingCosts,
        canEditPrintingCosts,
        canSendWhatsApp,
        canSendMessages,
        internalMessages,
        unreadMessagesCount,
        sendInternalMessage,
        markMessageRead,
        addFabricOrColor,
        recordTransaction,
        exportWarehouseInventoryCsv,
        updateColorPrice,
        accessoryTypes,
        accessoryItems,
        accessoryTransactions,
        addAccessoryType,
        addAccessoryItem,
        updateAccessoryItem,
        deleteAccessoryItem,
        recordAccessoryTransaction,
        exportAccessoryInventoryCsv,
        markAccessoryWithdrawn,
        addDesignModel,
        updateModelPlan,
        updateModelNotesAndTarget,
        addModelRequirement,
        deleteModelRequirement,
        addModelAccessory,
        deleteModelAccessory,
        issueFabricToCutting,
        deleteDesignModel,
        addCuttingRecord,
        finishCuttingToQC,
        exportCuttingCsv,
        recordQCData,
        addQCRecord: recordQCData,
        recordQCStageCount,
        finishQCApproval,
        exportQcCsv,
        addPrintDispatch,
        updateDispatchStatus,
        dispatchModelToSewing,
        receiveModelFromSewing,
        finishSewingToQC,
        finishQCToProduction,
        addSizeDef,
        addSupplier,
        addUser,
        toggleUserActive,
        updateUserPermissionsAndPassword,
        deleteUser,
        logAction,
        addModelTimelineEvent
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
