import prisma from '../config/db.js';

const asyncWrapper = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// @desc    Get store settings
// @route   GET /api/settings
// @access  Public
export const getSettings = asyncWrapper(async (req, res) => {
  let settings = await prisma.storeSettings.findFirst();
  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: {}
    });
  }
  res.json(settings);
});

// @desc    Update store settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = asyncWrapper(async (req, res) => {
  const { 
    deliveryFeeType, deliveryFeeValue, 
    codFeeType, codFeeValue, sizeSystem,
    enableEasypaisa, easypaisaNumber,
    enableJazzcash, jazzcashNumber,
    enableCod, enableBank, bankName, bankAccountNumber,
    emailSupport, directLine, headquarters, headquartersAddress,
    defaultSortOption
  } = req.body;

  let settings = await prisma.storeSettings.findFirst();
  if (!settings) {
    settings = await prisma.storeSettings.create({ data: {} });
  }

  const updatedSettings = await prisma.storeSettings.update({
    where: { id: settings.id },
    data: {
      deliveryFeeType: deliveryFeeType || 'FIXED',
      deliveryFeeValue: Number(deliveryFeeValue) || 0,
      codFeeType: codFeeType || 'FIXED',
      codFeeValue: Number(codFeeValue) || 0,
      sizeSystem: sizeSystem || 'UK',
      enableEasypaisa: enableEasypaisa !== undefined ? enableEasypaisa : settings.enableEasypaisa,
      easypaisaNumber: easypaisaNumber || settings.easypaisaNumber,
      enableJazzcash: enableJazzcash !== undefined ? enableJazzcash : settings.enableJazzcash,
      jazzcashNumber: jazzcashNumber || settings.jazzcashNumber,
      enableCod: enableCod !== undefined ? enableCod : settings.enableCod,
      enableBank: enableBank !== undefined ? enableBank : settings.enableBank,
      bankName: bankName || settings.bankName,
      bankAccountNumber: bankAccountNumber || settings.bankAccountNumber,
      emailSupport: emailSupport || settings.emailSupport,
      directLine: directLine || settings.directLine,
      headquarters: headquarters || settings.headquarters,
      headquartersAddress: headquartersAddress || settings.headquartersAddress,
      defaultSortOption: defaultSortOption || settings.defaultSortOption,
    }
  });

  res.json(updatedSettings);
});
