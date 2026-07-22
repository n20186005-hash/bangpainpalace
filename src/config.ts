export const siteConfig = {
  // 多语言名称（站点名 / 当地名）
  name: {
    th: 'พระราชวังบางปะอิน',
    en: 'Bang Pa-In Palace',
    zh: '邦巴因王宫',
  },
  nameLocal: 'พระราชวังบางปะอิน', // 当地（泰文）名称
  domain: process.env.CURRENT_SITE_DOMAIN ? `https://${process.env.CURRENT_SITE_DOMAIN}` : 'https://bangpainpalace.com',

  phone: '+6635261548',
  phoneDisplay: '+66 35 261 548',

  rating: 4.5,
  reviewCount: '7,742',

  // 实际坐标（用于天气 / 日落 API 与地图嵌入）—— 邦巴因王宫（Bang Pa-In Palace，大城府）
  coords: { lat: 14.2302, lng: 100.5751 },

  // 统一 Google Maps 链接（首屏 / 照片 / 评价 / 页脚 共 4 处 + JSON-LD sameAs）
  mapsUrl: 'https://maps.app.goo.gl/p8D7cQapK2dzG85P6',

  // 地图嵌入（MapSection iframe，使用用户提供的 Bang Pa-In Palace Google Maps 嵌入代码）
  googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3867.395029519498!2d100.57509751226402!3d14.23016328615597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e2782a4ab79549%3A0xcdab9b0f50a40e4c!2sBang%20Pa-In%20Palace!5e0!3m2!1szh-CN!2sus!4v1784684686345!5m2!1szh-CN!2sus',

  // 结构化数据 sameAs（权威资料页）
  sameAs: [
    'https://maps.app.goo.gl/p8D7cQapK2dzG85P6',
    'https://en.wikipedia.org/wiki/Bang_Pa-In_Royal_Palace',
  ],

  address: 'Ban Len, Bang Pa-in District, Phra Nakhon Si Ayutthaya 13160, Thailand',
  plusCode: '6HJH+33',

  // 画廊图片前缀（public/gallery/bang-pa-in-palace-1..N.jpg，王宫真实照片）
  galleryPrefix: 'bang-pa-in-palace-',

  // 社交 / 资料链接（科普站占位，上线前请替换为官方或可运营账号）
  socialLinks: [
    {
      name: 'Tourism Thailand',
      href: 'https://www.tourismthailand.org/',
      icon: 'globe',
    },
    {
      name: 'Ayutthaya',
      href: 'https://www.tourismthailand.org/Destinations/ayutthaya',
      icon: 'tree',
    },
    {
      name: 'Google Maps',
      href: 'https://maps.app.goo.gl/p8D7cQapK2dzG85P6',
      icon: 'map',
    },
  ],

  // 资料来源（页脚引用，需与页脚 per-language name 结构一致）
  sources: [
    {
      name: { th: 'การท่องเที่ยวแห่งประเทศไทย', en: 'Tourism Authority of Thailand', zh: '泰国国家旅游局' },
      url: 'https://www.tourismthailand.org/',
    },
    {
      name: { th: 'วิกิพีเดีย – พระราชวังบางปะอิน', en: 'Wikipedia — Bang Pa-In Royal Palace', zh: '维基百科 – 邦巴因王宫' },
      url: 'https://en.wikipedia.org/wiki/Bang_Pa-In_Royal_Palace',
    },
    {
      name: { th: 'จังหวัดพระนครศรีอยุธยา', en: 'Phra Nakhon Si Ayutthaya', zh: '大城府' },
      url: 'https://www.ayutthaya.go.th/',
    },
  ],
};
