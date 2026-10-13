import { CustomerModel } from '../models/customer.model.js'
import bcrypt from 'bcrypt'
import genToken from '../utils/generateToken.js'
import validator from 'validator'

const cookieOptions = {
  httpOnly: true,
  secure: true,       // required for cross-origin (HTTPS only)
  sameSite: 'none',   // required to send cookie cross-origin
}

// register controller i.e., controller to register a new user to the database
const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ error: 'Bad Request', message: 'All Fields Required' })
    }

    if (!validator.isEmail(email)) return res.status(400).json({ message: 'Invalid email id' })

    if (password.length < 6) {
      return res.status(400).json({ error: 'Bad Request', message: 'Password too short' })
    }

    const emailExists = await CustomerModel.findOne({ email })

    if (emailExists) {
      return res.status(409).json({ error: 'Conflict', message: 'Email already exists' })
    }

    // generating salt for password encryption
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newCustomer = await CustomerModel.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
    })

    const { _id } = newCustomer
    const customerData = { _id, fullName, email, phone }
    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: customerData,
      user: customerData,
    })
  } catch (err) {
    return res.status(500).json({ error: err, message: 'Server Crashed' })
  }
}

// function to delete a user from database
const deleteCustomer = async (req, res) => {
  const id = req.params.id
  const deletedUser = await CustomerModel.findByIdAndDelete(id)
  res.send(deletedUser)
}

// function to display all users in the database
const getAllCustomers = async (req, res) => {
  const customers = await CustomerModel.find({})
  if (customers.length === 0) return res.status(404).json({ message: 'No customers found' })
  res.send(customers)
}

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) return res.status(400).json({ message: 'All fields required' })

    const customer = await CustomerModel.findOne({ email })

    if (!customer) return res.status(404).json({ message: 'Customer not Found' })

    // password comparison
    const passwordMatched = await bcrypt.compare(password, customer.password)
    if (!passwordMatched) return res.status(401).json({ message: 'password did not match' })

    const token = genToken(customer._id)
    res.cookie('token', token, cookieOptions)

    const customerData = {
      _id: customer._id,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      customer: customerData,
      user: customerData,
      authenticatedUser: customerData,
    })
  } catch (err) {
    return res.status(500).json({ error: err, message: 'Server Crashed' })
  }
}

const getMe = (req, res) => {
  const { _id, fullName, email, phone } = req.customer
  const customerData = { _id, fullName, email, phone }
  res.status(200).json({
    ...customerData,
    customer: customerData,
    user: customerData,
    authenticatedUser: customerData,
  })
}

const logoutCustomer = (req, res) => {
  res.clearCookie('token', cookieOptions)

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
}

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Bad Request', message: 'Password too short' })
    }

    const customer = req.customer
    const passwordMatched = await bcrypt.compare(oldPassword, customer.password)
    if (!passwordMatched) {
      return res.status(401).json({ message: 'old password did not match' })
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    const cust = await CustomerModel.findById(customer._id)
    cust.password = hashedPassword
    await cust.save()

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (err) {
    return res.status(500).json({ error: err, message: 'Server Crashed' })
  }
}

export {
  registerCustomer,
  deleteCustomer,
  getAllCustomers,
  loginCustomer,
  getMe,
  logoutCustomer,
  changePassword,
}