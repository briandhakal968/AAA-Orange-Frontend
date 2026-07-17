"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminApi, homeSectionApi, HomeSection, HomeSectionItem } from "@/lib/admin-api";
import { MediaPicker } from "@/components/admin/media-picker";

function triggerRevalidate() {
  fetch('/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: '/', secret: 'ecom-revalidate-2026' }),
  }).catch(() => {});
}

interface CategoryItemData {
  id?: number;
  title: string;
  image: string;
  link: string;
}

export default function HomeSectionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [heroSection, setHeroSection] = useState<HomeSection | null>(null);
  const [heroItems, setHeroItems] = useState<HomeSectionItem[]>([]);
  const [categorySection, setCategorySection] = useState<HomeSection | null>(null);
  const [categoryItems, setCategoryItems] = useState<HomeSectionItem[]>([]);
  const [quickAddUrl, setQuickAddUrl] = useState("");
  const [quickAdding, setQuickAdding] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [editingItem, setEditingItem] = useState<HomeSectionItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLink, setEditLink] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryEditModal, setShowCategoryEditModal] = useState(false);
  const [categoryHeading, setCategoryHeading] = useState("");
  const [categorySliderItems, setCategorySliderItems] = useState<CategoryItemData[]>([]);
  const [editingCategoryItem, setEditingCategoryItem] = useState<CategoryItemData | null>(null);
  const [showCategoryItemModal, setShowCategoryItemModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showCategoryPickerModal, setShowCategoryPickerModal] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  // First Two Column Banner section state
  const [bannerSection, setBannerSection] = useState<HomeSection | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);

  // Column 1
  const [col1Title, setCol1Title] = useState("");
  const [col1Subtitle, setCol1Subtitle] = useState("");
  const [col1Image, setCol1Image] = useState("");
  const [col1ButtonText, setCol1ButtonText] = useState("");
  const [col1Link, setCol1Link] = useState("");
  const [showMediaPickerCol1, setShowMediaPickerCol1] = useState(false);

  // Column 2
  const [col2Title, setCol2Title] = useState("");
  const [col2Subtitle, setCol2Subtitle] = useState("");
  const [col2Image, setCol2Image] = useState("");
  const [col2ButtonText, setCol2ButtonText] = useState("");
  const [col2Link, setCol2Link] = useState("");
  const [showMediaPickerCol2, setShowMediaPickerCol2] = useState(false);

  // Full Width Banner section state
  const [fullWidthBannerSection, setFullWidthBannerSection] = useState<HomeSection | null>(null);
  const [savingFullWidthBanner, setSavingFullWidthBanner] = useState(false);
  const [fwTitle, setFwTitle] = useState("");
  const [fwSubtitle, setFwSubtitle] = useState("");
  const [fwImage, setFwImage] = useState("");
  const [fwButtonText, setFwButtonText] = useState("");
  const [fwLink, setFwLink] = useState("");
  const [showMediaPickerFw, setShowMediaPickerFw] = useState(false);

  // Product Grid section state
  const [productGridSection, setProductGridSection] = useState<HomeSection | null>(null);
  const [pgTitle, setPgTitle] = useState("");
  const [pgFilter, setPgFilter] = useState("latest");
  const [savingProductGrid, setSavingProductGrid] = useState(false);

  // Second Product Grid section state
  const [secondProductGridSection, setSecondProductGridSection] = useState<HomeSection | null>(null);
  const [spgTitle, setSpgTitle] = useState("");
  const [spgFilter, setSpgFilter] = useState("latest");
  const [savingSecondProductGrid, setSavingSecondProductGrid] = useState(false);

  // First Product Slider section state
  const [productSliderSection, setProductSliderSection] = useState<HomeSection | null>(null);
  const [psTitle, setPsTitle] = useState("");
  const [psCategoryId, setPsCategoryId] = useState("");
  const [savingProductSlider, setSavingProductSlider] = useState(false);

  // Second Product Slider section state
  const [secondProductSliderSection, setSecondProductSliderSection] = useState<HomeSection | null>(null);
  const [spsTitle, setSpsTitle] = useState("");
  const [spsCategoryId, setSpsCategoryId] = useState("");
  const [savingSecondProductSlider, setSavingSecondProductSlider] = useState(false);

  const [allCategories, setAllCategories] = useState<{ id: number; name: string; slug: string }[]>([]);

  const [showMediaPickerForEdit, setShowMediaPickerForEdit] = useState(false);
  const [showMediaPickerForCategory, setShowMediaPickerForCategory] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);



  // Section refs for scrolling
  const bannerSectionRef = useRef<HTMLDivElement>(null);
  const fullWidthBannerRef = useRef<HTMLDivElement>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const productSliderRef = useRef<HTMLDivElement>(null);
  const secondProductSliderRef = useRef<HTMLDivElement>(null);
  const secondProductGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchSections();
  }, [router]);

  const fetchSections = async () => {
    try {
      const data = await homeSectionApi.getAll();
      const hero = data.find((s: HomeSection) => s.section_key === "hero");
      const category = data.find((s: HomeSection) => s.section_key === "category");
      const banner = data.find((s: HomeSection) => s.section_key === "banner" || s.section_key === "promo_banner");
      const fullWidth = data.find((s: HomeSection) => s.section_key === "full_width_banner");

      setHeroSection(hero || null);
      setHeroItems(hero?.items || []);
      setCategorySection(category || null);
      setCategoryItems(category?.items || []);
      if (category) {
        setCategoryHeading(category.title || "");
        const sorted = (category.items || []).sort((a, b) => a.position - b.position);
        setCategorySliderItems(
          sorted.map((item) => ({
            id: item.id,
            title: item.title || "",
            image: item.image || "",
            link: item.link || "",
          }))
        );
      }

      setBannerSection(banner || null);
      const bItems = (banner?.items || []).sort((a, b) => a.position - b.position);
      const col1 = bItems[0];
      const col2 = bItems[1];
      setCol1Title(col1?.title || "");
      setCol1Subtitle(col1?.badge || "");
      setCol1Image(col1?.image || "");
      setCol1ButtonText(col1?.button_text || "");
      setCol1Link(col1?.link || "");
      setCol2Title(col2?.title || "");
      setCol2Subtitle(col2?.badge || "");
      setCol2Image(col2?.image || "");
      setCol2ButtonText(col2?.button_text || "");
      setCol2Link(col2?.link || "");

      setFullWidthBannerSection(fullWidth || null);
      const fwItem = fullWidth?.items?.[0];
      setFwTitle(fwItem?.title || "");
      setFwSubtitle(fwItem?.badge || "");
      setFwImage(fwItem?.image || "");
      setFwButtonText(fwItem?.button_text || "");
      setFwLink(fwItem?.link || "");

      const pg = data.find((s: HomeSection) => s.section_key === "product_grid");
      setProductGridSection(pg || null);
      setPgTitle(pg?.title || "Latest Collection");
      const pgSettings = typeof pg?.settings === "string" ? JSON.parse(pg.settings) : pg?.settings;
      setPgFilter(String(pgSettings?.filter || "latest"));

      const ps = data.find((s: HomeSection) => s.section_key === "product_slider");
      setProductSliderSection(ps || null);
      setPsTitle(ps?.title || "Top Selling");
      const psSettings = typeof ps?.settings === "string" ? JSON.parse(ps.settings) : ps?.settings;
      setPsCategoryId(String(psSettings?.category_id || ""));

      const sps = data.find((s: HomeSection) => s.section_key === "second_product_slider");
      setSecondProductSliderSection(sps || null);
      setSpsTitle(sps?.title || "New Collection");
      const spsSettings = typeof sps?.settings === "string" ? JSON.parse(sps.settings) : sps?.settings;
      setSpsCategoryId(String(spsSettings?.category_id || ""));

      const spg = data.find((s: HomeSection) => s.section_key === "second_product_grid");
      setSecondProductGridSection(spg || null);
      setSpgTitle(spg?.title || "Latest Collection");
      const spgSettings = typeof spg?.settings === "string" ? JSON.parse(spg.settings) : spg?.settings;
      setSpgFilter(String(spgSettings?.filter || "latest"));

      // Fetch categories for dropdown
      try {
        const catsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/categories`);
        if (catsRes.ok) {
          const catsData = await catsRes.json();
          const cats = Array.isArray(catsData) ? catsData : catsData.data || [];
          setAllCategories(cats.filter((c: any) => !c.parent_id && c.slug !== "uncategorized"));
        }
      } catch {
        setAllCategories([]);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---- Hero handlers ----
  const handleMediaSelect = async (url: string) => {
    if (!heroSection) return;
    setQuickAdding(true);
    try {
      await homeSectionApi.createItem(heroSection.id, {
        image: url,
        position: heroItems.length,
      });
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Add slide error:", error);
    } finally {
      setQuickAdding(false);
    }
  };

  const handleQuickAddSlide = async () => {
    if (!quickAddUrl || !heroSection) return;
    setQuickAdding(true);
    try {
      await homeSectionApi.createItem(heroSection.id, {
        image: quickAddUrl,
        position: heroItems.length,
      });
      setQuickAddUrl("");
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Quick add error:", error);
    } finally {
      setQuickAdding(false);
    }
  };

  const handleEditItem = (item: HomeSectionItem) => {
    setEditingItem(item);
    setEditTitle(item.title || "");
    setEditLink(item.link || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !heroSection) return;
    try {
      await homeSectionApi.updateItem(heroSection.id, editingItem.id, {
        title: editTitle,
        link: editLink,
      });
      setShowEditModal(false);
      setEditingItem(null);
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Edit error:", error);
    }
  };

  const handleChangeImage = (item: HomeSectionItem) => {
    setEditingItem(item);
    setShowMediaPickerForEdit(true);
  };

  const handleEditMediaSelect = async (url: string) => {
    if (!editingItem || !heroSection) return;
    try {
      await homeSectionApi.updateItem(heroSection.id, editingItem.id, {
        image: url,
      });
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Change image error:", error);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!heroSection) return;
    if (!confirm("Delete this slide?")) return;
    try {
      await homeSectionApi.deleteItem(heroSection.id, itemId);
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleReorder = async (itemId: number, direction: "up" | "down") => {
    if (!heroSection) return;
    const sorted = [...heroItems].sort((a, b) => a.position - b.position);
    const index = sorted.findIndex((i) => i.id === itemId);
    if ((direction === "up" && index === 0) || (direction === "down" && index === sorted.length - 1)) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const tempPos = sorted[index].position;
    sorted[index].position = sorted[swapIndex].position;
    sorted[swapIndex].position = tempPos;

    try {
      await Promise.all([
        homeSectionApi.updateItem(heroSection.id, sorted[index].id, { position: sorted[index].position }),
        homeSectionApi.updateItem(heroSection.id, sorted[swapIndex].id, { position: sorted[swapIndex].position }),
      ]);
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Reorder error:", error);
    }
  };

  // ---- Category handlers ----
  const handleSaveCategorySection = async () => {
    if (!categorySection) {
      try {
        await homeSectionApi.create({
          section_key: "category",
          title: categoryHeading,
          is_active: true,
          position: 10,
        });
        setSuccessMessage("Section created successfully!");
        setShowSuccessMessage(true);
        triggerRevalidate();
        fetchSections();
      } catch (error) {
        console.error("Create category section error:", error);
      }
      return;
    }
    setSavingCategory(true);
    try {
      await homeSectionApi.update(categorySection.id, {
        title: categoryHeading,
      });
      setSuccessMessage("Changes saved successfully!");
      setShowSuccessMessage(true);
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Update category section error:", error);
    } finally {
      setSavingCategory(false);
    }
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleAddCategoryItem = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        const parentCategories = data.filter((c: any) => !c.parent_id);
        setAvailableCategories(parentCategories);
        setShowCategoryPickerModal(true);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleEditCategoryItem = (item: CategoryItemData) => {
    setEditingCategoryItem(item);
    setShowCategoryItemModal(true);
  };

  const handleSaveCategoryItem = async () => {
    if (!editingCategoryItem || !categorySection) return;
    try {
      if (editingCategoryItem.id) {
        await homeSectionApi.updateItem(categorySection.id, editingCategoryItem.id, {
          title: editingCategoryItem.title,
          image: editingCategoryItem.image,
          link: editingCategoryItem.link,
        });
      } else {
        await homeSectionApi.createItem(categorySection.id, {
          title: editingCategoryItem.title,
          image: editingCategoryItem.image,
          link: editingCategoryItem.link,
          position: categorySliderItems.length,
        });
      }
      setShowCategoryItemModal(false);
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Save category item error:", error);
    }
  };

  const handleDeleteCategoryItem = async (itemId: number) => {
    if (!categorySection) return;
    if (!confirm("Delete this category?")) return;
    try {
      await homeSectionApi.deleteItem(categorySection.id, itemId);
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // ---- Banner handlers ----
  const handleSaveBanner = async () => {
    setSavingBanner(true);
    try {
      let section = bannerSection;
      if (!section) {
        section = await homeSectionApi.create({
          section_key: "banner",
          is_active: true,
          position: 20,
          settings: { columns: 2, aspect_ratio: "3/2" },
        });
        setBannerSection(section);
      }

      const items = (section.items || []).sort((a, b) => a.position - b.position);
      const col1Id = items[0]?.id;
      const col2Id = items[1]?.id;

      if (col1Id) {
        await homeSectionApi.updateItem(section.id, col1Id, {
          title: col1Title,
          badge: col1Subtitle,
          image: col1Image,
          button_text: col1ButtonText,
          link: col1Link,
        });
      } else {
        await homeSectionApi.createItem(section.id, {
          title: col1Title,
          badge: col1Subtitle,
          image: col1Image,
          button_text: col1ButtonText,
          link: col1Link,
          position: 0,
        });
      }

      if (col2Id) {
        await homeSectionApi.updateItem(section.id, col2Id, {
          title: col2Title,
          badge: col2Subtitle,
          image: col2Image,
          button_text: col2ButtonText,
          link: col2Link,
        });
      } else {
        await homeSectionApi.createItem(section.id, {
          title: col2Title,
          badge: col2Subtitle,
          image: col2Image,
          button_text: col2ButtonText,
          link: col2Link,
          position: 1,
        });
      }

      setSuccessMessage("Banner saved!");
      setShowSuccessMessage(true);
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Save banner error:", error);
    } finally {
      setSavingBanner(false);
    }
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // ---- One Column Banner handler ----
  const handleSaveFullWidthBanner = async () => {
    setSavingFullWidthBanner(true);
    try {
      let section = fullWidthBannerSection;
      if (!section) {
        section = await homeSectionApi.create({
          section_key: "full_width_banner",
          is_active: true,
          position: 25,
          settings: { columns: 1, aspect_ratio: "21/9" },
        });
        setFullWidthBannerSection(section);
      }

      const items = (section.items || []).sort((a, b) => a.position - b.position);
      const itemId = items[0]?.id;

      if (itemId) {
        await homeSectionApi.updateItem(section.id, itemId, {
          title: fwTitle,
          badge: fwSubtitle,
          image: fwImage,
          button_text: fwButtonText,
          link: fwLink,
        });
      } else {
        await homeSectionApi.createItem(section.id, {
          title: fwTitle,
          badge: fwSubtitle,
          image: fwImage,
          button_text: fwButtonText,
          link: fwLink,
          position: 0,
        });
      }

      setSuccessMessage("Full width banner saved!");
      setShowSuccessMessage(true);
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Save full width banner error:", error);
    } finally {
      setSavingFullWidthBanner(false);
    }
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // ---- Product Grid handler ----
  const handleSaveProductGrid = async () => {
    setSavingProductGrid(true);
    try {
      let section = productGridSection;
      if (!section) {
        section = await homeSectionApi.create({
          section_key: "product_grid",
          title: pgTitle,
          is_active: true,
          position: 15,
          settings: { filter: pgFilter },
        });
        setProductGridSection(section);
      } else {
        await homeSectionApi.update(section.id, {
          title: pgTitle,
          settings: { filter: pgFilter },
        });
      }

      setSuccessMessage("Product grid saved!");
      setShowSuccessMessage(true);
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Save product grid error:", error);
    } finally {
      setSavingProductGrid(false);
    }
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // ---- Second Product Grid handler ----
  const handleSaveSecondProductGrid = async () => {
    setSavingSecondProductGrid(true);
    try {
      let section = secondProductGridSection;
      if (!section) {
        section = await homeSectionApi.create({
          section_key: "second_product_grid",
          title: spgTitle,
          is_active: true,
          position: 45,
          settings: { filter: spgFilter },
        });
        setSecondProductGridSection(section);
      } else {
        await homeSectionApi.update(section.id, {
          title: spgTitle,
          settings: { filter: spgFilter },
        });
      }

      setSuccessMessage("Second product grid saved!");
      setShowSuccessMessage(true);
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Save second product grid error:", error);
    } finally {
      setSavingSecondProductGrid(false);
    }
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // ---- First Product Slider handler ----
  const handleSaveProductSlider = async () => {
    setSavingProductSlider(true);
    try {
      let section = productSliderSection;
      if (!section) {
        section = await homeSectionApi.create({
          section_key: "product_slider",
          title: psTitle,
          is_active: true,
          position: 25,
          settings: { category_id: psCategoryId ? parseInt(psCategoryId) : null },
        });
        setProductSliderSection(section);
      } else {
        await homeSectionApi.update(section.id, {
          title: psTitle,
          settings: { category_id: psCategoryId ? parseInt(psCategoryId) : null },
        });
      }

      setSuccessMessage("First product slider saved!");
      setShowSuccessMessage(true);
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Save product slider error:", error);
    } finally {
      setSavingProductSlider(false);
    }
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // ---- Second Product Slider handler ----
  const handleSaveSecondProductSlider = async () => {
    setSavingSecondProductSlider(true);
    try {
      let section = secondProductSliderSection;
      if (!section) {
        section = await homeSectionApi.create({
          section_key: "second_product_slider",
          title: spsTitle,
          is_active: true,
          position: 35,
          settings: { category_id: spsCategoryId ? parseInt(spsCategoryId) : null },
        });
        setSecondProductSliderSection(section);
      } else {
        await homeSectionApi.update(section.id, {
          title: spsTitle,
          settings: { category_id: spsCategoryId ? parseInt(spsCategoryId) : null },
        });
      }

      setSuccessMessage("Second product slider saved!");
      setShowSuccessMessage(true);
      triggerRevalidate();
      fetchSections();
    } catch (error) {
      console.error("Save second product slider error:", error);
    } finally {
      setSavingSecondProductSlider(false);
    }
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  const sortedHeroItems = [...heroItems].sort((a, b) => a.position - b.position);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Home Page Sections</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your home page content</p>
      </div>

      {/* Hero Slider Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Hero Slider</h2>
          <p className="text-sm text-gray-500">{sortedHeroItems.length} slide{sortedHeroItems.length !== 1 ? "s" : ""}</p>
        </div>
        
        {!heroSection ? (
          <p className="text-gray-500">No hero section found. Create one first.</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <input
                type="text"
                value={quickAddUrl}
                onChange={(e) => setQuickAddUrl(e.target.value)}
                placeholder="Or paste image URL here..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleQuickAddSlide()}
              />
              <button
                onClick={handleQuickAddSlide}
                disabled={!quickAddUrl || quickAdding}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 whitespace-nowrap"
              >
                {quickAdding ? "Adding..." : "Add URL"}
              </button>
              <button
                onClick={() => setShowMediaPicker(true)}
                disabled={quickAdding}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Choose from Library
              </button>
            </div>
            
            {sortedHeroItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedHeroItems.map((item, idx) => (
                  <div key={item.id} className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-100 group">
                    <img
                      src={item.image || ""}
                      alt={`Slide ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      Slide {idx + 1}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 shadow-lg"
                        title="Edit details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleChangeImage(item)}
                        className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 shadow-lg"
                        title="Change image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
                        title="Delete slide"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleReorder(item.id, "up")}
                        disabled={idx === 0}
                        className="p-1 bg-white/90 rounded disabled:opacity-30 hover:bg-white"
                        title="Move up"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleReorder(item.id, "down")}
                        disabled={idx === sortedHeroItems.length - 1}
                        className="p-1 bg-white/90 rounded disabled:opacity-30 hover:bg-white"
                        title="Move down"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 mb-4">No slides yet</p>
                <button
                  onClick={() => setShowMediaPicker(true)}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add First Slide
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Media Picker for adding new slide */}
      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
      />

      {/* Media Picker for changing image */}
      <MediaPicker
        isOpen={showMediaPickerForEdit}
        onClose={() => { setShowMediaPickerForEdit(false); setEditingItem(null); }}
        onSelect={handleEditMediaSelect}
      />

      {/* Hero Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Edit Slide</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {editingItem.image && (
                <div className="aspect-[16/9] rounded-lg overflow-hidden bg-gray-100">
                  <img src={editingItem.image} alt="Current slide" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Slide title (optional)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link URL</label>
                <input
                  type="text"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  placeholder="/shop or https://example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Slider Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Category Slider</h2>
          <p className="text-sm text-gray-500">{categorySliderItems.length} category{categorySliderItems.length !== 1 ? "ies" : ""}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Heading</label>
            <input
              type="text"
              value={categoryHeading}
              onChange={(e) => setCategoryHeading(e.target.value)}
              placeholder="e.g., Shop by Category"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
        </div>
        
        <div className="flex gap-2 mb-6">
          <button
            onClick={handleSaveCategorySection}
            disabled={savingCategory}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingCategory ? "Saving..." : categorySection ? "Save Changes" : "Create Section"}
          </button>
          {showSuccessMessage && (
            <span className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </span>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium">Category Images</h3>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={handleAddCategoryItem}
              className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </button>
          </div>

          {categorySliderItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categorySliderItems.map((item, idx) => (
                <div key={item.id || idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {idx + 1}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-xs font-medium truncate drop-shadow-lg">{item.title}</p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditCategoryItem(item)}
                      className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 shadow-lg"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => item.id && handleDeleteCategoryItem(item.id)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500">No categories added yet</p>
            </div>
          )}
        </div>
      </div>

      {/* First Product Grid Section */}
      <div ref={productGridRef} className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">First Product Grid</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Heading</label>
            <input
              type="text"
              value={pgTitle}
              onChange={(e) => setPgTitle(e.target.value)}
              placeholder="e.g., Latest Collection"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Filter</label>
            <select
              value={pgFilter}
              onChange={(e) => setPgFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
            >
              <option value="latest">Latest Products</option>
              <option value="featured">Featured Products</option>
              <option value="top_selling">Top Selling</option>
              <option value="all">All Products</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveProductGrid}
            disabled={savingProductGrid}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingProductGrid ? "Saving..." : "Save Grid"}
          </button>
          {showSuccessMessage && (
            <span className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </span>
          )}
        </div>
      </div>

      {/* First Two Column Banner */}
      <div ref={bannerSectionRef} className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">First Two Column Banner</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-4 border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700">Column 1</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={col1Title}
                onChange={(e) => setCol1Title(e.target.value)}
                placeholder="e.g., Summer Collection"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={col1Subtitle}
                onChange={(e) => setCol1Subtitle(e.target.value)}
                placeholder="e.g., New Arrivals"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={col1Image}
                  onChange={(e) => setCol1Image(e.target.value)}
                  placeholder="Paste image URL"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
                <button
                  onClick={() => setShowMediaPickerCol1(true)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                >
                  Choose
                </button>
              </div>
              {col1Image && (
                <div className="mt-2 aspect-[3/2] rounded-lg overflow-hidden bg-gray-100 max-w-[200px]">
                  <img src={col1Image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Button Text</label>
              <input
                type="text"
                value={col1ButtonText}
                onChange={(e) => setCol1ButtonText(e.target.value)}
                placeholder="e.g., Shop Now"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Button Link</label>
              <input
                type="text"
                value={col1Link}
                onChange={(e) => setCol1Link(e.target.value)}
                placeholder="e.g., /summer-collection"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4 border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700">Column 2</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={col2Title}
                onChange={(e) => setCol2Title(e.target.value)}
                placeholder="e.g., Style Essentials"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={col2Subtitle}
                onChange={(e) => setCol2Subtitle(e.target.value)}
                placeholder="e.g., Complete Your Look"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={col2Image}
                  onChange={(e) => setCol2Image(e.target.value)}
                  placeholder="Paste image URL"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
                <button
                  onClick={() => setShowMediaPickerCol2(true)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                >
                  Choose
                </button>
              </div>
              {col2Image && (
                <div className="mt-2 aspect-[3/2] rounded-lg overflow-hidden bg-gray-100 max-w-[200px]">
                  <img src={col2Image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Button Text</label>
              <input
                type="text"
                value={col2ButtonText}
                onChange={(e) => setCol2ButtonText(e.target.value)}
                placeholder="e.g., Shop Now"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Button Link</label>
              <input
                type="text"
                value={col2Link}
                onChange={(e) => setCol2Link(e.target.value)}
                placeholder="e.g., /accessories"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSaveBanner}
            disabled={savingBanner}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingBanner ? "Saving..." : "Save Banner"}
          </button>
          {showSuccessMessage && (
            <span className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </span>
          )}
        </div>
      </div>

      {/* First Product Slider Section */}
      <div ref={productSliderRef} className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">First Product Slider</h2>
          {productSliderSection && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Active</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section Heading</label>
            <input
              type="text"
              value={psTitle}
              onChange={(e) => setPsTitle(e.target.value)}
              placeholder="e.g. Top Selling"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={psCategoryId}
              onChange={(e) => setPsCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">All Products</option>
              {allCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveProductSlider}
            disabled={savingProductSlider}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingProductSlider ? "Saving..." : "Save First Product Slider"}
          </button>
        </div>
      </div>

      {/* Full Width Banner */}
      <div ref={fullWidthBannerRef} className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Full Width Banner</h2>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={fwTitle}
              onChange={(e) => setFwTitle(e.target.value)}
              placeholder="e.g., Discover the New Collection"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={fwSubtitle}
              onChange={(e) => setFwSubtitle(e.target.value)}
              placeholder="e.g., Explore the latest trends"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fwImage}
                onChange={(e) => setFwImage(e.target.value)}
                placeholder="Paste image URL"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
              <button
                onClick={() => setShowMediaPickerFw(true)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
              >
                Choose
              </button>
            </div>
            {fwImage && (
              <div className="mt-2 aspect-[21/9] rounded-lg overflow-hidden bg-gray-100 max-w-[400px]">
                <img src={fwImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Button Text</label>
              <input
                type="text"
                value={fwButtonText}
                onChange={(e) => setFwButtonText(e.target.value)}
                placeholder="e.g., Shop Now"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Button Link</label>
              <input
                type="text"
                value={fwLink}
                onChange={(e) => setFwLink(e.target.value)}
                placeholder="e.g., /new-collection"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSaveFullWidthBanner}
            disabled={savingFullWidthBanner}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingFullWidthBanner ? "Saving..." : "Save Banner"}
          </button>
          {showSuccessMessage && (
            <span className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </span>
          )}
        </div>
      </div>

      {/* Second Product Slider Section */}
      <div ref={secondProductSliderRef} className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Second Product Slider</h2>
          {secondProductSliderSection && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Active</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section Heading</label>
            <input
              type="text"
              value={spsTitle}
              onChange={(e) => setSpsTitle(e.target.value)}
              placeholder="e.g. New Collection"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={spsCategoryId}
              onChange={(e) => setSpsCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">All Products</option>
              {allCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveSecondProductSlider}
            disabled={savingSecondProductSlider}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingSecondProductSlider ? "Saving..." : "Save Second Product Slider"}
          </button>
        </div>
      </div>

      {/* Second Product Grid Section */}
      <div ref={secondProductGridRef} className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Second Product Grid</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Heading</label>
            <input
              type="text"
              value={spgTitle}
              onChange={(e) => setSpgTitle(e.target.value)}
              placeholder="e.g., Latest Collection"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Filter</label>
            <select
              value={spgFilter}
              onChange={(e) => setSpgFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
            >
              <option value="latest">Latest Products</option>
              <option value="featured">Featured Products</option>
              <option value="top_selling">Top Selling</option>
              <option value="all">All Products</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveSecondProductGrid}
            disabled={savingSecondProductGrid}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingSecondProductGrid ? "Saving..." : "Save Grid"}
          </button>
          {showSuccessMessage && (
            <span className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </span>
          )}
        </div>
      </div>

      {/* Media Picker for category items */}
      <MediaPicker
        isOpen={showMediaPickerForCategory}
        onClose={() => { setShowMediaPickerForCategory(false); setEditingCategoryItem(null); }}
        onSelect={(url) => {
          if (editingCategoryItem) {
            setEditingCategoryItem({ ...editingCategoryItem, image: url });
          }
        }}
      />

      {/* Category Item Modal */}
      {showCategoryItemModal && editingCategoryItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingCategoryItem.id ? "Edit Category" : "Add Category"}
              </h2>
              <button onClick={() => setShowCategoryItemModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={editingCategoryItem.title}
                  onChange={(e) => setEditingCategoryItem({ ...editingCategoryItem, title: e.target.value })}
                  placeholder="e.g., Ladies Wear"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingCategoryItem.image}
                    onChange={(e) => setEditingCategoryItem({ ...editingCategoryItem, image: e.target.value })}
                    placeholder="Paste image URL"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                  <button
                    onClick={() => setShowMediaPickerForCategory(true)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                  >
                    Choose
                  </button>
                </div>
                {editingCategoryItem.image && (
                  <div className="mt-2 aspect-square rounded-lg overflow-hidden bg-gray-100 max-w-[200px]">
                    <img src={editingCategoryItem.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link URL</label>
                <input
                  type="text"
                  value={editingCategoryItem.link}
                  onChange={(e) => setEditingCategoryItem({ ...editingCategoryItem, link: e.target.value })}
                  placeholder="e.g., /category/ladies-wear"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowCategoryItemModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategoryItem}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Picker Modal */}
      {showCategoryPickerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Select Category</h2>
              <button onClick={() => setShowCategoryPickerModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {availableCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setEditingCategoryItem({
                          id: undefined,
                          title: cat.name,
                          image: cat.image || "",
                          link: `/category/${cat.slug}`,
                        });
                        setShowCategoryPickerModal(false);
                        setShowCategoryItemModal(true);
                      }}
                      className="p-3 border border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No categories available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Column 1 Media Picker */}
      <MediaPicker
        isOpen={showMediaPickerCol1}
        onClose={() => setShowMediaPickerCol1(false)}
        onSelect={(url) => setCol1Image(url)}
      />

      {/* Column 2 Media Picker */}
      <MediaPicker
        isOpen={showMediaPickerCol2}
        onClose={() => setShowMediaPickerCol2(false)}
        onSelect={(url) => setCol2Image(url)}
      />

      {/* Full Width Banner Media Picker */}
      <MediaPicker
        isOpen={showMediaPickerFw}
        onClose={() => setShowMediaPickerFw(false)}
        onSelect={(url) => setFwImage(url)}
      />
    </div>
  );
}
