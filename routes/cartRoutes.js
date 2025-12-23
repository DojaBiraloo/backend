const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const router = express.Router();

/**
 * Get cart by userId or guestId
 */
const getCart = async (userId, guestId) => {
  if (userId) {
    return await Cart.findOne({ user: userId });
  }
  if (guestId) {
    return await Cart.findOne({ guestId });
  }
  return null;
};

/**
 * @route   POST /api/cart
 * @desc    Add product to cart (guest or logged-in user)
 * @access  Public
 */
router.post("/", async (req, res) => {
  try {
    let { productId, quantity, size, color, guestId, userId } = req.body;

    // Convert quantity to Number (CRITICAL FIX)
    quantity = Number(quantity);

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid product or quantity" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await getCart(userId, guestId);

    // ================= UPDATE CART =================
    if (cart) {
      const productIndex = cart.products.findIndex(
        (p) =>
          p.productId.toString() === productId &&
          p.size === size &&
          p.color === color
      );

      if (productIndex > -1) {
        // ADD quantity (FIXED)
        cart.products[productIndex].quantity += quantity;
      } else {
        cart.products.push({
          productId,
          name: product.name,
          image: product.images?.[0]?.url || "",
          price: product.price,
          size,
          color,
          quantity,
        });
      }

      // Recalculate total price
      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      await cart.save();
      return res.status(200).json(cart);
    }

    // ================= CREATE CART =================
    const newCart = await Cart.create({
      user: userId || undefined, // FIXED
      guestId: guestId || `guest_${Date.now()}`,
      products: [
        {
          productId,
          name: product.name,
          image: product.images?.[0]?.url || "",
          price: product.price,
          size,
          color,
          quantity,
        },
      ],
      totalPrice: product.price * quantity,
    });

    return res.status(201).json(newCart);

  } catch (error) {
    console.error("Cart Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
