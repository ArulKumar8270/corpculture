import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Spinner from "../../components/Spinner";
import { useAuth } from "../../context/auth";
import SeoData from "../../SEO/SeoData";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import TextField from "@mui/material/TextField"; // Import TextField for search input

const AdminEmployees = () => {
  const { auth, userPermissions } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/all`,
        {
          headers: {
            Authorization: auth?.token,
          },
        }
      );
      setEmployees(response.data.employees || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setLoading(false);
      toast.error("Failed to fetch employees.");
    }
  };

  useEffect(() => {
    if (auth?.token) {
      fetchEmployees();
    }
  }, [auth?.token]);

  const hasPermission = (key, action) => {
    return userPermissions.some(p => p.key === key && p.actions.includes(action)) || auth?.user?.role === 1;
  };

  const handleEditEmployee = (employeeId) => {
    navigate(`../addEmployee/${employeeId}`);
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      try {
        setLoading(true);
        const response = await axios.delete(
          `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/delete/${employeeId}`,
          {
            headers: {
              Authorization: auth?.token,
            },
          }
        );
        if (response.status === 200) {
          toast.success("Employee deleted successfully!");
          fetchEmployees();
        }
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast.error(error.response?.data?.message || "Failed to delete employee. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter(employee => {
    const query = searchQuery.toLowerCase();
    return (
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      employee.phone.toLowerCase().includes(query) ||
      employee.employeeType.toLowerCase().includes(query) ||
      (employee.designation && employee.designation.toLowerCase().includes(query)) // Check for designation existence
    );
  });

  return (
    <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
      <SeoData title="Employees - Admin" />
      <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow mb-4">
        <h1 className="text-lg font-bold uppercase text-[#019ee3] tracking-wide">
          Employees
        </h1>
        {hasPermission("reportsEmployeeList", "create") ? <button
          onClick={() => navigate('../addEmployee')}
          className="py-2 px-5 rounded-xl shadow font-semibold text-white bg-gradient-to-r from-[#afcb09] to-[#019ee3] hover:from-[#019ee3] hover:to-[#afcb09] transition"
        >
          + New Employees
        </button> : null}
      </div>

      {/* Search Input Field */}
      <div className="mb-4">
        <TextField
          label="Search Employees"
          variant="outlined"
          fullWidth
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-white rounded-xl shadow"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-lg text-gray-500">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white">
                <th className="py-2 px-3 text-left">Name</th>
                <th className="py-2 px-3 text-left">Email</th>
                <th className="py-2 px-3 text-left">Phone</th>
                <th className="py-2 px-3 text-left">Address</th>
                <th className="py-2 px-3 text-left">Employee Type</th>
                <th className="py-2 px-3 text-left">Department</th>
                <th className="py-2 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees?.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-6 text-gray-400">No employees found.</td>
                </tr>
              ) : (
                filteredEmployees.map(employee => (
                  <tr key={employee._id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <Link
                        to={`/admin/employee_details/${employee._id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {employee.name}
                      </Link>
                    </td>
                    <td className="py-2 px-3">{employee.email}</td>
                    <td className="py-2 px-3">{employee.phone}</td>
                    <td className="py-2 px-3">{employee.address}</td>
                    <td className="py-2 px-3">{employee.employeeType}</td>
                    <td className="py-2 px-3">{employee.department?.name || 'N/A'}</td>
                    <td className="py-2 px-3 text-center">
                      {hasPermission("reportsEmployeeList", "edit") && (
                        <IconButton
                          onClick={() => handleEditEmployee(employee._id)}
                          color="primary"
                          aria-label="edit employee"
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                      {hasPermission("reportsEmployeeList", "delete") && (
                        <IconButton
                          onClick={() => handleDeleteEmployee(employee._id)}
                          color="error"
                          aria-label="delete employee"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminEmployees;