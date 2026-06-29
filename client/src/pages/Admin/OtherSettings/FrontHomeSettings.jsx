import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    CircularProgress,
    Tabs,
    Tab,
    Switch,
    FormControlLabel,
    IconButton,
    Grid,
    Divider,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../../context/auth";
import { SERVICE_ICON_OPTIONS } from "../../../utils/serviceIcons";

const API = `${import.meta.env.VITE_SERVER_URL}/api/v1/front-home-settings`;

const FrontHomeSettings = () => {
    const { auth, userPermissions } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState(0);
    const [settings, setSettings] = useState(null);

    const hasPermission = (action = "edit") =>
        userPermissions.some((p) => p.key === "otherSettingsFrontHome" && p.actions.includes(action)) ||
        auth?.user?.role === 1;

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(API, {
                headers: { Authorization: auth?.token },
            });
            if (data?.success) setSettings(data.settings);
        } catch (e) {
            toast.error("Failed to load front home settings");
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await axios.post(
            `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/upload-file`,
            formData,
            { headers: { Authorization: auth?.token } }
        );
        return res?.data?.fileUrl;
    };

    const handleSave = async () => {
        if (!hasPermission()) {
            toast.error("No permission to update front home settings");
            return;
        }
        try {
            setSaving(true);
            const { data } = await axios.put(
                API,
                { settings },
                { headers: { Authorization: auth?.token } }
            );
            if (data?.success) {
                toast.success("Front home settings saved");
                setSettings(data.settings);
            }
        } catch (e) {
            toast.error(e.response?.data?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm("Reset all front home settings to defaults?")) return;
        try {
            setSaving(true);
            const { data } = await axios.post(`${API}/reset`, null, {
                headers: { Authorization: auth?.token },
            });
            if (data?.success) {
                toast.success("Settings reset");
                setSettings(data.settings);
            }
        } catch (e) {
            toast.error("Reset failed");
        } finally {
            setSaving(false);
        }
    };

    const patch = (path, value) => {
        setSettings((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            const keys = path.split(".");
            let cur = next;
            for (let i = 0; i < keys.length - 1; i++) {
                cur[keys[i]] = cur[keys[i]] ?? {};
                cur = cur[keys[i]];
            }
            cur[keys[keys.length - 1]] = value;
            return next;
        });
    };

    const updateListItem = (listKey, index, field, value) => {
        setSettings((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            next[listKey][index][field] = value;
            return next;
        });
    };

    const addListItem = (listKey, template) => {
        setSettings((prev) => ({
            ...prev,
            [listKey]: [...(prev[listKey] || []), { ...template, id: String(Date.now()) }],
        }));
    };

    const removeListItem = (listKey, index) => {
        setSettings((prev) => ({
            ...prev,
            [listKey]: prev[listKey].filter((_, i) => i !== index),
        }));
    };

    const handleListImageUpload = async (listKey, index, field, file) => {
        if (!file) return;
        try {
            const url = await uploadImage(file);
            updateListItem(listKey, index, field, url);
            toast.success("Image uploaded");
        } catch {
            toast.error("Image upload failed");
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!settings) return null;

    return (
        <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h5" sx={{ color: "#019ee3", fontWeight: "bold" }}>
                    Front Home Settings
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    {hasPermission() && (
                        <>
                            <Button variant="outlined" color="warning" onClick={handleReset} disabled={saving}>
                                Reset defaults
                            </Button>
                            <Button variant="contained" onClick={handleSave} disabled={saving}>
                                {saving ? <CircularProgress size={22} /> : "Save all"}
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
                    <Tab label="Theme & Logo" />
                    <Tab label="Banner" />
                    <Tab label="Nav tabs" />
                    <Tab label="Offer / Rental" />
                    <Tab label="Services" />
                    <Tab label="Products" />
                    <Tab label="Category banners" />
                    <Tab label="Sales & Credit" />
                </Tabs>

                <Box sx={{ mt: 3 }}>
                    {tab === 0 && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    Home tab theme
                                </Typography>
                                {[
                                    ["theme.primaryColor", "Primary color"],
                                    ["theme.secondaryColor", "Secondary color"],
                                    ["theme.headerGradientFrom", "Header gradient from"],
                                    ["theme.headerGradientTo", "Header gradient to"],
                                    ["theme.homeBackgroundFrom", "Home background from"],
                                    ["theme.homeBackgroundTo", "Home background to"],
                                ].map(([path, label]) => (
                                    <TextField
                                        key={path}
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        label={label}
                                        value={path.split(".").reduce((o, k) => o?.[k], settings) || ""}
                                        onChange={(e) => patch(path, e.target.value)}
                                    />
                                ))}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    Logo
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!settings.logo?.useTextLogo}
                                            onChange={(e) => patch("logo.useTextLogo", e.target.checked)}
                                        />
                                    }
                                    label="Use text logo (corp culture)"
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    margin="dense"
                                    label="Logo image URL"
                                    value={settings.logo?.url || ""}
                                    onChange={(e) => patch("logo.url", e.target.value)}
                                    helperText="Upload below or paste URL. Used when text logo is off."
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const url = await uploadImage(e.target.files?.[0]);
                                        if (url) patch("logo.url", url);
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    margin="dense"
                                    label="Text primary"
                                    value={settings.logo?.textPrimary || ""}
                                    onChange={(e) => patch("logo.textPrimary", e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    margin="dense"
                                    label="Text accent"
                                    value={settings.logo?.textAccent || ""}
                                    onChange={(e) => patch("logo.textAccent", e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    )}

                    {tab === 1 && (
                        <Box>
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label="Mobile height (px)"
                                        value={settings.banner?.mobileHeight ?? 250}
                                        onChange={(e) => patch("banner.mobileHeight", Number(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label="Desktop height (px)"
                                        value={settings.banner?.desktopHeight ?? 480}
                                        onChange={(e) => patch("banner.desktopHeight", Number(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label="Autoplay (ms)"
                                        value={settings.banner?.autoplaySpeed ?? 3000}
                                        onChange={(e) => patch("banner.autoplaySpeed", Number(e.target.value))}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Banner accent color"
                                        value={settings.banner?.accentColor || ""}
                                        onChange={(e) => patch("banner.accentColor", e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                            <Button
                                startIcon={<AddIcon />}
                                variant="outlined"
                                onClick={() => {
                                    const slides = [...(settings.banner?.slides || [])];
                                    slides.push({
                                        imageUrl: "",
                                        link: "",
                                        order: slides.length,
                                        active: true,
                                    });
                                    patch("banner.slides", slides);
                                }}
                                sx={{ mb: 2 }}
                            >
                                Add banner slide
                            </Button>
                            {(settings.banner?.slides || []).map((slide, i) => (
                                <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                        <IconButton
                                            color="error"
                                            onClick={() => {
                                                const slides = [...(settings.banner.slides || [])];
                                                slides.splice(i, 1);
                                                patch("banner.slides", slides);
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        label="Image URL"
                                        value={slide.imageUrl || ""}
                                        onChange={(e) => {
                                            const slides = [...settings.banner.slides];
                                            slides[i].imageUrl = e.target.value;
                                            patch("banner.slides", slides);
                                        }}
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const url = await uploadImage(e.target.files?.[0]);
                                            if (url) {
                                                const slides = [...settings.banner.slides];
                                                slides[i].imageUrl = url;
                                                patch("banner.slides", slides);
                                            }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        label="Link (optional)"
                                        value={slide.link || ""}
                                        onChange={(e) => {
                                            const slides = [...settings.banner.slides];
                                            slides[i].link = e.target.value;
                                            patch("banner.slides", slides);
                                        }}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={slide.active !== false}
                                                onChange={(e) => {
                                                    const slides = [...settings.banner.slides];
                                                    slides[i].active = e.target.checked;
                                                    patch("banner.slides", slides);
                                                }}
                                            />
                                        }
                                        label="Active"
                                    />
                                </Paper>
                            ))}
                        </Box>
                    )}

                    {tab === 2 && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Mute hides a tab with reduced opacity. Uncheck visible to hide completely.
                            </Typography>
                            <Button
                                startIcon={<AddIcon />}
                                variant="outlined"
                                sx={{ mb: 2 }}
                                onClick={() =>
                                    addListItem("navTabs", {
                                        id: `tab-${Date.now()}`,
                                        label: "New Tab",
                                        path: "/",
                                        visible: true,
                                        muted: false,
                                    })
                                }
                            >
                                Add nav tab
                            </Button>
                            {(settings.navTabs || []).map((t, i) => (
                                <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                    <Grid container spacing={1}>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Label"
                                                value={t.label}
                                                onChange={(e) => updateListItem("navTabs", i, "label", e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Path"
                                                value={t.path}
                                                onChange={(e) => updateListItem("navTabs", i, "path", e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={6} md={2}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={t.visible !== false}
                                                        onChange={(e) =>
                                                            updateListItem("navTabs", i, "visible", e.target.checked)
                                                        }
                                                    />
                                                }
                                                label="Visible"
                                            />
                                        </Grid>
                                        <Grid item xs={6} md={2}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={!!t.muted}
                                                        onChange={(e) =>
                                                            updateListItem("navTabs", i, "muted", e.target.checked)
                                                        }
                                                    />
                                                }
                                                label="Muted"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <IconButton color="error" onClick={() => removeListItem("navTabs", i)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                        </Box>
                    )}

                    {tab === 3 && (
                        <Box>
                            <TextField
                                fullWidth
                                size="small"
                                margin="dense"
                                label="Rental default enquiry image URL"
                                value={settings.rentalDefaultImage || ""}
                                onChange={(e) => patch("rentalDefaultImage", e.target.value)}
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const url = await uploadImage(e.target.files?.[0]);
                                    if (url) patch("rentalDefaultImage", url);
                                }}
                            />
                            <Divider sx={{ my: 2 }} />
                            <Button
                                startIcon={<AddIcon />}
                                variant="outlined"
                                sx={{ mb: 2 }}
                                onClick={() =>
                                    addListItem("offerCategories", {
                                        category: "New offer",
                                        description: "",
                                        discount: "",
                                        image: "",
                                        themeColor: "#019ee3",
                                        visible: true,
                                        order: settings.offerCategories?.length || 0,
                                    })
                                }
                            >
                                Add offer / rental banner
                            </Button>
                            {(settings.offerCategories || []).map((item, i) => (
                                <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                    <Grid container spacing={1}>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Category title"
                                                value={item.category}
                                                onChange={(e) =>
                                                    updateListItem("offerCategories", i, "category", e.target.value)
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Theme color"
                                                value={item.themeColor || ""}
                                                onChange={(e) =>
                                                    updateListItem("offerCategories", i, "themeColor", e.target.value)
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Discount label"
                                                value={item.discount || ""}
                                                onChange={(e) =>
                                                    updateListItem("offerCategories", i, "discount", e.target.value)
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Description"
                                                value={item.description || ""}
                                                onChange={(e) =>
                                                    updateListItem("offerCategories", i, "description", e.target.value)
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Banner image URL"
                                                value={item.image || ""}
                                                onChange={(e) =>
                                                    updateListItem("offerCategories", i, "image", e.target.value)
                                                }
                                            />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) =>
                                                    handleListImageUpload(
                                                        "offerCategories",
                                                        i,
                                                        "image",
                                                        e.target.files?.[0]
                                                    )
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={item.visible !== false}
                                                        onChange={(e) =>
                                                            updateListItem(
                                                                "offerCategories",
                                                                i,
                                                                "visible",
                                                                e.target.checked
                                                            )
                                                        }
                                                    />
                                                }
                                                label="Visible (hide Credit when credit disabled in Sales tab)"
                                            />
                                            <IconButton
                                                color="error"
                                                onClick={() => removeListItem("offerCategories", i)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                        </Box>
                    )}

                    {tab === 4 && (
                        <Box>
                            <TextField
                                fullWidth
                                size="small"
                                margin="dense"
                                label="Service default image URL"
                                value={settings.serviceDefaultImage || ""}
                                onChange={(e) => patch("serviceDefaultImage", e.target.value)}
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const url = await uploadImage(e.target.files?.[0]);
                                    if (url) patch("serviceDefaultImage", url);
                                }}
                            />
                            <Divider sx={{ my: 2 }} />
                            <Button
                                startIcon={<AddIcon />}
                                variant="outlined"
                                sx={{ mb: 2 }}
                                onClick={() =>
                                    addListItem("services", {
                                        title: "New Service",
                                        iconKey: "Monitor",
                                        bgColor: "from-cyan-300 to-cyan-500",
                                        description: "",
                                        imageUrl: "",
                                        visible: true,
                                        order: settings.services?.length || 0,
                                    })
                                }
                            >
                                Add service
                            </Button>
                            {(settings.services || []).map((s, i) => (
                                <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                    <Grid container spacing={1}>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Title"
                                                value={s.title}
                                                onChange={(e) =>
                                                    updateListItem("services", i, "title", e.target.value)
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Icon</InputLabel>
                                                <Select
                                                    value={s.iconKey || "Monitor"}
                                                    label="Icon"
                                                    onChange={(e) =>
                                                        updateListItem("services", i, "iconKey", e.target.value)
                                                    }
                                                >
                                                    {SERVICE_ICON_OPTIONS.map((k) => (
                                                        <MenuItem key={k} value={k}>
                                                            {k}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Gradient classes"
                                                value={s.bgColor || ""}
                                                onChange={(e) =>
                                                    updateListItem("services", i, "bgColor", e.target.value)
                                                }
                                                helperText="e.g. from-cyan-300 to-cyan-500"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Description"
                                                value={s.description || ""}
                                                onChange={(e) =>
                                                    updateListItem("services", i, "description", e.target.value)
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Custom image URL (optional)"
                                                value={s.imageUrl || ""}
                                                onChange={(e) =>
                                                    updateListItem("services", i, "imageUrl", e.target.value)
                                                }
                                            />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) =>
                                                    handleListImageUpload(
                                                        "services",
                                                        i,
                                                        "imageUrl",
                                                        e.target.files?.[0]
                                                    )
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={s.visible !== false}
                                                        onChange={(e) =>
                                                            updateListItem("services", i, "visible", e.target.checked)
                                                        }
                                                    />
                                                }
                                                label="Visible on home"
                                            />
                                            <IconButton color="error" onClick={() => removeListItem("services", i)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                        </Box>
                    )}

                    {tab === 5 && (
                        <Box>
                            <Button
                                startIcon={<AddIcon />}
                                variant="outlined"
                                sx={{ mb: 2 }}
                                onClick={() =>
                                    addListItem("homeProducts", {
                                        title: "New Product Category",
                                        bgColor: "from-blue-400 to-blue-600",
                                        status: "COMING SOON",
                                        image: "",
                                        categorySlug: "",
                                        visible: true,
                                        order: settings.homeProducts?.length || 0,
                                    })
                                }
                            >
                                Add home product category
                            </Button>
                            {(settings.homeProducts || []).map((p, i) => (
                                <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                    <Grid container spacing={1}>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Title"
                                                value={p.title}
                                                onChange={(e) =>
                                                    updateListItem("homeProducts", i, "title", e.target.value)
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Status badge"
                                                value={p.status || ""}
                                                onChange={(e) =>
                                                    updateListItem("homeProducts", i, "status", e.target.value)
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Link category (sales)"
                                                value={p.categorySlug || ""}
                                                onChange={(e) =>
                                                    updateListItem("homeProducts", i, "categorySlug", e.target.value)
                                                }
                                                helperText="Must match exact category name from Sales → Category (e.g. Electronics). Leave empty to auto-match by title."
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Image URL"
                                                value={p.image || ""}
                                                onChange={(e) =>
                                                    updateListItem("homeProducts", i, "image", e.target.value)
                                                }
                                            />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) =>
                                                    handleListImageUpload(
                                                        "homeProducts",
                                                        i,
                                                        "image",
                                                        e.target.files?.[0]
                                                    )
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={p.visible !== false}
                                                        onChange={(e) =>
                                                            updateListItem("homeProducts", i, "visible", e.target.checked)
                                                        }
                                                    />
                                                }
                                                label="Visible on home"
                                            />
                                            <IconButton
                                                color="error"
                                                onClick={() => removeListItem("homeProducts", i)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                        </Box>
                    )}

                    {tab === 6 && (
                        <Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={!!settings.categorySearch?.enabled}
                                        onChange={(e) => patch("categorySearch.enabled", e.target.checked)}
                                    />
                                }
                                label="Enable category search"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={!!settings.categorySearch?.showOnHome}
                                        onChange={(e) => patch("categorySearch.showOnHome", e.target.checked)}
                                    />
                                }
                                label="Show search on home page"
                            />
                            <TextField
                                fullWidth
                                size="small"
                                margin="dense"
                                label="Search placeholder"
                                value={settings.categorySearch?.placeholder || ""}
                                onChange={(e) => patch("categorySearch.placeholder", e.target.value)}
                            />
                            <Divider sx={{ my: 2 }} />
                            <Button
                                startIcon={<AddIcon />}
                                variant="outlined"
                                sx={{ mb: 2 }}
                                onClick={() =>
                                    addListItem("categoryBanners", {
                                        title: "Category",
                                        image: "",
                                        themeColor: "#019ee3",
                                        link: "",
                                        visible: true,
                                        order: settings.categoryBanners?.length || 0,
                                    })
                                }
                            >
                                Add category banner
                            </Button>
                            {(settings.categoryBanners || []).map((b, i) => (
                                <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        label="Title"
                                        value={b.title}
                                        onChange={(e) =>
                                            updateListItem("categoryBanners", i, "title", e.target.value)
                                        }
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        margin="dense"
                                        label="Image URL"
                                        value={b.image || ""}
                                        onChange={(e) =>
                                            updateListItem("categoryBanners", i, "image", e.target.value)
                                        }
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleListImageUpload(
                                                "categoryBanners",
                                                i,
                                                "image",
                                                e.target.files?.[0]
                                            )
                                        }
                                    />
                                    <IconButton
                                        color="error"
                                        onClick={() => removeListItem("categoryBanners", i)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Paper>
                            ))}
                        </Box>
                    )}

                    {tab === 7 && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Sales
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!settings.sales?.showAssuredBadge}
                                            onChange={(e) =>
                                                patch("sales.showAssuredBadge", e.target.checked)
                                            }
                                        />
                                    }
                                    label='Show assured badge (replaces "Flipkart Assured")'
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    margin="dense"
                                    label="Assured badge label"
                                    value={settings.sales?.assuredBadgeLabel || ""}
                                    onChange={(e) => patch("sales.assuredBadgeLabel", e.target.value)}
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!settings.sales?.creditOptionEnabled}
                                            onChange={(e) =>
                                                patch("sales.creditOptionEnabled", e.target.checked)
                                            }
                                        />
                                    }
                                    label="Enable credit option at checkout"
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    margin="dense"
                                    label="Credit checkout label"
                                    value={settings.sales?.creditLabel || ""}
                                    onChange={(e) => patch("sales.creditLabel", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Service
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!settings.service?.creditOptionEnabled}
                                            onChange={(e) =>
                                                patch("service.creditOptionEnabled", e.target.checked)
                                            }
                                        />
                                    }
                                    label="Enable credit option on service enquiry"
                                />
                                <TextField
                                    fullWidth
                                    size="small"
                                    margin="dense"
                                    label="Service credit label"
                                    value={settings.service?.creditLabel || ""}
                                    onChange={(e) => patch("service.creditLabel", e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default FrontHomeSettings;
