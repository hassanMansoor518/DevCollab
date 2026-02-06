import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import Cookies from 'js-cookie'

function useGetAllUser() {
   
    const [allUser , setAllUser] = useState([])
    const [loading , setLoading] = useState(false)

  useEffect(() => {

    const fetchAllUser = async () =>{
        setLoading(true)

        try {
            const response = await fetch("/api/auth/allUser", {
                credentials: "include",
            })

            if (!response.ok) {
                console.error("Failed to fetch users, status:", response.status)
                setAllUser([])
                setLoading(false)
                return
            }

            const data = await response.json()

            if (Array.isArray(data)) setAllUser(data)
            else if (data && Array.isArray(data.users)) setAllUser(data.users)
            else setAllUser([])

            setLoading(false)
        }
        catch (error) {
            console.error("Error fetching users:", error)
            setAllUser([])
            setLoading(false)
        }
    }
    fetchAllUser()
  }, [])
 return[allUser , loading]
}

export default useGetAllUser;
