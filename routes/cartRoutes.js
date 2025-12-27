const express = require("express");
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Utility: Get cart by userId or guestId
 */
const getCart = async (userId, guestId) => {
  if (userId) {
    return Cart.findOne({ user: userId });
  }
  if (guestId) {
    return Cart.findOne({ guestId });
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

    // Convert quantity to number
    quantity = Number(quantity);

    // Validate inputs
    if (
      !mongoose.Types.ObjectId.isValid(productId) ||
      isNaN(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({ message: "Invalid product or quantity" });
    }

    // Check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await getCart(userId, guestId);

    // ================= UPDATE EXISTING CART =================
    if (cart) {
      const productIndex = cart.products.findIndex(
        (p) =>
          p.productId.equals(productId) &&
          p.size === size &&
          p.color === color
      );

      if (productIndex > -1) {
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

      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      await cart.save();
      return res.status(200).json(cart);
    }

    // ================= CREATE NEW CART =================
    const newCart = await Cart.create({
      user: userId || undefined,
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
    console.error("Cart POST Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
});

/**
 * @route   PUT /api/cart
 * @desc    Update product quantity in cart
 * @access  Public
 */
router.put("/", async (req, res) => {
  try {
    let { productId, quantity, size, color, guestId, userId } = req.body;

    quantity = Number(quantity);

    // Validate inputs
    if (
      !mongoose.Types.ObjectId.isValid(productId) ||
      isNaN(quantity)
    ) {
      return res.status(400).json({ message: "Invalid product or quantity" });
    }

    const cart = await getCart(userId, guestId);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const productIndex = cart.products.findIndex(
      (p) =>
        p.productId.equals(productId) &&
        p.size === size &&
        p.color === color
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Update or remove item
    if (quantity > 0) {
      cart.products[productIndex].quantity = quantity;
    } else {
      cart.products.splice(productIndex, 1);
    }

    cart.totalPrice = cart.products.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    await cart.save();
    return res.status(200).json(cart);

  } catch (error) {
    console.error("Cart PUT Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
});

/**
 * @route   DELETE /api/cart
 * @desc    Remove a product from the cart
 * @access  Public
 */
router.delete("/", async (req, res) => {
  try {
    const { productId, size, color, guestId, userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const cart = await getCart(userId, guestId);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const productIndex = cart.products.findIndex(
      (p) =>
        p.productId.equals(productId) &&
        (size ? p.size === size : true) &&
        (color ? p.color === color : true)
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.products.splice(productIndex, 1);

    cart.totalPrice = cart.products.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    await cart.save();
    return res.status(200).json(cart);

  } catch (error) {
    console.error("Cart DELETE Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
});

// @route GET /api/cart
// @desc Get logged in user's or guest user's request
// @access Public

router.get("/", async(req, res) =>{
  const {userId, guestId} = req.query;

  try {
    const cart = await getCart(userId, guestId);
    if(cart) {
      res.json(cart);
    }else{
      res.status(404).json({message: "Cart not found"});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Server Error"});
    
    
  }
})

// @route POST /api/cart/merge
// @desc Merge guest cart into user cart on login
// @access Private

router.post("/merge", protect, async (req, res) => {
  const { guestId } = req.body;
  const userId = req.user._id;  // Get userId from authenticated user

  try {
    // Validate userId (should always exist if protect middleware worked)
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Valid userId required" });
    }

    // Validate guestId
    if (!guestId) {
      return res.status(400).json({ message: "guestId is required" });
    }

    // Find carts
    const guestCart = await Cart.findOne({ guestId });
    const userCart = await Cart.findOne({ user: userId });

    // ❌ No guest cart
    if (!guestCart) {
      if (userCart) {
        return res.status(200).json(userCart);
      }
      return res.status(404).json({ message: "Guest cart not found" });
    }

    // ❌ Guest cart empty
    if (guestCart.products.length === 0) {
      return res.status(400).json({ message: "Guest cart is empty" });
    }

    // ✅ If user cart exists → merge
    if (userCart) {
      guestCart.products.forEach((guestItem) => {
        const productIndex = userCart.products.findIndex(
          (item) =>
            item.productId.toString() === guestItem.productId.toString() &&
            item.size === guestItem.size &&
            item.color === guestItem.color
        );

        if (productIndex > -1) {
          userCart.products[productIndex].quantity += guestItem.quantity;
        } else {
          userCart.products.push(guestItem);
        }
      });

      userCart.totalPrice = userCart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      await userCart.save();
      await Cart.findOneAndDelete({ guestId });

      return res.status(200).json(userCart);
    }

    // ✅ If user cart does NOT exist → assign guest cart to user
    guestCart.user = userId;  // ← Use userId from authenticated user
    guestCart.guestId = undefined;
    await guestCart.save();

    return res.status(200).json(guestCart);

  } catch (error) {
    console.error("Merge cart error:", error);  // ← Better error logging
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});



module.exports = router;
