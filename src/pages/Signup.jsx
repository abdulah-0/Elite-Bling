import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Signup = () => {
    const navigate = useNavigate()
    const { signUp, user } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    if (user) {
        navigate('/')
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess(false)

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            setLoading(false)
            return
        }

        const { error } = await signUp(email, password)

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            setSuccess(true)
            setLoading(false)
            setTimeout(() => navigate('/login'), 2000)
        }
    }

    return (
        <div className="py-16 md:py-20">
            <div className="container-custom max-w-md">
                <div className="card p-8 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-heading font-bold text-ivory mb-2">Create Account</h1>
                        <p className="text-dark-400 text-sm">Join Elite Bling and start shopping</p>
                    </div>

                    {error && (
                        <div className="bg-rosegold/10 border border-rosegold/30 text-rosegold px-4 py-3 mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 mb-6 text-sm">
                            Account created successfully! Redirecting to login...
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
                            <p className="text-xs text-dark-500 mt-1">At least 6 characters</p>
                        </div>
                        <div>
                            <label className="block text-sm tracking-wider uppercase text-dark-300 font-medium mb-2">Confirm Password</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="input-field" placeholder="••••••••" />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-dark-400 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-gold-400 hover:text-gold-300 font-semibold transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Signup
