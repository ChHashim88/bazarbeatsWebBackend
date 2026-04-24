import prisma from '../config/db.js';

const asyncWrapper = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = asyncWrapper(async (req, res) => {
  const settings = await prisma.storeSettings.findFirst();
  const sortSetting = settings?.defaultSortOption || 'newest';
  
  let orderObj = { createdAt: 'desc' };
  if (sortSetting === 'oldest') orderObj = { createdAt: 'asc' };
  else if (sortSetting === 'price_asc') orderObj = { price: 'asc' };
  else if (sortSetting === 'price_desc') orderObj = { price: 'desc' };
  else if (sortSetting === 'name_asc') orderObj = { name: 'asc' };

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: orderObj
  });
  res.json(products);
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = asyncWrapper(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true, reviews: { include: { user: { select: { name: true } } } } }
  });

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = asyncWrapper(async (req, res) => {
  const { name, price, description, images, categoryId, sizes, colors, stock, sizeStock, brand, tier, salePrice, saleStartDate, saleEndDate } = req.body;

  // Auto-generate a default category if none is provided to prevent Prisma crashes
  let validCategoryId = categoryId;
  if (!validCategoryId) {
    let defaultCategory = await prisma.category.findFirst({ where: { name: 'Uncategorized' } });
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({ data: { name: 'Uncategorized' } });
    }
    validCategoryId = defaultCategory.id;
  }

  const product = await prisma.product.create({
    data: {
      name: name || 'Sample name',
      price: price || 0,
      description: description || 'Sample description',
      images: images || [],
      sizes: sizes || [],
      colors: colors || [],
      stock: stock || 0,
      sizeStock: sizeStock || {},
      brand: brand || null,
      tier: tier || null,
      salePrice: salePrice || null,
      saleStartDate: saleStartDate ? new Date(saleStartDate) : null,
      saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
      categoryId: validCategoryId
    }
  });

  res.status(201).json(product);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = asyncWrapper(async (req, res) => {
  const { name, price, description, images, categoryId, sizes, colors, stock, sizeStock, brand, tier, salePrice, saleStartDate, saleEndDate } = req.body;

  const productExists = await prisma.product.findUnique({ where: { id: req.params.id } });

  if (productExists) {
    let validCategoryId = categoryId || productExists.categoryId;

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        price,
        description,
        images,
        categoryId: validCategoryId,
        sizes,
        colors,
        stock,
        sizeStock,
        brand,
        tier,
        salePrice: salePrice !== undefined ? salePrice : productExists.salePrice,
        saleStartDate: saleStartDate !== undefined ? (saleStartDate ? new Date(saleStartDate) : null) : productExists.saleStartDate,
        saleEndDate: saleEndDate !== undefined ? (saleEndDate ? new Date(saleEndDate) : null) : productExists.saleEndDate
      }
    });
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = asyncWrapper(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });

  if (product) {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Update trending products
// @route   PUT /api/products/trending
// @access  Private/Admin
export const updateTrendingProducts = asyncWrapper(async (req, res) => {
  const { productIds } = req.body;

  if (!productIds || !Array.isArray(productIds)) {
    res.status(400);
    throw new Error('Please provide an array of product IDs');
  }

  const validIds = productIds.slice(0, 3);

  await prisma.product.updateMany({
    data: { isTrending: false }
  });

  if (validIds.length > 0) {
    await prisma.product.updateMany({
      where: { id: { in: validIds } },
      data: { isTrending: true }
    });
  }

  res.json({ message: 'Trending models updated successfully' });
});
