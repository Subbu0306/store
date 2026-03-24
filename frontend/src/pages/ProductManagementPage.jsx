import React, { useEffect, useState } from "react";
import axios from "axios";

const ProductManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    quantity: "",
  });
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${import.meta.env.VITE_API_URL}/products`, newProduct, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
      setNewProduct({ name: "", price: "", quantity: "" });
    } catch (err) {
      console.error("Error adding product:", err);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_API_URL}products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/products/${editingProduct._id}`,
        {
          name: editingProduct.name,
          price: editingProduct.price,
          quantity: editingProduct.quantity,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchProducts();
      setEditingProduct(null);
    } catch (err) {
      console.error("Error updating product:", err);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Product Management</h1>

      {/* Add Product Form */}
      <form onSubmit={handleAddProduct} className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={newProduct.name}
            onChange={handleInputChange}
            className="p-2 border rounded"
            required
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={newProduct.price}
            onChange={handleInputChange}
            className="p-2 border rounded"
            required
          />
          <input
            type="number"
            name="quantity"
            placeholder="Stock Quantity"
            value={newProduct.quantity}
            onChange={handleInputChange}
            className="p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-green-500 text-white p-2 rounded hover:bg-green-600 transition duration-300"
        >
          Add Product
        </button>
      </form>

      {/* Edit Product Form */}
      {editingProduct && (
        <form onSubmit={handleUpdateProduct} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={editingProduct.name}
              onChange={(e) =>
                setEditingProduct({ ...editingProduct, name: e.target.value })
              }
              className="p-2 border rounded"
              required
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={editingProduct.price}
              onChange={(e) =>
                setEditingProduct({ ...editingProduct, price: e.target.value })
              }
              className="p-2 border rounded"
              required
            />
            <input
              type="number"
              name="quantity"
              placeholder="Stock Quantity"
              value={editingProduct.quantity}
              onChange={(e) =>
                setEditingProduct({ ...editingProduct, quantity: e.target.value })
              }
              className="p-2 border rounded"
              required
            />
          </div>
          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300"
            >
              Save Changes
            </button>
            <button
              onClick={() => setEditingProduct(null)}
              className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Product Table */}
      <h2 className="text-xl font-semibold mb-4">All Products</h2>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Stock</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td className="border p-2">{product.name}</td>
              <td className="border p-2">${product.price}</td>
              <td className="border p-2">{product.quantity}</td>
              <td className="border p-2">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 transition duration-300 mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product._id)}
                  className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition duration-300"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductManagementPage;
