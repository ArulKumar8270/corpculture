/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { MdBusiness } from "react-icons/md";
import CompanyRegistrationForm from "../../pages/user/CompanyRegistration/CompanyRegistrationForm";

const CompanyToggleHeader = () => {
    const navigate = useNavigate();
    const { 
        auth, 
        isCompanyEnabled, 
        setIsCompanyEnabled, 
        companyDetails, 
        setSelectedCompany, 
        selectedCompany,
        setRefetch,
        refetch
    } = useAuth();
    const [showCompanyModal, setShowCompanyModal] = useState(false);

    console.log(companyDetails, 'selectedCompany', selectedCompany);

    // Initialize isCompanyEnabled from localStorage
    useEffect(() => {
        const storedCompanyEnabled = localStorage.getItem('isCompanyEnabled');
        if (storedCompanyEnabled !== null) {
            setIsCompanyEnabled(JSON.parse(storedCompanyEnabled));
        }
    }, []);

    // Update localStorage whenever isCompanyEnabled changes
    useEffect(() => {
        localStorage.setItem('isCompanyEnabled', JSON.stringify(isCompanyEnabled));
    }, [isCompanyEnabled]);

    // Initialize selectedCompany from localStorage
    useEffect(() => {
        const storedSelectedCompany = localStorage.getItem('selectedCompany');
        if (storedSelectedCompany !== null && storedSelectedCompany !== 'null') {
            setSelectedCompany(storedSelectedCompany);
        }
    }, []);

    // Update localStorage whenever selectedCompany changes
    useEffect(() => {
        if (selectedCompany) {
            localStorage.setItem('selectedCompany', selectedCompany);
        }
    }, [selectedCompany]);

    // Show company modal when "new" company is selected
    useEffect(() => {
        if (selectedCompany === "new" && isCompanyEnabled) {
            setShowCompanyModal(true);
        } else {
            setShowCompanyModal(false);
        }
    }, [selectedCompany, isCompanyEnabled]);

    const handleToggleCompany = () => {
        const newValue = !isCompanyEnabled;
        setIsCompanyEnabled(newValue);
        if (!newValue) {
            setSelectedCompany("");
        }
    };

    const handleCompanyChange = (event) => {
        const value = event.target.value;
        setSelectedCompany(value);
    };

    // Function to close the company modal
    const handleCloseCompanyModal = () => {
        setShowCompanyModal(false);
        setSelectedCompany("");
        // Trigger refetch to reload company details after creation
        setRefetch(!refetch);
    };

    // Don't show for unauthenticated users or admins
    if (!auth?.user || auth?.user?.role === 1) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            {/* Enable Company Toggle */}
            <label className="flex items-center gap-2 text-white text-sm font-medium cursor-pointer hover:bg-white/10 rounded-lg px-3 py-2 transition-all duration-200">
                <input
                    type="checkbox"
                    checked={isCompanyEnabled || selectedCompany !== ''}
                    className="accent-cyan-300 w-4 h-4 rounded focus:ring-2 focus:ring-cyan-400"
                    onChange={handleToggleCompany}
                />
                <span className="hidden lg:block">Company</span>
                <span className="lg:hidden">
                    <MdBusiness className="text-lg" />
                </span>
            </label>

            {/* Company Selector Dropdown */}
            {(isCompanyEnabled || selectedCompany !== '') && (
                <FormControl sx={{ m: 0, minWidth: 140 }} size="small">
                    <InputLabel 
                        id="company-select-label" 
                        sx={{ color: 'white', fontSize: '0.875rem' }}
                    >
                        Companies
                    </InputLabel>
                    <Select
                        labelId="company-select-label"
                        id="company-select"
                        value={selectedCompany || ''}
                        onChange={handleCompanyChange}
                        autoWidth
                        label="Companies"
                        sx={{
                            color: 'white',
                            fontSize: '0.875rem',
                            '.MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'white',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'white',
                            },
                            '.MuiSvgIcon-root': {
                                color: 'white',
                            },
                            '& .MuiSelect-select': {
                                padding: '8px 12px',
                            }
                        }}
                    >
                        <MenuItem value="new">
                            <em>New Company</em>
                        </MenuItem>
                        {companyDetails && Array.isArray(companyDetails) && companyDetails.length > 0 ? (
                            companyDetails.map((company) => (
                                <MenuItem key={company?._id} value={company?._id}>
                                    {company?.companyName}
                                </MenuItem>
                            ))
                        ) : companyDetails && !Array.isArray(companyDetails) ? (
                            <MenuItem value={companyDetails?._id}>
                                {companyDetails?.companyName}
                            </MenuItem>
                        ) : null}
                    </Select>
                </FormControl>
            )}

            {/* Company Registration Modal */}
            {showCompanyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative">
                        {/* Close button */}
                        <button
                            onClick={handleCloseCompanyModal}
                            className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold z-10"
                        >
                            &times;
                        </button>
                        {/* Render the Company Registration Form */}
                        <CompanyRegistrationForm onClose={handleCloseCompanyModal} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyToggleHeader;

