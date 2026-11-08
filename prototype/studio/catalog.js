export const BRUSHES = Object.freeze({
  tree: { label: '松林', footprint: 0.06, candidates: 14000 },
  house: { label: '木屋', footprint: 0.115, candidates: 1800 },
  broadleaf: { label: '阔叶树', footprint: 0.105, candidates: 6000 },
  flowers: { label: '花丛', footprint: 0.05, candidates: 16000 },
  rock: { label: '岩石', footprint: 0.08, candidates: 8000 },
  mushroom: { label: '蘑菇', footprint: 0.067, candidates: 12000 },
});

export const ENVIRONMENTS = Object.freeze({
  snow: {
    label: '雪原', land: 0xe8f4f2, shade: 0x9bb8bf,
    ambient: 0xd6fff2, groundLight: 0x223342, sunlight: 0xf3f8ff, rim: 0x93efd6,
    pine: 0x245c4c, tip: 0x387e60, leaf: 0x688e80, leafTip: 0x9fbaa2,
    rock: 0x7a919b, petals: 0xd88fae, petalsAlt: 0xa7a0d0, mushroom: 0xc67768,
  },
  grass: {
    label: '草地', land: 0x7ab273, shade: 0x38664e,
    ambient: 0xe5f9e0, groundLight: 0x394e43, sunlight: 0xfff3d3, rim: 0x92c8d2,
    pine: 0x28694e, tip: 0x579657, leaf: 0x59a254, leafTip: 0x99c76a,
    rock: 0x8d9997, petals: 0xe981ac, petalsAlt: 0xa18cda, mushroom: 0xe66c59,
  },
  desert: {
    label: '沙漠', land: 0xe3ae73, shade: 0xac744e,
    ambient: 0xffecc6, groundLight: 0x453f53, sunlight: 0xffddab, rim: 0xd69e88,
    pine: 0x617b51, tip: 0x9da56c, leaf: 0x7b8f55, leafTip: 0xb9bb7c,
    rock: 0xa86850, petals: 0xeea25f, petalsAlt: 0xd37a80, mushroom: 0xb87a57,
  },
});
