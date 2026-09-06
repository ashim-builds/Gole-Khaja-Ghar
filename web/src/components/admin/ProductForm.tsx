import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Upload,
  Plus,
  Trash2,
  AlertCircle,
  X,
  UtensilsCrossed,
  Scale,
  Zap,
  CheckCircle2,
  FileText,
  DollarSign,
  Image as ImageIcon,
  Sparkles,
  Package,
} from "lucide-react";

interface ProductFormProps {
  product?: any;
}

const STEPS = [
  { id: 1, name: "Basic Info", shortName: "Info", icon: FileText, desc: "Name, category & details" },
  { id: 2, name: "Portions & Price", shortName: "Pricing", icon: DollarSign, desc: "Plates, pieces or weight" },
  { id: 3, name: "Photos", shortName: "Photos", icon: ImageIcon, desc: "Cover & gallery images" },
  { id: 4, name: "Review & Save", shortName: "Review", icon: Sparkles, desc: "Preview & publish" },
];

export default function ProductForm({ product }: ProductFormProps) {
  const isEdit = !!product;
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auto-dismiss error after 6 seconds
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 6000);
    return () => clearTimeout(t);
  }, [error]);

  // Auto-dismiss success after 2 seconds then navigate
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => navigate("/admin/products"), 2000);
    return () => clearTimeout(t);
  }, [success, navigate]);

  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    category: product?.category || "Khaja Sets",
    priceType: product?.priceType || "variant",
    pricePerKg: product?.pricePerKg || "",
    variants:
      product?.variants && product.variants.length > 0
        ? product.variants
        : [{ name: "Full Plate", price: "" }],
    weightOptions: product?.weightOptions || [
      { value: 250, unit: "g" },
      { value: 500, unit: "g" },
      { value: 750, unit: "g" },
      { value: 1, unit: "kg" },
    ],
    allowCustomWeight: product ? product.allowCustomWeight : true,
    trackStock: product ? Boolean(product.trackStock) : false,
    stockQuantity: product && product.stockQuantity !== undefined ? String(product.stockQuantity) : "0",
    lowStockAlert: product && product.lowStockAlert !== undefined ? String(product.lowStockAlert) : "5",
    existingImage: product?.image || "",
    existingImages: product?.images || [],
    isAvailable: product ? product.isAvailable : true,
    isFeatured: product ? product.isFeatured : false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image || null);

  // Gallery
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(product?.images || []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (!isEdit && name === "name") {
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, ""),
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddVariant = (defaultName = "") => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { name: defaultName, price: "" }],
    }));
  };

  const handleApplyPresetTemplate = (
    template: "full_half" | "momo_pcs" | "khaja_set" | "beverage"
  ) => {
    if (template === "full_half") {
      setFormData((prev) => ({
        ...prev,
        variants: [
          { name: "Full Plate", price: "" },
          { name: "Half Plate", price: "" },
        ],
      }));
    } else if (template === "momo_pcs") {
      setFormData((prev) => ({
        ...prev,
        variants: [
          { name: "1 Plate (10 Pcs)", price: "" },
          { name: "Half Plate (5 Pcs)", price: "" },
        ],
      }));
    } else if (template === "khaja_set") {
      setFormData((prev) => ({
        ...prev,
        variants: [
          { name: "Regular Khaja Set", price: "" },
          { name: "Special Khaja Set", price: "" },
        ],
      }));
    } else if (template === "beverage") {
      setFormData((prev) => ({
        ...prev,
        variants: [
          { name: "1 Cup", price: "" },
          { name: "1 Glass", price: "" },
          { name: "1 Bottle", price: "" },
        ],
      }));
    }
  };

  const handleVariantChange = (index: number, field: string, value: string | number) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const handleRemoveVariant = (index: number) => {
    const newVariants = formData.variants.filter((_: any, i: number) => i !== index);
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const handleAddWeightOption = () => {
    setFormData((prev) => ({
      ...prev,
      weightOptions: [...prev.weightOptions, { value: 0, unit: "g" }],
    }));
  };

  const handleWeightOptionChange = (index: number, field: string, value: string | number) => {
    const newOptions = [...formData.weightOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData((prev) => ({ ...prev, weightOptions: newOptions }));
  };

  const handleRemoveWeightOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      weightOptions: prev.weightOptions.filter((_: any, i: number) => i !== index),
    }));
  };

  const validateStep = (stepNumber: number): boolean => {
    setError("");

    if (stepNumber === 1) {
      if (!formData.name.trim()) {
        setError("Please enter a Product Name.");
        return false;
      }
      if (!formData.slug.trim()) {
        setError("Please enter a valid URL Slug.");
        return false;
      }
      if (!formData.description.trim()) {
        setError("Please provide a short description for the product.");
        return false;
      }
    }

    if (stepNumber === 2) {
      if (formData.priceType === "variant") {
        if (formData.variants.length === 0) {
          setError("Please add at least one portion option (e.g. Full Plate, Half Plate, Pcs).");
          return false;
        }
        const invalidVariant = formData.variants.find(
          (v: any) => !v.name?.trim() || isNaN(Number(v.price)) || Number(v.price) < 0
        );
        if (invalidVariant) {
          setError("Please ensure all portions have a name and a valid price (e.g. Rs. 200).");
          return false;
        }
      } else {
        if (!formData.pricePerKg || Number(formData.pricePerKg) <= 0) {
          setError("Please enter a valid price per Kg.");
          return false;
        }
      }
    }

    if (stepNumber === 3) {
      // Photo is optional (defaults to /images/logo.png if not uploaded)
      return true;
    }

    return true;
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError("");
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1));
    }
  };

  const handlePrevStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError("");
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handlePublish = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError("");

    // Strictly ensure we are on step 4
    if (currentStep !== 4) {
      handleNextStep();
      return;
    }

    // Validate all required steps before final save
    for (let s = 1; s <= 3; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        return;
      }
    }

    setLoading(true);

    try {
      const MAX_PER_FILE_MB = 5;
      const MAX_TOTAL_MB = 9;
      const allFiles = [imageFile, ...galleryFiles].filter(Boolean) as File[];

      for (const file of allFiles) {
        if (file.size > MAX_PER_FILE_MB * 1024 * 1024) {
          throw new Error(
            `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please keep each image under ${MAX_PER_FILE_MB} MB.`
          );
        }
      }

      const totalBytes = allFiles.reduce((sum, f) => sum + f.size, 0);
      if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) {
        throw new Error(
          `Total upload size is ${(totalBytes / 1024 / 1024).toFixed(1)} MB (limit: ${MAX_TOTAL_MB} MB).`
        );
      }

      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "variants" || key === "existingImages" || key === "weightOptions") {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, String(value));
        }
      });

      if (imageFile) {
        data.append("imageFile", imageFile);
      }
      galleryFiles.forEach((file) => data.append("galleryFiles", file));

      if (isEdit) {
        const productId = product.id || product._id?.toString();
        await api.products.update(productId, data);
        setSuccess("Product updated successfully!");
      } else {
        await api.products.create(data);
        setSuccess("Product added successfully!");
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 bg-white rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
              {isEdit ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-xs text-stone-500 font-medium">Step-by-step product catalog creation</p>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {success && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-lg"
          style={{ animation: "slide-in-from-top-4 0.3s ease forwards" }}
        >
          <div className="bg-green-600 text-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
              <p className="flex-1 text-sm font-bold">{success}</p>
              <span className="text-xs text-green-200 font-medium">Redirecting...</span>
            </div>
            <div className="h-1 bg-green-500">
              <div className="h-full bg-white/60" style={{ animation: "shrink 2s linear forwards" }} />
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-lg">
          <div className="bg-red-600 text-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="flex-1 text-sm font-bold leading-snug">{error}</p>
              <button
                onClick={() => setError("")}
                className="p-1 hover:bg-red-500 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-1 bg-red-500">
              <div className="h-full bg-white/60" style={{ animation: "shrink 6s linear forwards" }} />
            </div>
          </div>
        </div>
      )}

      {/* STEPPER PROGRESS BAR */}
      <div className="bg-white p-2 sm:p-4 rounded-2xl border border-stone-200/90 shadow-xs">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setError("");
                  setCurrentStep(step.id);
                }}
                className={`p-1.5 sm:p-3 rounded-xl transition-all flex flex-col sm:flex-row items-center gap-1 sm:gap-2.5 cursor-pointer text-center sm:text-left ${
                  isCurrent
                    ? "bg-orange-50 border-2 border-orange-500 shadow-xs"
                    : isCompleted
                    ? "bg-emerald-50/70 border border-emerald-200 hover:bg-emerald-50"
                    : "bg-stone-50/70 border border-stone-200/70 opacity-75 hover:opacity-100"
                }`}
              >
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-[11px] sm:text-xs shrink-0 ${
                    isCurrent
                      ? "bg-orange-600 text-white shadow-xs"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : step.id}
                </div>
                <div className="min-w-0 w-full">
                  <p
                    className={`text-[10px] sm:text-xs font-black truncate leading-tight ${
                      isCurrent ? "text-orange-950" : isCompleted ? "text-emerald-950" : "text-stone-600"
                    }`}
                  >
                    <span className="sm:hidden">{step.shortName}</span>
                    <span className="hidden sm:inline">{step.name}</span>
                  </p>
                  <p className="text-[10px] text-stone-400 truncate hidden md:block">{step.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FORM CARD (ACTIVE STEP) */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (currentStep === 4) {
            handlePublish();
          } else {
            handleNextStep();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.preventDefault();
            if (currentStep < 4) {
              handleNextStep();
            }
          }
        }}
        className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-stone-200"
      >
        
        {/* STEP 1: BASIC INFORMATION */}
        {currentStep === 1 && (
          <div className="space-y-3.5 sm:space-y-4">
            <div className="border-b border-stone-100 pb-2.5">
              <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                Step 1: Basic Information
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">Enter product title, catalog category and customer description</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full text-stone-900 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-none placeholder:text-stone-400 font-bold"
                  placeholder="e.g. Buff Momo, Chicken Chowmein"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full text-stone-900 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-none font-bold"
                >
                  <option value="Khaja Sets">Khaja Sets</option>
                  <option value="Momo">Momo</option>
                  <option value="Chowmein">Chowmein</option>
                  <option value="Sekuwa & Snacks">Sekuwa & Snacks</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                URL Slug *
              </label>
              <input
                required
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full text-stone-900 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-none placeholder:text-stone-400 font-mono text-sm"
                placeholder="e.g. buff-momo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Description *
              </label>
              <textarea
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full text-stone-900 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-none placeholder:text-stone-400 font-medium"
                placeholder="Describe freshness, ingredients, spice level, or serving style..."
              />
            </div>
          </div>
        )}

        {/* STEP 2: PORTIONS & PRICING */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                  Step 2: Pricing & Portions
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">Configure restaurant serving sizes (Full/Half Plate, Pcs) or Weight</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full w-fit">
                {formData.priceType === "variant" ? "Portion-Based" : "Weight-Based"}
              </span>
            </div>

            {/* Price Type Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setFormData((p) => ({ ...p, priceType: "variant" }))}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  formData.priceType === "variant"
                    ? "border-orange-500 bg-orange-50/50 shadow-sm"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <input
                  type="radio"
                  name="priceType"
                  value="variant"
                  checked={formData.priceType === "variant"}
                  onChange={handleChange}
                  className="mt-1 text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <span className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <UtensilsCrossed className="w-4 h-4 text-orange-600 shrink-0" />
                    Restaurant Portions (Recommended)
                  </span>
                  <span className="text-xs text-stone-500 block mt-0.5">
                    Full Plate, Half Plate, Pcs, Khaja Sets, Cup/Glass
                  </span>
                </div>
              </label>

              <label
                onClick={() => setFormData((p) => ({ ...p, priceType: "weight" }))}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  formData.priceType === "weight"
                    ? "border-orange-500 bg-orange-50/50 shadow-sm"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <input
                  type="radio"
                  name="priceType"
                  value="weight"
                  checked={formData.priceType === "weight"}
                  onChange={handleChange}
                  className="mt-1 text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <span className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-stone-600 shrink-0" />
                    By Weight (Bulk / Raw Items)
                  </span>
                  <span className="text-xs text-stone-500 block mt-0.5">
                    Price per Kg with Grams / Kg portion selections
                  </span>
                </div>
              </label>
            </div>

            {formData.priceType === "weight" ? (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Price per Kg / Base (Rs.) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    name="pricePerKg"
                    value={formData.pricePerKg}
                    onChange={handleChange}
                    className="w-full text-stone-900 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:outline-none font-black text-lg"
                    placeholder="e.g. 500"
                  />
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Weight Options
                    </label>
                    <button
                      type="button"
                      onClick={handleAddWeightOption}
                      className="text-xs font-bold bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Weight Option
                    </button>
                  </div>
                  {formData.weightOptions.map((opt: any, index: number) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <input
                          required
                          type="number"
                          min="1"
                          placeholder="Value (e.g. 250)"
                          value={opt.value || ""}
                          onChange={(e) =>
                            handleWeightOptionChange(index, "value", Number(e.target.value))
                          }
                          className="w-full text-stone-900 px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                        />
                      </div>
                      <div className="w-32">
                        <select
                          value={opt.unit}
                          onChange={(e) => handleWeightOptionChange(index, "unit", e.target.value)}
                          className="w-full text-stone-900 px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                        >
                          <option value="g">g (Grams)</option>
                          <option value="kg">kg (Kilograms)</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveWeightOption(index)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-stone-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="allowCustomWeight"
                        checked={formData.allowCustomWeight}
                        onChange={handleChange}
                        className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500"
                      />
                      <span className="text-xs font-bold text-stone-700">
                        Allow customers to type in custom grams / kg
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200">
                {/* 1-Tap Quick Portions */}
                <div>
                  <span className="text-xs font-bold text-stone-600 flex items-center gap-1 mb-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    1-Tap Quick Portions:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddVariant("Full Plate")}
                      className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:border-orange-300 border border-stone-200 rounded-lg text-xs font-bold text-stone-800 shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-orange-600" /> Full Plate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddVariant("Half Plate")}
                      className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:border-orange-300 border border-stone-200 rounded-lg text-xs font-bold text-stone-800 shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-orange-600" /> Half Plate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddVariant("10 Pcs (Plate)")}
                      className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:border-orange-300 border border-stone-200 rounded-lg text-xs font-bold text-stone-800 shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-orange-600" /> 10 Pcs
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddVariant("5 Pcs (Half)")}
                      className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:border-orange-300 border border-stone-200 rounded-lg text-xs font-bold text-stone-800 shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-orange-600" /> 5 Pcs
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddVariant("1 Pc (Single)")}
                      className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:border-orange-300 border border-stone-200 rounded-lg text-xs font-bold text-stone-800 shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-orange-600" /> 1 Pc
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddVariant("Khaja Set")}
                      className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:border-orange-300 border border-stone-200 rounded-lg text-xs font-bold text-stone-800 shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-orange-600" /> Khaja Set
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddVariant("1 Cup / Glass")}
                      className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:border-orange-300 border border-stone-200 rounded-lg text-xs font-bold text-stone-800 shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-orange-600" /> Cup / Glass
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddVariant("")}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-black shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Custom Portion
                    </button>
                  </div>
                </div>

                {/* Templates */}
                <div className="flex items-center gap-2 pt-1 border-t border-stone-200/80">
                  <span className="text-[11px] font-semibold text-stone-500">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetTemplate("full_half")}
                    className="text-[11px] text-orange-700 hover:text-orange-900 font-bold underline cursor-pointer"
                  >
                    Full + Half Plate
                  </button>
                  <span className="text-stone-300">•</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetTemplate("momo_pcs")}
                    className="text-[11px] text-orange-700 hover:text-orange-900 font-bold underline cursor-pointer"
                  >
                    10 Pcs & 5 Pcs
                  </button>
                  <span className="text-stone-300">•</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetTemplate("khaja_set")}
                    className="text-[11px] text-orange-700 hover:text-orange-900 font-bold underline cursor-pointer"
                  >
                    Regular & Special Set
                  </button>
                </div>

                {/* Portion List */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-600 px-1">
                    <span>Portion Name</span>
                    <span className="w-32 text-right pr-10">Price (Rs.)</span>
                  </div>

                  {formData.variants.map((variant: any, index: number) => (
                    <div
                      key={index}
                      className="flex gap-2 items-center bg-white p-2 rounded-xl border border-stone-200 shadow-sm"
                    >
                      <div className="flex-1">
                        <input
                          required
                          placeholder="e.g. Full Plate, Half Plate, 10 Pcs"
                          value={variant.name}
                          onChange={(e) => handleVariantChange(index, "name", e.target.value)}
                          className="w-full text-stone-900 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm font-semibold"
                        />
                      </div>
                      <div className="w-32">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                            Rs.
                          </span>
                          <input
                            required
                            type="number"
                            min="0"
                            placeholder="Price"
                            value={variant.price !== undefined ? variant.price : ""}
                            onChange={(e) =>
                              handleVariantChange(
                                index,
                                "price",
                                e.target.value === "" ? "" : Number(e.target.value)
                              )
                            }
                            className="w-full text-stone-900 pl-8 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm font-black"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        disabled={formData.variants.length === 1}
                        title={
                          formData.variants.length === 1
                            ? "At least one portion is required"
                            : "Remove portion"
                        }
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* INVENTORY & STOCK TRACKING */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-stone-900">Inventory & Stock Tracking</h3>
                    <p className="text-xs text-stone-500">Track stock count for drinks, beers, cans, or daily limited items</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="trackStock"
                    checked={formData.trackStock}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              {formData.trackStock && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Available Stock Quantity *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        name="stockQuantity"
                        value={formData.stockQuantity}
                        onChange={handleChange}
                        placeholder="e.g. 50"
                        className="w-full text-stone-900 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white font-black"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                        Units
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">Stock automatically decreases with each order.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Low Stock Warning Threshold
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        name="lowStockAlert"
                        value={formData.lowStockAlert}
                        onChange={handleChange}
                        placeholder="e.g. 5"
                        className="w-full text-stone-900 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                        Units
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">Warns in yellow when stock reaches or drops below this number.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: PHOTOS & MEDIA */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-600" />
                Step 3: Product Photos
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Upload high quality cover and gallery images for the menu</p>
            </div>

            {/* Primary Cover Photo */}
            <div>
              <p className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Cover Photo * <span className="text-stone-400 font-normal lowercase">(main display photo)</span>
              </p>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex-1">
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-stone-300 border-dashed rounded-2xl cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <Upload className="w-8 h-8 mb-2 text-stone-400" />
                      <p className="text-sm text-stone-600 font-bold">
                        <span className="text-orange-600">Click to upload</span> cover photo
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">PNG, JPG, WEBP (under 5MB)</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
                {imagePreview && (
                  <div className="w-36 h-36 relative rounded-2xl border-2 border-orange-500 overflow-hidden bg-stone-100 shadow-md shrink-0">
                    <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 bg-orange-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow">
                      Cover
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Gallery Images */}
            <div>
              <p className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Gallery Images <span className="text-stone-400 font-normal lowercase">(optional extra angles)</span>
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-2">
                {galleryPreviews.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl border border-stone-200 overflow-hidden bg-stone-100 shadow-sm group"
                  >
                    <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const isExisting = i < (formData.existingImages?.length || 0);
                        if (isExisting) {
                          setFormData((prev: any) => ({
                            ...prev,
                            existingImages: prev.existingImages.filter((_: string, idx: number) => idx !== i),
                          }));
                        } else {
                          const fileIdx = i - (formData.existingImages?.length || 0);
                          setGalleryFiles((prev) => prev.filter((_, idx) => idx !== fileIdx));
                        }
                        setGalleryPreviews((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-xl cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
                  <Plus className="w-6 h-6 text-stone-400 mb-1" />
                  <span className="text-[10px] font-bold text-stone-500">Add Photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files);
                        setGalleryFiles((prev) => [...prev, ...newFiles]);
                        setGalleryPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
                      }
                    }}
                  />
                </label>
              </div>
              <p className="text-[11px] text-stone-400">Hover over any gallery image to remove it.</p>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & PUBLISH */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-600" />
                Step 4: Review & Publish
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Check product summary and toggle catalog visibility</p>
            </div>

            {/* Live Product Preview Summary */}
            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start">
              {imagePreview ? (
                <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-stone-300 shadow-sm">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full sm:w-32 h-32 rounded-xl bg-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-full text-[10px] font-black uppercase">
                    {formData.category}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">/{formData.slug}</span>
                </div>

                <h3 className="text-xl font-black text-stone-900">{formData.name || "Untitled Product"}</h3>
                <p className="text-xs text-stone-600 line-clamp-2">{formData.description || "No description."}</p>

                <div className="pt-2 border-t border-stone-200 flex flex-wrap gap-2 items-center">
                  {formData.priceType === "variant" ? (
                    formData.variants.map((v: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-800 shadow-sm"
                      >
                        {v.name}: <strong className="text-orange-600">Rs. {v.price || 0}</strong>
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-800 shadow-sm">
                      Base: <strong className="text-orange-600">Rs. {formData.pricePerKg}/Kg</strong>
                    </span>
                  )}
                  {formData.trackStock ? (
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      Stock: <strong className="text-emerald-950 font-black">{formData.stockQuantity} units</strong> (Alert: {formData.lowStockAlert || 5})
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-stone-100 border border-stone-200 text-stone-600 rounded-lg text-xs font-medium">
                      Stock: Unlimited (Kitchen Prepared)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Availability & Feature Toggles */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  className="w-5 h-5 text-orange-600 rounded border-stone-300 focus:ring-orange-500"
                />
                <div>
                  <span className="font-bold text-sm text-stone-800 block">Product In Stock & Available</span>
                  <span className="text-xs text-stone-500">Visible to customers in the digital menu and POS</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-stone-100">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="w-5 h-5 text-orange-600 rounded border-stone-300 focus:ring-orange-500"
                />
                <div>
                  <span className="font-bold text-sm text-stone-800 block">Feature on Home Page</span>
                  <span className="text-xs text-stone-500">Highlights this item in top featured specialties</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* STEPPER BOTTOM NAVIGATION BAR */}
        <div className="mt-8 pt-5 border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <span className="text-xs font-black text-stone-400">
            Step {currentStep} of 4
          </span>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={loading}
              className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-orange-600/30 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Saving...
                </>
              ) : isEdit ? (
                "Update Product"
              ) : (
                "Publish Product"
              )}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}

