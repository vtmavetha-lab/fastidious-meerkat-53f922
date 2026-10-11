import { useAuth } from './lib/auth'
import AuthPage from './views/AuthPage'
import Shell from './Shell'
import Toasts from './components/Toasts'

export default function App() {
  const session = useAuth((s) => s.session)
  return (
    <>
      {session ? <Shell /> : <AuthPage />}
      <Toasts />
    </>
  )
}
