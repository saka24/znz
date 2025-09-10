import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Heart, 
  ShoppingCart, 
  Star,
  MapPin,
  DollarSign,
  Package,
  Truck,
  CreditCard,
  Filter,
  Grid,
  List,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Marketplace = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'electronics',
    condition: 'new',
    location: '',
    stock_quantity: '1',
    tags: '',
    images: []
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'sports', label: 'Sports' },
    { value: 'books', label: 'Books' },
    { value: 'cars', label: 'Cars & Vehicles' },
    { value: 'services', label: 'Services' }
  ];

  // Load products
  const loadProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await axios.get(`${API}/products?${params}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    }
  };

  // Load user's products
  const loadMyProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/products?seller=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyProducts(response.data);
    } catch (error) {
      console.error('Failed to load my products:', error);
    }
  };

  // Load cart
  const loadCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  // Load orders
  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  // Create product
  const createProduct = async () => {
    if (!newProduct.name || !newProduct.description || !newProduct.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock_quantity: parseInt(newProduct.stock_quantity),
        tags: newProduct.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await axios.post(`${API}/products`, productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Product created successfully!');
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: 'electronics',
        condition: 'new',
        location: '',
        stock_quantity: '1',
        tags: '',
        images: []
      });
      setShowCreateProduct(false);
      loadProducts();
      loadMyProducts();
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Failed to create product');
    }
  };

  // Add to cart
  const addToCart = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/cart/add`, {
        product_id: productId,
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Added to cart!');
      loadCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  // Like product
  const likeProduct = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/products/${productId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      loadProducts();
    } catch (error) {
      console.error('Failed to like product:', error);
      toast.error('Failed to like product');
    }
  };

  // Format price
  const formatPrice = (price, currency = 'TZS') => {
    return `${currency} ${price.toLocaleString()}`;
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  useEffect(() => {
    loadProducts();
    loadCart();
    loadOrders();
    if (user) loadMyProducts();
  }, [user, selectedCategory, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-600">Buy and sell with your friends</p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => setShowCreateProduct(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Sell Item
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">
            <ShoppingBag className="h-4 w-4 mr-1" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="selling">
            <Package className="h-4 w-4 mr-1" />
            My Items
          </TabsTrigger>
          <TabsTrigger value="cart">
            <ShoppingCart className="h-4 w-4 mr-1" />
            Cart ({cart.length})
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Truck className="h-4 w-4 mr-1" />
            Orders
          </TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex space-x-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-md"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            <div className="flex space-x-1 border rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div onClick={() => setShowProductDetails(product)}>
                  {product.images?.[0] && (
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {product.name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {product.condition}
                        </Badge>
                      </div>
                      
                      <p className="text-2xl font-bold text-orange-600">
                        {formatPrice(product.price, product.currency)}
                      </p>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{product.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{product.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
                
                <div className="p-4 pt-0 flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => likeProduct(product.id)}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${product.likes?.includes(user?.id) ? 'text-red-500 fill-current' : ''}`} />
                    {product.likes?.length || 0}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    onClick={() => addToCart(product.id)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Add to Cart
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My Items Tab */}
        <TabsContent value="selling" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Products</h2>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => setShowCreateProduct(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xl font-bold text-orange-600">
                      {formatPrice(product.price, product.currency)}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{product.views || 0} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{product.likes?.length || 0} likes</span>
                      </div>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cart Tab */}
        <TabsContent value="cart" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Shopping Cart</h2>
            {cart.length > 0 && (
              <Button className="bg-green-600 hover:bg-green-700">
                <CreditCard className="h-4 w-4 mr-2" />
                Checkout ({cart.reduce((total, item) => total + (item.product?.price * item.quantity), 0).toLocaleString()} TZS)
              </Button>
            )}
          </div>

          {cart.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
                <p className="text-gray-500">Browse products and add them to your cart</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {item.product?.images?.[0] ? (
                          <img 
                            src={item.product.images[0]} 
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.product?.name}</h3>
                        <p className="text-sm text-gray-500">by {item.product?.seller_name}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="font-bold text-orange-600">
                            {formatPrice(item.product?.price || 0, item.product?.currency)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">-</Button>
                            <span className="px-2">{item.quantity}</span>
                            <Button size="sm" variant="outline">+</Button>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <h2 className="text-xl font-semibold">Order History</h2>
          
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No orders yet</h3>
                <p className="text-gray-500">Your order history will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.id.slice(-8)}</p>
                        <p className="text-sm text-gray-500">{formatTime(order.created_at)}</p>
                      </div>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {order.products?.map((product, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{product.name} x{product.quantity}</span>
                          <span className="font-medium">{formatPrice(product.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total: {formatPrice(order.total_amount, order.currency)}</span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Track Order
                        </Button>
                        <Button size="sm" variant="outline">
                          Contact Seller
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Product Modal */}
      <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sell New Product</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <Input
                placeholder="iPhone 15 Pro Max"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <Textarea
                placeholder="Describe your product..."
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (TZS) *
                </label>
                <Input
                  type="number"
                  placeholder="500000"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <Input
                  type="number"
                  placeholder="1"
                  value={newProduct.stock_quantity}
                  onChange={(e) => setNewProduct({...newProduct, stock_quantity: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                >
                  {categories.slice(1).map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={newProduct.condition}
                  onChange={(e) => setNewProduct({...newProduct, condition: e.target.value})}
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <Input
                placeholder="Dar es Salaam, Tanzania"
                value={newProduct.location}
                onChange={(e) => setNewProduct({...newProduct, location: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <Input
                placeholder="smartphone, electronics, apple"
                value={newProduct.tags}
                onChange={(e) => setNewProduct({...newProduct, tags: e.target.value})}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateProduct(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={createProduct}
              >
                List Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Details Modal */}
      {showProductDetails && (
        <Dialog open={!!showProductDetails} onOpenChange={() => setShowProductDetails(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{showProductDetails.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {showProductDetails.images?.[0] && (
                <img 
                  src={showProductDetails.images[0]} 
                  alt={showProductDetails.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-orange-600">
                  {formatPrice(showProductDetails.price, showProductDetails.currency)}
                </p>
                <Badge variant="outline">
                  {showProductDetails.condition}
                </Badge>
              </div>
              
              <p className="text-gray-700">{showProductDetails.description}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{showProductDetails.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Package className="h-4 w-4" />
                  <span>{showProductDetails.stock_quantity} available</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>by {showProductDetails.seller_name}</span>
                </div>
              </div>
              
              {showProductDetails.tags && showProductDetails.tags.length > 0 && (
                <div className="flex space-x-2 flex-wrap">
                  {showProductDetails.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => likeProduct(showProductDetails.id)}
                >
                  <Heart className={`h-4 w-4 mr-2 ${showProductDetails.likes?.includes(user?.id) ? 'text-red-500 fill-current' : ''}`} />
                  Like ({showProductDetails.likes?.length || 0})
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={() => {
                    addToCart(showProductDetails.id);
                    setShowProductDetails(null);
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Marketplace;