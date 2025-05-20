import { Step, StepLabel, Stepper } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import { formatDate } from "../../../utils/functions";

const Tracker = ({ activeStep, orderOn }) => {
    const steps = [
        {
            status: "Ordered",
            dt: formatDate(orderOn),
        },
        {
            status: "Shipped",
        },
        {
            status: "Out For Delivery",
        },
        {
            status: "Delivered",
        },
    ];

    const completedIcon = (
        <span className="text-primaryGreen animate-pulse">
            <CircleIcon sx={{ fontSize: "22px" }} />
        </span>
    );
    const pendingIcon = (
        <span className="text-gray-300">
            <CircleIcon sx={{ fontSize: "22px" }} />
        </span>
    );

    return (
        <Stepper activeStep={activeStep} alternativeLabel className="!mb-2 !mt-2">
            {steps?.map((item, index) => (
                <Step
                    key={index}
                    active={activeStep === index ? true : false}
                    completed={activeStep >= index ? true : false}
                >
                    <StepLabel
                        icon={activeStep >= index ? completedIcon : pendingIcon}
                        className="!font-bold"
                    >
                        {activeStep >= index ? (
                            <span className="text-primaryGreen font-bold text-base">
                                {item.status}
                            </span>
                        ) : (
                            <span className="text-gray-400 font-bold text-base">
                                {item.status}
                            </span>
                        )}
                        {item.dt && (
                            <div className="text-xs text-gray-500 mt-1">{item.dt}</div>
                        )}
                    </StepLabel>
                </Step>
            ))}
        </Stepper>
    );
};

export default Tracker;
