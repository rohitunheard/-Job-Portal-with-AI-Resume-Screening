import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Applynow() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/resume-screener', { replace: true })
  }, [])
  return null
}
