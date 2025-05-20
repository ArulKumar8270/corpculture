import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SeoData from "../../../SEO/SeoData";

const OrderFailed = () => {
    const navigate = useNavigate();
    const [time, setTime] = useState(3);
    //after order place remove items from cart

    useEffect(() => {
        if (time === 0) {
            navigate("/cart");
            return;
        }
        const intervalId = setInterval(() => {
            setTime(time - 1);
        }, 1000);

        return () => clearInterval(intervalId);
        // eslint-disable-next-line
    }, [time]);

    return (
        <>
            <SeoData title={`Transaction Failed`} />

            <main className="w-full p-8 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
                {/* <!-- row --> */}
                <div className="flex flex-col gap-4 items-center justify-center sm:w-4/6 m-auto bg-white shadow-lg rounded-2xl p-10 min-h-[60vh]">
                    <div className="flex gap-4 items-center">
                        <ErrorOutlineIcon className="text-red-600" sx={{ fontSize: 48 }} />
                        <h1 className="text-3xl font-bold text-gray-800">
                            Transaction Failed
                        </h1>
                    </div>
                    <p className="mt-4 text-lg text-gray-700 font-medium">
                        Redirecting to cart in {time} sec
                    </p>
                    <Link
                        to="/cart"
                        className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] mt-4 py-3 px-8 text-lg font-semibold text-white uppercase shadow rounded-xl hover:from-[#017bbd] hover:to-[#8fae07] transition"
                    >
                        Go to Cart
                    </Link>
                </div>
                {/* <!-- row --> */}
            </main>
        </>
    );
};

export default OrderFailed;
