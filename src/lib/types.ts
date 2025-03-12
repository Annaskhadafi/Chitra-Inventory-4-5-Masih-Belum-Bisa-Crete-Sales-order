export type InventoryItem = {
      id: number;
      plnt: string;
      plantName: string;
      materialCI: string;
      oldMaterialNo: string;
      materialDescription: string;
      sLoc: string;
      description: string;
      totalStock: number;
      currentStock: number;
      minimumStock: number;
    };

    export type IncomingGoodsItem = {
      id: string;
      inventoryItemId: number; // Link to the InventoryItem
      vendorName: string;
      quantityReceived: number;
      receivedDate: string;
      notes?: string;
    };

    export type SalesOrderItem = {
      id: string;
      sales_order_id?: string; // Make optional during creation
      product_description: string;
      quantity: number;
      price: number;
      total: number;
      from_lookup: boolean;
    };

    export type SalesOrderType = { // Renamed to SalesOrderType
      id: string;
      po_number: string;
      po_date: string;
      customer_name: string;
      customer_address: string;
      total_amount: number;
      created_at: string;
      status: OrderStatus;
      items?: SalesOrderItem[]; // Keep items here for consistency
      statusHistory?: StatusHistoryRecord[]; // Add status history
    };

    export type OrderStatus = 'pending-delivery' | 'pending-invoice' | 'pending-item' | 'delivery' | 'done';

    // Add a type for status history records
    export type StatusHistoryRecord = {
      status: OrderStatus;
      date: string;
      note?: string;
    };
