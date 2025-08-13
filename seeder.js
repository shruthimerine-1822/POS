const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/Product"); // Path must match your structure

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB connection failed:", err));

// Updated products with quantity
const products = [
  { name: "Ladoo", price: 100, category: "Sweet", inStock: true, quantity: 50 },
  { name: "Barfi", price: 150, category: "Sweet", inStock: true, quantity: 40 },
  { name: "Rasgulla", price: 130, category: "Sweet", inStock: false, quantity: 0 }
];

// Seed function
const seedProducts = async () => {
  try {
    await Product.deleteMany(); // Clear old data
    await Product.insertMany(products);
    console.log("✅ Products seeded successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding products:", err);
    process.exit(1);
  }
};

seedProducts();

