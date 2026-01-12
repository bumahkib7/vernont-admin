// Re-export all stores from @vernont/admin-ui
// The stores are configured via setStoreConfig in the app layout

export {
  // Configuration
  setStoreConfig,
  getStoreConfig,
  getApiUrl,
  getWsUrl,

  // WebSocket store
  useWebSocketStore,
  WS_TOPICS,

  // Domain stores
  useOrdersStore,
  useProductsStore,
  useInventoryStore,
  useCustomersStore,
  useReturnsStore,
  useWorkflowsStore,
  useDashboardStore,
} from "@vernont/admin-ui/stores";

// Re-export types
export type {
  StoreConfig,
  OrderSummary,
  Order,
  OrderItem,
  OrderAddress,
  OrdersFilters,
  ProductSummary,
  Product,
  ProductImage,
  ProductVariant,
  ProductPrice,
  ProductOption,
  ProductsFilters,
  InventoryLevel,
  StockLocation,
  InventoryFilters,
  CustomerSummary,
  Customer,
  CustomerAddress,
  CustomerGroup,
  CustomersFilters,
  ReturnSummary,
  Return,
  ReturnItem,
  ReturnStats,
  ReturnsFilters,
  WorkflowExecution,
  WorkflowStep,
  WorkflowExecutionEvent,
  WorkflowEventType,
  ExecutionStatus,
  DashboardStats,
  ActivityItem,
  ConnectionStatus,
} from "@vernont/admin-ui/stores";
