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
    useEffect(() => {
        if (auth?.user?._id || refetch) {
            getCompanyDetails();
        }
    }, [auth, isCompanyEnabled, refetch])

    useEffect(() => {
        const data = Cookies.get("auth");
        if (data) {
            const parsedData = JSON.parse(data);
            setAuth({
                user: parsedData.user,
                token: parsedData.token,
            });
            setIsAdmin(parsedData?.user?.role === 1);
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

    const getCompanyDetails = async () => {
        try {
            // 1. Check for user's company details
            // You need a backend endpoint that returns the company details for the logged-in user
            const companyResponse = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/company/user-company/${auth?.user?._id}`, // *** Create this backend endpoint ***
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );

            // Assuming the backend returns company data if it exists, or null/empty if not found
            const userCompany = companyResponse.data.company;
            setCompanyDetails(userCompany) // Adjust based on your backend response structure
        } catch (error) {
            console.error("Error fetching company details:", error);
        }
    }

    return (
        <AuthContext.Provider
            value={{ auth, setAuth, LogOut, isAdmin, isContextLoading, isCompanyEnabled, setIsCompanyEnabled, companyDetails, setRefetch, refetch, setSelectedCompany, selectedCompany }}
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
