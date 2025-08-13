// src/components/Inventory.js
import React, { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "", price: "", quantity: "", category: "",
    inStock: false, expiryDate: "", minStockLevel: ""
  });
  const [editingId, setEditingId] = useState(null);

  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: "", adjustment: "", reason: ""
  });

  const [page, setPage] = useState(1);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = () => {
    fetch("http://localhost:5000/api/products")
      .then(res => res.json())
      .then(data => {
        setProducts(data || []);
        setPage(1); // reset to first page on refresh
      })
      .catch(console.error);
  };

  // ---------- Form handlers ----------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalForm = {
      ...form,
      expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
      minStockLevel: parseFloat(form.minStockLevel) || 0,
      price: parseFloat(form.price) || 0,
      quantity: parseFloat(form.quantity) || 0,
    };

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `http://localhost:5000/api/products/${editingId}`
      : "http://localhost:5000/api/products";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalForm),
    })
      .then(res => res.json())
      .then(() => {
        fetchProducts();
        setForm({
          name: "", price: "", quantity: "", category: "",
          inStock: false, expiryDate: "", minStockLevel: ""
        });
        setEditingId(null);
      })
      .catch(console.error);
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name || "",
      price: p.price ?? "",
      quantity: p.quantity ?? "",
      category: p.category || "",
      inStock: !!p.inStock,
      expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().split("T")[0] : "",
      minStockLevel: p.minStockLevel ?? ""
    });
    setEditingId(p._id);
    // scroll to top so the form is visible
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this product?")) return;
    fetch(`http://localhost:5000/api/products/${id}`, { method: "DELETE" })
      .then(() => fetchProducts())
      .catch(console.error);
  };

  // ---------- Adjust stock ----------
  const handleAdjust = () => {
    const product = products.find(p => p._id === adjustmentForm.productId);
    const delta = parseInt(adjustmentForm.adjustment, 10);

    if (!product || isNaN(delta)) return;
    const newQty = (parseFloat(product.quantity) || 0) + delta;
    if (newQty < 0) {
      alert("Cannot reduce stock below zero.");
      return;
    }

    fetch("http://localhost:5000/api/products/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adjustmentForm),
    })
      .then(res => res.json())
      .then(() => {
        fetchProducts();
        setAdjustmentForm({ productId: "", adjustment: "", reason: "" });
      })
      .catch(console.error);
  };

  // ---------- Pagination ----------
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [products, page]);

  const gotoPage = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  // ---------- Helpers for badges ----------
  const renderStockBadges = (p) => {
    const qty = parseFloat(p.quantity) || 0;
    const min = parseFloat(p.minStockLevel) || 0;
    const expired = p.expiryDate && new Date(p.expiryDate) < new Date();

    let status;
    if (qty <= 0) status = <span className="badge badge-danger">❌ Out of Stock</span>;
    else if (expired) status = <span className="badge badge-warning">✅ In Stock • ⛔ Expired</span>;
    else status = <span className="badge badge-success">✅ In Stock</span>;

    return (
      <>
        {status}
        {qty > 0 && qty <= min && (
          <span className="badge badge-low">⚠️ Low Stock</span>
        )}
      </>
    );
  };

  return (
    <div className="inventory-page">
      <h1>🍬 Sweet Shop — Inventory</h1>

      {/* Form (no images) */}
      <form className="inventory-form" onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Price" type="number" step="0.01" required />
        <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="Quantity" type="number" required />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" />
        <label className="checkbox">
          <input type="checkbox" name="inStock" checked={form.inStock} onChange={handleChange} />
          In Stock
        </label>
        <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} />
        <input type="number" name="minStockLevel" value={form.minStockLevel} onChange={handleChange} placeholder="Min Stock Level" />
        <button type="submit">{editingId ? "Update" : "Add"} Product</button>
      </form>

      {/* Pagination controls (top) */}
      <div className="pager">
        <button onClick={() => gotoPage(page - 1)} disabled={page <= 1}>← Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button onClick={() => gotoPage(page + 1)} disabled={page >= totalPages}>Next →</button>
      </div>

      {/* List (10 per page, no images) */}
      <table className="product-table">
        <thead>
          <tr>
            <th style={{width:'24%'}}>Name</th>
            <th style={{width:'12%'}}>Price</th>
            <th style={{width:'12%'}}>Qty</th>
            <th style={{width:'16%'}}>Category</th>
            <th style={{width:'20%'}}>Expiry</th>
            <th style={{width:'16%'}}>Status</th>
            <th style={{width:'?'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.length === 0 ? (
            <tr><td colSpan="7" style={{ textAlign: "center" }}>No products</td></tr>
          ) : pageItems.map(p => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>₹{p.price}</td>
              <td>{p.quantity}</td>
              <td>{p.category || "-"}</td>
              <td>{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString("en-GB") : "-"}</td>
              <td className="status-col">{renderStockBadges(p)}</td>
              <td className="actions">
                <button onClick={() => handleEdit(p)}>Edit</button>
                <button className="danger" onClick={() => handleDelete(p._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination controls (bottom) */}
      <div className="pager">
        <button onClick={() => gotoPage(page - 1)} disabled={page <= 1}>← Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button onClick={() => gotoPage(page + 1)} disabled={page >= totalPages}>Next →</button>
      </div>

      {/* Adjust stock */}
      <div className="adjust-box">
        <h3>🔁 Adjust Stock</h3>
        <select
          value={adjustmentForm.productId}
          onChange={e => setAdjustmentForm({ ...adjustmentForm, productId: e.target.value })}
        >
          <option value="">Select Product</option>
          {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <input type="number" placeholder="Adjustment (+/-)"
               value={adjustmentForm.adjustment}
               onChange={e => setAdjustmentForm({ ...adjustmentForm, adjustment: e.target.value })} />
        <input type="text" placeholder="Reason"
               value={adjustmentForm.reason}
               onChange={e => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })} />
        <button onClick={handleAdjust}>Submit</button>
      </div>
    </div>
  );
};

export default Inventory;

