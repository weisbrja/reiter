import { createContext, JSX } from 'preact'
import { useState, useEffect, useContext } from 'preact/hooks'

type PopupErrorContextType = {
    setError: (error: string | null) => void
    onCancel: () => void
}

export const PopupErrorContext = createContext<PopupErrorContextType | undefined>(undefined)

export function usePopupErrorContext() {
    const context = useContext(PopupErrorContext)
    if (context === undefined) {
        throw new Error('usePopupErrorContext must be used with a PopupErrorContext.Provider')
    }
    return context
}

interface PopupProps {
    title: string
    prevError: string | null
    onCancel: () => void
    children: JSX.Element | JSX.Element[]
}

export function Popup({ title, prevError, onCancel, children }: PopupProps) {
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setError(prevError)
    }, [prevError])

    return (
        <div class="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            {children && (
                <div class="bg-base-300 rounded-lg p-6 w-1/3 min-w-96">
                    <h2 class="text-lg font-bold mb-4">{title}</h2>
                    {error && <p class="text-error mb-2">{error}</p>}
                    <PopupErrorContext.Provider value={{ setError, onCancel }}>{children}</PopupErrorContext.Provider>
                </div>
            )}
        </div>
    )
}
