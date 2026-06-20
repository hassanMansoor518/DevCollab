import React from 'react'
import AppRoutes from "./routes/AppRoutes"
import { useAuth } from '../src/context/AuthProvider'
import Loading from './component/Loading'
import CallOverlay from "./pages/Chat/RightParts/CallOverlay"

export default function App() {
  const [authUser, setAuthUser] = useAuth()

  return (
    <div>
      <AppRoutes />
      {authUser && <CallOverlay />}
    </div>
  )
}

