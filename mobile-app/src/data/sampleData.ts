// Sample data for when API is not available

export const sampleUsers = {
  customer: {
    _id: '1',
    name: 'John Doe',
    email: 'customer@example.com',
    phone: '9876543210',
    role: 0,
  },
  employee: {
    _id: '2',
    name: 'Jane Smith',
    email: 'employee@example.com',
    phone: '9876543211',
    role: 3,
  },
  admin: {
    _id: '3',
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '9876543212',
    role: 1,
  },
};

export const sampleProducts = [
  {
    _id: '1',
    name: 'HP LaserJet Pro',
    description: 'High-quality laser printer for office use',
    price: 25000,
    discountPrice: 22000,
    category: 'Printers',
    image: 'https://via.placeholder.com/300',
    stock: 50,
    rating: 4.5,
    reviews: 120,
  },
  {
    _id: '2',
    name: 'Canon PIXMA',
    description: 'Inkjet printer with wireless connectivity',
    price: 15000,
    discountPrice: 13000,
    category: 'Printers',
    image: 'https://via.placeholder.com/300',
    stock: 30,
    rating: 4.2,
    reviews: 85,
  },
  {
    _id: '3',
    name: 'Epson EcoTank',
    description: 'Eco-friendly printer with refillable ink tanks',
    price: 18000,
    discountPrice: 16000,
    category: 'Printers',
    image: 'https://via.placeholder.com/300',
    stock: 25,
    rating: 4.7,
    reviews: 200,
  },
];

export const sampleCompanies = [
  {
    _id: '1',
    companyName: 'ABC Corporation',
    email: 'contact@abccorp.com',
    phone: '9876543210',
    address: '123 Main St, City',
    pincode: '560001',
    gstNumber: '29ABCDE1234F1Z5',
  },
  {
    _id: '2',
    companyName: 'XYZ Industries',
    email: 'info@xyzind.com',
    phone: '9876543211',
    address: '456 Park Ave, City',
    pincode: '560002',
    gstNumber: '29XYZAB5678G2H6',
  },
];

export const sampleRentalProducts = [
  {
    _id: '1',
    name: 'Xerox WorkCentre 7835',
    serialNo: 'SN001',
    basePrice: 5000,
    category: 'Multifunction Printer',
  },
  {
    _id: '2',
    name: 'Canon imageRUNNER',
    serialNo: 'SN002',
    basePrice: 6000,
    category: 'Copier',
  },
];

export const sampleServiceEnquiries = [
  {
    _id: '1',
    companyId: '1',
    companyName: 'ABC Corporation',
    contactPerson: 'John Doe',
    phone: '9876543210',
    email: 'john@abccorp.com',
    serviceType: 'Repair',
    status: 'Pending',
    createdAt: '2025-01-20',
    priority: 'High',
  },
  {
    _id: '2',
    companyId: '2',
    companyName: 'XYZ Industries',
    contactPerson: 'Jane Smith',
    phone: '9876543211',
    email: 'jane@xyzind.com',
    serviceType: 'Maintenance',
    status: 'In Progress',
    createdAt: '2025-01-19',
    priority: 'Medium',
  },
];

export const sampleRentalEnquiries = [
  {
    _id: '1',
    companyId: '1',
    companyName: 'ABC Corporation',
    contactPerson: 'John Doe',
    phone: '9876543210',
    rentalProduct: 'Xerox WorkCentre 7835',
    startDate: '2025-02-01',
    endDate: '2025-02-28',
    status: 'Pending',
  },
];

export const sampleOrders = [
  {
    _id: '1',
    orderNumber: 'ORD-2025-01-001',
    products: [
      { productId: '1', name: 'HP LaserJet Pro', quantity: 2, price: 22000 },
    ],
    total: 44000,
    status: 'Processing',
    createdAt: '2025-01-20',
    shippingAddress: '123 Main St, City, 560001',
  },
  {
    _id: '2',
    orderNumber: 'ORD-2025-01-002',
    products: [
      { productId: '2', name: 'Canon PIXMA', quantity: 1, price: 13000 },
    ],
    total: 13000,
    status: 'Shipped',
    createdAt: '2025-01-19',
    shippingAddress: '456 Park Ave, City, 560002',
  },
];

export const sampleServiceInvoices = [
  {
    _id: '1',
    invoiceNumber: 'SINV-2025-01-0001',
    companyId: '1',
    companyName: 'ABC Corporation',
    products: [
      { productId: '1', name: 'Service Product 1', quantity: 1, price: 5000 },
    ],
    total: 5000,
    status: 'Pending',
    createdAt: '2025-01-20',
  },
];

export const sampleRentalInvoices = [
  {
    _id: '1',
    invoiceNumber: 'RINV-2025-01-0001',
    companyId: '1',
    companyName: 'ABC Corporation',
    products: [
      {
        productId: '1',
        name: 'Xerox WorkCentre 7835',
        serialNo: 'SN001',
        a3Config: { bwOldCount: 100, bwNewCount: 150 },
        a4Config: { bwOldCount: 200, bwNewCount: 250 },
        a5Config: { bwOldCount: 50, bwNewCount: 75 },
        productTotal: 5000,
      },
    ],
    grandTotal: 5000,
    status: 'Pending',
    createdAt: '2025-01-20',
  },
];

export const sampleCategories = [
  'Mobiles',
  'Electronics',
  'Fashion',
  'Appliances',
  'Home',
  'Furniture',
  'Grocery',
  'Beauty, Toys and More',
];

export const sampleEmployees = [
  {
    _id: '1',
    name: 'Employee One',
    email: 'emp1@example.com',
    phone: '9876543213',
    role: 3,
    pincode: '560001',
  },
  {
    _id: '2',
    name: 'Employee Two',
    email: 'emp2@example.com',
    phone: '9876543214',
    role: 3,
    pincode: '560002',
  },
];

export const sampleVendors = [
  {
    _id: '1',
    vendorName: 'Vendor One',
    contactPerson: 'Vendor Contact',
    email: 'vendor1@example.com',
    phone: '9876543215',
    address: '789 Vendor St',
  },
];

export const sampleMaterials = [
  {
    _id: '1',
    materialName: 'Toner Cartridge',
    category: 'Consumables',
    unit: 'piece',
    currentStock: 100,
    reorderLevel: 20,
    costPerUnit: 500,
  },
  {
    _id: '2',
    materialName: 'Paper A4',
    category: 'Consumables',
    unit: 'ream',
    currentStock: 50,
    reorderLevel: 10,
    costPerUnit: 200,
  },
];

export const sampleCommission = [
  {
    _id: '1',
    employeeId: '1',
    employeeName: 'Employee One',
    orderId: '1',
    orderNumber: 'ORD-2025-01-001',
    commissionAmount: 2200,
    commissionPercentage: 5,
    status: 'Pending',
    createdAt: '2025-01-20',
  },
];

export const sampleDashboardStats = {
  totalServices: 25,
  totalInvoices: 15,
  totalRevenue: 500000,
  pendingApprovals: 5,
  activeEmployees: 10,
};

