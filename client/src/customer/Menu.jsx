import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

export default function Menu({ table, session, ensureSession, onOrderPlaced }) {
  const [categories, setCategories] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Category Scroll Refs
  const tabsRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  // Item Detail Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQty, setItemQty] = useState(1);
  const [selectedOpts, setSelectedOpts] = useState([]);
  const [itemNote, setItemNote] = useState('');
  
  const [customerName, setCustomerName] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const toast = useToast();

  const checkScroll = () => {
    if (!tabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    async function loadMenu() {
      try {
        const [catsRes, itemsRes] = await Promise.all([
          api.getCategories(),
          api.getFoodItems('available_only=true')
        ]);
        const activeCats = catsRes.data.filter(c => c.is_active);
        setCategories(activeCats);
        setFoodItems(itemsRes.data);
        if (activeCats.length > 0) setActiveCategory(activeCats[0].id);
      } catch (err) {
        toast('Failed to load menu: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, [toast]);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const scrollTabs = (offset) => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const openItemDetail = (item) => {
    setSelectedItem(item);
    setItemQty(1);
    setSelectedOpts([]);
    setItemNote('');
  };

  const handleAddToCart = () => {
    const cartItem = {
      food_item_id: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.price,
      quantity: itemQty,
      options: selectedOpts, // array of IDs
      optionDetails: selectedItem.options.filter(o => selectedOpts.includes(o.id)),
      special_instructions: itemNote,
      tempId: Date.now() // to distinguish same items with different options
    };
    
    setCart(prev => [...prev, cartItem]);
    setSelectedItem(null);
    toast(`Added ${selectedItem.name} to cart`);
  };

  const removeFromCart = (tempId) => {
    setCart(prev => prev.filter(i => i.tempId !== tempId));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const itemPrice = item.price + item.optionDetails.reduce((s, o) => s + o.price, 0);
    return sum + (itemPrice * item.quantity);
  }, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacingOrder(true);
    try {
      // Always ensure a fresh session before placing order
      // This handles cases where the session might have expired while browsing
      let activeSession = session;
      if (!activeSession?.id) {
        activeSession = await ensureSession();
      }
      
      if (!activeSession?.id) {
        throw new Error('Unable to create a table session. Please refresh and try again.');
      }

      const res = await api.createOrder({
        table_id: table.id,
        session_id: activeSession.id,
        customer_name: customerName,
        items: cart.map(i => ({
          food_item_id: i.food_item_id,
          quantity: i.quantity,
          options: i.options,
          special_instructions: i.special_instructions
        }))
      });
      toast('Order placed successfully! 🍕');
      onOrderPlaced(res.data.id);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const filteredItems = activeCategory 
    ? foodItems.filter(item => item.category_id === activeCategory)
    : foodItems;

  return (
    <>
      <div className="category-nav-wrapper">
        {showLeftArrow && (
          <button className="category-nav-btn left" onClick={() => scrollTabs(-150)}>‹</button>
        )}
        <div className="category-pills" ref={tabsRef} onScroll={checkScroll}>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
        {showRightArrow && (
          <button className="category-nav-btn right" onClick={() => scrollTabs(150)}>›</button>
        )}
      </div>

      <div className="menu-list">
        <h2 className="menu-section-title">
          {categories.find(c => c.id === activeCategory)?.name || 'Menu'}
        </h2>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--customer-text-secondary)' }}>
            No items available in this category yet.
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="menu-item-card" onClick={() => openItemDetail(item)} style={{ cursor: 'pointer' }}>
              <div className="menu-item-info">
                <div className="menu-item-name">{item.name}</div>
                <div className="menu-item-desc">{item.description}</div>
                <div className="menu-item-price">${item.price.toFixed(2)}</div>
              </div>
              <button className="add-to-cart-btn" onClick={(e) => { e.stopPropagation(); openItemDetail(item); }}>+</button>
            </div>
          ))
        )}
      </div>

      {selectedItem && (
        <div className="item-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="item-modal-content" onClick={e => e.stopPropagation()}>
            <div className="item-modal-header">
              <button className="item-modal-close" onClick={() => setSelectedItem(null)}>✕</button>
              <div className="item-modal-image">🍴</div>
            </div>
            
            <div className="item-modal-body">
              <h2 className="item-modal-title">{selectedItem.name}</h2>
              <p className="item-modal-desc">{selectedItem.description}</p>
              
              <div className="item-modal-price-row">
                <span className="item-modal-price">Price: ${selectedItem.price.toFixed(2)}</span>
                <div className="qty-selector">
                  <button onClick={() => setItemQty(Math.max(1, itemQty - 1))}>−</button>
                  <span>{itemQty}</span>
                  <button onClick={() => setItemQty(itemQty + 1)}>+</button>
                </div>
              </div>

              {selectedItem.options?.length > 0 && (
                <div className="options-section">
                  <div className="options-header">Select Multiple</div>
                  <div className="options-list">
                    {selectedItem.options.map(opt => (
                      <label key={opt.id} className="option-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <input 
                            type="checkbox" 
                            checked={selectedOpts.includes(opt.id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedOpts([...selectedOpts, opt.id]);
                              else setSelectedOpts(selectedOpts.filter(id => id !== opt.id));
                            }}
                          />
                          <span className="option-name">{opt.name}</span>
                        </div>
                        <span className="option-price">{opt.price || 0}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="notes-section">
                <label className="notes-label">Special Instructions (English only, no symbol)</label>
                <textarea 
                  className="notes-textarea" 
                  placeholder="Add a note (extra sauce, no onions etc..)"
                  value={itemNote}
                  onChange={e => setItemNote(e.target.value)}
                />
              </div>
            </div>

            <div className="item-modal-footer">
              <button className="place-order-btn" onClick={handleAddToCart} style={{ borderRadius: 8 }}>
                Add to Cart — ${((selectedItem.price + selectedItem.options.filter(o => selectedOpts.includes(o.id)).reduce((s,o)=>s+o.price,0)) * itemQty).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {cartCount > 0 && !isCartOpen && (
        <button className="floating-cart" onClick={() => setIsCartOpen(true)}>
          <div className="cart-badge">{cartCount}</div>
          View Cart — ${cartTotal.toFixed(2)}
        </button>
      )}

      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-drawer-handle" onClick={() => setIsCartOpen(false)}></div>
        <div className="cart-drawer-header">
          <h3>Your Order</h3>
          <button onClick={() => setIsCartOpen(false)} style={{ fontSize: 24 }}>✕</button>
        </div>
        
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.tempId} className="cart-item" style={{ height: 'auto', padding: '16px 20px', alignItems: 'flex-start' }}>
              <div className="cart-item-info" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="cart-item-name">{item.quantity}x {item.name}</div>
                  <div className="cart-item-price">${((item.price + item.optionDetails.reduce((s,o)=>s+o.price,0)) * item.quantity).toFixed(2)}</div>
                </div>
                {item.optionDetails.length > 0 && (
                  <div className="cart-item-opts">
                    {item.optionDetails.map(o => <span key={o.id}>+ {o.name}</span>)}
                  </div>
                )}
                {item.special_instructions && (
                  <div className="cart-item-note">Note: {item.special_instructions}</div>
                )}
              </div>
              <button 
                className="btn btn-sm btn-danger" 
                style={{ marginLeft: 16, background: 'none', color: '#ff5252', padding: 4 }}
                onClick={() => removeFromCart(item.tempId)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="cart-footer">
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ color: 'var(--customer-text-secondary)', fontFamily: 'var(--font-customer)' }}>Your Name (Optional)</label>
            <input 
              className="customer-input" 
              placeholder="Who is this order for?" 
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>
          <div className="cart-total">
            <span>Total Payable</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <button 
            className="place-order-btn" 
            onClick={handlePlaceOrder}
            disabled={placingOrder || cart.length === 0}
          >
            {placingOrder ? 'Sending Order...' : 'Place Order Now'}
          </button>
        </div>
      </div>
    </>
  );
}
