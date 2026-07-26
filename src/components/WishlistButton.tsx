"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  iconSize?: number;
}

export default function WishlistButton({ productId, className = "", iconSize = 20 }: WishlistButtonProps) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    
    // Check wishlist status
    fetch(`/api/wishlist/check?productId=${productId}`)
      .then(res => res.json())
      .then(data => {
        setIsLiked(!!data.isLiked);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId, session]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if wrapped in a Link
    e.stopPropagation();
    
    if (!session?.user) {
      toast.error("Vui lòng đăng nhập để lưu Sản phẩm Yêu thích");
      return;
    }

    // Optimistic UI update
    const previousState = isLiked;
    setIsLiked(!isLiked);

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      if (data.isLiked) {
        toast.success("Đã thêm vào Yêu thích");
      } else {
        toast.success("Đã bỏ Yêu thích");
      }
      setIsLiked(data.isLiked);
    } catch (err: any) {
      console.error(err);
      setIsLiked(previousState);
      toast.error("Đã có lỗi xảy ra");
    }
  };

  if (loading) return null;

  return (
    <button
      onClick={handleToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-full p-2 bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 transition-all active:scale-95 ${className}`}
      aria-label="Wishlist"
      title="Thêm vào yêu thích"
    >
      <Heart
        size={iconSize}
        className={`transition-colors ${
          isLiked || isHovered ? "fill-red-500 text-red-500" : "text-gray-400"
        }`}
      />
    </button>
  );
}
