import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';
import { getProducts, getProductQuantities } from '@/api/EcommerceApi';
import { useLocalization } from '@/contexts/LocalizationContext';

const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzc0MTUxIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";

const ProductCard = ({ product, index }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, region } = useLocalization();

  const displayVariant = useMemo(() => product.variants[0], [product]);
  const hasSale = useMemo(() => displayVariant && displayVariant.sale_price_in_cents !== null, [displayVariant]);
  const displayPrice = useMemo(() => hasSale ? displayVariant.sale_price_formatted : displayVariant.price_formatted, [displayVariant, hasSale]);
  const originalPrice = useMemo(() => hasSale ? displayVariant.price_formatted : null, [displayVariant, hasSale]);

  // Transform product name for USA region
  const displayName = useMemo(() => {
    if (region === 'USA' && (product.title.toLowerCase().includes('água') || product.title.toLowerCase().includes('galão'))) {
        if (product.title.includes('20')) return 'Water Refill 5 Gallon';
        if (product.title.includes('10')) return 'Water Refill 3 Gallon';
        return product.title.replace('Galão', 'Gallon').replace('Água', 'Water');
    }
    return product.title;
  }, [product.title, region]);

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.variants.length > 1) {
      navigate(`/product/${product.id}`);
      return;
    }

    const defaultVariant = product.variants[0];

    try {
      await addToCart(product, defaultVariant, 1, defaultVariant.inventory_quantity);
      toast({
        title: t('added_to_cart'),
        description: `${displayName} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: error.message,
      });
    }
  }, [product, addToCart, toast, navigate, displayName, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Link to={`/product/${product.id}`}>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm glass-card border-0 text-white overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
          <div className="relative">
            <img
              src={product.image ||placeholderImage}
              alt={displayName}
              className="w-full h-64 object-cover transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300" />
            {product.ribbon_text && (
              <div className="absolute top-3 left-3 bg-pink-500/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                {product.ribbon_text}
              </div>
            )}
            <div className="absolute top-3 right-3 bg-purple-500/80 text-white text-xs font-bold px-3 py-1 rounded-full flex items-baseline gap-1.5">
              {hasSale && (
                <span className="line-through opacity-70">{originalPrice}</span>
              )}
              <span>{displayPrice}</span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-bold truncate">{displayName}</h3>
            <p className="text-sm text-gray-300 h-10 overflow-hidden">{product.subtitle || 'Check out this amazing product!'}</p>
            <Button onClick={handleAddToCart} className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold">
              <ShoppingCart className="mr-2 h-4 w-4" /> {t('add_product')}
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useLocalization();

  useEffect(() => {
    const fetchProductsWithQuantities = async () => {
      try {
        setLoading(true);
        setError(null);

        const productsResponse = await getProducts();

        if (productsResponse.products.length === 0) {
          setProducts([]);
          return;
        }

        const productIds = productsResponse.products.map(product => product.id);

        const quantitiesResponse = await getProductQuantities({
          fields: 'inventory_quantity',
          product_ids: productIds
        });

        const variantQuantityMap = new Map();
        quantitiesResponse.variants.forEach(variant => {
          variantQuantityMap.set(variant.id, variant.inventory_quantity);
        });

        const productsWithQuantities = productsResponse.products.map(product => ({
          ...product,
          variants: product.variants.map(variant => ({
            ...variant,
            inventory_quantity: variantQuantityMap.get(variant.id) ?? variant.inventory_quantity
          }))
        }));

        setProducts(productsWithQuantities);
      } catch (err) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProductsWithQuantities();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-16 w-16 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 p-8">
        <p>{t('error')}: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center text-gray-400 p-8">
        <p>{t('no_products')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
};

export default ProductsList;