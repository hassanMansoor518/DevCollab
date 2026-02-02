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
            const token = Cookies.get("token")
            const response = await fetch("/api/auth/allUser" , {   
                credentials : "include",
                headers:{
                    "Authorization" : `Bearer ${token}`
                }
            })
            const data = await response.json()
            setAllUser(data)
            setLoading(false)
        }
        catch (error) {
            console.error("Error fetching users:", error)
            setLoading(false)
        }
    }
    fetchAllUser()
  }, [])
 return[allUser , loading]
}

export default useGetAllUser;
