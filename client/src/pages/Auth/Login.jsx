import { useEffect, useState } from "react";
import authImg from "../../assets/images/auth.png";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../context/auth";
import Spinner from "../../components/Spinner";
import Cookies from "js-cookie";
import SeoData from "../../SEO/SeoData";

const Login = () => {
    //hooks->
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { auth, setAuth, isAdmin } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const location = useLocation();

    const handlePasswordToggle = () => {
        setShowPassword(!showPassword);
    };

    const navigate = useNavigate();
    useEffect(() => {
        if (auth.token) {
            isAdmin
                ? navigate("/admin/dashboard")
                : navigate("/user/dashboard");
        }
    }, [navigate, auth, isAdmin]);
    // axios.defaults.headers.common["Authorization"] = auth.token;

    //form submission handler
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            toast(
                "The backend is starting up, please wait for a minute if the loader is visible."
            );

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/login`,
                {
                    email,
                    password,
                }
            );
            // console.log(response);

            if (response.status === 200) {
                toast.success("Logged in Successfully!");
                setAuth({
                    ...auth,
                    user: response.data.user,
                    token: response.data.token,
                });

                Cookies.set("auth", JSON.stringify(response.data), {
                    expires: 7,
                });
                navigate(location.state || "/");
            }
        } catch (error) {
            console.error("Error:", error);
            // invalid password
            error.response?.status === 401 &&
                error.response.data?.errorType === "invalidPassword" &&
                toast.error("Wrong password!");
            //user not registered
            error.response?.status === 401 &&
                error.response.data?.errorType === "invalidUser" &&
                toast.error("User not Registered!");
            //server error
            error.response?.status === 500 &&
                toast.error(
                    "Something went wrong! Please try after sometime."
                ) &&
                navigate("/login");
        } finally {
            setIsSubmitting(false);
        }
    };

    // display content
    return (
        <>
            <SeoData
                title="Log in - Existing User"
                description="Log in with user details"
            />
            {isSubmitting ? (
                <Spinner />
            ) : (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] py-8">
                    <div className="flex flex-col md:flex-row w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                        {/* Left Panel */}
                        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-[#0bbad8] to-[#8b1414] w-full md:w-1/2 p-10">
                            <h2 className="text-white text-3xl font-bold mb-4 text-center">Log in</h2>
                            <p className="text-cyan-100 text-base mb-6 text-center">
                                Get access to your Orders, Wishlist and Recommendations
                            </p>
                            <div className="bg-white/10 rounded-lg p-4 text-xs text-cyan-100 mb-6 w-full text-center">
                                <div className="mb-2">
                                    <span className="font-semibold">User</span><br />
                                    username - test@test.com<br />
                                    password - test123
                                </div>
                                <div>
                                    <span className="font-semibold">Admin</span><br />
                                    username - store@flipkart.com<br />
                                    password - admin123
                                </div>
                            </div>
                            <img src={authImg} alt="auth" className="w-40 mx-auto" />
                        </div>
                        {/* Right Panel (Form) */}
                        <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12">
                            <h3 className="text-2xl font-bold text-[#8b1414] mb-6 text-center">Welcome Back</h3>
                            <form
                                action="/login"
                                method="post"
                                className="space-y-5"
                                onSubmit={handleFormSubmit}
                            >
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
                                <div className="text-xs text-slate-500 text-center">
                                    By continuing, you agree to Flipkart&apos;s Terms of Use and Privacy Policy.
                                </div>
                                <button
                                    className="w-full bg-gradient-to-r from-[#0bbad8] to-[#8b1414] text-white font-semibold py-2 rounded-lg shadow hover:from-[#8b1414] hover:to-[#0bbad8] transition-all uppercase"
                                    type="submit"
                                >
                                    Log in
                                </button>
                            </form>
                            <div className="mt-6 text-center">
                                <Link
                                    to="/forgot-password"
                                    className="text-cyan-700 font-semibold text-sm hover:underline"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                            <div className="mt-2 text-center">
                                <Link
                                    to="/register"
                                    className="text-cyan-700 font-semibold text-sm hover:underline"
                                >
                                    New to Corp Culture? Create an account
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Login;
