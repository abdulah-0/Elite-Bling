import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase/client'

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })
        return { data, error }
    }

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { data, error }
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        return { error }
    }

    const isAdmin = () => {
        return user?.email === 'snakeyes358@gmail.com'
    }

    const value = {
        user,
        loading,
        signUp,
        signIn,
        signOut,
        isAdmin
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
