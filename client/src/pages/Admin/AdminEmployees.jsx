import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Spinner from "../../components/Spinner"; // Assuming you have a Spinner component
import { useAuth } from "../../context/auth";
import SeoData from "../../SEO/SeoData"; // Assuming you have an SeoData component
import { Link } from 'react-router-dom'; // Import Link for navigation
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
const AdminEmployees = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  // Sample data for demonstration
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false); // Set to false initially to show sample data

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        // *** Replace with your actual API endpoint for fetching employees ***
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
        // Handle error display if needed
      }
    };

    // You might want to comment out or modify this to use sample data initially
    if (auth?.token) {
      fetchEmployees();
    }
    // For now, we'll just use the sample data set in useState
    setLoading(false); // Ensure loading is false after component mounts if not fetching
  }, [auth?.token]); // Re-run effect if auth token changes

  return (
    <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
      <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow mb-4">
        <h1 className="text-lg font-bold uppercase text-[#019ee3] tracking-wide">
          Employees
        </h1>
        <button
          onClick={() => navigate('/admin/AddEmployee')} // Assuming this is the route for adding an employee
          className="py-2 px-5 rounded-xl shadow font-semibold text-white bg-gradient-to-r from-[#afcb09] to-[#019ee3] hover:from-[#019ee3] hover:to-[#afcb09] transition"
        >
          + New Employees
        </button>
      </div>
      {loading ? (
        <div className="text-center py-10 text-lg text-gray-500">
          <Spinner /> {/* Display spinner while loading */}
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
              </tr>
            </thead>
            <tbody>
              {employees?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">No employees found.</td> {/* Updated colspan */}
                </tr>
              ) : (
                employees.map(employee => (
                  <tr key={employee._id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-2 px-3"> {/* Wrap employee name in Link */} {/* {{ edit_2 }} */}
                        <Link // {{ edit_2 }}
                            to={`/admin/employee_details/${employee._id}`} // Link to employee details page // {{ edit_2 }}
                            className="text-blue-600 hover:underline" // Add styling to make it look like a link // {{ edit_2 }}
                        > {/* {{ edit_2 }} */}
                            {employee.name} {/* {{ edit_2 }} */}
                        </Link> {/* {{ edit_2 }} */}
                    </td> {/* {{ edit_2 }} */}
                    <td className="py-2 px-3">{employee.email}</td>
                    <td className="py-2 px-3">{employee.phone}</td>
                    <td className="py-2 px-3">{employee.address}</td>
                    <td className="py-2 px-3">{employee.employeeType}</td>
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