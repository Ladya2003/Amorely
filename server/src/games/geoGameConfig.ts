export const GEO_ROUND_TIME_SEC = 60;
export const GEO_LOBBY_COUNTDOWN_SEC = 3;
export const GEO_MAX_ROUND_POINTS = 5000;
export const GEO_MAX_ROUNDS_PER_DAY = 5;

export interface GeoLocation {
  id: string;
  name: string;
  imageUrl: string;
  lat: number;
  lng: number;
  continent: string;
  country: string;
  city: string;
}

export const GEO_LOCATIONS: GeoLocation[] = [
  {
    id: 'paris-eiffel',
    name: 'Эйфелева башня, Париж',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779806030/paris_c73gcl.webp',
    lat: 48.8584,
    lng: 2.2945,
    continent: 'Европа',
    country: 'Франция',
    city: 'Париж',
  },
  {
    id: 'tokyo-shibuya',
    name: 'Сибуя, Токио',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779806261/%D0%A1%D0%B8%D0%B1%D1%83%D1%8F_%D0%A2%D0%BE%D0%BA%D0%B8%D0%BE_pzp5zt.jpg',
    lat: 35.6595,
    lng: 139.7005,
    continent: 'Азия',
    country: 'Япония',
    city: 'Токио',
  },
  {
    id: 'nyc-times-square',
    name: 'Таймс-сквер, Нью-Йорк',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779806261/%D0%A2%D0%B0%D0%B9%D0%BC%D1%81-%D1%81%D0%BA%D0%B2%D0%B5%D1%80_%D0%9D%D1%8C%D1%8E-%D0%99%D0%BE%D1%80%D0%BA_myzkqi.jpg',
    lat: 40.758,
    lng: -73.9855,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Нью-Йорк',
  },
  {
    id: 'rio-copacabana',
    name: 'Копакабана, Рио-де-Жанейро',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779806260/%D0%9A%D0%BE%D0%BF%D0%B0%D0%BA%D0%B0%D0%B1%D0%B0%D0%BD%D0%B0_%D0%A0%D0%B8%D0%BE-%D0%B4%D0%B5-%D0%96aneiro_xkbn2c.jpg',
    lat: -22.9711,
    lng: -43.1822,
    continent: 'Южная Америка',
    country: 'Бразилия',
    city: 'Рио-де-Жанейро',
  },
  {
    id: 'sydney-opera',
    name: 'Сиднейский оперный театр',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779806261/%D0%A1%D0%B8%D0%B4%D0%BD%D0%B5%D0%B9%D1%81%D0%BA%D0%B8%D0%B9_%D0%BE%D0%BF%D0%B5%D1%80%D0%BD%D1%8B%D0%B9_%D1%82%D0%B5%D0%B0%D1%82%D1%80_iym3ze.jpg',
    lat: -33.8568,
    lng: 151.2153,
    continent: 'Океания',
    country: 'Австралия',
    city: 'Сидней',
  },
  {
    id: 'cairo-pyramids',
    name: 'Пирамиды Гизы',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779806262/%D0%9F%D0%B8%D1%80%D0%B0%D0%BC%D0%B8%D0%B4%D1%8B_%D0%93%D0%B8%D0%B7%D1%8B_qnrqcq.jpg',
    lat: 29.9792,
    lng: 31.1342,
    continent: 'Африка',
    country: 'Египет',
    city: 'Каир',
  },
  {
    id: 'london-bridge',
    name: 'Тower Bridge, Лондон',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779806261/%D0%A2ower_Bridge_%D0%9B%D0%BE%D0%BD%D0%B4%D0%BE%D0%BD_ehlsdv.webp',
    lat: 51.5055,
    lng: -0.0754,
    continent: 'Европа',
    country: 'Великобритания',
    city: 'Лондон',
  },
  {
    id: 'rome-colosseum',
    name: 'Колизей, Рим',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779806259/%D0%9A%D0%BE%D0%BB%D0%B8%D0%B7%D0%B5%D0%B9_%D0%A0%D0%B8%D0%BC_z5h9um.webp',
    lat: 41.8902,
    lng: 12.4922,
    continent: 'Европа',
    country: 'Италия',
    city: 'Рим',
  },
  {
    id: 'peru-machu-picchu',
    name: 'Мачу-Пикchu, Перу',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968355/80_-_Machu_Picchu_-_Juin_2009_-_edit_mum716.jpg',
    lat: -13.1631,
    lng: -72.545,
    continent: 'Южная Америка',
    country: 'Перу',
    city: 'Мачу-Пикchu',
  },
  {
    id: 'rio-christ',
    name: 'Статуя Христа-Искупителя, Рио-де-Жанейро',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968359/Statue-of-Christ-the-Redeemer_ytgapp.jpg',
    lat: -22.9519,
    lng: -43.2105,
    continent: 'Южная Америка',
    country: 'Бразилия',
    city: 'Рио-де-Жанейро',
  },
  {
    id: 'london-big-ben',
    name: 'Биг-Бен, Лондон',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968361/%D0%91%D0%B5%D0%B7_%D0%BD%D0%B0%D0%B7%D0%B2%D0%B0%D0%BD%D0%B8%D1%8F_uspeov.webp',
    lat: 51.5007,
    lng: -0.1246,
    continent: 'Европа',
    country: 'Великобритания',
    city: 'Лондон',
  },
  {
    id: 'barcelona-sagrada',
    name: 'Саграда Фамилия, Барселона',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968355/347117141076008_r9gra5.jpg',
    lat: 41.4036,
    lng: 2.1744,
    continent: 'Европа',
    country: 'Испания',
    city: 'Барселона',
  },
  {
    id: 'berlin-brandenburg',
    name: 'Бранденбургские ворота, Берлин',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968356/Brandenburg-Gate-3_vjw5bn.jpg',
    lat: 52.5163,
    lng: 13.3777,
    continent: 'Европа',
    country: 'Германия',
    city: 'Берлин',
  },
  {
    id: 'athens-acropolis',
    name: 'Акropolis, Афины',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968357/dcfbf731d7991f91d41640ffd032610f-d2cfb372cf3a129c5ee7d6d3945d0580-AdobeStock-129050920copy_kah10c.avif',
    lat: 37.9715,
    lng: 23.7257,
    continent: 'Европа',
    country: 'Греция',
    city: 'Афины',
  },
  {
    id: 'agra-taj-mahal',
    name: 'Тадж-Махал, Агра',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968360/Taj_Mahal__Edited_ngajfl.jpg',
    lat: 27.1751,
    lng: 78.0421,
    continent: 'Азия',
    country: 'Индия',
    city: 'Агра',
  },
  {
    id: 'china-great-wall',
    name: 'Великая Китайская стена',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968354/00_ohnsix.jpg',
    lat: 40.3592,
    lng: 116.0204,
    continent: 'Азия',
    country: 'Китай',
    city: 'Пекин',
  },
  {
    id: 'cambodia-angkor-wat',
    name: 'Angkor Wat, Камбodja',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968355/Angkor_Wat_W-Seite_nsmom1.jpg',
    lat: 13.4125,
    lng: 103.867,
    continent: 'Азия',
    country: 'Камбоджа',
    city: 'Сиемреап',
  },
  {
    id: 'dubai-burj-khalifa',
    name: 'Burj Khalifa, Dubai',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968358/poi-burj-khalifa-3-dtcm-jun-2023_n1znwa.avif',
    lat: 25.1972,
    lng: 55.2744,
    continent: 'Азия',
    country: 'ОАЭ',
    city: 'Дубай',
  },
  {
    id: 'moscow-red-square',
    name: 'Красная площадь, Москва',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968617/s1_lc0slv.jpg',
    lat: 55.7555,
    lng: 37.6176,
    continent: 'Европа',
    country: 'Россия',
    city: 'Москва',
  },
  {
    id: 'sf-golden-gate',
    name: 'Golden Gate Bridge, Сан-Франциско',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968616/iStock-1569136577_0.jpg_y6wcli.webp',
    lat: 37.8199,
    lng: -122.4783,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Сан-Франциско',
  },
  {
    id: 'usa-grand-canyon',
    name: 'Гранд-Каньон, США',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968615/grand-canyon-2_fvke3m.jpg',
    lat: 36.8791,
    lng: -111.5103,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Аризона',
  },
  {
    id: 'niagara-falls',
    name: 'Ниагарский водопад',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968614/320d13c49c3e09e627ff9606975e27ad-Table_Rock_puuqfn.avif',
    lat: 43.0828,
    lng: -79.0742,
    continent: 'Северная Америка',
    country: 'Канада',
    city: 'Ниагара-Фолс',
  },
  {
    id: 'mexico-chichen-itza',
    name: 'Chichen Itza, Мексика',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968697/CC98DF7F7F00010167E2FA9ED2593925_drpzog.jpg',
    lat: 20.6843,
    lng: -88.5678,
    continent: 'Северная Америка',
    country: 'Мексика',
    city: 'Юкатан',
  },
  {
    id: 'canada-moraine-lake',
    name: 'Moraine Lake, Banff',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968613/2022_MoraineLake_TravelAlberta_RothandRamberg-3_y2uwsl.jpg',
    lat: 51.3217,
    lng: -116.1817,
    continent: 'Северная Америка',
    country: 'Канада',
    city: 'Банф',
  },
  {
    id: 'cape-town-table-mountain',
    name: 'Table Mountain, Кейптаун',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968612/CapeTownMountain_700_njsb5u.jpg',
    lat: -33.9628,
    lng: 18.4098,
    continent: 'Африка',
    country: 'ЮАР',
    city: 'Кейптаун',
  },
  {
    id: 'victoria-falls',
    name: 'Водопад Виктория',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968611/victoria_618x216_big_brfau5.jpg',
    lat: -17.9243,
    lng: 25.8572,
    continent: 'Африка',
    country: 'Замбия',
    city: 'Ливингстон',
  },
  {
    id: 'jordan-petra',
    name: 'Petra, Иордания',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968610/petra_swjrie.jpg',
    lat: 30.3285,
    lng: 35.4444,
    continent: 'Азия',
    country: 'Иордания',
    city: 'Петра',
  },
  {
    id: 'greece-santorini',
    name: 'Santorini, Oia',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968609/istockphoto-1145450965-612x612_f0uwm9.jpg',
    lat: 36.4618,
    lng: 25.3753,
    continent: 'Европа',
    country: 'Греция',
    city: 'Санторини',
  },
  {
    id: 'iceland-hallgrimskirkja',
    name: 'Hallgrímskirkja, Reykjavik',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968608/hallgrimskirkja-2_qff0zh.avif',
    lat: 64.142,
    lng: -21.9266,
    continent: 'Европа',
    country: 'Исландия',
    city: 'Рейкьявик',
  },
  {
    id: 'australia-uluru',
    name: 'Uluru, Австралия',
    imageUrl: 'https://res.cloudinary.com/dlbrkdlco/image/upload/v1779968607/uluru_otg53n.jpg',
    lat: -25.3444,
    lng: 131.0369,
    continent: 'Океания',
    country: 'Австралия',
    city: 'Улуру',
  },
];

export const getGeoLocationCount = () => GEO_LOCATIONS.length;

export const getGeoLocation = (locationId: string): GeoLocation | undefined =>
  GEO_LOCATIONS.find((location) => location.id === locationId);

export interface PickNextGeoLocationResult {
  location: GeoLocation;
  usedLocationIds: string[];
}

/** Следующая локация из непройденных; при исчерпании пула — цикл с начала. */
export const pickNextGeoLocation = (usedLocationIds: string[]): PickNextGeoLocationResult | null => {
  if (GEO_LOCATIONS.length === 0) {
    return null;
  }

  let effectiveUsed = usedLocationIds;
  let unused = GEO_LOCATIONS.filter((location) => !effectiveUsed.includes(location.id));

  if (unused.length === 0) {
    effectiveUsed = [];
    unused = GEO_LOCATIONS;
  }

  const location = unused[Math.floor(Math.random() * unused.length)];
  const nextUsed = effectiveUsed.includes(location.id)
    ? effectiveUsed
    : [...effectiveUsed, location.id];

  return { location, usedLocationIds: nextUsed };
};

export const calculateGeoRoundScore = (distanceKm: number): number => {
  if (distanceKm <= 0.05) {
    return GEO_MAX_ROUND_POINTS;
  }

  const score = Math.round(GEO_MAX_ROUND_POINTS * Math.exp(-distanceKm / 1500));
  return Math.max(0, Math.min(GEO_MAX_ROUND_POINTS, score));
};

export const haversineDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
