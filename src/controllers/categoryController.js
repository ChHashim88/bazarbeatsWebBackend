import prisma from '../config/db.js';

const asyncWrapper = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// @desc    Fetch all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncWrapper(async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = asyncWrapper(async (req, res) => {
  const { name, description } = req.body;

  const categoryExists = await prisma.category.findUnique({ where: { name } });
  if (categoryExists) {
    res.status(400);
    throw new Error('Category already exists');
  }

  const category = await prisma.category.create({
    data: { name, description }
  });

  res.status(201).json(category);
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = asyncWrapper(async (req, res) => {
  const { name, description } = req.body;

  const category = await prisma.category.findUnique({ where: { id: req.params.id } });

  if (category) {
    const updatedCategory = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, description }
    });
    res.json(updatedCategory);
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncWrapper(async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });

  if (category) {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category removed' });
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});
