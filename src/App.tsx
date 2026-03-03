import { Routes, Route } from 'react-router-dom'
import { CursorBackground } from './components/CursorBackground'
import Index from './pages/Index'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

import UPILogin from './pages/upiguard/Login'
import UPIRegister from './pages/upiguard/Register'
import UPIDashboard from './pages/upiguard/Dashboard'
import UPITransaction from './pages/upiguard/TransactionForm'
import UPIAdmin from './pages/upiguard/AdminPanel'

export default function App() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <CursorBackground />
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                <Route path="/upiguard/login" element={<UPILogin />} />
                <Route path="/upiguard/register" element={<UPIRegister />} />
                <Route path="/upiguard/dashboard" element={<UPIDashboard />} />
                <Route path="/upiguard/transaction" element={<UPITransaction />} />
                <Route path="/upiguard/admin" element={<UPIAdmin />} />
            </Routes>
        </div>
    )
}
