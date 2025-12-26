import { useContext, createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import axios from "axios";

const AuthContext = createContext();

// eslint-disable-next-line react/prop-types
const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        user: null,
        token: "",
    });
    const [isAdmin, setIsAdmin] = useState(0);
    const [isContextLoading, setIsContextLoading] = useState(true);
    const [isCompanyEnabled, setIsCompanyEnabled] = useState(false);
    const [companyDetails, setCompanyDetails] = useState(null); // {{ edit_6 }}
    const [refetch, setRefetch] = useState(false); // {{ edit_7 }}
    const [selectedCompany, setSelectedCompany] = useState(null); // {{ edit_8 }}
    const [userPermissions, setUserPermissions] = useState([]);
    const [loadingPermissions, setLoadingPermissions] = useState(true);

    // Initialize company settings from localStorage
    useEffect(() => {
        const storedCompanyEnabled = localStorage.getItem('isCompanyEnabled');
        const storedSelectedCompany = localStorage.getItem('selectedCompany');
        if (storedCompanyEnabled !== null) {
            setIsCompanyEnabled(JSON.parse(storedCompanyEnabled));
        }
        if (storedSelectedCompany !== null && storedSelectedCompany !== 'null' && storedSelectedCompany !== '') {
            setSelectedCompany(storedSelectedCompany);
        }
    }, []);

    // Update localStorage whenever company state changes
    useEffect(() => {
        localStorage.setItem('isCompanyEnabled', JSON.stringify(isCompanyEnabled));
    }, [isCompanyEnabled]);

    useEffect(() => {
        if (selectedCompany) {
            localStorage.setItem('selectedCompany', selectedCompany);
        } else if (selectedCompany === null || selectedCompany === '') {
            localStorage.removeItem('selectedCompany');
        }
    }, [selectedCompany]);
    useEffect(() => {
        if ((auth?.user?._id && isCompanyEnabled) || refetch) {
            getCompanyDetails();
        }
    }, [auth, isCompanyEnabled, refetch])

    useEffect(() => {
        const fetchPermissions = async () => {
            if (auth?.user?._id) {
                try {
                    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/permissions/user/${auth.user._id}`);
                    if (data.success) {
                        setUserPermissions(data.permissions);
                    } else {
                        console.error("Failed to fetch permissions:", data.message);
                    }
                } catch (error) {
                    console.error("Error fetching permissions:", error);
                } finally {
                    setLoadingPermissions(false);
                }
            } else {
                setLoadingPermissions(false);
            }
        };
        fetchPermissions();
    }, [auth?.user?._id]);


    useEffect(() => {
        const data = Cookies.get("auth");
        if (data) {
            const parsedData = JSON.parse(data);
            setAuth({
                user: parsedData.user,
                token: parsedData.token,
            });
            let isCompanyEnabled = parsedData?.user?.role === 1 || parsedData?.user?.role === 3;
            setIsAdmin(isCompanyEnabled);
        }
        setIsContextLoading(false);
    }, []);
    //Function to Logout user
    const LogOut = () => {
        setAuth({
            ...auth,
            user: null,
            token: "",
        });
        Cookies.remove("auth");
        toast.success("Logged out Successfully!", {
            toastId: "LogOut",
        });
    };

    console.log('auth23452345', auth);

    const getCompanyDetails = async () => {
        if (!auth?.user || !auth?.token || !isCompanyEnabled) return;
        
        try {
            let response;
            // For customers (role 0), use user-company endpoint
            if (auth.user.role === 0 && auth.user.phone) {
                response = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/company/user-company/${auth.user.phone}`,
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
                // Handle response structure: { success: true, company: [...] }
                if (response.data?.success && response.data.company) {
                    // company is an array in this response
                    const companies = Array.isArray(response.data.company) 
                        ? response.data.company 
                        : [response.data.company];
                    setCompanyDetails(companies);
                }
            } else {
                // For admin/employee, use all companies endpoint
                response = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/company/all?limit=1000`,
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
                // Handle response structure: { success: true, companies: [...] }
                if (response.data?.success && response.data.companies) {
                    setCompanyDetails(response.data.companies);
                }
            }
        } catch (error) {
            console.error("Error fetching company details:", error);
            setCompanyDetails(null);
        }
    }

    return (
        <AuthContext.Provider
            value={{ auth, setAuth, LogOut, isAdmin, isContextLoading, isCompanyEnabled, setIsCompanyEnabled, companyDetails, setRefetch, refetch, setSelectedCompany, selectedCompany, userPermissions }}
        >
            {children}
        </AuthContext.Provider>
    );
};

//custom hook->
const useAuth = () => {
    return useContext(AuthContext);
};

// eslint-disable-next-line react-refresh/only-export-components
export { AuthProvider, useAuth };
