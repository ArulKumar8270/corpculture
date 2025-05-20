/* eslint-disable react/no-unescaped-entities */
import { useState } from "react";
import authImg from "../../assets/images/auth.png";
import axios from "axios";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Spinner from "./../../components/Spinner";
import SeoData from "../../SEO/SeoData";

const ForgotPassword = () => {
    //hooks->
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [userFound, setUserFound] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePasswordToggle = () => {
        setShowPassword(!showPassword);
    };

    const navigate = useNavigate();

    //form submission handler
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (email === "test@test.com" || email === "store@flipkart.com") {
            toast.error(
                "Functionality is disabled for testing account! Please create a new one!"
            );
            setEmail("");
            setConfirmPassword("");
            setPassword("");
            return;
        }
        setIsSubmitting(true);
        try {
            if (userFound) {
                if (password !== confirmPassword) {
                    toast.error("Password does not match!");
                    return;
                }
                const response = await axios.post(
                    `${
                        import.meta.env.VITE_SERVER_URL
                    }/api/v1/auth/forgot-password`,
                    {
                        email,
                        password,
                    }
                );
                console.log(response);

                if (response.status === 200) {
                    setUserFound(false);
                    toast.success("Password Reset Successfully!", {
                        toastId: "passwordReset",
                    });
                    navigate("/login");
                }
            } else {
                const response = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/user-exist`,
                    {
                        email,
                    }
                );

                if (response.status === 200) {
                    setUserFound(true);
                }
            }
        } catch (error) {
            console.error("Error:", error);
            //user not registered
            error.response?.status === 401 &&
                error.response.data?.errorType === "invalidUser" &&
                toast.error("User not Found!");
            //server error
            error.response?.status === 500 &&
                toast.error(
                    "Something went wrong! Please try after sometime."
                ) &&
                navigate("/forgot-password");
        } finally {
            setIsSubmitting(false);
        }
    };

    // display content
    return (
        <>
            <SeoData
                title="Forgot Password - Existing User"
                description="Forgot Password"
            />

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] py-8">
                <div className="flex flex-col md:flex-row w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Left Panel */}
                    <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-[#0bbad8] to-[#8b1414] w-full md:w-1/2 p-10">
                        <h2 className="text-white text-3xl font-bold mb-4 text-center">Forgot Password</h2>
                        <p className="text-cyan-100 text-base mb-6 text-center">
                            Forgot your password? No worries, we've got you covered!
                        </p>
                        <img src={authImg} alt="auth" className="w-40 mx-auto" />
                    </div>
                    {/* Right Panel (Form) */}
                    <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12">
                        <h3 className="text-2xl font-bold text-[#8b1414] mb-6 text-center">Reset Your Password</h3>
                        {isSubmitting ? (
                            <div className="flex items-center justify-center h-40">
                                <Spinner />
                            </div>
                        ) : (
                            <form
                                action="/login"
                                method="post"
                                className="space-y-5"
                                onSubmit={handleFormSubmit}
                            >
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Enter Your Email Address
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
                                {userFound && (
                                    <>
                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                                New Password
                                            </label>
                                            <input
                                                autoComplete="off"
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:outline-none pr-10"
                                                placeholder="New Password"
                                                required
                                                minLength="5"
                                            />
                                        </div>
                                        <div className="relative">
                                            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirm Password
                                            </label>
                                            <input
                                                autoComplete="off"
                                                id="confirm_password"
                                                name="confirm_password"
                                                value={confirmPassword}
                                                type={showPassword ? "text" : "password"}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-300 focus:outline-none pr-10"
                                                placeholder="Confirm Password"
                                                required
                                            />
                                            <span
                                                className="absolute right-3 top-9 text-gray-400 hover:text-gray-700 cursor-pointer"
                                                onClick={handlePasswordToggle}
                                            >
                                                {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                                            </span>
                                        </div>
                                    </>
                                )}
                                <div className="text-xs text-slate-500 text-center">
                                    By continuing, you agree to Flipkart's Terms of Use and Privacy Policy.
                                </div>
                                <button
                                    className="w-full bg-gradient-to-r from-[#0bbad8] to-[#8b1414] text-white font-semibold py-2 rounded-lg shadow hover:from-[#8b1414] hover:to-[#0bbad8] transition-all uppercase"
                                    type="submit"
                                >
                                    Submit
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ForgotPassword;
