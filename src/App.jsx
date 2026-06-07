import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import About from './pages/About'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Admin from './pages/Admin'
import Wholesale from './pages/Wholesale'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-success" element={<OrderSuccess />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/wholesale" element={<Wholesale />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute adminOnly>
                                <Admin />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
            <Footer />
        </div>
    )
}

export default App
