import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import Spinner from '../../components/Spinner';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { IconButton, Menu, MenuItem } from '@mui/material'; // Import Material-UI components
import MoreVertIcon from '@mui/icons-material/MoreVert'; // Icon for the action button
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt'; // For Invoice
import DescriptionIcon from '@mui/icons-material/Description'; // For Quotation
import BarChartIcon from '@mui/icons-material/BarChart'; // For Report
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'; // For Move To Unwanted Tab
import TextField from '@mui/material/TextField';

const AdminServices = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [allServicesData, setAllServicesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);
  const [activeTab, setActiveTab] = useState('new');
  const [tabCounts, setTabCounts] = useState({
    new: 0,
    assigned: 0,
    invoiced: 0,
    quotation: 0,
    report: 0,
    w_u: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const { auth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // State for managing the action menu popover
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentServiceIdForMenu, setCurrentServiceIdForMenu] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event, serviceId) => {
    setAnchorEl(event.currentTarget);
    setCurrentServiceIdForMenu(serviceId);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setCurrentServiceIdForMenu(null);
  };

  // Fetch Employees (unchanged)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/employee/all`, {
          headers: {
            Authorization: auth.token,
          },
        });
        if (data?.success) {
          setEmployees(data.employees);
        } else {
          toast.error(data?.message || 'Failed to fetch employees.');
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
        toast.error('Something went wrong while fetching employees.');
      }
    };

    if (auth?.token) {
      fetchEmployees();
    }
  }, [auth?.token]);

  // Fetch ALL Services initially
  useEffect(() => {
    const fetchAllServices = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service/all`, {
          headers: {
            Authorization: auth.token,
          },
        });

        if (data?.success) {
          setAllServicesData(data.services);
        } else {
          setError(data?.message || 'Failed to fetch service enquiries.');
          toast.error(data?.message || 'Failed to fetch service enquiries.');
        }
      } catch (err) {
        console.error('Error fetching all service enquiries:', err);
        setError('Something went wrong while fetching all service enquiries.');
        toast.error('Something went wrong while fetching all service enquiries.');
      } finally {
        setLoading(false);
      }
    };

    if (auth?.token) {
      fetchAllServices();
    }
  }, [auth?.token]);

  // Filter services and calculate counts whenever allServicesData, activeTab, or location.search changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const serviceTypeFilter = queryParams.get('serviceType');

    let currentFilteredServices = allServicesData;

    // 1. Filter by serviceType from URL (if present)
    if (serviceTypeFilter) {
      currentFilteredServices = currentFilteredServices.filter(
        enquiry => enquiry.serviceType === serviceTypeFilter
      );
    }

    // Calculate counts for all tabs based on the serviceType-filtered data
    const newCounts = {
      new: 0,
      assigned: 0,
      invoiced: 0,
      quotation: 0,
      report: 0,
      w_u: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
    };

    currentFilteredServices.forEach(enquiry => {
      if (!enquiry.employeeId) {
        newCounts.new++;
      }
      if (enquiry.employeeId && enquiry.status !== 'Cancelled') {
        newCounts.assigned++;
      }
      if (enquiry.status === 'Cancelled') { newCounts.w_u++; }
      if (enquiry.status === 'Pending') { newCounts.pending++; }
      if (enquiry.status === 'In Progress') { newCounts.inProgress++; }
      if (enquiry.status === 'Completed') { newCounts.completed++; }
    });
    setTabCounts(newCounts);

    // 2. Filter by activeTab
    let finalFilteredServices = [];
    switch (activeTab) {
      case 'new':
        finalFilteredServices = currentFilteredServices.filter(enquiry => !enquiry.employeeId);
        break;
      case 'assigned':
        finalFilteredServices = currentFilteredServices.filter(enquiry => !!enquiry.employeeId && enquiry.status !== 'Cancelled');
        break;
      case 'w_u':
        finalFilteredServices = currentFilteredServices.filter(enquiry => enquiry.status === 'Cancelled');
        break;
      case 'pending':
        finalFilteredServices = currentFilteredServices.filter(enquiry => enquiry.status === 'Pending');
        break;
      case 'inProgress':
        finalFilteredServices = currentFilteredServices.filter(enquiry => enquiry.status === 'In Progress');
        break;
      case 'completed':
        finalFilteredServices = currentFilteredServices.filter(enquiry => enquiry.status === 'Completed');
        break;
      default:
        finalFilteredServices = currentFilteredServices;
        break;
    }
    setEnquiries(finalFilteredServices);

  }, [allServicesData, activeTab, location.search]);

  const assignEmployeeToService = async (serviceId, employeeId) => {
    setUpdatingServiceId(serviceId);
    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_SERVER_URL}/api/v1/service/update/${serviceId}`,
        { employeeId },
        {
          headers: {
            Authorization: auth.token,
          },
        }
      );
      if (data?.success) {
        toast.success(data.message || 'Employee assigned successfully!');
        setAllServicesData(prevAllServices =>
          prevAllServices.map(enquiry =>
            enquiry._id === serviceId ? { ...enquiry, employeeId: employeeId } : enquiry
          )
        );
      } else {
        toast.error(data?.message || 'Failed to assign employee.');
      }
    } catch (err) {
      console.error('Error assigning employee:', err);
      toast.error('Something went wrong while assigning employee.');
    } finally {
      setUpdatingServiceId(null);
    }
  };
  const updateStausToService = async (serviceId, status) => {
    setUpdatingServiceId(serviceId);
    try {
      const { data } = await axios.put(
        `${import.meta.env.VITE_SERVER_URL}/api/v1/service/update/${serviceId}`,
        { status },
        {
          headers: {
            Authorization: auth.token,
          },
        }
      );
      if (data?.success) {
        toast.success(data.message || 'Status Updated successfully!');
        // Update the status in allServicesData to trigger rerender
        setAllServicesData(prevAllServices =>
          prevAllServices.map(enquiry =>
            enquiry._id === serviceId ? { ...enquiry, status } : enquiry
          )
        );
      } else {
        toast.error(data?.message || 'Failed to Status Updated .');
      }
    } catch (err) {
      console.error('Error Status Updated :', err);
      toast.error('Something went wrong while Status Updated .');
    } finally {
      setUpdatingServiceId(null);
    }
  };

  // Placeholder functions for actions
  const handleEdit = (serviceId) => {
    alert(`Edit service ${serviceId}`);
    handleClose();
  };

  const handleInvoice = (serviceId) => {
    navigate(`../addServiceInvoice`);
    handleClose();
  };

  const handleQuotation = (serviceId) => {
    navigate(`../AddServiceQuotation`);
    handleClose();
  };

  const handleReport = (serviceId) => {
    navigate(`../addServiceReport`);
    handleClose();
  };

  const handleMoveStatus = (serviceId, status) => {
    updateStausToService(serviceId, status)
    handleClose();
  };

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="text-center text-red-500 mt-4">
        <p>{error}</p>
      </div>
    );
  }

  // Add this before the return statement
  const filteredEnquiries = enquiries.filter(enquiry => {
    const term = searchTerm.toLowerCase();
    return (
      (enquiry.companyName && enquiry.companyName.toLowerCase().includes(term)) ||
      (enquiry.phone && enquiry.phone.toLowerCase().includes(term)) ||
      (enquiry.email && enquiry.email.toLowerCase().includes(term)) ||
      (enquiry.serviceTitle && enquiry.serviceTitle.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-[#019ee3]">Service Enquiries</h1>

      {/* Search Field */}
      <div className="mb-4 w-[83%]">
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          placeholder="Search by Company Name, Phone, Email, or Service Title"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'new' ? 'bg-[#019ee3] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveTab('new')}
        >
          New Service Requests ({tabCounts.new})
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'assigned' ? 'bg-[#019ee3] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveTab('assigned')}
        >
          Assigned Requests ({tabCounts.assigned})
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'pending' ? 'bg-[#019ee3] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({tabCounts.pending})
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'inProgress' ? 'bg-[#019ee3] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveTab('inProgress')}
        >
          In Progress ({tabCounts.inProgress})
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'completed' ? 'bg-[#019ee3] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({tabCounts.completed})
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'w_u' ? 'bg-[#019ee3] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setActiveTab('w_u')}
        >
          W&U ({tabCounts.w_u})
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow p-4 w-[83%]">
        <table className="w-[80%] text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white">
              <th className="py-2 px-3 text-left">Action</th>
              <th className="py-2 px-3 text-left">Assigned To</th>
              <th className="py-2 px-3 text-left">Assigned Employee</th>
              <th className="py-2 px-3 text-left">Customer Type</th>
              <th className="py-2 px-3 text-left">Phone</th>
              <th className="py-2 px-3 text-left">Company Name</th>
              <th className="py-2 px-3 text-left">Contact Person</th>
              <th className="py-2 px-3 text-left">Email</th>
              <th className="py-2 px-3 text-left">Address Detail</th>
              <th className="py-2 px-3 text-left">Location Detail</th>
              <th className="py-2 px-3 text-left">Complaint (Optional)</th>
              <th className="py-2 px-3 text-left">Service Type</th>
              <th className="py-2 px-3 text-left">Service Title</th>
              <th className="py-2 px-3 text-left">Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnquiries.length === 0 ? (
              <tr>
                <td colSpan={14} className="text-center py-6 text-gray-400">No service enquiries found.</td>
              </tr>
            ) : (
              filteredEnquiries.map(enquiry => (
                <tr key={enquiry._id} className="border-b last:border-b-0 hover:bg-blue-50">
                  <td className="py-2 px-3">
                    <IconButton
                      aria-label="more"
                      aria-controls={open ? 'long-menu' : undefined}
                      aria-expanded={open ? 'true' : undefined}
                      aria-haspopup="true"
                      onClick={(event) => handleClick(event, enquiry._id)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      id="long-menu"
                      MenuListProps={{
                        'aria-labelledby': 'long-button',
                      }}
                      anchorEl={anchorEl}
                      open={open && currentServiceIdForMenu === enquiry._id} // Only open for the clicked row
                      onClose={handleClose}
                      PaperProps={{
                        style: {
                          maxHeight: 48 * 4.5,
                          width: '20ch',
                        },
                      }}
                    >
                      {/* <MenuItem onClick={() => handleEdit(currentServiceIdForMenu)}>
                        <EditIcon sx={{ mr: 1 }} /> Edit
                      </MenuItem> */}
                      <MenuItem onClick={() => handleInvoice(currentServiceIdForMenu)}>
                        <ReceiptIcon sx={{ mr: 1 }} /> Invoice
                      </MenuItem>
                      <MenuItem onClick={() => handleQuotation(currentServiceIdForMenu)}>
                        <DescriptionIcon sx={{ mr: 1 }} /> Quotation
                      </MenuItem>
                      <MenuItem onClick={() => handleReport(currentServiceIdForMenu)}>
                        <BarChartIcon sx={{ mr: 1 }} /> Report
                      </MenuItem>
                      <MenuItem onClick={() => handleMoveStatus(currentServiceIdForMenu, "Cancelled")}>
                        <ArrowForwardIcon sx={{ mr: 1 }} /> Move To Unwanted Tab
                      </MenuItem>
                      <MenuItem onClick={() => handleMoveStatus(currentServiceIdForMenu, "Pending")}>
                        <ArrowForwardIcon sx={{ mr: 1 }} /> Move To Pending
                      </MenuItem>
                      <MenuItem onClick={() => handleMoveStatus(currentServiceIdForMenu, "In Progress")}>
                        <ArrowForwardIcon sx={{ mr: 1 }} /> Move To In Progress
                      </MenuItem>
                      <MenuItem onClick={() => handleMoveStatus(currentServiceIdForMenu, "Completed")}>
                        <ArrowForwardIcon sx={{ mr: 1 }} /> Move To Completed
                      </MenuItem>
                    </Menu>
                  </td>
                  <td className="py-2 px-3">
                    {enquiry.employeeId ? (
                      <Link
                        to={`/admin/employee_details/${enquiry.employeeId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {employees.find(emp => emp._id === enquiry.employeeId)?.name || enquiry.employeeId}
                      </Link>
                    ) : (
                      "Not Assigned"
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {updatingServiceId === enquiry._id ? (
                      <Spinner size="sm" />
                    ) : (
                      <select
                        value={enquiry.employeeId || ""}
                        onChange={(e) => assignEmployeeToService(enquiry._id, e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-200 bg-white"
                      >
                        <option value="">-- Select Employee --</option>
                        {employees?.filter(employee => employee.employeeType === 'Sales')
                          .map(employee => (
                            <option key={employee._id} value={employee._id}>
                              {employee.name}
                            </option>
                          ))}
                      </select>
                    )}
                  </td>
                  <td className="py-2 px-3">{enquiry.customerType}</td>
                  <td className="py-2 px-3">{enquiry.phone}</td>
                  <td className="py-2 px-3">{enquiry.companyName}</td>
                  <td className="py-2 px-3">{enquiry.contactPerson}</td>
                  <td className="py-2 px-3">{enquiry.email}</td>
                  <td className="py-2 px-3">{enquiry.address}</td>
                  <td className="py-2 px-3">{enquiry.location}</td>
                  <td className="py-2 px-3">{enquiry.customerComplaint || "-"}</td>
                  <td className="py-2 px-3">{enquiry.serviceType || "-"}</td>
                  <td className="py-2 px-3 text-left">{enquiry.serviceTitle || "-"}</td>
                  <td className="py-2 px-3 text-left">{enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : "-"}</td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminServices;