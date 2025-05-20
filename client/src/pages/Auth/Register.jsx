import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import auth from "../../assets/images/auth.png";
import { Link } from "react-router-dom";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../../components/Spinner";
import Checkbox from "@mui/material/Checkbox";
import SeoData from "../../SEO/SeoData";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [address, setAddress] = useState("");
    const [isSeller, setIsSeller] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePasswordToggle = () => {
        setShowPassword(!showPassword);
    };

    const handleCheckbox = () => {
        setIsSeller(!isSeller);
    };

    const navigate = useNavigate();

    //form submission handler
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (password !== confirmPassword) {
                toast.error("Password does not match!");
                return;
            }
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/register`,
                {
                    name,
                    email,
                    phone,
                    password,
                    address,
                    isSeller,
                }
            );
            console.log(response);

            // Registration successful
            response.status === 201 &&
                toast.success(
                    "User Registered Successfully! Please Login..."
                ) &&
                navigate("/login");

            // Email already registered
            response.status === 200 &&
                toast.error("Email is already registered! Please Login...") &&
                navigate("/login");
        } catch (error) {
            console.error("Error:", error);

            //server error
            error.response.status === 500 &&
                toast.error(
                    "Something went wrong! Please try after sometime."
                ) &&
                navigate("/register");
        } finally {
            setIsSubmitting(false);
        }
    };

    //display content
    return (
        <>
            <SeoData
                title="Sign up - New User"
                description="Register new user with details"
            />
            {isSubmitting ? (
                <Spinner />
            ) : (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] py-8">
                    <div className="flex flex-col md:flex-row w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                        {/* Left Panel */}
                        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-[#0bbad8] to-[#8b1414] w-full md:w-1/2 p-10">
                            <h2 className="text-white text-3xl font-bold mb-4 text-center">Looks like you're new here!</h2>
                            <p className="text-cyan-100 text-base mb-8 text-center">
                                Sign up with the required details to get started
                            </p>
                            <img src={auth} alt="auth" className="w-60 mx-auto" />
                        </div>
                        {/* Right Panel (Form) */}
                        <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12">
                            <h3 className="text-2xl font-bold text-[#8b1414] mb-6 text-center">Create Your Account</h3>
                            <form
                                action="/register"
                                method="post"
                                className="space-y-5"
                                onSubmit={handleFormSubmit}
                            >
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        autoComplete="on"
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:outline-none"
                                        placeholder="Full Name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        autoComplete="on"
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:outline-none"
                                        placeholder="Email address"
                                        required
                                        pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                        Mobile Number
                                    </label>
                                    <input
                                        autoComplete="on"
                                        id="phone"
                                        name="phone"
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:outline-none"
                                        placeholder="Mobile Number"
                                        required
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        minLength="10"
                                        maxLength="10"
                                    />
                                </div>
                                <div className="relative">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Password
                                    </label>
                                    <input
                                        autoComplete="off"
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:outline-none pr-10"
                                        placeholder="Password"
                                        required
                                        minLength="5"
                                    />
                                    <span
                                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-700 cursor-pointer"
                                        onClick={handlePasswordToggle}
                                    >
                                        {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                                    </span>
                                </div>
                                <div>
                                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password
                                    </label>
                                    <input
                                        autoComplete="off"
                                        id="confirm_password"
                                        name="confirm_password"
                                        type={showPassword ? "text" : "password"}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:outline-none"
                                        placeholder="Confirm Password"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <input
                                        autoComplete="on"
                                        id="address"
                                        name="address"
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:outline-none"
                                        placeholder="Address"
                                        required
                                    />
                                </div>
                                <div className="flex items-center">
                                    <Checkbox
                                        size="small"
                                        onChange={handleCheckbox}
                                        inputProps={{
                                            "aria-label": "controlled",
                                        }}
                                    />
                                    <span className="text-sm text-gray-700 font-medium">
                                        Register as Seller
                                    </span>
                                </div>
                                <button
                                    className="w-full bg-gradient-to-r from-[#0bbad8] to-[#8b1414] text-white font-semibold py-2 rounded-lg shadow hover:from-[#8b1414] hover:to-[#0bbad8] transition-all uppercase"
                                    type="submit"
                                >
                                    Continue
                                </button>
                            </form>
                            <div className="mt-6 text-center">
                                <Link to="/login">
                                    <button className="w-full border border-cyan-400 text-cyan-700 font-semibold py-2 rounded-lg hover:bg-cyan-50 transition-all">
                                        Existing User? Log in
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Register;
