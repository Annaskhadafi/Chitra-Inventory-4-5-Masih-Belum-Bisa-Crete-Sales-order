import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import Modal from '../components/Modal';
import { InventoryItem, SalesOrderItem, SalesOrder, OrderStatus } from '../lib/types';
import { supabase } from '../lib/supabase';

type LineItem = {
  id: string;
  productDescription: string;
  quantity: number;
  price: number;
  total: number;
  fromLookup: boolean;
};

const CreateSalesOrder = () => {
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [currentLineItemId, setCurrentLineItemId] = useState<string | null>(null);
  const [inventoryLookup, setInventoryLookup] = useState<InventoryItem[]>([]);
  const [lookupSearchTerm, setLookupSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<SalesOrder>>({
    po_number: '',
    po_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    customer_address: '',
    items: [
      { id: crypto.randomUUID(), productDescription: '', quantity: 1, price: 0, total: 0, fromLookup: false }
    ],
    status: 'pending-delivery'
  });

  // Status options mapping
  const statusOptions: Record<OrderStatus, { label: string, color: string }> = {
    'pending-delivery': { label: 'Pending Delivery', color: 'bg-yellow-100 text-yellow-800' },
    'pending-invoice': { label: 'Pending Invoice', color: 'bg-blue-100 text-blue-800' },
    'pending-item': { label: 'Pending Item', color: 'bg-purple-100 text-purple-800' },
    'delivery': { label: 'Delivery', color: 'bg-indigo-100 text-indigo-800' },
    'done': { label: 'Done', color: 'bg-green-100 text-green-800' },
  };

  // Sample inventory data
  const sampleInventoryData: InventoryItem[] = [
    {
      id: 1,
      plnt: 'A001',
      plantName: 'Main Distribution Center',
      materialCI: 'T-2055516-BFG',
      oldMaterialNo: 'BFG-205',
      materialDescription: 'BF Goodrich 205/55/R16 All-Terrain',
      sLoc: 'WH-01',
      description: 'Premium all-terrain tire',
      totalStock: 200,
      currentStock: 143,
      minimumStock: 50
    },
    {
      id: 2,
      plnt: 'A001',
      plantName: 'Main Distribution Center',
      materialCI: 'T-2557016-MIC',
      oldMaterialNo: 'MIC-255',
      materialDescription: 'Michelin 255/70/R16 Highway Terrain',
      sLoc: 'WH-02',
      description: 'Premium highway terrain tire',
      totalStock: 150,
      currentStock: 97,
      minimumStock: 30
    },
    {
      id: 3,
      plnt: 'A002',
      plantName: 'South Region Hub',
      materialCI: 'T-2157016-PIR',
      oldMaterialNo: 'PIR-215',
      materialDescription: 'Pirelli 215/70/R16 Sport',
      sLoc: 'WH-03',
      description: 'Sport performance tire',
      totalStock: 120,
      currentStock: 65,
      minimumStock: 40
    },
    {
      id: 4,
      plnt: 'A002',
      plantName: 'South Region Hub',
      materialCI: 'T-1957516-BST',
      oldMaterialNo: 'BST-195',
      materialDescription: 'Bridgestone 195/75/R16 All Season',
      sLoc: 'WH-01',
      description: 'All-season tire for passenger vehicles',
      totalStock: 250,
      currentStock: 212,
      minimumStock: 60
    },
    {
      id: 5,
      plnt: 'A003',
      plantName: 'North Distribution Hub',
      materialCI: 'T-2257517-CNT',
      oldMaterialNo: 'CNT-225',
      materialDescription: 'Continental 225/75/R17 Winter',
      sLoc: 'WH-02',
      description: 'Winter tire with advanced grip',
      totalStock: 180,
      currentStock: 86,
      minimumStock: 45
    },
  ];

  useEffect(() => {
    // Load sample inventory data (replace with actual fetch in real app)
    setInventoryLookup(sampleInventoryData);
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate line item total
  const calculateLineItemTotal = (quantity: number, price: number) => {
    return quantity * price;
  };

  // Calculate order total
  const calculateOrderTotal = (items: LineItem[]) => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenLookup = (itemId: string) => {
    setCurrentLineItemId(itemId);
    setIsLookupModalOpen(true);
  };

  const handleSelectInventoryItem = (item: InventoryItem) => {
    if (!currentLineItemId) return;

    setFormData(prev => {
      const updatedItems = prev.items?.map(lineItem => {
        if (lineItem.id === currentLineItemId) {
          return {
            ...lineItem,
            productDescription: item.materialDescription,
            price: 100000, // Replace with actual price
            total: calculateLineItemTotal(lineItem.quantity, 100000),
            fromLookup: true,
          };
        }
        return lineItem;
      }) || [];

      const totalAmount = calculateOrderTotal(updatedItems);

      return { ...prev, items: updatedItems, totalAmount };
    });

    setIsLookupModalOpen(false);
    setCurrentLineItemId(null);
  };

  // Handle line item changes
  const handleLineItemChange = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updatedItems = prev.items?.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [name]: value };

          if (name === 'quantity' || name === 'price') {
            const quantity = parseFloat(name === 'quantity' ? value : updatedItem.quantity.toString());
            const price = parseFloat(name === 'price' ? value : updatedItem.price.toString());

            if (!isNaN(quantity) && !isNaN(price)) {
              updatedItem.total = quantity * price;
            }
          }
          return updatedItem;
        }
        return item;
      }) || [];

      const totalAmount = calculateOrderTotal(updatedItems);

      return { ...prev, items: updatedItems, totalAmount };
    });
  };

  // Add new line item
  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...(prev.items || []),
        { id: crypto.randomUUID(), productDescription: '', quantity: 1, price: 0, total: 0, fromLookup: false }
      ]
    }));
  };

  // Remove line item
  const handleRemoveLineItem = (itemId: string) => {
    setFormData(prev => {
      const updatedItems = prev.items?.filter(item => item.id !== itemId) || [];
      const totalAmount = calculateOrderTotal(updatedItems);
      return {
        ...prev,
        items: updatedItems,
        totalAmount,
      }
    });
  };

  // Submit the form to create a new order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const items = formData.items || [];
    const totalAmount = calculateOrderTotal(items);

    console.log("Form Data:", formData);
    console.log("Total Amount:", totalAmount);

    const newOrder: Partial<SalesOrder> = {
      po_number: formData.poNumber || '',
      po_date: formData.poDate || new Date().toISOString().split('T')[0],
      customer_name: formData.customerName || '',
      customer_address: formData.customerAddress || '',
      total_amount: totalAmount,
      status: formData.status as OrderStatus || 'pending-delivery',
    };

    console.log("New Order:", newOrder);

    try {
      // Insert into sales_orders
      console.log("Before inserting into sales_orders"); // Add this
      const { data: orderData, error: orderError } = await supabase
        .from('sales_orders')
        .insert([newOrder])
        .select();
      console.log("After inserting into sales_orders"); // Add this

      console.log("Order Data:", orderData);
      console.log("Order Error:", orderError);

      if (orderError) throw orderError;
      if (!orderData || orderData.length === 0) throw new Error("Failed to create sales order.");

      const salesOrderId = orderData[0].id;

      console.log("Sales Order ID:", salesOrderId);

      // Prepare items for insertion
      const salesOrderItems: SalesOrderItem[] = items.map(item => ({
        sales_order_id: salesOrderId,
        product_description: item.productDescription,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        from_lookup: item.fromLookup,
      }));

      console.log("Sales Order Items:", salesOrderItems);

      // Insert into sales_order_items
      console.log("Before inserting into sales_order_items"); // Add this
      const { error: itemsError } = await supabase
        .from('sales_order_items')
        .insert(salesOrderItems);
      console.log("After inserting into sales_order_items"); // Add this

      console.log("Items Error:", itemsError);

      if (itemsError) throw itemsError;

      setSuccessMessage("Sales order created successfully!");

      // Reset the form
      setFormData({
        po_number: '',
        po_date: new Date().toISOString().split('T')[0],
        customer_name: '',
        customer_address: '',
        items: [
          { id: crypto.randomUUID(), productDescription: '', quantity: 1, price: 0, total: 0, fromLookup: false }
        ],
        status: 'pending-delivery'
      });

    } catch (error: any) {
      console.error("Error creating sales order:", error);
      setErrorMessage(error.message || "An error occurred while creating the sales order.");
    }
  };

  const filteredInventoryLookup = inventoryLookup.filter(item =>
    item.materialDescription.toLowerCase().includes(lookupSearchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Sales Order</h1>
      {successMessage && <div className="mb-4 text-green-600">{successMessage}</div>}
      {errorMessage && <div className="mb-4 text-red-600">{errorMessage}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Information */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-3">Purchase Order Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700">PO Number</label>
              <input
                type="text"
                id="poNumber"
                name="poNumber"
                value={formData.poNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="poDate" className="block text-sm font-medium text-gray-700">PO Date</label>
              <input
                type="date"
                id="poDate"
                name="poDate"
                value={formData.poDate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Initial Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {Object.entries(statusOptions).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-3">Customer Information</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700">Customer Address</label>
              <textarea
                id="customerAddress"
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleInputChange}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium text-gray-900">Order Items</h3>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Description</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.items?.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => handleOpenLookup(item.id)}
                          className="inline-flex items-center p-1 border border-gray-300 rounded-md shadow-sm text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          name="productDescription"
                          value={item.productDescription}
                          onChange={(e) => handleLineItemChange(e, item.id)}
                          className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter product description"
                          required
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        min="1"
                        onChange={(e) => handleLineItemChange(e, item.id)}
                        className="block w-24 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="number"
                        name="price"
                        value={item.price}
                        min="0"
                        onChange={(e) => handleLineItemChange(e, item.id)}
                        className={`block w-32 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                        required
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-3 py-2 text-right text-sm font-medium">Total Amount:</td>
                  <td className="px-3 py-2 text-sm font-bold">
                    {formatCurrency(calculateOrderTotal(formData.items || []))}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 sm:mt-6">
          <button
            type="submit"
            className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm"
          >
            Create Order
          </button>
        </div>
      </form>

      {/* Inventory Lookup Modal */}
      <Modal
        isOpen={isLookupModalOpen}
        onClose={() => setIsLookupModalOpen(false)}
        title="Select Product from Inventory"
        size="lg"
      >
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search inventory..."
            value={lookupSearchTerm}
            onChange={(e) => setLookupSearchTerm(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material CI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventoryLookup.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.materialCI}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{item.materialDescription}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.plantName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.currentStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleSelectInventoryItem(item)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};

export default CreateSalesOrder;
