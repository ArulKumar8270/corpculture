import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Spinner from "../../components/Spinner";
import { useAuth } from "../../context/auth";
import SeoData from "../../SEO/SeoData";
import { Link } from "react-router-dom"; // Import Link for navigation

const AdminServices = () => {
  const { auth } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]); // {{ edit_1 }} State to store employees
  const [updatingServiceId, setUpdatingServiceId] = useState(null); // {{ edit_1 }} State to track which service is being updated

  // Fetch Service Enquiries
  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/v1/service/all`,
          {
            headers: {
              Authorization: auth?.token,
            },
          }
        );
        setEnquiries(response.data.services || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching service enquiries:", error);
        setLoading(false);
        console.error("Failed to fetch service enquiries."); // {{ edit_1 }} Show error notification
      }
    };

    if (auth?.token) {
      fetchEnquiries();
    }
  }, [auth?.token]);

  // Fetch Employees {{ edit_1 }}
  useEffect(() => { // {{ edit_1 }}
    const fetchEmployees = async () => { // {{ edit_1 }}
      try { // {{ edit_1 }}
        // *** Replace with your actual API endpoint for fetching employees *** {{ edit_1 }}
        const response = await axios.get( // {{ edit_1 }}
          `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/all`, // {{ edit_1 }}
          { // {{ edit_1 }}
            headers: { // {{ edit_1 }}
              Authorization: auth?.token, // {{ edit_1 }}
            }, // {{ edit_1 }}
          } // {{ edit_1 }}
        ); // {{ edit_1 }}
        // Assuming the response data has a 'employees' array {{ edit_1 }}
        setEmployees(response.data.employees || []); // {{ edit_1 }} Store employees {{ edit_1 }}
      } catch (error) { // {{ edit_1 }}
        console.error("Error fetching employees:", error); // {{ edit_1 }}
        toast.error("Failed to fetch employees."); // {{ edit_1 }} Show error notification {{ edit_1 }}
      } // {{ edit_1 }}
    }; // {{ edit_1 }}

    if (auth?.token) { // {{ edit_1 }}
      fetchEmployees(); // {{ edit_1 }}
    } // {{ edit_1 }}
  }, [auth?.token]); // {{ edit_1 }} Depend on auth.token

  // Function to assign employee to service {{ edit_1 }}
  const assignEmployeeToService = async (serviceId, employeeId) => { // {{ edit_1 }}
    setUpdatingServiceId(serviceId); // {{ edit_1 }} Set loading state for this service
    try { // {{ edit_1 }}
      const response = await axios.put( // {{ edit_1 }} Use PUT for update
        `${import.meta.env.VITE_SERVER_URL}/api/v1/service/update/${serviceId}`, // {{ edit_1 }} Update endpoint
        { employeeId: employeeId === "" ? null : employeeId }, // {{ edit_1 }} Send employeeId (use null if unassigning)
        { // {{ edit_1 }}
          headers: { // {{ edit_1 }}
            Authorization: auth?.token, // {{ edit_1 }}
          }, // {{ edit_1 }}
        } // {{ edit_1 }}
      ); // {{ edit_1 }}

      if (response.data.success) { // {{ edit_1 }}
        // Update the local state with the assigned employee ID {{ edit_1 }}
        setEnquiries(prevEnquiries => // {{ edit_1 }}
          prevEnquiries.map(enquiry => // {{ edit_1 }}
            enquiry._id === serviceId ? { ...enquiry, employeeId: employeeId === "" ? undefined : employeeId } : enquiry // {{ edit_1 }} Update the specific enquiry
          ) // {{ edit_1 }}
        ); // {{ edit_1 }}
        toast.success("Employee assigned successfully!"); // {{ edit_1 }} Show success notification
      } else { // {{ edit_1 }}
        toast.error(response.data.message || "Failed to assign employee."); // {{ edit_1 }} Show error message from backend
      } // {{ edit_1 }}
    } catch (error) { // {{ edit_1 }}
      console.error("Error assigning employee:", error); // {{ edit_1 }}
      toast.error("Failed to assign employee."); // {{ edit_1 }} Show generic error
    } finally { // {{ edit_1 }}
      setUpdatingServiceId(null); // {{ edit_1 }} Clear loading state
    } // {{ edit_1 }}
  }; // {{ edit_1 }}


  return (
    <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
      <SeoData title="Service Enquiries - Admin" />
      <h1 className="text-2xl font-bold mb-6 text-[#019ee3]">Service Enquiries</h1>
      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow p-4 w-[83%]">
          <table className="w-[80%] text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white">
                <th className="py-2 px-3 text-left">Customer Type</th>
                <th className="py-2 px-3 text-left">Phone</th>
                <th className="py-2 px-3 text-left">Company Name</th>
                <th className="py-2 px-3 text-left">Contact Person</th>
                <th className="py-2 px-3 text-left">Email</th>
                <th className="py-2 px-3 text-left">Address Detail</th>
                <th className="py-2 px-3 text-left">Location Detail</th>
                <th className="py-2 px-3 text-left">Complaint (Optional)</th>
                <th className="py-2 px-3 text-left">Submitted At</th>
                <th className="py-2 px-3 text-left">Assigned To</th>
                <th className="py-2 px-3 text-left">Assigned Employee</th> {/* {{ edit_2 }} New column header */}
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-6 text-gray-400">No service enquiries found.</td> {/* {{ edit_2 }} Update colspan */}
                </tr>
              ) : (
                enquiries.map(enquiry => (
                  <tr key={enquiry._id} className="border-b last:border-b-0 hover:bg-blue-50">
                    <td className="py-2 px-3">{enquiry.customerType}</td>
                    <td className="py-2 px-3">{enquiry.phone}</td>
                    <td className="py-2 px-3">{enquiry.companyName}</td>
                    <td className="py-2 px-3">{enquiry.contactPerson}</td>
                    <td className="py-2 px-3">{enquiry.email}</td>
                    <td className="py-2 px-3">{enquiry.address}</td>
                    <td className="py-2 px-3">{enquiry.location}</td>
                    <td className="py-2 px-3">{enquiry.customerComplaint || "-"}</td>
                    <td className="py-2 px-3">{enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : "-"}</td>
                    <td className="py-2 px-3">
                      <Link // {{ edit_2 }}
                        to={`/admin/employee_details/${enquiry.employeeId}`} // Link to employee details page // {{ edit_2 }}
                        className="text-blue-600 hover:underline" // Add styling to make it look like a link // {{ edit_2 }}
                      > {/* {{ edit_2 }} */}
                        {enquiry.employeeId} {/* {{ edit_2 }} */}
                      </Link>
                    </td>
                    <td className="py-2 px-3"> {/* {{ edit_2 }} New table data cell for assignment */}
                      {updatingServiceId === enquiry._id ? ( // {{ edit_2 }} Show spinner if updating this service
                        <Spinner size="sm" /> // {{ edit_2 }} Assuming you have a small spinner component
                      ) : ( // {{ edit_2 }}
                        <select // {{ edit_2 }} Dropdown to select employee
                          value={enquiry.employeeId || ""} // {{ edit_2 }} Set current value (empty string for unassigned)
                          onChange={(e) => assignEmployeeToService(enquiry._id, e.target.value)} // {{ edit_2 }} Call assignment function on change
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-200 bg-white" // {{ edit_2 }} Basic styling
                        > {/* {{ edit_2 }} */}
                          <option value="">-- Select Employee --</option> {/* {{ edit_2 }} Option to unassign */}
                          {employees?.filter(employee => employee.employeeType === 'Sales') // {{ edit_1 }} Filter employees by type 'Service'
                            .map(employee => ( // {{ edit_2 }} Map through employees to create options
                              <option key={employee._id} value={employee._id}> {/* {{ edit_2 }} Option value is employee ID */}
                                {employee.name} {/* {{ edit_2 }} Display employee name */}
                              </option> // {{ edit_2 }}
                            ))} {/* {{ edit_2 }} */}
                        </select> // {{ edit_2 }}
                      )} {/* {{ edit_2 }} */}
                    </td> {/* {{ edit_2 }} */}
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

export default AdminServices;