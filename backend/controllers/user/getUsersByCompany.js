import userModel from "../../models/userModel.js";

//USER EXIST
 const getUsersByCompany = async (req, res) => {
    try {
        const companyId  = req.params.id;

        //Checking the EMAIL and PASSWORD
        if (!companyId) {
            return res.status(401).send({
                success: false,
                message: "Invalid companyId",
                errorType: "invalidCredentials",
            });
        }

        //FINDING THE USER
        const user = await userModel.find({ companyId });

        if (!user) {
            return res.status(401).send({
                success: false,
                message: "User Not Registered!",
                errorType: "invalidUser",
            });
        }

        //SUCCESS RESPONSE
        res.status(200).send({
            success: true,
            message: "User Found!",
            data: user,
        });
    } catch (error) {
        console.log("User Check Error: " + error);
        res.status(500).send({
            success: false,
            message: "Error in User Checking",
            error,
        });
    }
};

export default getUsersByCompany;