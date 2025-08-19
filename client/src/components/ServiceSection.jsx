import React, { useState } from 'react';
import axios from "axios";
import { useAuth } from '../context/auth';

const ServiceSection = ({ services }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isFetchingServices, setIsFetchingServices] = useState(false); // Loading state for phone lookup
  const [fetchError, setFetchError] = useState(null); // Error state for phone lookup
  const [fetchedServices, setFetchedServices] = useState([]); // State to store fetched services
  const { auth } = useAuth();

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setShowModal(true);
    // Reset form and fetched services when opening modal
    setForm({
      customerType: "",
      phone: "",
      companyName: "",
      complaint: "",
      contactPerson: "",
      email: "",
      address: "",
      location: "",
      oldServiceId: "", // Reset oldServiceId
      serviceImage: null, // Reset serviceImage
    });
    setErrors({});
    setSubmitStatus(null);
    setFetchedServices([]);
    setFetchError(null);
    setIsFetchingServices(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedService(null);
    // Reset states when closing modal
    setForm({
      customerType: "",
      phone: "",
      companyName: "",
      complaint: "",
      contactPerson: "",
      email: "",
      address: "",
      location: "",
      oldServiceId: "", // Reset oldServiceId
      serviceImage: null, // Reset serviceImage
    });
    setErrors({});
    setSubmitStatus(null);
    setFetchedServices([]);
    setFetchError(null);
    setIsFetchingServices(false);
  };


  const [form, setForm] = useState({
    customerType: "",
    phone: "",
    companyName: "",
    complaint: "",
    contactPerson: "",
    email: "",
    address: "",
    location: "",
    oldServiceId: "", // Initialize oldServiceId
    serviceType: selectedService?.id,
    serviceTitle: selectedService?.title, // Set the serviceType based on the selected service
    serviceImage: null, // Initialize serviceImage to null
  });
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!form.customerType) newErrors.customerType = "Type of customer is required";
    if (!form.phone) newErrors.phone = "Phone is required";
    // Basic phone number validation (e.g., 10 digits)
    else if (!/^\d{10}$/.test(form.phone)) newErrors.phone = "Phone number must be 10 digits";

    if (!form.companyName) newErrors.companyName = "Company name is required";
    if (!form.contactPerson) newErrors.contactPerson = "Contact person is required";
    if (!form.email) newErrors.email = "Email is required";
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) newErrors.email = "Invalid email";
    // if (!form.address) newErrors.address = "Address is required";
    if (!form.location) newErrors.location = "Location is required";
    if (form.customerType === "Rework" && !form.oldServiceId) { // Validate oldServiceId for Rework
      newErrors.oldServiceId = "Old Service ID is required for Rework";
    }
    return newErrors;
  };

  const fetchServicesByPhone = async (phoneNumber) => { // New function to fetch services by phone
    if (!phoneNumber || phoneNumber.length < 9) { // Only fetch if phone is 10 digits
      setFetchError(null); // Clear previous error
      // Optionally clear form fields related to previous customer if phone number is cleared/invalidated
      setForm(prevForm => ({
        ...prevForm,
        customerType: "", // Reset customer type
        companyName: "", // Reset company name
        contactPerson: "", // Reset contact person
        email: "", // Reset email
        address: "", // Reset address
        location: "", // Reset location
        oldServiceId: "", // Reset oldServiceId
        serviceType: selectedService?.id,
        serviceTitle: selectedService?.title, // Set the serviceType based on the selected service
        serviceImage: null, // Reset serviceImage
      }));
      return;
    }

    setIsFetchingServices(true); // Set loading state
    setFetchError(null); // Clear previous error

    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service/phone/${phoneNumber}`);
      if (response.data.success) { // Check for success and if services were returned
        setFetchedServices(response.data.services); // Update fetched services
        // Set customer type to Existing if services are found
        setForm(prevForm => ({ // Update form with fetched data
          ...prevForm, // Keep the current phone number
          customerType: "New", // Set customer type to Existing
          companyName: response.data.services?.[0]?.companyName || "", // Pre-fill company name
          contactPerson: response.data.services?.[0]?.contactPerson || "", // Pre-fill contact person
          email: response.data.services?.[0]?.email || "", // Pre-fill email
          address: response.data.services?.[0]?.addressDetail || "", // Pre-fill address
          location: response.data.services?.[0]?.location || "", // Pre-fill location
          serviceType: response.data.services?.[0]?.serviceType,
          serviceTitle: response.data.services?.[0]?.title,
          oldServiceId: "", // Do not pre-fill oldServiceId from phone lookup
          // complaint is usually specific to the new request, so don't pre-fill
        }));
      } else {
        // Handle cases where success is false or no services found
        setFetchError(response.data.message || "No services found for this phone number.");
        // Optionally clear form fields if no previous customer found
        setForm(prevForm => ({
          ...prevForm, // Keep the current phone number
          customerType: "", // Reset customer type
          companyName: "", // Reset company name
          contactPerson: "", // Reset contact person
          email: "", // Reset email
          address: "", // Reset address
          location: "", // Reset location
          oldServiceId: "", // Reset oldServiceId
        }));
      }
    } catch (err) {
      console.error("Error fetching services by phone:", err);
      setFetchedServices([]); // Clear results on error
      // Set a user-friendly error message
      if (err.response && err.response.status === 404) {
        setFetchError("No services found for this phone number.");
      } else {
        setFetchError("Failed to fetch services. Please try again.");
      }
      // Optionally clear form fields on error
      setForm(prevForm => ({
        ...prevForm, // Keep the current phone number
        customerType: "", // Reset customer type
        companyName: "", // Reset company name
        contactPerson: "", // Reset contact person
        email: "", // Reset email
        address: "", // Reset address
        location: "", // Reset location
        oldServiceId: "", // Reset oldServiceId
      }));
    } finally {
      setIsFetchingServices(false); // Clear loading state
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => {
      const newForm = { ...prevForm, [name]: value };
      // If customerType changes, clear oldServiceId if not Rework
      if (name === 'customerType' && value !== 'Rework') {
        newForm.oldServiceId = '';
      }
      if(name === 'serviceImage'){
        newForm.serviceImage = e.target.files[0];
      }
      return newForm;
    });
    setErrors({ ...errors, [name]: undefined });

    if (name === 'phone') {
      fetchServicesByPhone(value); // Trigger the fetch function
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitStatus(null);
      return;
    }
    const formData = new FormData();
    // Only append file if it exists
    if (form.serviceImage) {
      formData.append("file", form.serviceImage);
    }
    
    let imageUrl = '';
    if (form.serviceImage) {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/upload-file`, formData,
          {
            headers: {
              Authorization: auth?.token
            },
          }
        );
        imageUrl = res?.data?.fileUrl;
      } catch (error) {
        console.error("Error uploading image:", error);
        setSubmitStatus(false);
        return; // Stop submission if image upload fails
      }
    }

    try {
      // Replace with your actual API endpoint
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/service/create`, {
        ...form,
        serviceImage: imageUrl // Use the uploaded image URL
      });
      setSubmitStatus(true);
      setForm({
        customerType: "",
        phone: "",
        companyName: "",
        complaint: "",
        contactPerson: "",
        email: "",
        address: "",
        location: "",
        oldServiceId: "", // Reset oldServiceId after submission
        serviceType: selectedService?.id,
        serviceTitle: selectedService?.title, // Set the serviceType based on the selected service
        serviceImage: null, // Reset serviceImage to null after submission
      });
      setErrors({});
      setFetchedServices([]); // Clear fetched services after successful submission
      setFetchError(null); // Clear fetch error after successful submission
    } catch (err) {
      console.error("Service submission error:", err); // Log the error
      setSubmitStatus(false);
    }
  };


  return (
    <section className="py-20 w-full servicesection" id="services">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our Services
          </h2>
          <div className="h-1 w-24 bg-teal-500 mx-auto mb-6"></div>
          <p className="text-lg text-white max-w-2xl mx-auto">
            We offer a comprehensive range of technical services to meet all your business needs
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group cursor-pointer"
              onClick={() => handleServiceClick(service)}
            >
              <div
                className={`${service.bgColor} p-6 flex justify-center items-center transition-all duration-300 group-hover:scale-105`}
              >
                <div className="bg-white/20 p-4 rounded-full">
                  {service.icon}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-3xl p-0 overflow-hidden border border-gray-200">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-red-100 text-gray-500 hover:text-red-500 shadow transition"
              aria-label="Close"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
            <div className="flex flex-col md:flex-row gap-0">
              <div className="flex-1 p-8">
                <h2 className="text-2xl font-extrabold mb-6 text-center md:text-left text-gray-800 tracking-tight">AC/SERVICE ENQUIRY FORM</h2>
                {submitStatus === true && ( // Check for explicit true
                  <div className="mb-4 text-green-600 font-semibold">Enquiry submitted successfully!</div>
                )}
                {submitStatus === false && ( // Check for explicit false
                  <div className="mb-4 text-red-600 font-semibold">Submission failed. Please try again.</div>
                )}
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit} noValidate>
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Type Of Customer</label>
                    <select
                      name="customerType"
                      value={form.customerType}
                      onChange={handleChange}
                      className={`w-full rounded-lg px-3 py-2 border ${errors.customerType ? "border-red-400" : "border-gray-300"} focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition bg-white`}
                    >
                      <option value="">Mode Of Customer</option>
                      <option value="New">New</option>
                      <option value="Rework">Rework</option>
                    </select>
                    {errors.customerType && <span className="text-red-500 text-xs">{errors.customerType}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange} // Use the modified handleChange
                      className={`w-full rounded-lg px-3 py-2 border ${errors.phone || fetchError ? "border-red-400" : "border-gray-300"} focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition bg-white`} // Add error styling based on fetchError
                      maxLength="10" // Limit input to 10 digits
                    />
                    {errors.phone && <span className="text-red-500 text-xs">{errors.phone}</span>}
                    {/* Display loading or error message for phone lookup */}
                    {isFetchingServices && <span className="text-sky-600 text-xs">Searching for previous services...</span>}
                    {fetchError && <span className="text-red-500 text-xs">{fetchError}</span>}
                  </div>
                  {form.customerType === "Rework" && ( // Conditionally render Old Service ID field
                    <div>
                      <label className="block font-semibold mb-1 text-gray-700">Old Service ID</label>
                      <input
                        type="text"
                        name="oldServiceId"
                        value={form.oldServiceId}
                        onChange={handleChange}
                        className={`w-full rounded-lg px-3 py-2 border ${errors.oldServiceId ? "border-red-400" : "border-gray-300"} focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition bg-white`}
                      />
                      {errors.oldServiceId && <span className="text-red-500 text-xs">{errors.oldServiceId}</span>}
                    </div>
                  )}

                  {form.customerType === "Rework" && fetchedServices.length > 0 && (
                    <div className="md:col-span-2 mt-4">
                      <h3 className="text-lg font-semibold mb-2 text-gray-700">Previous Services for this Phone Number:</h3>
                      <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50">
                        {fetchedServices.map((service) => (
                          <div
                            key={service._id}
                            className={`p-3 mb-2 border rounded-md cursor-pointer transition-all duration-200 ${form.oldServiceId === service._id ? 'bg-sky-100 border-sky-500' : 'bg-white border-gray-200 hover:bg-gray-100'}`}
                            onClick={() => setForm(prevForm => ({ ...prevForm, oldServiceId: service._id }))}
                          >
                            <p className="font-medium text-gray-800">Service ID: <span className="font-normal text-sm text-gray-600">{service._id}</span></p>
                            <p className="font-medium text-gray-800">Service Type: <span className="font-normal text-sm text-gray-600">{service.serviceTitle || 'N/A'}</span></p>
                            <p className="font-medium text-gray-800">Complaint: <span className="font-normal text-sm text-gray-600">{service.complaint || 'No complaint details'}</span></p>
                            <p className="font-medium text-gray-800">Date: <span className="font-normal text-sm text-gray-600">{new Date(service.createdAt).toLocaleDateString()}</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      className={`w-full rounded-lg px-3 py-2 border ${errors.companyName ? "border-red-400" : "border-gray-300"} focus:border-sky-500 focus:ring-2 focus:ring-200 transition bg-white`}
                    />
                    {errors.companyName && <span className="text-red-500 text-xs">{errors.companyName}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Customer Complaint Box (Optional)</label>
                    <input
                      type="text"
                      name="complaint"
                      value={form.complaint}
                      onChange={handleChange}
                      className="w-full rounded-lg px-3 py-2 border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Contact Person</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={form.contactPerson}
                      onChange={handleChange}
                      className={`w-full rounded-lg px-3 py-2 border ${errors.contactPerson ? "border-red-400" : "border-gray-300"} focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition bg-white`}
                    />
                    {errors.contactPerson && <span className="text-red-500 text-xs">{errors.contactPerson}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Email address</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className={`w-full rounded-lg px-3 py-2 border ${errors.email ? "border-red-400" : "border-gray-300"} focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition bg-white`}
                    />
                    {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Address Detail</label>
                    <input
                      type="text"
                      name="location" // Changed from location to address
                      value={form.location} // Changed from location to address
                      onChange={handleChange}
                      className={`w-full rounded-lg px-3 py-2 border ${errors.location ? "border-red-400" : "border-gray-300"} focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition bg-white`}
                    />
                    {errors.location && <span className="text-red-500 text-xs">{errors.location}</span>}
                  </div>
                  {/* <div>
                    <label className="block font-semibold mb-1 text-gray-700">Location Detail</label>
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      className={`w-full rounded-lg px-3 py-2 border ${errors.location ? "border-red-400" : "border-gray-300"} focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition bg-white`}
                    />
                    {errors.location && <span className="text-red-500 text-xs">{errors.location}</span>}
                  </div> */}
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Service Image</label>
                    <input
                      type="file"
                      name="serviceImage"
                      // Removed value={form.serviceImage}
                      onChange={handleChange}
                      accept='image/*'
                      className={`w-full rounded-lg px-3 py-2 border ${errors.serviceImage ? "border-red-400" : "border-gray-300"} focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition bg-white`}
                    />
                    {errors.serviceImage && <span className="text-red-500 text-xs">{errors.serviceImage}</span>}
                  </div>
                  <div className="col-span-1 md:col-span-2 flex gap-4 mt-4">
                    <button type="submit" className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-bold shadow transition text-lg">Submit</button>
                    <button type="button" className="flex-1 bg-lime-500 hover:bg-lime-600 text-white py-3 rounded-xl font-bold shadow transition text-lg">Calls us</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ServiceSection;