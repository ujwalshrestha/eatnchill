import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import Categories from './admin/Categories'
import FoodItems from './admin/FoodItems'
import Tables from './admin/Tables'
import Transactions from './admin/Transactions'
import CustomerLayout from './customer/CustomerLayout'

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="categories" element={<Categories />} />
        <Route path="food-items" element={<FoodItems />} />
        <Route path="tables" element={<Tables />} />
        <Route path="transactions" element={<Transactions />} />
      </Route>
      <Route path="/table/:tableId" element={<CustomerLayout />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
