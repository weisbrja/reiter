import { useContext, useEffect, useState } from 'preact/hooks'
import { Channel, invoke } from '@tauri-apps/api/core'
import { listen, emit } from '@tauri-apps/api/event'
import { ProgressBarMsg, ProgressBars } from './ProgressBars'
import { Popup } from './Popup'
import { UsernameForm } from '../forms/UsernameForm'
import { PasswordForm } from '../forms/PasswordForm'
import { createContext, JSX } from 'preact'

type RequestSubject = 'password' | 'username' | 'jsonArgs'

type OpenLoginForm = 'username' | 'password' | null

interface SattelContextType {
    isSattelRunning: boolean
    progressBarMsgs: Channel<ProgressBarMsg>
    startSattel: () => void
    stopSattel: () => void
}

export const SattelContext = createContext<SattelContextType | undefined>(undefined)

export function useSattelContext() {
    const context = useContext(SattelContext)
    if (context === undefined) {
        throw new Error('useSattelContext must be used with a SattelContextProvider')
    }
    return context
}

export function SattelProvider({ children }: { children: JSX.Element | JSX.Element[] }) {
    const [isSattelRunning, setSattelRunning] = useState(false)
    const [progressBarMsgs, setProgressBarMsgs] = useState(new Channel())

    async function startSattel() {
        if (!isSattelRunning) {
            setSattelRunning(true)
            await invoke('ensure_default_config')
            invoke('run_sattel', { progressBarMsgs }).catch((error) => console.error(error))
        } else {
            console.error('already running sattel')
        }
    }

    function stopSattel() {
        emit('cancel')
        setSattelRunning(false)
        setProgressBarMsgs(new Channel())
    }

    useEffect(() => {
        return () => {
            if (isSattelRunning) {
                stopSattel()
            }
        }
    }, [isSattelRunning])

    return (
        <SattelContext.Provider value={{ isSattelRunning, progressBarMsgs, startSattel, stopSattel }}>
            {children}
        </SattelContext.Provider>
    )
}

export default function SattelLoginHandler() {
    const [openLoginForm, setOpenLoginForm] = useState<OpenLoginForm>(null)
    const [loginFailed, setLoginFailed] = useState(false)

    const { stopSattel } = useSattelContext()

    useEffect(() => {
        const loginFailedUnlisten = listen('loginFailed', (_) => {
            setLoginFailed(true)
        })

        const requestUnlisten = listen<RequestSubject>('request', (event) => {
            if (event.payload === 'jsonArgs') {
                emit('response', '{}')
            } else {
                setOpenLoginForm(event.payload)
            }
        })

        return () => {
            loginFailedUnlisten.then((unlisten) => unlisten())
            requestUnlisten.then((unlisten) => unlisten())
        }
    }, [])

    return (
        <>
            {openLoginForm && (
                <Popup
                    title="Login"
                    prevError={loginFailed ? 'Login failed. Please reenter credentials.' : null}
                    onCancel={() => {
                        setOpenLoginForm(null)
                        stopSattel()
                    }}
                >
                    {openLoginForm === 'username' ? (
                        <UsernameForm
                            onSubmit={(username) => {
                                emit('response', username)
                                setOpenLoginForm(null)
                                setLoginFailed(false)
                            }}
                        />
                    ) : (
                        <PasswordForm
                            onSubmit={(password) => {
                                emit('response', password)
                                setOpenLoginForm(null)
                                setLoginFailed(false)
                            }}
                        />
                    )}
                </Popup>
            )}
        </>
    )
}

export function SattelProgress() {
    const { stopSattel } = useSattelContext()
    const [crawler, setCrawler] = useState<string | undefined>()

    useEffect(() => {
        const crawlUnlisten = listen<string>('crawl', (event) => {
            setCrawler(event.payload)
        })

        return () => crawlUnlisten.then((unlisten) => unlisten())
    }, [])

    return (
        <>
            <div class="flex items-center justify-between mb-4">
                <button class="btn btn-error mr-4" onClick={stopSattel}>
                    Cancel
                </button>
                {crawler ? (
                    <span class="font-bold">Crawling {crawler}</span>
                ) : (
                    <span class="loading loading-dots"></span>
                )}
            </div>
            <ProgressBars />
        </>
    )
}
