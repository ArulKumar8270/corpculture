import React, { useState } from 'react';
import axios from "axios";

const ServiceSection = ({ services }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [fetchedServices, setFetchedServices] = useState([]); // State to store services fetched by phone
  const [isFetchingServices, setIsFetchingServices] = useState(false); // Loading state for phone lookup
  const [fetchError, setFetchError] = useState(null); // Error state for phone lookup


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
  if (!form.address) newErrors.address = "Address is required";
  if (!form.location) newErrors.location = "Location is required";
  return newErrors;
};

const fetchServicesByPhone = async (phoneNumber) => { // New function to fetch services by phone
    if (!phoneNumber || phoneNumber.length !== 10) { // Only fetch if phone is 10 digits
        setFetchedServices([]); // Clear previous results
        setFetchError(null); // Clear previous error
        // Optionally clear form fields related to previous customer if phone number is cleared/invalidated {{ edit_1 }}
        setForm(prevForm => ({ // {{ edit_1 }}
            ...prevForm, // {{ edit_1 }}
            customerType: "", // {{ edit_1 }} Reset customer type
            companyName: "", // {{ edit_1 }} Reset company name
            contactPerson: "", // {{ edit_1 }} Reset contact person
            email: "", // {{ edit_1 }} Reset email
            address: "", // {{ edit_1 }} Reset address
            location: "", // {{ edit_1 }} Reset location
        })); // {{ edit_1 }}
        return; // {{ edit_1 }}
    }

    setIsFetchingServices(true); // Set loading state
    setFetchError(null); // Clear previous error

    try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service/phone/${phoneNumber}`);
        if (response.data.success && response.data.services.length > 0) { // Check for success and if services were returned {{ edit_1 }}
            setFetchedServices(response.data.services); // Store fetched services
            const latestService = response.data.services[0]; // Get the most recent service (assuming sorted by createdAt desc) {{ edit_1 }}
            setForm(prevForm => ({ // {{ edit_1 }} Update form with fetched data
                ...prevForm, // {{ edit_1 }} Keep the current phone number
                customerType: "Existing", // {{ edit_1 }} Set customer type to Existing
                companyName: latestService.companyName || "", // {{ edit_1 }} Pre-fill company name
                contactPerson: latestService.contactPerson || "", // {{ edit_1 }} Pre-fill contact person
                email: latestService.email || "", // {{ edit_1 }} Pre-fill email
                address: latestService.address || "", // {{ edit_1 }} Pre-fill address
                location: latestService.location || "", // {{ edit_1 }} Pre-fill location
                // complaint is usually specific to the new request, so don't pre-fill {{ edit_1 }}
            })); // {{ edit_1 }}
        } else {
             // Handle cases where success is false or no services found
            setFetchedServices([]); // Clear previous results
            setFetchError(response.data.message || "No services found for this phone number.");
             // Optionally clear form fields if no previous customer found {{ edit_1 }}
            setForm(prevForm => ({ // {{ edit_1 }}
                ...prevForm, // {{ edit_1 }} Keep the current phone number
                customerType: "", // {{ edit_1 }} Reset customer type
                companyName: "", // {{ edit_1 }} Reset company name
                contactPerson: "", // {{ edit_1 }} Reset contact person
                email: "", // {{ edit_1 }} Reset email
                address: "", // {{ edit_1 }} Reset address
                location: "", // {{ edit_1 }} Reset location
            })); // {{ edit_1 }}
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
         // Optionally clear form fields on error {{ edit_1 }}
        setForm(prevForm => ({ // {{ edit_1 }}
            ...prevForm, // {{ edit_1 }} Keep the current phone number
            customerType: "", // {{ edit_1 }} Reset customer type
            companyName: "", // {{ edit_1 }} Reset company name
            contactPerson: "", // {{ edit_1 }} Reset contact person
            email: "", // {{ edit_1 }} Reset email
            address: "", // {{ edit_1 }} Reset address
            location: "", // {{ edit_1 }} Reset location
        })); // {{ edit_1 }}
    } finally {
        setIsFetchingServices(false); // Clear loading state
    }
};


const handleChange = (e) => {
  const { name, value } = e.target;
  setForm({ ...form, [name]: value });
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
  try {
    // Replace with your actual API endpoint
    await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/service/create`, form);
    setSubmitStatus("success");
    setForm({
      customerType: "",
      phone: "",
      companyName: "",
      complaint: "",
      contactPerson: "",
      email: "",
      address: "",
      location: "",
    });
    setErrors({});
    setFetchedServices([]); // Clear fetched services after successful submission
    setFetchError(null); // Clear fetch error after successful submission
  } catch (err) {
    console.error("Service submission error:", err); // Log the error
    setSubmitStatus("error");
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
                {submitStatus === "success" && (
                  <div className="mb-4 text-green-600 font-semibold">Enquiry submitted successfully!</div>
                )}
                {submitStatus === "error" && (
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
                      <option value="Existing">Existing</option>
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
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      className={`w-full rounded-lg px-3 py-2 border ${errors.companyName ? "border-red-400" : "border-gray-300"} focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition bg-white`}
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
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className={`w-full rounded-lg px-3 py-2 border ${errors.address ? "border-red-400" : "border-gray-300"} focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition bg-white`}
                    />
                    {errors.address && <span className="text-red-500 text-xs">{errors.address}</span>}
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700">Location Detail</label>
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      className={`w-full rounded-lg px-3 py-2 border ${errors.location ? "border-red-400" : "border-gray-300"} focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition bg-white`}
                    />
                    {errors.location && <span className="text-red-500 text-xs">{errors.location}</span>}
                  </div>
                  <div className="col-span-1 md:col-span-2 flex gap-4 mt-4">
                    <button type="submit" className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-bold shadow transition text-lg">Submit</button>
                    <button type="button" className="flex-1 bg-lime-500 hover:bg-lime-600 text-white py-3 rounded-xl font-bold shadow transition text-lg">Calls us</button>
                  </div>
                </form>

                {/* Display fetched services */}
                {fetchedServices.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-semibold mb-3 text-gray-700">Previous Service Requests:</h3>
                        <ul className="list-disc list-inside text-gray-600 text-sm max-h-40 overflow-y-auto pr-2">
                            {fetchedServices.map(service => (
                                <li key={service._id} className="mb-1">
                                    <strong>ID:</strong> {service._id} - <strong>Status:</strong> {service.status || 'Pending'} - <strong>Date:</strong> {new Date(service.createdAt).toLocaleDateString()} {/* Display relevant service info */}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ServiceSection;