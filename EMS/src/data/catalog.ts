export type CatalogCompany = {
  id: string;
  name: string;
  models: { id: string; name: string }[];
};

// Popular brands / models commonly seen in India.
// You can freely extend / edit this list.
export const CATALOG: CatalogCompany[] = [
  {
    id: 'samsung',
    name: 'Samsung',
    models: [
      { id: 'galaxy-a05', name: 'Galaxy A05' },
      { id: 'galaxy-a14', name: 'Galaxy A14' },
      { id: 'galaxy-a15', name: 'Galaxy A15' },
      { id: 'galaxy-a34', name: 'Galaxy A34' },
      { id: 'galaxy-a54', name: 'Galaxy A54' },
      { id: 'galaxy-f15', name: 'Galaxy F15' },
      { id: 'galaxy-m14', name: 'Galaxy M14' },
      { id: 'galaxy-s22', name: 'Galaxy S22' },
      { id: 'galaxy-s23', name: 'Galaxy S23' },
      { id: 'galaxy-s24', name: 'Galaxy S24' },
      { id: 'galaxy-s24-ultra', name: 'Galaxy S24 Ultra' },
    ],
  },
  {
    id: 'apple',
    name: 'Apple',
    models: [
      { id: 'iphone-12', name: 'iPhone 12' },
      { id: 'iphone-13', name: 'iPhone 13' },
      { id: 'iphone-13-mini', name: 'iPhone 13 mini' },
      { id: 'iphone-14', name: 'iPhone 14' },
      { id: 'iphone-14-plus', name: 'iPhone 14 Plus' },
      { id: 'iphone-14-pro', name: 'iPhone 14 Pro' },
      { id: 'iphone-15', name: 'iPhone 15' },
      { id: 'iphone-15-plus', name: 'iPhone 15 Plus' },
      { id: 'iphone-15-pro', name: 'iPhone 15 Pro' },
      { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max' },
    ],
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi / Redmi',
    models: [
      { id: 'redmi-12', name: 'Redmi 12' },
      { id: 'redmi-13', name: 'Redmi 13' },
      { id: 'redmi-note-12', name: 'Redmi Note 12' },
      { id: 'redmi-note-12-5g', name: 'Redmi Note 12 5G' },
      { id: 'redmi-note-13', name: 'Redmi Note 13' },
      { id: 'redmi-note-13-pro', name: 'Redmi Note 13 Pro' },
      { id: 'poco-m6-pro', name: 'POCO M6 Pro' },
      { id: 'poco-x6', name: 'POCO X6' },
      { id: 'poco-x6-pro', name: 'POCO X6 Pro' },
    ],
  },
  {
    id: 'realme',
    name: 'realme',
    models: [
      { id: 'realme-narzo-70', name: 'realme Narzo 70' },
      { id: 'realme-narzo-60', name: 'realme Narzo 60' },
      { id: 'realme-12', name: 'realme 12' },
      { id: 'realme-12-pro', name: 'realme 12 Pro' },
      { id: 'realme-c53', name: 'realme C53' },
      { id: 'realme-c67', name: 'realme C67' },
    ],
  },
  {
    id: 'oneplus',
    name: 'OnePlus',
    models: [
      { id: 'oneplus-nord-ce-3-lite', name: 'Nord CE 3 Lite' },
      { id: 'oneplus-nord-3', name: 'Nord 3' },
      { id: 'oneplus-11r', name: 'OnePlus 11R' },
      { id: 'oneplus-12', name: 'OnePlus 12' },
    ],
  },
  {
    id: 'oppo',
    name: 'OPPO',
    models: [
      { id: 'oppo-a59', name: 'OPPO A59' },
      { id: 'oppo-a78', name: 'OPPO A78' },
      { id: 'oppo-f25-pro', name: 'OPPO F25 Pro' },
      { id: 'oppo-reno-11', name: 'OPPO Reno 11' },
    ],
  },
  {
    id: 'vivo',
    name: 'Vivo',
    models: [
      { id: 'vivo-y27', name: 'Vivo Y27' },
      { id: 'vivo-y28', name: 'Vivo Y28' },
      { id: 'vivo-y200', name: 'Vivo Y200' },
      { id: 'vivo-v29', name: 'Vivo V29' },
      { id: 'vivo-v30', name: 'Vivo V30' },
      { id: 'iqoo-z9', name: 'iQOO Z9' },
      { id: 'iqoo-neo-9', name: 'iQOO Neo 9' },
    ],
  },
  {
    id: 'motorola',
    name: 'Motorola',
    models: [
      { id: 'moto-g14', name: 'Moto G14' },
      { id: 'moto-g34', name: 'Moto G34' },
      { id: 'moto-g64', name: 'Moto G64' },
      { id: 'moto-edge-50', name: 'Moto Edge 50' },
    ],
  },
  {
    id: 'nothing',
    name: 'Nothing',
    models: [
      { id: 'phone-1', name: 'Phone (1)' },
      { id: 'phone-2', name: 'Phone (2)' },
      { id: 'phone-2a', name: 'Phone (2a)' },
    ],
  },
  {
    id: 'infinix',
    name: 'Infinix',
    models: [
      { id: 'infinix-hot-30', name: 'Infinix Hot 30' },
      { id: 'infinix-hot-40', name: 'Infinix Hot 40' },
      { id: 'infinix-note-30', name: 'Infinix Note 30' },
    ],
  },
  {
    id: 'tecno',
    name: 'Tecno',
    models: [
      { id: 'tecno-spark-20', name: 'Spark 20' },
      { id: 'tecno-camon-20', name: 'Camon 20' },
      { id: 'tecno-pova-6', name: 'Pova 6' },
    ],
  },
  {
    id: 'lava',
    name: 'Lava',
    models: [
      { id: 'lava-storm-5g', name: 'Lava Storm 5G' },
      { id: 'lava-blaze-2', name: 'Lava Blaze 2' },
      { id: 'lava-agnel-5g', name: 'Lava Agni 5G' },
    ],
  },
  {
    id: 'nokia',
    name: 'Nokia',
    models: [
      { id: 'nokia-g42', name: 'Nokia G42' },
      { id: 'nokia-c32', name: 'Nokia C32' },
    ],
  },
];

export function getCompanyById(companyId: string | null | undefined) {
  return CATALOG.find((c) => c.id === companyId) ?? null;
}

export function getModelById(
  companyId: string | null | undefined,
  modelId: string | null | undefined
) {
  const c = getCompanyById(companyId);
  return c?.models.find((m) => m.id === modelId) ?? null;
}

