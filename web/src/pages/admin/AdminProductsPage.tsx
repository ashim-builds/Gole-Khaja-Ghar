import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Image as ImageIcon, Loader2 } from "lucide-react";
import StockToggle from "@/components/admin/StockToggle";
import { api } from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.products
      .getAll()
      .then((res) => {
        if (isMounted) {
          setProducts(res.products || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch products for admin:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-stone-900">Products</h1>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 bg-primary text-black font-black px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-4 md:p-0">
          <table className="block md:table w-full text-left">
            <thead className="hidden md:table-header-group bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="p-4 font-bold text-stone-500 text-sm">Image</th>
                <th className="p-4 font-bold text-stone-500 text-sm">Product Name</th>
                <th className="p-4 font-bold text-stone-500 text-sm">Price</th>
                <th className="p-4 font-bold text-stone-500 text-sm">Stock</th>
                <th className="p-4 font-bold text-stone-500 text-sm">Featured</th>
                <th className="p-4 font-bold text-stone-500 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group divide-y divide-stone-100 md:divide-y-0">
              {products.map((product: any) => (
                <tr
                  key={product.id || product._id}
                  className="block md:table-row bg-white md:bg-transparent border border-stone-150 md:border-0 rounded-xl p-4 mb-4 md:mb-0 space-y-2.5 md:space-y-0 relative shadow-sm md:shadow-none hover:bg-stone-50 transition-colors"
                >
                  <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0">
                    <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                      Image
                    </span>
                    <div className="w-12 h-12 rounded-lg bg-stone-100 relative overflow-hidden border border-stone-200 flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-stone-400" />
                      )}
                    </div>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0">
                    <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                      Product Name
                    </span>
                    <div className="text-right md:text-left">
                      <p className="font-bold text-stone-900">{product.name}</p>
                      <p className="text-xs text-stone-500 font-medium">{product.category}</p>
                    </div>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0 font-black text-stone-900">
                    <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                      Price
                    </span>
                    <span>
                      {product.priceType === "weight"
                        ? `Rs. ${product.pricePerKg}/kg`
                        : product.variants?.[0]?.price
                        ? `From Rs. ${product.variants[0].price}`
                        : "—"}
                    </span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0">
                    <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                      Stock
                    </span>
                    <div>
                      <StockToggle
                        productId={product.id || product._id}
                        initialAvailable={product.isAvailable ?? true}
                      />
                    </div>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-0 md:p-4 border-b border-stone-100 md:border-0 pb-2 md:pb-0">
                    <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                      Featured
                    </span>
                    <span>
                      {product.isFeatured ? (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">
                          Featured
                        </span>
                      ) : (
                        <span className="text-stone-300 text-xs font-medium">—</span>
                      )}
                    </span>
                  </td>
                  <td className="flex md:table-cell justify-between items-center p-0 md:p-4 last:border-0 pt-1 md:pt-0">
                    <span className="md:hidden font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                      Actions
                    </span>
                    <Link
                      to={`/admin/products/${product.id || product._id}/edit`}
                      className="inline-flex items-center justify-center p-2 bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-black rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr className="block md:table-row bg-white md:bg-transparent">
                  <td colSpan={6} className="block md:table-cell p-8 text-center text-stone-400 font-medium">
                    No products found. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
