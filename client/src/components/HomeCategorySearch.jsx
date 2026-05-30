import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BsSearch } from "react-icons/bs";
import { useFrontHomeSettings } from "../context/frontHomeSettings";

const HomeCategorySearch = ({ categories = [] }) => {
    const { categorySearch, theme } = useFrontHomeSettings();
    const [query, setQuery] = useState("");

    const enabled = categorySearch?.enabled && categorySearch?.showOnHome;

    const filtered = useMemo(() => {
        if (!query.trim()) return categories.slice(0, 12);
        const q = query.toLowerCase();
        return categories.filter((c) => c.name?.toLowerCase().includes(q));
    }, [categories, query]);

    if (!enabled || !categories.length) return null;

    return (
        <section className="w-full bg-white rounded-2xl shadow-md border border-[#e6fbff] p-4">
            <div
                className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
                style={{ backgroundColor: theme?.homeBackgroundFrom || "#f0f5ff" }}
            >
                <BsSearch className="text-gray-500 shrink-0" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={categorySearch?.placeholder || "Search categories..."}
                    className="w-full bg-transparent outline-none text-sm text-gray-800"
                />
            </div>
            <div className="flex flex-wrap gap-2">
                {filtered.length === 0 ? (
                    <p className="text-sm text-gray-500">No categories match your search.</p>
                ) : (
                    filtered.map((cat) => (
                        <Link
                            key={cat._id || cat.name}
                            to={`/products?category=${encodeURIComponent(cat.name)}`}
                            className="text-sm px-3 py-1.5 rounded-full border font-medium hover:text-white transition-colors"
                            style={{
                                borderColor: theme?.primaryColor || "#019ee3",
                                color: theme?.primaryColor || "#019ee3",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    theme?.primaryColor || "#019ee3";
                                e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = theme?.primaryColor || "#019ee3";
                            }}
                        >
                            {cat.name}
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
};

export default HomeCategorySearch;
