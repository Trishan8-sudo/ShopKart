import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import customerRoutes from './routes/customer.route.js'
import productRoutes from './routes/product.route.js'
import wishlistRoutes from './routes/wishlist.route.js'
import cartRoutes from './routes/cart.route.js'
import orderRoutes from './routes/order.route.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'


const PORT = process.env.PORT || 8067
const app = express()
app.use(express.json())
app.use(cookieParser()) // needed for parsing cookie into json objects

// setting up cors middleware to accept request from client
app.use(
  cors({
    origin: 'http://localhost:5173', // base url of client
    credentials: true,
  })
)

dotenv.config()

mongoose
  .connect(process.env.dbUri)
  .then(() => {
    console.log('DB connected successfully')
  })
  .catch((err) => {
    console.log(err)
  })

app.use('/customers', customerRoutes)
app.use('/products', productRoutes)
app.use('/wishlist', wishlistRoutes)
app.use('/cart', cartRoutes)
app.use('/orders', orderRoutes)

app.get('/', (req, res) => {
  res.send('Hello! Welcome to the Home Page...')
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})