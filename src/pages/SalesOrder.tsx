import { useEffect, useState } from 'react';
import { Calendar, Download, FileText, Filter, Search, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { OrderStatus, SalesOrderType, SalesOrderItem, StatusHistoryRecord } from '../lib/types'; // Import SalesOrderType
import { supabase } from '../lib/supabase';

const SalesOrder = () => {
  const [orders, setOrders] = useState<SalesOrderType[]>([]); // Use SalesOrderType
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<SalesOrderType | null>(null); // Use SalesOrderType
  const [statusNote, setStatusNote] = useState('');

  // Status options mapping
  const statusOptions: Record<OrderStatus, { label: string, color: string }> = {
    'pending-delivery': { label: 'Pending Delivery', color: 'bg-yellow-100 text-yellow-800' },
    'pending-invoice': { label: 'Pending Invoice', color: 'bg-blue-100 text-blue-800' },
    'pending-item': { label: 'Pending Item', color: 'bg-purple-100 text-purple-800' },
    'delivery': { label: 'Delivery', color: 'bg-indigo-100 text-indigo-800' },
    'done': { label: 'Done', color: 'bg-green-100 text-green-800' },
  };

  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('sales_orders')
          .select(`
            *,
            sales_order_items (
              *
            )
          `);

        if (error) throw error;

        if (data) {
          // Transform the data to match the SalesOrderType type
          const transformedData: SalesOrderType[] = data.map((order) => ({
            id: order.id,
            po_number: order.po_number,
            po_date: order.po_date,
            customer_name: order.customer_name,
            customer_address: order.customer_address,
            total_amount: order.total_amount,
            created_at: order.created_at,
            status: order.status,
            items: order.sales_order_items,
            statusHistory: [], // Initialize statusHistory
          }));
          setOrders(transformedData);
        }
      } catch (error: any) {
        console.error('Error fetching sales orders:', error);
        alert(error.message); // Display error to the user
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders based on search term and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = [
      order.po_number,
      order.customer_name,
    ].join(' ').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // View order details
  const handleViewOrder = (order: SalesOrderType) => { // Use SalesOrderType
    setCurrentOrder(order);
    setIsDetailModalOpen(true);
  };

  // Delete an order
  const handleDeleteOrder = async (id: string) => {
    try {
      // First, delete related items from sales_order_items
      const { error: itemsError } = await supabase
        .from('sales_order_items')
        .delete()
        .eq('sales_order_id', id);

      if (itemsError) throw itemsError;

      // Then, delete the order from sales_orders
      const { error: orderError } = await supabase
        .from('sales_orders')
        .delete()
        .eq('id', id);

      if (orderError) throw orderError;

      // Update the local state to reflect the deletion
      setOrders(orders.filter(order => order.id !== id));

    } catch (error: any) {
      console.error('Error deleting sales order:', error);
      alert(error.message); // Display error to the user
    }
  };

  // Open status change modal
  const handleStatusChangeClick = () => {
    if (!currentOrder) return;
    setStatusNote('');
    setIsStatusModalOpen(true);
  };

  // Handle status change
    const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) return;

    const form = e.target as HTMLFormElement;
    const newStatus = form.status.value as OrderStatus;

    try {
      // Update status in Supabase
      const { error } = await supabase
        .from('sales_orders')
        .update({ status: newStatus })
        .eq('id', currentOrder.id);

      if (error) throw error;

      // Fetch existing status history
      const { data: existingHistory, error: historyError } = await supabase
        .from('sales_orders')
        .select('status_history')
        .eq('id', currentOrder.id)
        .single(); // Use .single() since we expect one row

      if (historyError) throw historyError;

      // Prepare the new status history record
      const newStatusRecord: StatusHistoryRecord = {
        status: newStatus,
        date: new Date().toISOString(),
        note: statusNote.trim() || undefined,
      };

      // Combine existing history with new record
      const updatedStatusHistory = [
        ...(existingHistory?.status_history || []), // Use optional chaining and nullish coalescing
        newStatusRecord,
      ];

      // Update status history in Supabase
      const { error: updateHistoryError } = await supabase
        .from('sales_orders')
        .update({ status_history: updatedStatusHistory })
        .eq('id', currentOrder.id);

      if (updateHistoryError) throw updateHistoryError;

      // Update local state
      const updatedOrder: SalesOrderType = {
        ...currentOrder,
        status: newStatus,
        statusHistory: updatedStatusHistory,
      };

      setOrders(orders.map((order) => (order.id === currentOrder.id ? updatedOrder : order)));
      setCurrentOrder(updatedOrder);
      setIsStatusModalOpen(false);
    } catch (error: any) {
      console.error('Error updating sales order status:', error);
      alert(error.message); // Display error to the user
    }
  };

  // Get status badge color
  const getStatusBadge = (status: OrderStatus) => {
    const statusInfo = statusOptions[status];

    if (!statusInfo) {
      console.warn(`Invalid status: ${status}`);
      return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800`}>
          Unknown Status
        </span>
      );
    }

    const { label, color } = statusInfo;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
        <div className="flex space-x-2">
          {/* Removed Create Order button */}
          <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full py-2 pl-10 pr-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by PO number, customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div>
          <select
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
          >
            <option value="all">All Statuses</option>
            {Object.entries(statusOptions).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Object.entries(statusOptions).map(([status, { label, color }]) => {
          const count = orders.filter(order => order.status === status).length;
          return (
            <div key={status} className="p-3 bg-white rounded-lg shadow">
              <div className={`${color.split(' ')[0]} w-full px-3 py-2 rounded-md text-center mb-2`}>
                <span className={`font-medium ${color.split(' ')[1]}`}>{label}</span>
              </div>
              <div className="text-2xl font-bold text-center">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Sales Order table */}
      <div className="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">PO Number</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Items</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading sales order data...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No sales orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer" onClick={() => handleViewOrder(order)}>
                    {order.po_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.po_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(order.total_amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        className="p-1 text-blue-600 hover:text-blue-900 bg-blue-50 rounded-md hover:bg-blue-100"
                        onClick={() => handleViewOrder(order)}
                        title="View order"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-red-600 hover:text-red-900 bg-red-50 rounded-md hover:bg-red-100"
                        onClick={() => handleDeleteOrder(order.id)}
                        title="Delete order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Order Details Modal */}
      {currentOrder && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Sales Order: ${currentOrder.po_number}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-500">Sales Order</div>
                <h3 className="text-lg font-bold">{currentOrder.po_number}</h3>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {currentOrder.po_date}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {getStatusBadge(currentOrder.status)}
                <button
                  onClick={handleStatusChangeClick}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change Status
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Customer Information</h4>
                <div className="text-sm">
                  <p className="font-semibold">{currentOrder.customer_name}</p>
                  <p className="whitespace-pre-line text-gray-600">{currentOrder.customer_address}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Order Summary</h4>
                <div className="text-sm grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-600">Order Date:</p>
                    <p className="font-semibold">{currentOrder.po_date}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Amount:</p>
                    <p className="font-semibold">{formatCurrency(currentOrder.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Items:</p>
                    <p className="font-semibold">{currentOrder.items?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Current Status:</p>
                    <p className="font-semibold">{statusOptions[currentOrder.status].label}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Order Items</h4>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th scope="col" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 whitespace-normal text-sm">{item.product_description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{item.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium">Total:</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold">{formatCurrency(currentOrder.total_amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status History */}
            {currentOrder.statusHistory && currentOrder.statusHistory.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Status History</h4>
                <div className="border rounded-lg divide-y">
                  {currentOrder.statusHistory.map((record, index) => (
                    <div key={index} className="p-3 flex justify-between items-start">
                      <div>
                        <span className="font-medium">{statusOptions[record.status].label}</span>
                        {record.note && <p className="text-sm text-gray-500 mt-1">{record.note}</p>}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(record.date).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Change Modal */}
      {currentOrder && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title="Update Order Status"
          size="md"
        >
          <form onSubmit={handleStatusChange}>
            <div className="space-y-4">
              <div>
                <label htmlFor="statusUpdate" className="block text-sm font-medium text-gray-700">
                  Current Status: {currentOrder ? statusOptions[currentOrder.status].label : 'Unknown'}
                </label>
                <select
                  id="status"
                  name="status"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  defaultValue={currentOrder ? currentOrder.status : 'pending-delivery'}
                >
                  {Object.entries(statusOptions).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="statusNote" className="block text-sm font-medium text-gray-700">
                  Status Note (Optional)
                </label>
                <textarea
                  id="statusNote"
                  name="statusNote"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Add a note about this status change"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Update Status
              </button>
              <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setIsStatusModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SalesOrder;
