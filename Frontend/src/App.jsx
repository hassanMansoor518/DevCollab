import React from 'react'
import AppRoutes from "./routes/AppRoutes"
import { useAuth } from '../src/context/AuthProvider'
import Loading from './component/Loading'
import CallOverlay from "./pages/Chat/RightParts/CallOverlay"
import { Toaster } from "react-hot-toast"

export default function App() {
  const [authUser, setAuthUser] = useAuth()

  return (
    <div>
      <AppRoutes />
      {authUser && <CallOverlay />}
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  )
}

