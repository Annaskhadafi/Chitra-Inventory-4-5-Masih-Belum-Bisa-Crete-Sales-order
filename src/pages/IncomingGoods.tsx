import { useEffect, useState } from 'react';
    import { Plus, Search } from 'lucide-react';
    import Modal from '../components/Modal';
    import { InventoryItem } from '../lib/types';

    type IncomingGoodsItem = {
      id: string;
      inventoryItemId: number; // Link to the InventoryItem
      vendorName: string;
      quantityReceived: number;
      receivedDate: string;
      notes?: string;
    };

    const IncomingGoods = () => {
      const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
      const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
      const [inventoryLookup, setInventoryLookup] = useState<InventoryItem[]>([]);
      const [lookupSearchTerm, setLookupSearchTerm] = useState('');
      const [incomingGoods, setIncomingGoods] = useState<IncomingGoodsItem[]>([]);

      const [formData, setFormData] = useState<Partial<IncomingGoodsItem>>({
        vendorName: '',
        quantityReceived: 0,
        receivedDate: new Date().toISOString().split('T')[0],
        notes: '',
      });

      // Sample inventory data (for demonstration - consider moving to a shared location)
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

      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      };

      const handleOpenLookup = () => {
        setIsLookupModalOpen(true);
      };

      const handleSelectInventoryItem = (item: InventoryItem) => {
        setSelectedInventoryItem(item);
        setFormData(prev => ({ ...prev, inventoryItemId: item.id }));
        setIsLookupModalOpen(false);
      };

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedInventoryItem || !formData.vendorName || !formData.quantityReceived || !formData.receivedDate) {
          alert('Please fill in all required fields.');
          return;
        }

        const newIncomingGoodsItem: IncomingGoodsItem = {
          id: crypto.randomUUID(),
          inventoryItemId: selectedInventoryItem.id,
          vendorName: formData.vendorName,
          quantityReceived: parseInt(formData.quantityReceived.toString(), 10),
          receivedDate: formData.receivedDate,
          notes: formData.notes,
        };

        // Update inventory (in a real app, this would be a Supabase update)
        const updatedInventory = inventoryLookup.map(item => {
          if (item.id === selectedInventoryItem.id) {
            return { ...item, currentStock: item.currentStock + newIncomingGoodsItem.quantityReceived };
          }
          return item;
        });

        setInventoryLookup(updatedInventory);
        setIncomingGoods([...incomingGoods, newIncomingGoodsItem]);

        // Reset form
        setFormData({
          vendorName: '',
          quantityReceived: 0,
          receivedDate: new Date().toISOString().split('T')[0],
          notes: '',
        });
        setSelectedInventoryItem(null);
      };

      const filteredInventoryLookup = inventoryLookup.filter(item =>
        item.materialDescription.toLowerCase().includes(lookupSearchTerm.toLowerCase())
      );

      const getInventoryItemById = (id: number) => {
        return inventoryLookup.find(item => item.id === id);
      };

      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Incoming Goods from Vendor</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form inputs (same as before) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">Vendor Name</label>
                <input
                  type="text"
                  id="vendorName"
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="receivedDate" className="block text-sm font-medium text-gray-700">Received Date</label>
                <input
                  type="date"
                  id="receivedDate"
                  name="receivedDate"
                  value={formData.receivedDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="product" className="block text-sm font-medium text-gray-700">Product</label>
                <div className="mt-1 flex items-center">
                  <button
                    type="button"
                    onClick={handleOpenLookup}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-l-md shadow-sm text-gray-600 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    id="product"
                    value={selectedInventoryItem ? selectedInventoryItem.materialDescription : ''}
                    readOnly
                    className="block w-full rounded-none rounded-r-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-100 text-gray-500"
                    placeholder="Select a product"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="quantityReceived" className="block text-sm font-medium text-gray-700">Quantity Received</label>
                <input
                  type="number"
                  id="quantityReceived"
                  name="quantityReceived"
                  value={formData.quantityReceived}
                  onChange={handleInputChange}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter any notes about this delivery"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm"
              >
                Record Incoming Goods
              </button>
            </div>
          </form>

          {/* Incoming Goods History Table */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Incoming Goods History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incomingGoods.map((record) => {
                    const inventoryItem = getInventoryItemById(record.inventoryItemId);
                    return (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.vendorName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.receivedDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {inventoryItem ? inventoryItem.materialDescription : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.quantityReceived}</td>
                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{record.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

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

    export default IncomingGoods;
