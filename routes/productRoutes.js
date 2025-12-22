const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();

// @route POST /api/products
// @desc Create a new Product
// @access Private Admin

router.post("/", protect, admin,  async (req, res) => {
  try {
    // Destructure fields from the request body
    const {
      name,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      sizes,
      colors,
      collections,
      material,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category || !sizes || !colors || !collections || !sku) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Create the product
    const product = new Product({
      name,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      sizes,
      colors,
      collections,
      material,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
      user: req.user._id, // Reference to the admin user who created it
    });

    // Save the product to the database
    const createdProduct = await product.save();
    
    // Return the created product as a response
    res.status(201).json(createdProduct);

  } catch (error) {
    // Log the error for debugging
    console.error(error);
    // Send a generic error message to the client
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @route PUT/ api/products/:id
// @desc Update an existing productID
// @access Private/Admin

router.put("/:id", protect, admin, async (req, res) =>{
    try{
        const {
      name,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      sizes,
      colors,
      collections,
      material,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
    } = req.body;

    // Find product by ID
    const product = await Product.findById(req.params.id);

    if(product){
        // Update product fields
        product.name= name || product.name;
        product.description= description || product.description;
        product.price= price || product.price;
        product.discountPrice= discountPrice || product.discountPrice;
        product.countInStock= countInStock || product.countInStock;
        product.category= category || product.category;
        product.brand= brand || product.brand;
        product.sizes= sizes || product.sizes;
        product.colors= colors || product.colors;
        product.collections= collections || product.collections;
        product.material= material || product.material;
        product.gender= gender || product.gender;
        product.images= images || product.images;
        product.isFeatured= isFeatured !== undefined? isFeatured : product.isFeatured;
        product.isPublished= isPublished !== undefined? isPublished : product.isPublished;
        product.tags= tags || product.tags;
        product.dimensions= dimensions || product.dimensions;
        product.weight= weight || product.weight;
        product.sku= sku || product.sku;

        // Save the updated product

        const updatedProduct = await product.save();
        res.json(updatedProduct);
        
    }else{
        res.status(404).json({message: "Product not found"});
    }

    }catch(error){
        console.log(error);
        res.status(500).send("Server Error")
        

    }
})

// @route DELETE /api/products/:id
// @desc DELETE a product by ID
// @access Private/Admin

router.delete("/:id", protect, admin, async (req, res) => {
  try {
    // Find the product by ID
    const product = await Product.findById(req.params.id);

    // If the product is found, delete it
    if (product) {
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      // If no product is found, send a 404 error
      res.status(404).json({ message: "Product not found" });
    }

  } catch (error) {
    // Handle any errors that occur
    console.error(error);
    res.status(500).send("Server Error");
  }
});


module.exports = router;
