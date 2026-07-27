import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
    const navigate = useNavigate()
    const { signIn, user } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (user) {
        navigate('/')
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await signIn(email, password)

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            navigate('/')
        }
    }

    return (
        <div className="py-16 md:py-20">
            <div className="container-custom max-w-md">
                <div className="card p-8 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-heading font-bold text-ivory mb-2">Welcome Back</h1>
                        <p className="text-dark-400 text-sm">Sign in to your Ellite Bling account</p>
                    </div>

                    {error && (
                        <div className="bg-rosegold/10 border border-rosegold/30 text-rosegold px-4 py-3 mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="your@email.com" />
                        </div>
                        <div>
                            <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" placeholder="••••••••" />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-dark-400 text-sm">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-gold-400 hover:text-gold-300 font-semibold transition-colors">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
