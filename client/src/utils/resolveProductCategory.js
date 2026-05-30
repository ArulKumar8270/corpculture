/**
 * Resolve the sales category name used by /products?category= and filtered-products API.
 * Matches admin "Link category" field or home product title against category list.
 */
export function resolveCategoryForProduct(product, categories = []) {
    const explicit = (product?.categorySlug || product?.category || "").trim();
    if (explicit) {
        const exact = categories.find(
            (c) => c.name?.toLowerCase() === explicit.toLowerCase()
        );
        return exact?.name || explicit;
    }

    const title = (product?.title || "").trim().toLowerCase();
    if (!title || !categories?.length) return null;

    const byExactTitle = categories.find((c) => c.name?.toLowerCase() === title);
    if (byExactTitle) return byExactTitle.name;

    const words = title.split(/[\s&/,-]+/).filter((w) => w.length > 2);

    const byPartial = categories.find((c) => {
        const name = (c.name || "").toLowerCase();
        if (!name) return false;
        if (name.includes(title) || title.includes(name)) return true;
        return words.some((word) => name.includes(word));
    });

    return byPartial?.name || null;
}

export function isComingSoonStatus(status) {
    return /coming\s*soon/i.test(String(status || ""));
}

export function getCategoryProductsPath(categoryName) {
    if (!categoryName) return "/products";
    return `/products?category=${encodeURIComponent(categoryName)}`;
}
