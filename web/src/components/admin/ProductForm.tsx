import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Loader2, ArrowLeft, Upload, Plus, Trash2, AlertCircle, X } from "lucide-react";

interface ProductFormProps {
  product?: any;
}

export default function ProductForm({ product }: ProductFormProps) {
  const isEdit = !!product;
  const navigate = useNavigate();
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
    priceType: product?.priceType || "weight",
    pricePerKg: product?.pricePerKg || "",
    variants: product?.variants || [],
    weightOptions: product?.weightOptions || [
      { value: 250, unit: "g" },
      { value: 500, unit: "g" },
      { value: 750, unit: "g" },
      { value: 1, unit: "kg" }
    ],
    allowCustomWeight: product ? product.allowCustomWeight : true,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (!isEdit && name === 'name') {
      setFormData(prev => ({ 
        ...prev, 
        name: value, 
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') 
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

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { name: "", price: 0 }]
    }));
  };

  const handleVariantChange = (index: number, field: string, value: string | number) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleRemoveVariant = (index: number) => {
    const newVariants = formData.variants.filter((_: any, i: number) => i !== index);
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleAddWeightOption = () => {
    setFormData(prev => ({
      ...prev,
      weightOptions: [...prev.weightOptions, { value: 0, unit: "g" }]
    }));
  };

  const handleWeightOptionChange = (index: number, field: string, value: string | number) => {
    const newOptions = [...formData.weightOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData(prev => ({ ...prev, weightOptions: newOptions }));
  };

  const handleRemoveWeightOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      weightOptions: prev.weightOptions.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (formData.priceType === 'variant' && formData.variants.length === 0) {
        throw new Error("Please add at least one variant for pricing.");
      }

      if (!isEdit && !imageFile && !formData.existingImage) {
        throw new Error("Please select a cover photo.");
      }

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
        if (key === 'variants' || key === 'existingImages' || key === 'weightOptions') {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, String(value));
        }
      });

      if (imageFile) {
        data.append("imageFile", imageFile);
      }
      galleryFiles.forEach(file => data.append("galleryFiles", file));

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
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link to="/admin/products" className="p-2 bg-white rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-stone-600" />
        </Link>
        <h1 className="text-3xl font-black text-stone-900">
          {isEdit ? "Edit Product" : "Add New Product"}
        </h1>
      </div>

      {/* Success Toast */}
      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-lg" style={{ animation: 'slide-in-from-top-4 0.3s ease forwards' }}>
          <div className="bg-green-600 text-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="flex-1 text-sm font-bold">{success}</p>
              <span className="text-xs text-green-200 font-medium">Redirecting...</span>
            </div>
            <div className="h-1 bg-green-500">
              <div className="h-full bg-white/60" style={{ animation: 'shrink 2s linear forwards' }} />
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
              <div className="h-full bg-white/60" style={{ animation: 'shrink 6s linear forwards' }} />
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-stone-100 space-y-6">
        
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Product Name</label>
              <input required name="name" value={formData.name} onChange={handleChange} className="w-full text-black px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" placeholder="e.g. Buff Momo" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">URL Slug</label>
              <input required name="slug" value={formData.slug} onChange={handleChange} className="w-full text-black px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" placeholder="e.g. buff-momo" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">Description</label>
            <textarea required name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full text-black px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Product description..." />
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full text-black px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none">
              <option value="Khaja Sets">Khaja Sets</option>
              <option value="Momo">Momo</option>
              <option value="Chowmein">Chowmein</option>
              <option value="Sekuwa & Snacks">Sekuwa & Snacks</option>
              <option value="Beverages">Beverages</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-2">Pricing Structure</h2>
          
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="priceType" value="weight" checked={formData.priceType === 'weight'} onChange={handleChange} className="text-primary focus:ring-primary" />
              <span className="font-bold text-stone-700">By Weight / Base Price</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="priceType" value="variant" checked={formData.priceType === 'variant'} onChange={handleChange} className="text-primary focus:ring-primary" />
              <span className="font-bold text-stone-700">By Portion / Variant</span>
            </label>
          </div>

          {formData.priceType === 'weight' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Price per Kg / Base (Rs.)</label>
                <input required type="number" min="0" name="pricePerKg" value={formData.pricePerKg} onChange={handleChange} className="w-full text-black px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" placeholder="e.g. 500" />
              </div>
              
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-stone-700">Weight Options</label>
                  <button type="button" onClick={handleAddWeightOption} className="text-xs font-bold bg-stone-200 hover:bg-stone-300 text-stone-800 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer">
                    <Plus className="w-3 h-3" /> Add Option
                  </button>
                </div>
                {formData.weightOptions.map((opt: any, index: number) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <input required type="number" min="1" placeholder="Value (e.g. 250)" value={opt.value || ""} onChange={(e) => handleWeightOptionChange(index, "value", Number(e.target.value))} className="w-full text-black px-3 py-2 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                    <div className="w-32">
                      <select value={opt.unit} onChange={(e) => handleWeightOptionChange(index, "unit", e.target.value)} className="w-full text-black px-3 py-2 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-primary text-sm">
                        <option value="g">g (Grams)</option>
                        <option value="kg">kg (Kilograms)</option>
                      </select>
                    </div>
                    <button type="button" onClick={() => handleRemoveWeightOption(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                
                <div className="pt-2 border-t border-stone-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="allowCustomWeight" checked={formData.allowCustomWeight} onChange={handleChange} className="w-4 h-4 text-primary rounded border-stone-300 focus:ring-primary" />
                    <span className="text-sm font-bold text-stone-700">Allow customers to enter custom weight</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-stone-700">Product Variants / Portions</label>
                <button type="button" onClick={handleAddVariant} className="text-xs font-bold bg-stone-200 hover:bg-stone-300 text-stone-800 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer">
                  <Plus className="w-3 h-3" /> Add Variant
                </button>
              </div>
              
              {formData.variants.map((variant: any, index: number) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input required placeholder="Variant Name (e.g. Half / Full)" value={variant.name} onChange={(e) => handleVariantChange(index, "name", e.target.value)} className="w-full text-black px-3 py-2 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-primary text-sm" />
                  </div>
                  <div className="w-32">
                    <input required type="number" min="0" placeholder="Price (Rs)" value={variant.price || ""} onChange={(e) => handleVariantChange(index, "price", Number(e.target.value))} className="w-full text-black px-3 py-2 bg-white border border-stone-300 rounded-md focus:ring-2 focus:ring-primary text-sm" />
                  </div>
                  <button type="button" onClick={() => handleRemoveVariant(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {formData.variants.length === 0 && (
                <p className="text-sm text-stone-500 text-center py-2 italic">No variants added. Click "Add Variant".</p>
              )}
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div className="space-y-6">
          <h2 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-2">Product Images</h2>
          
          {/* Primary Cover Photo */}
          <div>
            <p className="text-sm font-bold text-stone-700 mb-2">Cover Photo <span className="text-stone-400 font-normal">(shown as main image)</span></p>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-stone-300 border-dashed rounded-xl cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-stone-400" />
                    <p className="text-sm text-stone-500 font-bold"><span className="text-primary">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-stone-400 mt-1">PNG, JPG, WEBP</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
              {imagePreview && (
                <div className="w-32 h-32 relative rounded-xl border-2 border-primary overflow-hidden bg-stone-100 shadow-sm shrink-0">
                  <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 bg-primary text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Cover</span>
                </div>
              )}
            </div>
          </div>

          {/* Gallery Images */}
          <div>
            <p className="text-sm font-bold text-stone-700 mb-2">Gallery Images <span className="text-stone-400 font-normal">(additional product photos)</span></p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
              {galleryPreviews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl border border-stone-200 overflow-hidden bg-stone-100 shadow-sm group">
                  <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const isExisting = i < (formData.existingImages?.length || 0);
                      if (isExisting) {
                        setFormData((prev: any) => ({ ...prev, existingImages: prev.existingImages.filter((_: string, idx: number) => idx !== i) }));
                      } else {
                        const fileIdx = i - (formData.existingImages?.length || 0);
                        setGalleryFiles(prev => prev.filter((_, idx) => idx !== fileIdx));
                      }
                      setGalleryPreviews(prev => prev.filter((_, idx) => idx !== i));
                    }}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}
              <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-xl cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
                <Plus className="w-6 h-6 text-stone-400 mb-1" />
                <span className="text-[10px] font-bold text-stone-400">Add Photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      const newFiles = Array.from(e.target.files);
                      setGalleryFiles(prev => [...prev, ...newFiles]);
                      setGalleryPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
                    }
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-stone-400">Hover any image and click to remove it. You can add multiple photos at once.</p>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-2">Status</h2>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleChange} className="w-5 h-5 text-primary rounded border-stone-300 focus:ring-primary" />
              <span className="font-bold text-stone-700">Product is available for purchase</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="w-5 h-5 text-primary rounded border-stone-300 focus:ring-primary" />
              <span className="font-bold text-stone-700">Feature product on home page</span>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-100">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-black font-black rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              isEdit ? "Update Product" : "Create Product"
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
