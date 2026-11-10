// หาสถานีตำรวจที่มีเขตอำนาจจากที่อยู่ (ข้อมูล data/jurisdiction.json เป็นร่าง ต้องให้ พงส. ตรวจ)

const PROVINCE_ALIAS = { กทม: 'กรุงเทพมหานคร', 'กทม.': 'กรุงเทพมหานคร', กรุงเทพ: 'กรุงเทพมหานคร', 'กรุงเทพฯ': 'กรุงเทพมหานคร' };

export function normPlace(s) {
  return String(s ?? '').replace(/\(.*?\)/g, '').replace(/\s+/g, '')
    .replace(/^(ตำบล|ต\.|แขวง|อำเภอ|อ\.|เขต|จังหวัด|จ\.)/, '');
}

export function placeKey(province, district, tambon) {
  const p = normPlace(province), prov = PROVINCE_ALIAS[p] ?? p;
  let d = normPlace(district);
  if (d === 'เมือง') d = 'เมือง' + prov; // "อ.เมือง จ.ขอนแก่น" → เมืองขอนแก่น
  return `${prov}|${d}|${normPlace(tambon)}`;
}

// คืน { level: 'ตำบล' | 'อำเภอ' | '', options: [{ station, share }] } เรียงสถานีที่น่าจะใช่ก่อน
export function findStations(data, { จังหวัด, อำเภอ, ตำบล } = {}) {
  if (!data || !จังหวัด) return { level: '', options: [] };
  const key = placeKey(จังหวัด, อำเภอ, ตำบล);
  const [prov, dist, tam] = key.split('|');
  const pick = list => list.map(x => Array.isArray(x) ? { station: data.stations[x[0]], share: x[1] } : { station: data.stations[x], share: null });
  const uniq = opts => opts.filter((o, i) => opts.findIndex(x => x.station === o.station) === i);
  let hit = tam && data.areas[key];
  if (!hit && tam && !dist) hit = Object.entries(data.areas).filter(([k]) => k.startsWith(prov + '|') && k.endsWith('|' + tam)).flatMap(([, v]) => v);
  if (hit?.length) return { level: 'ตำบล', options: uniq(pick(hit)) };
  if (!dist) return { level: '', options: [] };
  const byDistrict = Object.entries(data.areas).filter(([k]) => k.startsWith(`${prov}|${dist}|`)).flatMap(([, v]) => v);
  return { level: byDistrict.length ? 'อำเภอ' : '', options: uniq(pick(byDistrict).map(o => ({ ...o, share: null }))) };
}

// สถานีที่จะใช้บนหมายเรียก: ที่ พงส. เลือกไว้ หรือถ้าที่อยู่ตรงสถานีเดียวก็ใช้สถานีนั้น
export function stationFor(data, person) {
  if (person?.สถานีส่งหมาย?.ชื่อ) return person.สถานีส่งหมาย;
  const { level, options } = findStations(data, person ?? {});
  return level === 'ตำบล' && options.length === 1 ? options[0].station : null;
}

// หาจากตำบล/อำเภอ(/จังหวัด) โดยไม่ต้องรู้จังหวัด; อำเภอเว้นได้ถ้ามีตำบล; "เมือง" เฉยๆ ได้หลายจังหวัด
export function findByTambon(data, { จังหวัด, อำเภอ, ตำบล } = {}) {
  const d = normPlace(อำเภอ), t = normPlace(ตำบล), pv = จังหวัด ? placeKey(จังหวัด, '', '').split('|')[0] : '';
  if (!data || (!d && !t)) return [];
  const rows = Object.keys(data.areas).map(k => k.split('|'))
    .filter(([p, dist]) => (!pv || p === pv) && (!d || dist === d || (d === 'เมือง' && dist === 'เมือง' + p)));
  const exact = t ? rows.filter(r => r[2] === t) : [];
  if (!d && !exact.length) return [];
  const pick = exact.length ? exact : rows;
  const seen = new Set();
  return pick.filter(([p, dist, tam]) => !seen.has(p + dist + (exact.length ? tam : '')) && seen.add(p + dist + (exact.length ? tam : '')))
    .map(([จังหวัด, dist, tam]) => {
      const ตำบลชื่อ = exact.length ? tam : t;
      const r = findStations(data, { จังหวัด, อำเภอ: dist, ตำบล: exact.length ? tam : '' });
      return { จังหวัด, อำเภอ: dist, ตำบล: ตำบลชื่อ, level: r.level, options: r.options };
    });
}
