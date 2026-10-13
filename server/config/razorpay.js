import Razorpay from 'razorpay'
import dotenv from 'dotenv'

dotenv.config()

const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

export const razorpayInstance = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
})

export const getRazorpayKeyId = () => {
  return KEY_ID
}

export const getRazorpayKeySecret = () => {
  return KEY_SECRET
}

export default razorpayInstance
