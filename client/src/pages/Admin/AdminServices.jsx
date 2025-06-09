import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Spinner from "../../components/Spinner";
import { useAuth } from "../../context/auth";
import SeoData from "../../SEO/SeoData";

const AdminServices = () => {
  const { auth } = useAuth();
  const [enquiries, setEnquiries] = useState([
    {
      _id: "sample1",
      customerType: "Individual",
      phone: "9876543210",
      companyName: "",
      contactPerson: "John Doe",
      email: "john.doe@example.com",
      addressDetail: "123 Sample Street, Anytown",
      locationDetail: "Near Central Park",
      customerComplaint: "Issue with product delivery.",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "sample2",
      customerType: "Business",
      phone: "0123456789",
      companyName: "Sample Corp",
      contactPerson: "Jane Smith",
      email: "jane.smith@samplecorp.com",
      addressDetail: "456 Business Ave, Corp City",
      locationDetail: "Building C, 3rd Floor",
      customerComplaint: "Need bulk order quotation.",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
     {
      _id: "sample3",
      customerType: "Individual",
      phone: "5551112222",
      companyName: "",
      contactPerson: "Peter Jones",
      email: "peter.j@mail.com",
      addressDetail: "789 Test Lane, Villagetown",
      locationDetail: "Behind the post office",
      customerComplaint: "", // Optional field
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        setLoading(true);
        // *** Replace with your actual API endpoint for fetching service enquiries ***
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/v1/admin/service-enquiries`,
          {
            headers: {
              Authorization: auth?.token,
            },
          }
        );
        setEnquiries(response.data.enquiries || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching service enquiries:", error);
        setLoading(false);
        // Handle error display if needed
      }
    };

    if (auth?.token) {
      fetchEnquiries();
    }
  }, [auth?.token]);

  return (
    <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
      <SeoData title="Service Enquiries - Admin" />
      <h1 className="text-2xl font-bold mb-6 text-[#019ee3]">Service Enquiries</h1>
      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
          <table className="min-w-full text-sm">
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
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-gray-400">No service enquiries found.</td>
                </tr>
              ) : (
                enquiries.map(enquiry => (
                  <tr key={enquiry._id} className="border-b last:border-b-0 hover:bg-blue-50">
                    <td className="py-2 px-3">{enquiry.customerType}</td>
                    <td className="py-2 px-3">{enquiry.phone}</td>
                    <td className="py-2 px-3">{enquiry.companyName}</td>
                    <td className="py-2 px-3">{enquiry.contactPerson}</td>
                    <td className="py-2 px-3">{enquiry.email}</td>
                    <td className="py-2 px-3">{enquiry.addressDetail}</td>
                    <td className="py-2 px-3">{enquiry.locationDetail}</td>
                    <td className="py-2 px-3">{enquiry.customerComplaint || "-"}</td>
                    <td className="py-2 px-3">{enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : "-"}</td>
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