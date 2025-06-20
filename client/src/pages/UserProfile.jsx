import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserProfile = () => {
    const {auth, setAuth} = useAuth();
    const [profile, setProfile] = useState(false);
    const [emailSection, setEmailSection] = useState(false);
    const [phoneSection, setPhoneSection] = useState(false);
    const [email, setEmail] = useState(auth?.user?.email);
    const [name, setName] = useState(auth?.user?.name);
    const [phone, setPhone] = useState(auth?.user?.phone);
    const [nameInputFocused, setNameInputFocused] = useState(false);
    // Add state for email and phone input focus if needed for similar styling
    const [emailInputFocused, setEmailInputFocused] = useState(false); // {{ edit_1 }}
    const [phoneInputFocused, setPhoneInputFocused] = useState(false); // {{ edit_1 }}


    const handleProfile = () => {
        setProfile(!profile);
        // Reset other sections when toggling profile edit
        setEmailSection(false); // {{ edit_1 }}
        setPhoneSection(false); // {{ edit_1 }}
    };

    const handleEmail = () => {
        setEmailSection(!emailSection);
        // Reset other sections when toggling email edit
        setProfile(false); // {{ edit_1 }}
        setPhoneSection(false); // {{ edit_1 }}
    };

    const handlePhone = () => {
        setPhoneSection(!phoneSection);
        // Reset other sections when toggling phone edit
        setProfile(false); // {{ edit_1 }}
        setEmailSection(false); // {{ edit_1 }}
    };

    const handleNameSubmit = async (e) => {
        e.preventDefault();
        try {
            setProfile(false);

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/update-details`,
                {
                    newName: name,
                    email: auth?.user?.email,
                }
            );
            setAuth({
                ...auth,
                user: {
                    ...auth.user,
                    name: response.data.user.name, // Use updated name from response {{ edit_1 }}
                },
            });
            // Update localStorage with the new user data from the response
            localStorage.setItem("auth", JSON.stringify(response.data)); // {{ edit_1 }}

            toast.success(response.data.message);
        } catch (error) {
            console.error("Error:", error); // Use console.error for errors {{ edit_1 }}
             // Handle specific errors
            error.response?.status === 401 &&
                error.response.data?.errorType === "invalidUser" &&
                toast.error("User not Found!");
            error.response?.status === 500 &&
                toast.error("Something went wrong! Please try after sometime.");
             // Generic error message if no specific handler matches
            !error.response && toast.error("Network error or server unreachable."); // {{ edit_1 }}
        }
    };
    const handleEmailSubmit = async (e) => {
        e.preventDefault();

        try {
            setEmailSection(false);

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/update-details`,
                {
                    newEmail: email,
                    email: auth?.user?.email,
                }
            );
            setAuth({
                ...auth,
                user: {
                    ...auth.user,
                    email: response.data.user.email, // Use updated email from response {{ edit_1 }}
                },
            });
            // Update localStorage with the new user data from the response
            localStorage.setItem("auth", JSON.stringify(response.data)); // {{ edit_1 }}

            toast.success(response.data.message);
        } catch (error) {
            console.error("Error:", error); // Use console.error for errors {{ edit_1 }}
             // Handle specific errors
            error.response?.status === 401 &&
                error.response.data?.errorType === "invalidUser" &&
                toast.error("User not Found!");
            error.response?.status === 500 &&
                toast.error("Something went wrong! Please try after sometime.");
             // Generic error message if no specific handler matches
            !error.response && toast.error("Network error or server unreachable."); // {{ edit_1 }}
        }
    };
    const handlePhoneSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission here {{ edit_1 }}
        setPhoneSection(false);


        try {
            // setProfile(false); // This seems incorrect for phone update {{ edit_1 }}

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/update-details`, // Added missing '/' {{ edit_1 }}
                {
                    newPhone: phone,
                    email: auth?.user?.email, // Assuming email is used to identify the user on the backend
                }
            );
            setAuth({
                ...auth,
                user: {
                    ...auth.user,
                    phone: response.data.user.phone, // Use updated phone from response {{ edit_1 }}
                },
            });
            // Update localStorage with the new user data from the response
            localStorage.setItem("auth", JSON.stringify(response.data)); // {{ edit_1 }}

            toast.success(response.data.message);
        } catch (error) {
            console.error("Error:", error);
            //user not found
            error.response?.status === 401 &&
                error.response.data?.errorType === "invalidUser" &&
                toast.error("User not Found!");
            //server error
            error.response?.status === 500 &&
                toast.error("Something went wrong! Please try after sometime.");
             // Generic error message if no specific handler matches
            !error.response && toast.error("Network error or server unreachable."); // {{ edit_1 }}
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 rounded-lg shadow-md"> {/* {{ edit_1 }} Added max-width, centering, padding, background, rounded corners, shadow */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">My Profile</h2> {/* {{ edit_1 }} Added main heading */}
            <div className="w-full flex flex-col items-start gap-8"> {/* {{ edit_1 }} Adjusted gap */}

                {/* Personal Information section */}
                <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200"> {/* {{ edit_1 }} Styled section container */}
                    <div className="flex justify-between items-center mb-4"> {/* {{ edit_1 }} Adjusted flex for heading and button */}
                        <div className="font-semibold text-lg text-gray-700"> {/* {{ edit_1 }} Styled heading */}
                            Personal Information
                        </div>
                        <button
                            className="text-sm text-blue-600 hover:underline font-medium" // {{ edit_1 }} Styled button
                            onClick={handleProfile}
                        >
                            {!profile ? "Edit" : "Cancel"}
                        </button>
                    </div>
                    <div className="min-h-[50px]"> {/* {{ edit_1 }} Adjusted height */}
                        {profile ? (
                            <form
                                action="/update-details" // This action is not used with onSubmit {{ edit_1 }}
                                method="post" // This method is not used with onSubmit {{ edit_1 }}
                                onSubmit={handleNameSubmit}
                                className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center" // {{ edit_1 }} Adjusted form layout
                            >
                                <div
                                    className={`border p-3 flex flex-col w-full sm:w-[220px] rounded-md transition-colors duration-200 ${ // {{ edit_1 }} Styled input container
                                        nameInputFocused
                                            ? "border-blue-500" // {{ edit_1 }} Focused border color
                                            : "border-gray-300" // {{ edit_1 }} Default border color
                                    }`}
                                >
                                    <label
                                        htmlFor="name"
                                        className="text-xs text-gray-500 font-medium mb-1" // {{ edit_1 }} Styled label
                                    >
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        onFocus={() =>
                                            setNameInputFocused(true)
                                        }
                                        onBlur={() =>
                                            setNameInputFocused(false)
                                        }
                                        className="text-sm text-gray-800 outline-none bg-transparent" // {{ edit_1 }} Styled input
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-auto px-6 py-2 rounded-md transition-colors duration-200" // {{ edit_1 }} Styled button
                                    // onClick={handleNameSubmit} // No need for onClick when using onSubmit on form {{ edit_1 }}
                                >
                                    Save
                                </button>
                            </form>
                        ) : (
                            <div className="border p-3 w-full sm:w-[220px] min-h-[50px] text-gray-700 flex items-center rounded-md bg-gray-100"> {/* {{ edit_1 }} Styled display div */}
                                {auth?.user?.name}
                            </div>
                        )}
                    </div>
                </div>

                {/* email section */}
                <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200"> {/* {{ edit_1 }} Styled section container */}
                    <div className="flex justify-between items-center mb-4"> {/* {{ edit_1 }} Adjusted flex for heading and button */}
                        <div className="font-semibold text-lg text-gray-700"> {/* {{ edit_1 }} Styled heading */}
                            Email Address
                        </div>
                        <button
                            className="text-sm text-blue-600 hover:underline font-medium" // {{ edit_1 }} Styled button
                            onClick={handleEmail}
                        >
                            {!emailSection ? "Edit" : "Cancel"}
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center"> {/* {{ edit_1 }} Adjusted layout */}
                        {emailSection ? (
                             <div // {{ edit_1 }} Wrap input for consistent styling
                                    className={`border p-3 flex flex-col w-full sm:w-[220px] rounded-md transition-colors duration-200 ${
                                        emailInputFocused
                                            ? "border-blue-500"
                                            : "border-gray-300"
                                    }`}
                                > {/* {{ edit_1 }} */}
                                <label htmlFor="email" className="text-xs text-gray-500 font-medium mb-1">Email</label> {/* {{ edit_1 }} Added label */}
                                <input
                                    type="email"
                                    id="email" // Added ID {{ edit_1 }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setEmailInputFocused(true)} // {{ edit_1 }}
                                    onBlur={() => setEmailInputFocused(false)} // {{ edit_1 }}
                                    className="text-sm text-gray-800 outline-none bg-transparent" // {{ edit_1 }} Styled input
                                    pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$" // Email pattern
                                />
                            </div> // {{ edit_1 }}
                        ) : (
                            <div className="border p-3 w-full sm:w-[220px] text-gray-700 rounded-md bg-gray-100"> {/* {{ edit_1 }} Styled display div */}
                                {auth?.user?.email}
                            </div>
                        )}

                        {emailSection && (
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-auto px-6 py-2 rounded-md transition-colors duration-200" // {{ edit_1 }} Styled button
                                onClick={handleEmailSubmit}
                            >
                                Save
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile section */}
                <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200"> {/* {{ edit_1 }} Styled section container */}
                    <div className="flex justify-between items-center mb-4"> {/* {{ edit_1 }} Adjusted flex for heading and button */}
                        <div className="font-semibold text-lg text-gray-700"> {/* {{ edit_1 }} Styled heading */}
                            Mobile Number
                        </div>
                        <button
                            className="text-sm text-blue-600 hover:underline font-medium" // {{ edit_1 }} Styled button
                            onClick={handlePhone}
                        >
                            {!phoneSection ? "Edit" : "Cancel"}
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center"> {/* {{ edit_1 }} Adjusted layout */}
                        {phoneSection ? (
                             <div // {{ edit_1 }} Wrap input for consistent styling
                                    className={`border p-3 flex flex-col w-full sm:w-[220px] rounded-md transition-colors duration-200 ${
                                        phoneInputFocused
                                            ? "border-blue-500"
                                            : "border-gray-300"
                                    }`}
                                > {/* {{ edit_1 }} */}
                                <label htmlFor="phone" className="text-xs text-gray-500 font-medium mb-1">Mobile Number</label> {/* {{ edit_1 }} Added label */}
                                <input
                                    type="tel"
                                    id="phone" // Added ID {{ edit_1 }}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    onFocus={() => setPhoneInputFocused(true)} // {{ edit_1 }}
                                    onBlur={() => setPhoneInputFocused(false)} // {{ edit_1 }}
                                    className="text-sm text-gray-800 outline-none bg-transparent" // {{ edit_1 }} Styled input
                                    inputMode="numeric" // Set input mode to numeric
                                    pattern="[0-9]*" // Allow only numeric values
                                    minLength="10"
                                    maxLength="10"
                                />
                            </div> // {{ edit_1 }}
                        ) : (
                            <div className="border p-3 w-full sm:w-[220px] text-gray-700 rounded-md bg-gray-100"> {/* {{ edit_1 }} Styled display div */}
                                {auth?.user?.phone}
                            </div>
                        )}

                        {phoneSection && (
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-auto px-6 py-2 rounded-md transition-colors duration-200" // {{ edit_1 }} Styled button
                                onClick={handlePhoneSubmit}
                            >
                                Save
                            </button>
                        )}
                    </div>
                </div>

                {/* FAQ section */}
                <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200"> {/* {{ edit_1 }} Styled section container */}
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">FAQs</h3> {/* {{ edit_1 }} Styled heading */}
                    <div className="flex flex-col gap-4"> {/* {{ edit_1 }} Added gap between FAQ items */}
                        <div> {/* {{ edit_1 }} Container for FAQ item */}
                            <h5 className="text-sm font-medium text-gray-800"> {/* {{ edit_1 }} Styled question */}
                                What happens when I update my email address (or
                                mobile number)?
                            </h5>
                            <p className="text-xs text-gray-600 mt-1"> {/* {{ edit_1 }} Styled answer */}
                                Your login email id (or mobile number) changes,
                                likewise. You&apos;ll receive all your account
                                related communication on your updated email address
                                (or mobile number).
                            </p>
                        </div>
                        <div> {/* {{ edit_1 }} Container for FAQ item */}
                            <h5 className="text-sm font-medium text-gray-800"> {/* {{ edit_1 }} Styled question */}
                                When will my Flipkart account be updated with the
                                new email address (or mobile number)?
                            </h5>
                            <p className="text-xs text-gray-600 mt-1"> {/* {{ edit_1 }} Styled answer */}
                                It happens as soon as you confirm the verification
                                code sent to your email (or mobile) and save the
                                changes.
                            </p>
                        </div>
                        <div> {/* {{ edit_1 }} Container for FAQ item */}
                            <h5 className="text-sm font-medium text-gray-800"> {/* {{ edit_1 }} Styled question */}
                                Does my Seller account get affected when I update my
                                email address?
                            </h5>
                            <p className="text-xs text-gray-600 mt-1"> {/* {{ edit_1 }} Styled answer */}
                                Flipkart has a single sign-on policy. Any changes
                                will reflect in your Seller account also.
                            </p>
                        </div>
                    </div>
                </div>

                {/* deactivate account */}
                <div className="w-full text-right mt-4"> {/* {{ edit_1 }} Align link to the right */}
                    <Link to="./deactivate" className="text-sm text-red-600 hover:underline font-medium"> {/* {{ edit_1 }} Styled link */}
                        Deactivate Account
                    </Link>
                </div>
            </div>
            {/* image section */}
            <div className="w-full flex justify-center mt-8"> {/* {{ edit_1 }} Center the image */}
                <img
                    src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/myProfileFooter_4e9fe2.png"
                    alt="image"
                    className="max-w-full h-auto" // {{ edit_1 }} Ensure image is responsive
                />
            </div>
        </div>
    );
};

export default UserProfile;
