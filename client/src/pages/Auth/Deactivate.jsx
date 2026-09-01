import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/auth";
import ScrollToTopOnRouteChange from "../../utils/ScrollToTopOnRouteChange";

const Deactivate = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const { auth, LogOut } = useAuth();

    const handleTrashAccount = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/deactivate`,
                {
                    email,
                    phone,
                }
            );

            if (response.status === 200) {
                toast.success(response.data.message || "Account moved to trash successfully");
                LogOut();
                navigate("/");
            }
        } catch (error) {
            console.log(error);
            if (error.response?.status === 401 && error.response.data?.errorType === "phoneMismatch") {
                toast.error(error.response.data.message);
            } else {
                toast.error(error.response?.data?.message || "Failed to move account to trash");
            }
        }
    };

    return (
        <>
            <ScrollToTopOnRouteChange />
            <div className="flex flex-col sm:flex-row w-full items-center sm:items-start p-4 h-full ">
                <div className="sm:w-[50%] p-2 sm:border-r-2 h-full">
                    <div>
                        <div className="text-[16px] font-[500] leading-7 ">
                            When you move your account to trash
                        </div>
                        <div className="text-[12px] text-slate-500 p-4">
                            <ul className="list-disc leading-8">
                                <li>
                                    You are logged out of your account
                                </li>
                                <li>
                                    Your public profile is no longer visible
                                </li>
                                <li>
                                    Your reviews/ratings may still be visible,
                                    while your profile information is shown as
                                    unavailable.
                                </li>
                                <li>
                                    Your wishlist items are no longer accessible
                                    through the associated public hyperlink.
                                </li>
                                <li>
                                    You will be unsubscribed from receiving
                                    promotional emails
                                </li>
                                <li>
                                    Your account can be restored from trash by an administrator
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="sm:w-[50%] flex flex-col gap-5 items-center p-2  ">
                    <div className="w-full font-[500] text-[16px] text-center leading-7">
                        Are you sure you want to move your account to trash?
                    </div>
                    <div className="">
                        <form
                            action="/deactivate"
                            method="post"
                            onSubmit={handleTrashAccount}
                            className="flex flex-col gap-4 items-center w-full"
                        >
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Confirm Your Email Address"
                                className="border-2 p-2 w-[220px] focus:outline-primaryBlue focus:outline-1"
                                pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                                required
                            />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="border-2 p-2 w-[220px] focus:outline-primaryBlue focus:outline-1"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                minLength="10"
                                maxLength="10"
                                placeholder="Confirm Your Mobile Number"
                                required
                            />

                            <div className="relative flex items-center">
                                <button
                                    type="submit"
                                    className="bg-red-600 w-full uppercase text-white text-[14px] font-[500] rounded-sm px-2 py-1"
                                >
                                    Move to Trash
                                </button>
                            </div>
                        </form>
                    </div>
                    <Link
                        to={auth?.user?.role === 1 || auth?.user?.role === 3 ? "/admin/dashboard" : "/user/dashboard"}
                        className="uppercase text-primaryBlue font-[600] text-[14px] flex items-center justify-center w-full"
                    >
                        No, Let me Stay
                    </Link>
                </div>
            </div>
        </>
    );
};

export default Deactivate;
