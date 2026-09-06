import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ProductForm from "@/components/admin/ProductForm";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function AdminEditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    api.products
      .getAll()
      .then((res) => {
        if (!isMounted) return;
        const found = res.products?.find((p: any) => p.id === id || p._id === id);
        if (found) {
          setProduct(found);
        } else {
          setError("Product not found");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch product:", err);
        if (isMounted) {
          setError("Failed to fetch product");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-stone-800 mb-2">Product Not Found</h2>
        <Link to="/admin/products" className="text-primary font-bold hover:underline">
          Back to Products
        </Link>
      </div>
    );
  }

  return <ProductForm product={product} />;
}
