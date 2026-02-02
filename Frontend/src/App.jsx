import React from 'react'
import AppRoutes from "./routes/AppRoutes"
import { useAuth } from '../src/context/AuthProvider'
import Loading from './component/Loading'

export default function App() {
  const [authUser, setAuthUser] = useAuth()

  return (
    
    <div>
   <AppRoutes /> 
    </div>
  )
}

