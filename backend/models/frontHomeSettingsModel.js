import mongoose from "mongoose";
import { defaultFrontHomeSettings } from "../utils/defaultFrontHomeSettings.js";

const slideSchema = new mongoose.Schema(
    {
        imageUrl: { type: String, trim: true },
        link: { type: String, trim: true, default: "" },
        order: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
    },
    { _id: false }
);

const navTabSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        label: { type: String, required: true },
        path: { type: String, default: "/" },
        visible: { type: Boolean, default: true },
        muted: { type: Boolean, default: false },
    },
    { _id: false }
);

const offerCategorySchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        category: { type: String, required: true },
        description: { type: String, default: "" },
        discount: { type: String, default: "" },
        image: { type: String, default: "" },
        themeColor: { type: String, default: "#019ee3" },
        visible: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

const serviceItemSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        title: { type: String, required: true },
        iconKey: { type: String, default: "Monitor" },
        bgColor: { type: String, default: "from-cyan-300 to-cyan-500" },
        description: { type: String, default: "" },
        imageUrl: { type: String, default: "" },
        visible: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

const homeProductSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        title: { type: String, required: true },
        bgColor: { type: String, default: "from-blue-400 to-blue-600" },
        status: { type: String, default: "COMING SOON" },
        image: { type: String, default: "" },
        visible: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
        categorySlug: { type: String, default: "" },
    },
    { _id: false }
);

const categoryBannerSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        title: { type: String, required: true },
        image: { type: String, default: "" },
        themeColor: { type: String, default: "#019ee3" },
        link: { type: String, default: "" },
        visible: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

const frontHomeSettingsSchema = new mongoose.Schema(
    {
        theme: {
            primaryColor: { type: String, default: defaultFrontHomeSettings.theme.primaryColor },
            secondaryColor: { type: String, default: defaultFrontHomeSettings.theme.secondaryColor },
            headerGradientFrom: { type: String, default: defaultFrontHomeSettings.theme.headerGradientFrom },
            headerGradientTo: { type: String, default: defaultFrontHomeSettings.theme.headerGradientTo },
            homeBackgroundFrom: { type: String, default: defaultFrontHomeSettings.theme.homeBackgroundFrom },
            homeBackgroundTo: { type: String, default: defaultFrontHomeSettings.theme.homeBackgroundTo },
        },
        logo: {
            url: { type: String, default: "" },
            useTextLogo: { type: Boolean, default: true },
            textPrimary: { type: String, default: "corp" },
            textAccent: { type: String, default: "culture" },
        },
        banner: {
            slides: { type: [slideSchema], default: [] },
            mobileHeight: { type: Number, default: 250 },
            desktopHeight: { type: Number, default: 480 },
            autoplaySpeed: { type: Number, default: 3000 },
            accentColor: { type: String, default: "#019ee3" },
        },
        navTabs: { type: [navTabSchema], default: defaultFrontHomeSettings.navTabs },
        offerCategories: { type: [offerCategorySchema], default: defaultFrontHomeSettings.offerCategories },
        services: { type: [serviceItemSchema], default: defaultFrontHomeSettings.services },
        homeProducts: { type: [homeProductSchema], default: defaultFrontHomeSettings.homeProducts },
        categoryBanners: { type: [categoryBannerSchema], default: [] },
        serviceDefaultImage: { type: String, default: "" },
        rentalDefaultImage: { type: String, default: "" },
        sales: {
            assuredBadgeLabel: { type: String, default: "Corpculture Assured" },
            showAssuredBadge: { type: Boolean, default: true },
            creditOptionEnabled: { type: Boolean, default: true },
            creditLabel: { type: String, default: "Pay on Company Credit" },
        },
        service: {
            creditOptionEnabled: { type: Boolean, default: true },
            creditLabel: { type: String, default: "Request service on credit" },
        },
        categorySearch: {
            enabled: { type: Boolean, default: true },
            placeholder: { type: String, default: "Search categories..." },
            showOnHome: { type: Boolean, default: true },
        },
    },
    { timestamps: true }
);

export default mongoose.model("FrontHomeSettings", frontHomeSettingsSchema);
