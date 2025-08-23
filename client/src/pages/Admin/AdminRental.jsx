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

const AdminRental
  = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [allRentalsData, setAllRentalsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [updatingRentalId, setUpdatingRentalId] = useState(null);
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
    const { auth, userPermissions } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    // State for managing the action menu popover
    const [anchorEl, setAnchorEl] = useState(null);
    const [currentRentalIdForMenu, setCurrentRentalIdForMenu] = useState(null);
    const open = Boolean(anchorEl);

    const hasPermission = (key) => {
      return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const handleClick = (event, rentalId) => {
      setAnchorEl(event.currentTarget);
      setCurrentRentalIdForMenu(rentalId);
    };

    const handleClose = () => {
      setAnchorEl(null);
      setCurrentRentalIdForMenu(null);
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

    // Fetch ALL Rentals initially
    useEffect(() => {
      const fetchAllRentals = async () => {
        try {
          setLoading(true);
          const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental/${auth?.user?.role === 3 ? `assignedTo/${auth?.user?._id}` : "all"}`, {
            headers: {
              Authorization: auth.token,
            },
          });

          if (data?.success) {
            setAllRentalsData(data.rental);
          } else {
            setError(data?.message || 'Failed to fetch rental enquiries.');
            toast.error(data?.message || 'Failed to fetch rental enquiries.');
          }
        } catch (err) {
          console.error('Error fetching all rental enquiries:', err);
          setError('Something went wrong while fetching all rental enquiries.');
          toast.error('Something went wrong while fetching all rental enquiries.');
        } finally {
          setLoading(false);
        }
      };

      if (auth?.token) {
        fetchAllRentals();
      }
    }, [auth?.token]);

    // Filter Rentals and calculate counts whenever allRentalsData, activeTab, or location.search changes
    useEffect(() => {
      const queryParams = new URLSearchParams(location.search);
      const rentalTypeFilter = queryParams.get('rentalType');

      let currentFilteredRentals = allRentalsData;

      // 1. Filter by rentalType from URL (if present)
      if (rentalTypeFilter) {
        currentFilteredRentals = currentFilteredRentals.filter(
          enquiry => enquiry.rentalType === rentalTypeFilter
        );
      }

      // Calculate counts for all tabs based on the rentalType-filtered data
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

      currentFilteredRentals.forEach(enquiry => {
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
      let finalFilteredRentals = [];
      switch (activeTab) {
        case 'new':
          finalFilteredRentals = currentFilteredRentals.filter(enquiry => !enquiry.employeeId);
          break;
        case 'assigned':
          finalFilteredRentals = currentFilteredRentals.filter(enquiry => !!enquiry.employeeId && enquiry.status !== 'Cancelled');
          break;
        case 'w_u':
          finalFilteredRentals = currentFilteredRentals.filter(enquiry => enquiry.status === 'Cancelled');
          break;
        case 'pending':
          finalFilteredRentals = currentFilteredRentals.filter(enquiry => enquiry.status === 'Pending');
          break;
        case 'inProgress':
          finalFilteredRentals = currentFilteredRentals.filter(enquiry => enquiry.status === 'In Progress');
          break;
        case 'completed':
          finalFilteredRentals = currentFilteredRentals.filter(enquiry => enquiry.status === 'Completed');
          break;
        default:
          finalFilteredRentals = currentFilteredRentals;
          break;
      }
      setEnquiries(finalFilteredRentals);

    }, [allRentalsData, activeTab, location.search]);

    const assignEmployeeToRental = async (rentalId, employeeId) => {
      setUpdatingRentalId(rentalId);
      try {
        const { data } = await axios.put(
          `${import.meta.env.VITE_SERVER_URL}/api/v1/rental/update/${rentalId}`,
          { employeeId },
          {
            headers: {
              Authorization: auth.token,
            },
          }
        );
        if (data?.success) {
          toast.success(data.message || 'Employee assigned successfully!');
          setAllRentalsData(prevAllRentals =>
            prevAllRentals.map(enquiry =>
              enquiry._id === rentalId ? { ...enquiry, employeeId: employeeId } : enquiry
            )
          );
        } else {
          toast.error(data?.message || 'Failed to assign employee.');
        }
      } catch (err) {
        console.error('Error assigning employee:', err);
        toast.error('Something went wrong while assigning employee.');
      } finally {
        setUpdatingRentalId(null);
      }
    };
    const updateStausToRental = async (rentalId, status) => {
      setUpdatingRentalId(rentalId);
      try {
        const { data } = await axios.put(
          `${import.meta.env.VITE_SERVER_URL}/api/v1/rental/update/${rentalId}`,
          { status },
          {
            headers: {
              Authorization: auth.token,
            },
          }
        );
        if (data?.success) {
          toast.success(data.message || 'Status Updated successfully!');
          // Update the status in allRentalesData to trigger rerender
          setAllRentalsData(prevAllRentals =>
            prevAllRentals.map(enquiry =>
              enquiry._id === rentalId ? { ...enquiry, status } : enquiry
            )
          );
        } else {
          toast.error(data?.message || 'Failed to Status Updated .');
        }
      } catch (err) {
        console.error('Error Status Updated :', err);
        toast.error('Something went wrong while Status Updated .');
      } finally {
        setUpdatingRentalId(null);
      }
    };

    // Placeholder functions for actions
    const handleEdit = (rentalId) => {
      alert(`Edit rental ${rentalId}`);
      handleClose();
    };

    const handleInvoice = (rentalId, employeeName) => {
      navigate(`../addRentalInvoice?employeeName=${employeeName}&invoiceType=invoice`);
      handleClose();
    };

    const handleQuotation = (rentalId, employeeName) => {
      navigate(`../addRentalInvoice?employeeName=${employeeName}&invoiceType=quotation`);
      handleClose();
    };

    const handleReport = (rentalId, employeeName) => {
      navigate(`../addRentalReport?employeeName=${employeeName}&reportType=rental`);
      handleClose();
    };

    const handleMoveStatus = (rentalId, status) => {
      updateStausToRental(rentalId, status)
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
        (enquiry.rentalTitle && enquiry.rentalTitle.toLowerCase().includes(term))
      );
    });

    return (
      <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
        <h1 className="text-2xl font-bold mb-6 text-[#019ee3]">Rental Enquiries</h1>

        {/* Search Field */}
        <div className="mb-4 w-[83%]">
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Search by Company Name, Phone, Email, or Rental Title"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex flex-wrap gap-2">
          {auth?.user?.role === 1 ? <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'new' ? 'bg-[#019ee3] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('new')}
          >
            New Rental Requests ({tabCounts.new})
          </button> : null}
          {auth?.user?.role === 1 ? <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'assigned' ? 'bg-[#019ee3] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('assigned')}
          >
            Assigned Requests ({tabCounts.assigned})
          </button> : null}
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
          {auth?.user?.role === 1 ? <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'w_u' ? 'bg-[#019ee3] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('w_u')}
          >
            W&U ({tabCounts.w_u})
          </button> : null}
        </div>

        <div className="overflow-x-auto bg-white rounded-xl shadow p-4 w-[83%]">
          <table className="w-[80%] text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white">
                {hasPermission("rentalEnquiries") ? <th className="py-2 px-3 text-left">Action</th> : null}
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
                <th className="py-2 px-3 text-left">Rental Type</th>
                <th className="py-2 px-3 text-left">Rental Title</th>
                <th className="py-2 px-3 text-left">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-6 text-gray-400">No rental enquiries found.</td>
                </tr>
              ) : (
                filteredEnquiries.map(enquiry => (
                  <tr key={enquiry._id} className="border-b last:border-b-0 hover:bg-blue-50">
                    {hasPermission("rentalEnquiries") ? <td className="py-2 px-3">
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
                        open={open && currentRentalIdForMenu === enquiry._id} // Only open for the clicked row
                        onClose={handleClose}
                        PaperProps={{
                          style: {
                            maxHeight: 48 * 4.5,
                            width: '20ch',
                          },
                        }}
                      >
                        {/* <MenuItem onClick={() => handleEdit(currentRentalIdForMenu)}>
                        <EditIcon sx={{ mr: 1 }} /> Edit
                      </MenuItem> */}
                        <MenuItem onClick={() => handleInvoice(currentRentalIdForMenu, enquiry.employeeId)}>
                          <ReceiptIcon sx={{ mr: 1 }} /> Invoice
                        </MenuItem>
                        <MenuItem onClick={() => handleQuotation(currentRentalIdForMenu, enquiry.employeeId)}>
                          <DescriptionIcon sx={{ mr: 1 }} /> Quotation
                        </MenuItem>
                        <MenuItem onClick={() => handleReport(currentRentalIdForMenu, enquiry.employeeId)}>
                          <BarChartIcon sx={{ mr: 1 }} /> Report
                        </MenuItem>
                        <MenuItem onClick={() => handleMoveStatus(currentRentalIdForMenu, "Cancelled")}>
                          <ArrowForwardIcon sx={{ mr: 1 }} /> Move To Unwanted Tab
                        </MenuItem>
                        <MenuItem onClick={() => handleMoveStatus(currentRentalIdForMenu, "Pending")}>
                          <ArrowForwardIcon sx={{ mr: 1 }} /> Move To Pending
                        </MenuItem>
                        <MenuItem onClick={() => handleMoveStatus(currentRentalIdForMenu, "In Progress")}>
                          <ArrowForwardIcon sx={{ mr: 1 }} /> Move To In Progress
                        </MenuItem>
                        <MenuItem onClick={() => handleMoveStatus(currentRentalIdForMenu, "Completed")}>
                          <ArrowForwardIcon sx={{ mr: 1 }} /> Move To Completed
                        </MenuItem>
                      </Menu>
                    </td> : null}
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
                      {updatingRentalId === enquiry._id ? (
                        <Spinner size="sm" />
                      ) : (
                        <select
                          value={enquiry.employeeId || ""}
                          onChange={(e) => assignEmployeeToRental(enquiry._id, e.target.value)}
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-200 bg-white"
                          disabled={auth?.user?.role === 1 ? false : true}
                        >
                          <option value="">-- Select Employee --</option>
                          {employees?.map(employee => (
                              <option key={employee.userId} value={employee.userId}>
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
                    <td className="py-2 px-3">{enquiry.rentalType || "-"}</td>
                    <td className="py-2 px-3 text-left">{enquiry.rentalTitle || "-"}</td>
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

export default AdminRental
  ;