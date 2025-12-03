import { Route, Routes, useNavigate } from "react-router-dom";
import AdminMenu from "./AdminMenu";
import UserProfile from "../UserProfile";
import AddressComponent from "../AddressComponent";
import PanCardComponent from "../PanCardComponent";
import CreateProduct from "./CreateProduct";
import AllProducts from "./AllProducts";
import AllCategories from "./AllCategories";
import Users from "./Users";
import Deactivate from "../Auth/Deactivate";
import EditProduct from "./EditProduct";
import SeoData from "../../SEO/SeoData";
import { useEffect, useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import AdminServices from "./AdminServices"; // Import the new component
import GST from "./OtherSettings/GST";
import AdminEmployees from "./adminemployees";
import MenuSetting from "./OtherSettings/MenuSetting";
import CompanyList from "./OtherSettings/CompanyList";
import AddServiceProduct from "./Service/AddServiceProduct";
import ServiceProductList from "./Service/ServiceProductList";
import RentalProductList from "./Rental/RentalProductList";
import AddRentalProduct from "./Rental/AddRentalProduct";
import VendorList from "./Vendor/VendorList";
import AddVendor from "./Vendor/AddVendor";
import VendorProductList from "./Vendor/VendorProductList";
import AddVendorProduct from "./Vendor/AddVendorProduct";
import PurchaseList from "./Purchase/PurchaseList";
import PurchaseRegister from "./Purchase/PurchaseRegister";
import AddServiceQuotation from "./AddServiceQuotation";
import AddServiceInvoice from "./AddServiceInvoice";
import AddServiceReport from "./AddServiceReport";
import ServiceInvoiceList from "./ServiceInvoiceList";
import ServiceQuotationList from "./ServiceQuotationList";
import AddCompany from "./AddCompany";
import AddRentalInvoice from "./addRentalInvoice";
import AdminRental from "./AdminRental";
import RentalInvoiceList from "./RentalInvoiceList";
import ServiceReportsandGatpass from "./ServiceReportsandGatpass";
import ReportsDashboard from "./ReportsDashboard";
import ServiceInvoicesReport from "./reports/ServiceInvoicesReport";
import CompanyReports from "./reports/CompanyReports";
import ServiceReportsSummary from "./reports/ServiceReportsSummary";
import RentalReportsSummary from "./reports/RentalReportsSummary";
import SalesReportsSummary from "./reports/SalesReportsSummary";
import RentalInvoiceReport from "./Reports/RentalInvoiceReport";
import ServiceReportsReport from "./Reports/ServiceReportsReport";
import ServiceEnquiriesReport from "./Reports/ServiceEnquiriesReport";
import AddEmployee from "./addemployee";
import AdminOrders from "./AdminOrders";
import UpdateOrders from "./UpdateOrders";
import AdminCommission from "./AdminCommission";
import EmployeeDetails from "./EmployeeDetails";
import OldInvoicesList from "./OldInvoicesList";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State to manage menu visibility

    useEffect(() => {
        if (window.location.pathname === "/admin/dashboard") {
            navigate("./profile");
        }
    }, [navigate]);

    const toggleMenu = () => {
        setIsMenuOpen((prevState) => !prevState);
    };

    return (
        <>
            <SeoData title="Admin Dashboard" />
            <div className="min-h-screen bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] py-8">
                <div className="flex  mx-auto px-2 sm:px-8 overflow-x-hidden">
                    {/*sm:flex-row items-start justify-center gap-6  */}
                    {/* Sidebar */}
                    <div
                        className={`w-full sm:w-[260px] mb-4 sm:mb-0 ${
                            isMenuOpen
                                ? "block z-50"
                                : "hidden"
                        } sm:block`}
                    >
                        <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-8">
                            <AdminMenu toggleMenu={toggleMenu} />
                        </div>
                    </div>
                    {/* Main Content */}
                    <div className="flex-1 w-full p-4 min-h-[60vh] relative">
                        <button
                            onClick={toggleMenu}
                            className="sm:hidden absolute top-4 right-4 bg-[#019ee3] text-white rounded-full p-2 shadow-md transition hover:bg-[#afcb09]"
                        >
                            {isMenuOpen ? "Close" : <GiHamburgerMenu size={22} />}
                        </button>
                        <Routes>
                            <Route path="" element={<UserProfile />} />
                            <Route path="profile" element={<UserProfile />} />
                            <Route path="address" element={<AddressComponent />} />
                            <Route path="pan" element={<PanCardComponent />} />
                            <Route path="add-product" element={<CreateProduct />} />
                            <Route path="all-products" element={<AllProducts />} />
                            <Route path="orders" element={<AdminOrders />} />
                            <Route path="order_details/:id?" element={<UpdateOrders />} />
                            <Route path="commission" element={<AdminCommission />} />
                            <Route path="gst" element={<GST />} />
                            <Route path="employee" element={<AdminEmployees />} />
                            <Route path="employee_details/:id?" element={<EmployeeDetails />} />
                            <Route path="addEmployee/:employeeId?" element={<AddEmployee />} />
                            <Route path="menuSetting" element={<MenuSetting />} />
                            <Route path="addServiceProduct" element={<AddServiceProduct />} />
                            <Route path="serviceProductList" element={<ServiceProductList />} />
                            <Route path="rentalProductList" element={<RentalProductList />} />
                            <Route path="addRentalProduct" element={<AddRentalProduct />} />
                            <Route path="vendorList" element={<VendorList />} />
                            <Route path="addVendor" element={<AddVendor />} />
                            <Route path="vendorProductList" element={<VendorProductList />} />
                            <Route path="addVendorProduct" element={<AddVendorProduct />} />
                            <Route path="purchaseList" element={<PurchaseList />} />
                            <Route path="purchaseRegister/:id?" element={<PurchaseRegister />} />
                            <Route path="all-category" element={<AllCategories />} />
                            <Route path="companyList" element={<CompanyList />} />
                            <Route path="addCompany/:companyId?" element={<AddCompany />} />
                            {/* <Route path="serviceReports" element={<ServiceReports />} /> */}
                            <Route path="addServiceQuotation/:quotationId?" element={<AddServiceQuotation />} />
                            <Route path="addServiceInvoice/:invoiceId?" element={<AddServiceInvoice />} />
                            <Route path="serviceInvoiceList" element={<ServiceInvoiceList invoice={"invoice"}/>} />
                            <Route path="serviceQuotationList" element={<ServiceInvoiceList invoice={"quotation"} />} />
                            <Route path="addServiceReport/:id?" element={<AddServiceReport />} />
                            <Route path="serviceReportlist" element={<ServiceReportsandGatpass reportType={"service"}/>} />
                            <Route path="rentalReportlist" element={<ServiceReportsandGatpass reportType={"rental"}/>} />
                            <Route path="addRentalInvoice/:id?" element={<AddRentalInvoice />} />
                            <Route path="rentalInvoiceList" element={<RentalInvoiceList invoice={"invoice"}/>} />
                            <Route path="rentalQuotationList" element={<RentalInvoiceList invoice={"quotation"}/>} />
                            <Route path="users" element={<Users />} />
                            {/* Add the new route for Service Enquiries */}
                            <Route path="service-enquiries" element={<AdminServices />} />
                            <Route path="rental-enquiries" element={<AdminRental />} />
                            <Route path="profile/deactivate" element={<Deactivate />} />
                            <Route path="product/:productId" element={<EditProduct />} />

                            {/* Reports Routes */}
                            <Route path="companyReports" element={<CompanyReports />} />
                            <Route path="serviceReportsSummary" element={<ServiceReportsSummary />} />
                            <Route path="rentalReportsSummary" element={<RentalReportsSummary />} />
                            <Route path="salesReportsSummary" element={<SalesReportsSummary />} />
                            <Route path="reportsDashboard" element={<ReportsDashboard />} />
                            <Route path="serviceInvoicesReport/:companyId?" element={<ServiceInvoicesReport type={"invoice"}/>} />
                            <Route path="serviceQuotationsReport/:companyId?" element={<ServiceInvoicesReport type={"quotation"}/>} />
                            <Route path="serviceReportsReport/:companyId?" element={<ServiceReportsReport type={"service"}/>} />
                            <Route path="serviceEnquiriesReport/:companyId?" element={<ServiceEnquiriesReport type={"service"}/>} />
                            <Route path="rentalEnquiriesReport/:companyId?" element={<ServiceEnquiriesReport type={"rental"}/>} />
                            <Route path="rantalInvoicesReport/:companyId?" element={<RentalInvoiceReport type={"invoice"}/>} />
                            <Route path="rentalQuotationsReport/:companyId?" element={<RentalInvoiceReport type={"quotation"}/>} />
                            <Route path="rentalReportsReport/:companyId?" element={<ServiceReportsReport type={"rental"}/>} />
                            <Route path="oldInvoices" element={<OldInvoicesList />} />
                        </Routes>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;
