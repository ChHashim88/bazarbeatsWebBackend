import prisma from '../config/db.js';

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
export const getBrands = async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(brands);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a brand
// @route   POST /api/brands
// @access  Private/Admin
export const createBrand = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) return res.status(400).json({ message: 'Brand name is required' });

    const brandExists = await prisma.brand.findUnique({ where: { name } });
    if (brandExists) return res.status(400).json({ message: 'Brand already exists' });

    const brand = await prisma.brand.create({
      data: { name }
    });
    
    res.status(201).json(brand);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
export const updateBrand = async (req, res) => {
  try {
    const { name } = req.body;
    
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id }
    });

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    const oldName = brand.name;

    const updatedBrand = await prisma.brand.update({
      where: { id: req.params.id },
      data: { name }
    });

    // Cascade update to products if using String for brand
    if (oldName !== name) {
      await prisma.product.updateMany({
        where: { brand: oldName },
        data: { brand: name }
      });
    }

    res.json(updatedBrand);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
export const deleteBrand = async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id }
    });

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    await prisma.brand.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Brand removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
