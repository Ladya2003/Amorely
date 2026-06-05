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
  {
    id: 'nyc-statue-liberty',
    name: 'Статуя Свободы, Нью-Йорк',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780653467/geo-locations/nyc-statue-liberty.jpg',
    lat: 40.6892,
    lng: -74.0444,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Нью-Йорк',
  },
  {
    id: 'vatican-st-peters',
    name: 'Собор Святого Петра, Ватикан',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780653469/geo-locations/vatican-st-peters.jpg',
    lat: 41.9022,
    lng: 12.4534,
    continent: 'Европа',
    country: 'Ватикан',
    city: 'Ватикан',
  },
  {
    id: 'paris-louvre',
    name: 'Лувр, Париж',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780653516/geo-locations/paris-louvre.jpg',
    lat: 48.8611,
    lng: 2.3358,
    continent: 'Европа',
    country: 'Франция',
    city: 'Париж',
  },
  {
    id: 'uk-stonehenge',
    name: 'Стоунхендж, Англия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780653471/geo-locations/uk-stonehenge.jpg',
    lat: 51.1789,
    lng: -1.8261,
    continent: 'Европа',
    country: 'Великобритания',
    city: 'Уилтшир',
  },
  {
    id: 'france-mont-saint-michel',
    name: 'Мон-Сен-Мишель, Франция',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780653473/geo-locations/france-mont-saint-michel.jpg',
    lat: 48.6358,
    lng: -1.5103,
    continent: 'Европа',
    country: 'Франция',
    city: 'Нормандия',
  },
  {
    id: 'germany-neuschwanstein',
    name: 'Замок Нойшванштайн, Германия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780653474/geo-locations/germany-neuschwanstein.jpg',
    lat: 47.5575,
    lng: 10.7494,
    continent: 'Европа',
    country: 'Германия',
    city: 'Бавария',
  },
  {
    id: 'japan-mount-fuji',
    name: 'Гора Фудзи, Япония',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780653476/geo-locations/japan-mount-fuji.jpg',
    lat: 35.3606,
    lng: 138.7275,
    continent: 'Азия',
    country: 'Япония',
    city: 'Хонсю',
  },
  {
    id: 'turkey-blue-mosque',
    name: 'Голубая мечеть, Стамбул',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780653537/geo-locations/turkey-blue-mosque.jpg',
    lat: 41.0054,
    lng: 28.9768,
    continent: 'Азия',
    country: 'Турция',
    city: 'Стамбул',
  },
  {
    id: 'chile-easter-island',
    name: 'Остров Пасхи, Чили',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780653540/geo-locations/chile-easter-island.jpg',
    lat: -27.12,
    lng: -109.35,
    continent: 'Южная Америка',
    country: 'Чили',
    city: 'остров Пасхи',
  },
  {
    id: 'france-versailles',
    name: 'Версальский дворец, Франция',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780653543/geo-locations/france-versailles.jpg',
    lat: 48.8047,
    lng: 2.1203,
    continent: 'Европа',
    country: 'Франция',
    city: 'Версаль',
  },
  {
    id: 'usa-empire-state',
    name: 'Эмпайр-стейт-билдинг, Нью-Йорк',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654163/geo-locations/usa-empire-state.jpg',
    lat: 40.7483,
    lng: -73.9856,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Нью-Йорк',
  },
  {
    id: 'usa-mount-rushmore',
    name: 'Гора Рашмор, США',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654166/geo-locations/usa-mount-rushmore.jpg',
    lat: 43.8789,
    lng: -103.4592,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Южная Дакота',
  },
  {
    id: 'panama-canal',
    name: 'Панамский канал',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654169/geo-locations/panama-canal.jpg',
    lat: 9.12,
    lng: -79.75,
    continent: 'Северная Америка',
    country: 'Панама',
    city: 'Панама',
  },
  {
    id: 'bolivia-salar-uyuni',
    name: 'Солончак Уюни, Боливия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654172/geo-locations/bolivia-salar-uyuni.jpg',
    lat: -20.3333,
    lng: -67.7,
    continent: 'Южная Америка',
    country: 'Боливия',
    city: 'Уюни',
  },
  {
    id: 'argentina-iguazu-falls',
    name: 'Водопад Игуасу',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654651/geo-locations/argentina-iguazu-falls.jpg',
    lat: -25.6953,
    lng: -54.4367,
    continent: 'Южная Америка',
    country: 'Аргентина',
    city: 'Пуэрто-Игуасу',
  },
  {
    id: 'ecuador-galapagos',
    name: 'Галапагосские острова',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654199/geo-locations/ecuador-galapagos.jpg',
    lat: -0.6667,
    lng: -90.55,
    continent: 'Южная Америка',
    country: 'Эквадор',
    city: 'Галапагосы',
  },
  {
    id: 'spain-alhambra',
    name: 'Альгамбра, Гранада',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654201/geo-locations/spain-alhambra.jpg',
    lat: 37.1763,
    lng: -3.5882,
    continent: 'Европа',
    country: 'Испания',
    city: 'Гранада',
  },
  {
    id: 'italy-pisa-tower',
    name: 'Пизанская башня',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654211/geo-locations/italy-pisa-tower.jpg',
    lat: 43.723,
    lng: 10.3966,
    continent: 'Европа',
    country: 'Италия',
    city: 'Пиза',
  },
  {
    id: 'italy-venice-san-marco',
    name: 'Площадь Сан-Марко, Венеция',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654216/geo-locations/italy-venice-san-marco.jpg',
    lat: 45.434,
    lng: 12.338,
    continent: 'Европа',
    country: 'Италия',
    city: 'Венеция',
  },
  {
    id: 'czech-charles-bridge',
    name: 'Карлов мост, Прага',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654656/geo-locations/czech-charles-bridge.jpg',
    lat: 50.0864,
    lng: 14.4119,
    continent: 'Европа',
    country: 'Чехия',
    city: 'Прага',
  },
  {
    id: 'switzerland-matterhorn',
    name: 'Маттерхорн, Швейцария',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654661/geo-locations/switzerland-matterhorn.jpg',
    lat: 45.9764,
    lng: 7.6586,
    continent: 'Европа',
    country: 'Швейцария',
    city: 'Церматт',
  },
  {
    id: 'uk-edinburgh-castle',
    name: 'Эдинбургский замок',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654666/geo-locations/uk-edinburgh-castle.jpg',
    lat: 55.9487,
    lng: -3.2007,
    continent: 'Европа',
    country: 'Великобритания',
    city: 'Эдинбург',
  },
  {
    id: 'france-chambord',
    name: 'Замок Шамбор, Франция',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654291/geo-locations/france-chambord.jpg',
    lat: 47.6161,
    lng: 1.5172,
    continent: 'Европа',
    country: 'Франция',
    city: 'Шамбор',
  },
  {
    id: 'croatia-dubrovnik',
    name: 'Дубровник, Хорватия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654297/geo-locations/croatia-dubrovnik.jpg',
    lat: 42.6403,
    lng: 18.1083,
    continent: 'Европа',
    country: 'Хорватия',
    city: 'Дубровник',
  },
  {
    id: 'turkey-hagia-sophia',
    name: 'Собор Святой Софии, Стамбул',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654300/geo-locations/turkey-hagia-sophia.jpg',
    lat: 41.0083,
    lng: 28.98,
    continent: 'Азия',
    country: 'Турция',
    city: 'Стамбул',
  },
  {
    id: 'china-forbidden-city',
    name: 'Запретный город, Пекин',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654302/geo-locations/china-forbidden-city.jpg',
    lat: 39.9158,
    lng: 116.3908,
    continent: 'Азия',
    country: 'Китай',
    city: 'Пекин',
  },
  {
    id: 'indonesia-borobudur',
    name: 'Боробудур, Индонезия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654305/geo-locations/indonesia-borobudur.jpg',
    lat: -7.6079,
    lng: 110.2038,
    continent: 'Азия',
    country: 'Индонезия',
    city: 'Джокьякарта',
  },
  {
    id: 'korea-gyeongbokgung',
    name: 'Дворец Кёнбоккун, Сеул',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654308/geo-locations/korea-gyeongbokgung.jpg',
    lat: 37.5799,
    lng: 126.9768,
    continent: 'Азия',
    country: 'Южная Корея',
    city: 'Сеул',
  },
  {
    id: 'singapore-marina-bay',
    name: 'Marina Bay Sands, Сингапур',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654317/geo-locations/singapore-marina-bay.jpg',
    lat: 1.2825,
    lng: 103.86,
    continent: 'Азия',
    country: 'Сингапур',
    city: 'Сингапур',
  },
  {
    id: 'australia-great-barrier-reef',
    name: 'Большой Барьерный риф, Австралия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654322/geo-locations/australia-great-barrier-reef.jpg',
    lat: -16.4,
    lng: 145.8,
    continent: 'Океания',
    country: 'Австралия',
    city: 'Квинсленд',
  },
  {
    id: 'france-arc-de-triomphe',
    name: 'Триумфальная арка, Париж',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654876/geo-locations/france-arc-de-triomphe.jpg',
    lat: 48.8738,
    lng: 2.295,
    continent: 'Европа',
    country: 'Франция',
    city: 'Париж',
  },
  {
    id: 'uk-buckingham-palace',
    name: 'Букингемский дворец, Лондон',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654881/geo-locations/uk-buckingham-palace.jpg',
    lat: 51.501,
    lng: -0.142,
    continent: 'Европа',
    country: 'Великобритания',
    city: 'Лондон',
  },
  {
    id: 'canada-cn-tower',
    name: 'CN Tower, Торонто',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654886/geo-locations/canada-cn-tower.jpg',
    lat: 43.6428,
    lng: -79.3871,
    continent: 'Северная Америка',
    country: 'Канада',
    city: 'Торонто',
  },
  {
    id: 'australia-sydney-harbour-bridge',
    name: 'Сиднейский мост, Австралия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654891/geo-locations/australia-sydney-harbour-bridge.jpg',
    lat: -33.8522,
    lng: 151.2107,
    continent: 'Океания',
    country: 'Австралия',
    city: 'Сидней',
  },
  {
    id: 'france-notre-dame',
    name: 'Собор Парижской Богоматери',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655093/geo-locations/france-notre-dame.jpg',
    lat: 48.853,
    lng: 2.3498,
    continent: 'Европа',
    country: 'Франция',
    city: 'Париж',
  },
  {
    id: 'greece-meteora',
    name: 'Метеоры, Греция',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654923/geo-locations/greece-meteora.jpg',
    lat: 39.7125,
    lng: 21.6267,
    continent: 'Европа',
    country: 'Греция',
    city: 'Каламбака',
  },
  {
    id: 'china-terracotta-army',
    name: 'Терракотовая армия, Сиань',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654928/geo-locations/china-terracotta-army.jpg',
    lat: 34.385,
    lng: 109.2731,
    continent: 'Азия',
    country: 'Китай',
    city: 'Сиань',
  },
  {
    id: 'russia-st-basil',
    name: 'Собор Василия Блаженного, Москва',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654933/geo-locations/russia-st-basil.jpg',
    lat: 55.7525,
    lng: 37.6231,
    continent: 'Европа',
    country: 'Россия',
    city: 'Москва',
  },
  {
    id: 'tanzania-kilimanjaro',
    name: 'Килиманджаро, Танзания',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654938/geo-locations/tanzania-kilimanjaro.jpg',
    lat: -3.0667,
    lng: 37.3592,
    continent: 'Африка',
    country: 'Танзания',
    city: 'Килиманджаро',
  },
  {
    id: 'egypt-abu-simbel',
    name: 'Абу-Симбел, Египет',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654943/geo-locations/egypt-abu-simbel.jpg',
    lat: 22.3369,
    lng: 31.6256,
    continent: 'Африка',
    country: 'Египет',
    city: 'Асуан',
  },
  {
    id: 'croatia-plitvice',
    name: 'Национальный парк Плитвицкие озёра',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655103/geo-locations/croatia-plitvice.jpg',
    lat: 44.8804,
    lng: 15.616,
    continent: 'Европа',
    country: 'Хорватия',
    city: 'Плитвице',
  },
  {
    id: 'turkey-pamukkale',
    name: 'Памуккале, Турция',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654985/geo-locations/turkey-pamukkale.jpg',
    lat: 37.9236,
    lng: 29.1223,
    continent: 'Азия',
    country: 'Турция',
    city: 'Денизли',
  },
  {
    id: 'egypt-luxor-temple',
    name: 'Луксорский храм, Египет',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654990/geo-locations/egypt-luxor-temple.jpg',
    lat: 25.7,
    lng: 32.6392,
    continent: 'Африка',
    country: 'Египет',
    city: 'Луксор',
  },
  {
    id: 'usa-hollywood-sign',
    name: 'Знак Голливуда, Лос-Анджелес',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780654996/geo-locations/usa-hollywood-sign.jpg',
    lat: 34.1341,
    lng: -118.3217,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Лос-Анджелес',
  },
  {
    id: 'usa-antelope-canyon',
    name: 'Каньон Антилопы, США',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655001/geo-locations/usa-antelope-canyon.jpg',
    lat: 36.8578,
    lng: -111.3722,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Аризона',
  },
  {
    id: 'slovenia-lake-bled',
    name: 'Озеро Блед, Словения',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655005/geo-locations/slovenia-lake-bled.jpg',
    lat: 46.3644,
    lng: 14.0947,
    continent: 'Европа',
    country: 'Словения',
    city: 'Блед',
  },
  {
    id: 'iceland-seljalandsfoss',
    name: 'Водопад Сельяландсфосс, Исландия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655113/geo-locations/iceland-seljalandsfoss.jpg',
    lat: 63.6158,
    lng: -19.9928,
    continent: 'Европа',
    country: 'Исландия',
    city: 'Южный берег',
  },
  {
    id: 'uk-windsor-castle',
    name: 'Виндзорский замок, Англия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655043/geo-locations/uk-windsor-castle.jpg',
    lat: 51.4839,
    lng: -0.6044,
    continent: 'Европа',
    country: 'Великобритания',
    city: 'Виндзор',
  },
  {
    id: 'japan-fushimi-inari',
    name: 'Храм Фусими Инари, Киото',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655048/geo-locations/japan-fushimi-inari.jpg',
    lat: 34.9672,
    lng: 135.7734,
    continent: 'Азия',
    country: 'Япония',
    city: 'Киото',
  },
  {
    id: 'venezuela-angel-falls',
    name: 'Водопад Анхель, Венесуэла',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655053/geo-locations/venezuela-angel-falls.jpg',
    lat: 5.9701,
    lng: -62.5362,
    continent: 'Южная Америка',
    country: 'Венесуэла',
    city: 'Канайма',
  },
  {
    id: 'iceland-blue-lagoon',
    name: 'Голубая лагуна, Исландия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655355/geo-locations/iceland-blue-lagoon.jpg',
    lat: 63.8792,
    lng: -22.4455,
    continent: 'Европа',
    country: 'Исландия',
    city: 'Гриндавик',
  },
  {
    id: 'japan-himeji-castle',
    name: 'Замок Химэдзи, Япония',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655361/geo-locations/japan-himeji-castle.jpg',
    lat: 34.8394,
    lng: 134.6936,
    continent: 'Азия',
    country: 'Япония',
    city: 'Химэдзи',
  },
  {
    id: 'malaysia-petronas',
    name: 'Башни Петронас, Куала-Лумпур',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655366/geo-locations/malaysia-petronas.jpg',
    lat: 3.1578,
    lng: 101.7117,
    continent: 'Азия',
    country: 'Малайзия',
    city: 'Куала-Лумпур',
  },
  {
    id: 'taiwan-taipei-101',
    name: 'Тайбэй 101, Тайвань',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655370/geo-locations/taiwan-taipei-101.jpg',
    lat: 25.0336,
    lng: 121.5647,
    continent: 'Азия',
    country: 'Тайвань',
    city: 'Тайбэй',
  },
  {
    id: 'myanmar-bagan',
    name: 'Баган, Мьянма',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655375/geo-locations/myanmar-bagan.jpg',
    lat: 21.1725,
    lng: 94.86,
    continent: 'Азия',
    country: 'Мьянма',
    city: 'Баган',
  },
  {
    id: 'vietnam-ha-long-bay',
    name: 'Залив Халонг, Вьетнам',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655380/geo-locations/vietnam-ha-long-bay.jpg',
    lat: 20.9,
    lng: 107.2,
    continent: 'Азия',
    country: 'Вьетнам',
    city: 'Халонг',
  },
  {
    id: 'bhutan-tigers-nest',
    name: 'Монастырь Тигриное гнездо, Бутан',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655385/geo-locations/bhutan-tigers-nest.jpg',
    lat: 27.4917,
    lng: 89.3633,
    continent: 'Азия',
    country: 'Бутан',
    city: 'Паро',
  },
  {
    id: 'hungary-parliament',
    name: 'Здание парламента, Будапешт',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655390/geo-locations/hungary-parliament.jpg',
    lat: 47.5069,
    lng: 19.0456,
    continent: 'Европа',
    country: 'Венгрия',
    city: 'Будапешт',
  },
  {
    id: 'italy-pompeii',
    name: 'Помпеи, Италия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655394/geo-locations/italy-pompeii.jpg',
    lat: 40.7506,
    lng: 14.4897,
    continent: 'Европа',
    country: 'Италия',
    city: 'Помпеи',
  },
  {
    id: 'ireland-giants-causeway',
    name: 'Дорога гигантов, Ирландия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655399/geo-locations/ireland-giants-causeway.jpg',
    lat: 55.2408,
    lng: -6.5117,
    continent: 'Европа',
    country: 'Ирландия',
    city: 'Антрим',
  },
  {
    id: 'ireland-cliffs-moher',
    name: 'Утёсы Мохер, Ирландия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655404/geo-locations/ireland-cliffs-moher.jpg',
    lat: 52.9361,
    lng: -9.4708,
    continent: 'Европа',
    country: 'Ирландия',
    city: 'Клэр',
  },
  {
    id: 'norway-geirangerfjord',
    name: 'Гейрангер-фьорд, Норвегия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655409/geo-locations/norway-geirangerfjord.jpg',
    lat: 62.0944,
    lng: 7.0806,
    continent: 'Европа',
    country: 'Норвегия',
    city: 'Гейрангер',
  },
  {
    id: 'usa-old-faithful',
    name: 'Старый Верный, Йеллоустоун',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655414/geo-locations/usa-old-faithful.jpg',
    lat: 44.4605,
    lng: -110.8281,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Вайоминг',
  },
  {
    id: 'usa-monument-valley',
    name: 'Долина монументов, США',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655419/geo-locations/usa-monument-valley.jpg',
    lat: 36.9833,
    lng: -110.1,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Аризона',
  },
  {
    id: 'canada-parliament-hill',
    name: 'Парламентский холм, Оттава',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655424/geo-locations/canada-parliament-hill.jpg',
    lat: 45.4247,
    lng: -75.6994,
    continent: 'Северная Америка',
    country: 'Канада',
    city: 'Оттава',
  },
  {
    id: 'australia-bondi-beach',
    name: 'Пляж Бонди, Сидней',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655429/geo-locations/australia-bondi-beach.jpg',
    lat: -33.8911,
    lng: 151.2742,
    continent: 'Океания',
    country: 'Австралия',
    city: 'Сидней',
  },
  {
    id: 'morocco-jemaa-el-fnaa',
    name: 'Площадь Джема-эль-Фна, Марракеш',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655433/geo-locations/morocco-jemaa-el-fnaa.jpg',
    lat: 31.626,
    lng: -7.9891,
    continent: 'Африка',
    country: 'Марокко',
    city: 'Марракеш',
  },
  {
    id: 'india-golden-temple',
    name: 'Золотой храм, Амритсар',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655438/geo-locations/india-golden-temple.jpg',
    lat: 31.62,
    lng: 74.8767,
    continent: 'Азия',
    country: 'Индия',
    city: 'Амритсар',
  },
  {
    id: 'indonesia-tanah-lot',
    name: 'Храм Танах Лот, Бали',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655444/geo-locations/indonesia-tanah-lot.jpg',
    lat: -8.6211,
    lng: 115.0867,
    continent: 'Азия',
    country: 'Индонезия',
    city: 'Бали',
  },
  {
    id: 'hong-kong-victoria-harbour',
    name: 'Гавань Виктория, Гонконг',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655449/geo-locations/hong-kong-victoria-harbour.jpg',
    lat: 22.29,
    lng: 114.17,
    continent: 'Азия',
    country: 'Китай',
    city: 'Гонконг',
  },
  {
    id: 'usa-space-needle',
    name: 'Спейс Нидл, Сиэтл',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655613/geo-locations/usa-space-needle.jpg',
    lat: 47.6204,
    lng: -122.3491,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Сиэтл',
  },
  {
    id: 'belize-great-blue-hole',
    name: 'Большая голубая дыра, Белиз',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655618/geo-locations/belize-great-blue-hole.jpg',
    lat: 17.3156,
    lng: -87.5344,
    continent: 'Северная Америка',
    country: 'Белиз',
    city: 'Лайтхаус-Риф',
  },
  {
    id: 'guatemala-tikal',
    name: 'Тикаль, Гватемала',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655623/geo-locations/guatemala-tikal.jpg',
    lat: 17.2221,
    lng: -89.6236,
    continent: 'Северная Америка',
    country: 'Гватемала',
    city: 'Тикаль',
  },
  {
    id: 'cuba-old-havana',
    name: 'Старая Гавана, Куба',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655628/geo-locations/cuba-old-havana.jpg',
    lat: 23.1359,
    lng: -82.3583,
    continent: 'Северная Америка',
    country: 'Куба',
    city: 'Гавана',
  },
  {
    id: 'colombia-cartagena',
    name: 'Картахена, Колумбия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655634/geo-locations/colombia-cartagena.jpg',
    lat: 10.4236,
    lng: -75.5253,
    continent: 'Южная Америка',
    country: 'Колумбия',
    city: 'Картахена',
  },
  {
    id: 'brazil-sugarloaf',
    name: 'Сахарная голова, Рио-де-Жанейро',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655639/geo-locations/brazil-sugarloaf.jpg',
    lat: -22.9494,
    lng: -43.1567,
    continent: 'Южная Америка',
    country: 'Бразилия',
    city: 'Рио-де-Жанейро',
  },
  {
    id: 'mexico-bellas-artes',
    name: 'Дворец изящных искусств, Мехико',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655644/geo-locations/mexico-bellas-artes.jpg',
    lat: 19.4353,
    lng: -99.1414,
    continent: 'Северная Америка',
    country: 'Мексика',
    city: 'Мехико',
  },
  {
    id: 'chile-torres-del-paine',
    name: 'Торрес-дель-Пайне, Чили',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655650/geo-locations/chile-torres-del-paine.jpg',
    lat: -50.9831,
    lng: -72.9664,
    continent: 'Южная Америка',
    country: 'Чили',
    city: 'Патагония',
  },
  {
    id: 'peru-lake-titicaca',
    name: 'Озеро Титикака',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655655/geo-locations/peru-lake-titicaca.jpg',
    lat: -15.825,
    lng: -69.325,
    continent: 'Южная Америка',
    country: 'Перу',
    city: 'Пуно',
  },
  {
    id: 'italy-trevi-fountain',
    name: 'Фонтан Треви, Рим',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655661/geo-locations/italy-trevi-fountain.jpg',
    lat: 41.9008,
    lng: 12.4831,
    continent: 'Европа',
    country: 'Италия',
    city: 'Рим',
  },
  {
    id: 'italy-florence-duomo',
    name: 'Собор Санта-Мария-дель-Фьоре, Флоренция',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655666/geo-locations/italy-florence-duomo.jpg',
    lat: 43.7731,
    lng: 11.2569,
    continent: 'Европа',
    country: 'Италия',
    city: 'Флоренция',
  },
  {
    id: 'italy-cinque-terre',
    name: 'Чинкве-Терре, Италия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655671/geo-locations/italy-cinque-terre.jpg',
    lat: 44.1269,
    lng: 9.7094,
    continent: 'Европа',
    country: 'Италия',
    city: 'Лигурия',
  },
  {
    id: 'greece-knossos',
    name: 'Кносский дворец, Крит',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655677/geo-locations/greece-knossos.jpg',
    lat: 35.298,
    lng: 25.1632,
    continent: 'Европа',
    country: 'Греция',
    city: 'Крит',
  },
  {
    id: 'greece-delphi',
    name: 'Дельфы, Греция',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655682/geo-locations/greece-delphi.jpg',
    lat: 38.4833,
    lng: 22.5,
    continent: 'Европа',
    country: 'Греция',
    city: 'Дельфы',
  },
  {
    id: 'germany-cologne-cathedral',
    name: 'Кёльнский собор, Германия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655688/geo-locations/germany-cologne-cathedral.jpg',
    lat: 50.9414,
    lng: 6.9583,
    continent: 'Европа',
    country: 'Германия',
    city: 'Кёльн',
  },
  {
    id: 'austria-schonbrunn',
    name: 'Дворец Шёнбрунн, Вена',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655693/geo-locations/austria-schonbrunn.jpg',
    lat: 48.1848,
    lng: 16.3123,
    continent: 'Европа',
    country: 'Австрия',
    city: 'Вена',
  },
  {
    id: 'austria-hallstatt',
    name: 'Халльштатт, Австрия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655698/geo-locations/austria-hallstatt.jpg',
    lat: 47.5558,
    lng: 13.6467,
    continent: 'Европа',
    country: 'Австрия',
    city: 'Халльштатт',
  },
  {
    id: 'montenegro-kotor',
    name: 'Котор, Черногория',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655703/geo-locations/montenegro-kotor.jpg',
    lat: 42.4254,
    lng: 18.7712,
    continent: 'Европа',
    country: 'Черногория',
    city: 'Котор',
  },
  {
    id: 'romania-bran-castle',
    name: 'Замок Бран, Румыния',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655708/geo-locations/romania-bran-castle.jpg',
    lat: 45.515,
    lng: 25.3671,
    continent: 'Европа',
    country: 'Румыния',
    city: 'Бран',
  },
  {
    id: 'norway-preikestolen',
    name: 'Прекестулен, Норвегия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655714/geo-locations/norway-preikestolen.jpg',
    lat: 58.9867,
    lng: 6.1875,
    continent: 'Европа',
    country: 'Норвегия',
    city: 'Ставангер',
  },
  {
    id: 'uk-palace-westminster',
    name: 'Вестминстерский дворец, Лондон',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655719/geo-locations/uk-palace-westminster.jpg',
    lat: 51.4994,
    lng: -0.1242,
    continent: 'Европа',
    country: 'Великобритания',
    city: 'Лондон',
  },
  {
    id: 'uk-tower-london',
    name: 'Лондонский Тауэр',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655725/geo-locations/uk-tower-london.jpg',
    lat: 51.5082,
    lng: -0.0762,
    continent: 'Европа',
    country: 'Великобритания',
    city: 'Лондон',
  },
  {
    id: 'turkey-cappadocia',
    name: 'Каппадокия, Турция',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655730/geo-locations/turkey-cappadocia.jpg',
    lat: 38.6706,
    lng: 34.8392,
    continent: 'Азия',
    country: 'Турция',
    city: 'Гёреме',
  },
  {
    id: 'turkey-ephesus',
    name: 'Эфес, Турция',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655735/geo-locations/turkey-ephesus.jpg',
    lat: 37.9397,
    lng: 27.3486,
    continent: 'Азия',
    country: 'Турция',
    city: 'Сельчук',
  },
  {
    id: 'russia-lake-baikal',
    name: 'Озеро Байкал, Россия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655740/geo-locations/russia-lake-baikal.jpg',
    lat: 53.3028,
    lng: 108.0047,
    continent: 'Азия',
    country: 'Россия',
    city: 'Иркутск',
  },
  {
    id: 'russia-peterhof',
    name: 'Петергоф, Россия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655746/geo-locations/russia-peterhof.jpg',
    lat: 59.8863,
    lng: 29.9097,
    continent: 'Европа',
    country: 'Россия',
    city: 'Петергоф',
  },
  {
    id: 'japan-kinkaku-ji',
    name: 'Золотой павильон, Киото',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655751/geo-locations/japan-kinkaku-ji.jpg',
    lat: 35.0395,
    lng: 135.7285,
    continent: 'Азия',
    country: 'Япония',
    city: 'Киото',
  },
  {
    id: 'china-zhangjiajie',
    name: 'Национальный парк Чжанцзяцзе',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655756/geo-locations/china-zhangjiajie.jpg',
    lat: 29.3274,
    lng: 110.416,
    continent: 'Азия',
    country: 'Китай',
    city: 'Чжанцзяцзе',
  },
  {
    id: 'china-leshan-buddha',
    name: 'Будда Лэшань, Китай',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655761/geo-locations/china-leshan-buddha.jpg',
    lat: 29.5469,
    lng: 103.7692,
    continent: 'Азия',
    country: 'Китай',
    city: 'Лэшань',
  },
  {
    id: 'indonesia-mount-bromo',
    name: 'Вулкан Бромо, Индонезия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655767/geo-locations/indonesia-mount-bromo.jpg',
    lat: -7.9431,
    lng: 112.9539,
    continent: 'Азия',
    country: 'Индонезия',
    city: 'Джава',
  },
  {
    id: 'philippines-chocolate-hills',
    name: 'Шоколадные холмы, Филиппины',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655772/geo-locations/philippines-chocolate-hills.jpg',
    lat: 9.9167,
    lng: 124.1667,
    continent: 'Азия',
    country: 'Филиппины',
    city: 'Бохоль',
  },
  {
    id: 'thailand-wat-arun',
    name: 'Храм Рассвета, Бангкок',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655778/geo-locations/thailand-wat-arun.jpg',
    lat: 13.7437,
    lng: 100.4889,
    continent: 'Азия',
    country: 'Таиланд',
    city: 'Бангкок',
  },
  {
    id: 'sri-lanka-sigiriya',
    name: 'Сигирия, Шри-Ланка',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655783/geo-locations/sri-lanka-sigiriya.jpg',
    lat: 7.9569,
    lng: 80.7597,
    continent: 'Азия',
    country: 'Шри-Ланка',
    city: 'Сигирия',
  },
  {
    id: 'iran-naqsh-jahan',
    name: 'Площадь Накш-э-Джахан, Исфахан',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655788/geo-locations/iran-naqsh-jahan.jpg',
    lat: 32.6582,
    lng: 51.6773,
    continent: 'Азия',
    country: 'Иран',
    city: 'Исфахан',
  },
  {
    id: 'uzbekistan-samarkand',
    name: 'Самарканд, Узбекистан',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655793/geo-locations/uzbekistan-samarkand.jpg',
    lat: 39.6547,
    lng: 66.9758,
    continent: 'Азия',
    country: 'Узбекистан',
    city: 'Самарканд',
  },
  {
    id: 'tanzania-serengeti',
    name: 'Серенгети, Танзания',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655800/geo-locations/tanzania-serengeti.jpg',
    lat: -2.4,
    lng: 34.6,
    continent: 'Африка',
    country: 'Танзания',
    city: 'Серенгети',
  },
  {
    id: 'ethiopia-lalibela',
    name: 'Лалибела, Эфиопия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655805/geo-locations/ethiopia-lalibela.jpg',
    lat: 12.0356,
    lng: 39.0462,
    continent: 'Африка',
    country: 'Эфиопия',
    city: 'Лалибела',
  },
  {
    id: 'kenya-maasai-mara',
    name: 'Масаи-Мара, Кения',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655810/geo-locations/kenya-maasai-mara.jpg',
    lat: -1.49,
    lng: 35.14,
    continent: 'Африка',
    country: 'Кения',
    city: 'Найроби',
  },
  {
    id: 'namibia-sossusvlei',
    name: 'Соссусвлей, Намибия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655815/geo-locations/namibia-sossusvlei.jpg',
    lat: -24.7398,
    lng: 15.2876,
    continent: 'Африка',
    country: 'Намибия',
    city: 'Науклюфт',
  },
  {
    id: 'new-zealand-milford-sound',
    name: 'Милфорд-Саунд, Новая Зеландия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655821/geo-locations/new-zealand-milford-sound.jpg',
    lat: -44.6167,
    lng: 167.8667,
    continent: 'Океания',
    country: 'Новая Зеландия',
    city: 'Фьордленд',
  },
  {
    id: 'australia-great-ocean-road',
    name: 'Большая океанская дорога, Австралия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780655826/geo-locations/australia-great-ocean-road.jpg',
    lat: -38.7339,
    lng: 143.6872,
    continent: 'Океания',
    country: 'Австралия',
    city: 'Виктория',
  },
  {
    id: 'usa-yosemite',
    name: 'Йосемити, США',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657179/geo-locations/usa-yosemite.jpg',
    lat: 37.7425,
    lng: -119.5375,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Калифорния',
  },
  {
    id: 'canada-quebec-city',
    name: 'Квебек, Канада',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657185/geo-locations/canada-quebec-city.jpg',
    lat: 46.8161,
    lng: -71.2242,
    continent: 'Северная Америка',
    country: 'Канада',
    city: 'Квебек',
  },
  {
    id: 'guatemala-antigua',
    name: 'Антигуа, Гватемала',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657192/geo-locations/guatemala-antigua.jpg',
    lat: 14.5575,
    lng: -90.7333,
    continent: 'Северная Америка',
    country: 'Гватемала',
    city: 'Антигуа',
  },
  {
    id: 'mexico-teotihuacan',
    name: 'Теотиуакан, Мексика',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657198/geo-locations/mexico-teotihuacan.jpg',
    lat: 19.6925,
    lng: -98.8439,
    continent: 'Северная Америка',
    country: 'Мексика',
    city: 'Теотиуакан',
  },
  {
    id: 'chile-atacama',
    name: 'Салар-де-Атакама, Чили',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657203/geo-locations/chile-atacama.jpg',
    lat: -23.4167,
    lng: -68.2667,
    continent: 'Южная Америка',
    country: 'Чили',
    city: 'Атакама',
  },
  {
    id: 'brazil-amazon-theatre',
    name: 'Амазонский театр, Манаус',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657209/geo-locations/brazil-amazon-theatre.jpg',
    lat: -3.1303,
    lng: -60.0233,
    continent: 'Южная Америка',
    country: 'Бразилия',
    city: 'Манаус',
  },
  {
    id: 'italy-milan-cathedral',
    name: 'Миланский собор, Италия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657216/geo-locations/italy-milan-cathedral.jpg',
    lat: 45.464,
    lng: 9.1906,
    continent: 'Европа',
    country: 'Италия',
    city: 'Милан',
  },
  {
    id: 'italy-positano',
    name: 'Позитано, Италия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657221/geo-locations/italy-positano.jpg',
    lat: 40.6278,
    lng: 14.4819,
    continent: 'Европа',
    country: 'Италия',
    city: 'Позитано',
  },
  {
    id: 'greece-olympia',
    name: 'Олимпия, Греция',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657227/geo-locations/greece-olympia.jpg',
    lat: 37.6383,
    lng: 21.63,
    continent: 'Европа',
    country: 'Греция',
    city: 'Олимпия',
  },
  {
    id: 'greece-mykonos',
    name: 'Миконос, Греция',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657232/geo-locations/greece-mykonos.jpg',
    lat: 37.45,
    lng: 25.3333,
    continent: 'Европа',
    country: 'Греция',
    city: 'Миконос',
  },
  {
    id: 'germany-heidelberg',
    name: 'Замок Гейдельберг, Германия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657238/geo-locations/germany-heidelberg.jpg',
    lat: 49.4106,
    lng: 8.7158,
    continent: 'Европа',
    country: 'Германия',
    city: 'Гейдельберг',
  },
  {
    id: 'switzerland-jungfrau',
    name: 'Юнгфрау, Швейцария',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657243/geo-locations/switzerland-jungfrau.jpg',
    lat: 46.5369,
    lng: 7.9625,
    continent: 'Европа',
    country: 'Швейцария',
    city: 'Интерлакен',
  },
  {
    id: 'austria-vienna-st-stephen',
    name: 'Собор Святого Стефана, Вена',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657249/geo-locations/austria-vienna-st-stephen.jpg',
    lat: 48.2084,
    lng: 16.3733,
    continent: 'Европа',
    country: 'Австрия',
    city: 'Вена',
  },
  {
    id: 'poland-wawel',
    name: 'Вавельский замок, Краков',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657255/geo-locations/poland-wawel.jpg',
    lat: 50.0544,
    lng: 19.9366,
    continent: 'Европа',
    country: 'Польша',
    city: 'Краков',
  },
  {
    id: 'bosnia-stari-most',
    name: 'Старый мост, Мостар',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657260/geo-locations/bosnia-stari-most.jpg',
    lat: 43.3373,
    lng: 17.815,
    continent: 'Европа',
    country: 'Босния и Герцеговина',
    city: 'Мостар',
  },
  {
    id: 'estonia-tallinn',
    name: 'Старый город Таллина',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657266/geo-locations/estonia-tallinn.jpg',
    lat: 59.4372,
    lng: 24.7453,
    continent: 'Европа',
    country: 'Эстония',
    city: 'Таллин',
  },
  {
    id: 'denmark-nyhavn',
    name: 'Нюхавн, Копенгаген',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657271/geo-locations/denmark-nyhavn.jpg',
    lat: 55.6799,
    lng: 12.5904,
    continent: 'Европа',
    country: 'Дания',
    city: 'Копенгаген',
  },
  {
    id: 'norway-lofoten',
    name: 'Лофотенские острова, Норвегия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657276/geo-locations/norway-lofoten.jpg',
    lat: 68.3331,
    lng: 14.6664,
    continent: 'Европа',
    country: 'Норвегия',
    city: 'Лофотены',
  },
  {
    id: 'norway-trolltunga',
    name: 'Тролльязык, Норвегия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657283/geo-locations/norway-trolltunga.jpg',
    lat: 60.1242,
    lng: 6.74,
    continent: 'Европа',
    country: 'Норвегия',
    city: 'Ода',
  },
  {
    id: 'malta-valletta',
    name: 'Валлетта, Мальта',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657288/geo-locations/malta-valletta.jpg',
    lat: 35.8978,
    lng: 14.5125,
    continent: 'Европа',
    country: 'Мальта',
    city: 'Валлетта',
  },
  {
    id: 'russia-catherine-palace',
    name: 'Екатерининский дворец, Царское Село',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657294/geo-locations/russia-catherine-palace.jpg',
    lat: 59.716,
    lng: 30.3956,
    continent: 'Европа',
    country: 'Россия',
    city: 'Пушкин',
  },
  {
    id: 'china-summer-palace',
    name: 'Летний дворец, Пекин',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657299/geo-locations/china-summer-palace.jpg',
    lat: 39.9975,
    lng: 116.2689,
    continent: 'Азия',
    country: 'Китай',
    city: 'Пекин',
  },
  {
    id: 'india-gateway-of-india',
    name: 'Ворота Индии, Мумбаи',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657305/geo-locations/india-gateway-of-india.jpg',
    lat: 18.9218,
    lng: 72.8347,
    continent: 'Азия',
    country: 'Индия',
    city: 'Мумбаи',
  },
  {
    id: 'india-red-fort',
    name: 'Красный форт, Дели',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657310/geo-locations/india-red-fort.jpg',
    lat: 28.6558,
    lng: 77.2403,
    continent: 'Азия',
    country: 'Индия',
    city: 'Дели',
  },
  {
    id: 'india-lotus-temple',
    name: 'Храм Лотоса, Дели',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657316/geo-locations/india-lotus-temple.jpg',
    lat: 28.5533,
    lng: 77.2586,
    continent: 'Азия',
    country: 'Индия',
    city: 'Дели',
  },
  {
    id: 'pakistan-badshahi',
    name: 'Бадшахи-мечеть, Лахор',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657321/geo-locations/pakistan-badshahi.jpg',
    lat: 31.5881,
    lng: 74.3094,
    continent: 'Азия',
    country: 'Пакистан',
    city: 'Лахор',
  },
  {
    id: 'iran-persepolis',
    name: 'Персеполь, Иран',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657326/geo-locations/iran-persepolis.jpg',
    lat: 29.935,
    lng: 52.89,
    continent: 'Азия',
    country: 'Иран',
    city: 'Шираз',
  },
  {
    id: 'thailand-ayutthaya',
    name: 'Аюттхая, Таиланд',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657331/geo-locations/thailand-ayutthaya.jpg',
    lat: 14.3516,
    lng: 100.5575,
    continent: 'Азия',
    country: 'Таиланд',
    city: 'Аюттхая',
  },
  {
    id: 'philippines-banaue',
    name: 'Рисовые террасы Банауэ',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657337/geo-locations/philippines-banaue.jpg',
    lat: 16.9347,
    lng: 121.1347,
    continent: 'Азия',
    country: 'Филиппины',
    city: 'Банауэ',
  },
  {
    id: 'indonesia-komodo',
    name: 'Остров Комодо, Индонезия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657342/geo-locations/indonesia-komodo.jpg',
    lat: -8.5769,
    lng: 119.4511,
    continent: 'Азия',
    country: 'Индонезия',
    city: 'Комодо',
  },
  {
    id: 'japan-osaka-castle',
    name: 'Замок Осаки, Япония',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657348/geo-locations/japan-osaka-castle.jpg',
    lat: 34.6872,
    lng: 135.5258,
    continent: 'Азия',
    country: 'Япония',
    city: 'Осака',
  },
  {
    id: 'japan-todai-ji',
    name: 'Храм Тодайдзи, Нара',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657353/geo-locations/japan-todai-ji.jpg',
    lat: 34.6892,
    lng: 135.8397,
    continent: 'Азия',
    country: 'Япония',
    city: 'Нара',
  },
  {
    id: 'oman-grand-mosque',
    name: 'Большая мечеть султана Кабуса, Оман',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657359/geo-locations/oman-grand-mosque.jpg',
    lat: 23.5839,
    lng: 58.3892,
    continent: 'Азия',
    country: 'Оман',
    city: 'Маскат',
  },
  {
    id: 'israel-western-wall',
    name: 'Стена Плача, Иерусалим',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657365/geo-locations/israel-western-wall.jpg',
    lat: 31.7769,
    lng: 35.2343,
    continent: 'Азия',
    country: 'Израиль',
    city: 'Иерусалим',
  },
  {
    id: 'tunisia-sidi-bou-said',
    name: 'Сиди-Бу-Саид, Тунис',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657370/geo-locations/tunisia-sidi-bou-said.jpg',
    lat: 36.8698,
    lng: 10.341,
    continent: 'Африка',
    country: 'Тунис',
    city: 'Сиди-Бу-Саид',
  },
  {
    id: 'south-africa-kruger',
    name: 'Национальный парк Крюгера',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657376/geo-locations/south-africa-kruger.jpg',
    lat: -24.0114,
    lng: 31.4853,
    continent: 'Африка',
    country: 'ЮАР',
    city: 'Мпумаланга',
  },
  {
    id: 'botswana-okavango',
    name: 'Дельта Окаванго, Ботсвана',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657382/geo-locations/botswana-okavango.jpg',
    lat: -19.4,
    lng: 22.9,
    continent: 'Африка',
    country: 'Ботсвана',
    city: 'Окаванго',
  },
  {
    id: 'australia-blue-mountains',
    name: 'Голубые горы, Австралия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657387/geo-locations/australia-blue-mountains.jpg',
    lat: -33.6,
    lng: 150.35,
    continent: 'Океания',
    country: 'Австралия',
    city: 'Новый Южный Уэльс',
  },
  {
    id: 'new-zealand-abel-tasman',
    name: 'Национальный парк Абель-Тасман',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657393/geo-locations/new-zealand-abel-tasman.jpg',
    lat: -40.9,
    lng: 172.9715,
    continent: 'Океания',
    country: 'Новая Зеландия',
    city: 'Нельсон',
  },
  {
    id: 'french-polynesia-bora-bora',
    name: 'Бора-Бора, Французская Полинезия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657399/geo-locations/french-polynesia-bora-bora.jpg',
    lat: -16.498,
    lng: -151.736,
    continent: 'Океания',
    country: 'Франция',
    city: 'Бора-Бора',
  },
  {
    id: 'usa-death-valley',
    name: 'Долина Смерти, США',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657576/geo-locations/usa-death-valley.jpg',
    lat: 36.45,
    lng: -116.85,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Калифорния',
  },
  {
    id: 'usa-bryce-canyon',
    name: 'Каньон Брайс, США',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657581/geo-locations/usa-bryce-canyon.jpg',
    lat: 37.64,
    lng: -112.17,
    continent: 'Северная Америка',
    country: 'США',
    city: 'Юта',
  },
  {
    id: 'canada-banff',
    name: 'Национальный парк Банф',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657587/geo-locations/canada-banff.jpg',
    lat: 51.1667,
    lng: -115.55,
    continent: 'Северная Америка',
    country: 'Канада',
    city: 'Альберта',
  },
  {
    id: 'peru-rainbow-mountain',
    name: 'Радужная гора Виникунка',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657592/geo-locations/peru-rainbow-mountain.jpg',
    lat: -13.8695,
    lng: -71.303,
    continent: 'Южная Америка',
    country: 'Перу',
    city: 'Куско',
  },
  {
    id: 'spain-seville-cathedral',
    name: 'Севильский собор, Испания',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657598/geo-locations/spain-seville-cathedral.jpg',
    lat: 37.3857,
    lng: -5.9931,
    continent: 'Европа',
    country: 'Испания',
    city: 'Севилья',
  },
  {
    id: 'spain-segovia-aqueduct',
    name: 'Акведук Сеговии, Испания',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657604/geo-locations/spain-segovia-aqueduct.jpg',
    lat: 40.9479,
    lng: -4.1178,
    continent: 'Европа',
    country: 'Испания',
    city: 'Сеговия',
  },
  {
    id: 'portugal-jeronimos',
    name: 'Монастырь Жеронимуш, Лиссабон',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657609/geo-locations/portugal-jeronimos.jpg',
    lat: 38.6978,
    lng: -9.2056,
    continent: 'Европа',
    country: 'Португалия',
    city: 'Лиссабон',
  },
  {
    id: 'belgium-bruges',
    name: 'Брюгге, Бельгия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657615/geo-locations/belgium-bruges.jpg',
    lat: 51.2089,
    lng: 3.2242,
    continent: 'Европа',
    country: 'Бельгия',
    city: 'Брюгге',
  },
  {
    id: 'latvia-riga',
    name: 'Рига, Латвия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657620/geo-locations/latvia-riga.jpg',
    lat: 56.9475,
    lng: 24.1069,
    continent: 'Европа',
    country: 'Латвия',
    city: 'Рига',
  },
  {
    id: 'scotland-old-man-storr',
    name: 'Старый человек Сторр, Шотландия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657625/geo-locations/scotland-old-man-storr.jpg',
    lat: 57.5068,
    lng: -6.1747,
    continent: 'Европа',
    country: 'Великобритания',
    city: 'Остров Скай',
  },
  {
    id: 'china-potala-palace',
    name: 'Дворец Потала, Тибет',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657631/geo-locations/china-potala-palace.jpg',
    lat: 29.6578,
    lng: 91.1169,
    continent: 'Азия',
    country: 'Китай',
    city: 'Лхаса',
  },
  {
    id: 'china-lijiang',
    name: 'Старый город Лицзян',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657636/geo-locations/china-lijiang.jpg',
    lat: 26.8808,
    lng: 100.2208,
    continent: 'Азия',
    country: 'Китай',
    city: 'Лицзян',
  },
  {
    id: 'cambodia-bayon',
    name: 'Храм Байон, Ангкор',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657642/geo-locations/cambodia-bayon.jpg',
    lat: 13.4413,
    lng: 103.8587,
    continent: 'Азия',
    country: 'Камбоджа',
    city: 'Сиемреап',
  },
  {
    id: 'laos-luang-prabang',
    name: 'Луангпхабанг, Лаос',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657647/geo-locations/laos-luang-prabang.jpg',
    lat: 19.89,
    lng: 102.1347,
    continent: 'Азия',
    country: 'Лаос',
    city: 'Луангпхабанг',
  },
  {
    id: 'jordan-wadi-rum',
    name: 'Вади-Рам, Иордания',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657783/geo-locations/jordan-wadi-rum.jpg',
    lat: 29.5765,
    lng: 35.4199,
    continent: 'Азия',
    country: 'Иордания',
    city: 'Вади-Рам',
  },
  {
    id: 'morocco-majorelle',
    name: 'Сад Мажорель, Марракеш',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657657/geo-locations/morocco-majorelle.jpg',
    lat: 31.6415,
    lng: -8.0029,
    continent: 'Африка',
    country: 'Марокко',
    city: 'Марракеш',
  },
  {
    id: 'zimbabwe-great-zimbabwe',
    name: 'Великий Зимбабве',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657662/geo-locations/zimbabwe-great-zimbabwe.jpg',
    lat: -20.27,
    lng: 30.933,
    continent: 'Африка',
    country: 'Зимбабве',
    city: 'Масвинго',
  },
  {
    id: 'new-zealand-hobbiton',
    name: 'Хоббитон, Новая Зеландия',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657668/geo-locations/new-zealand-hobbiton.jpg',
    lat: -37.8575,
    lng: 175.6797,
    continent: 'Океания',
    country: 'Новая Зеландия',
    city: 'Матамата',
  },
  {
    id: 'usa-hawaii-volcanoes',
    name: 'Вулканический парк Гавайи',
    imageUrl:
      'https://res.cloudinary.com/dlbrkdlco/image/upload/v1780657673/geo-locations/usa-hawaii-volcanoes.jpg',
    lat: 19.4008,
    lng: -155.1236,
    continent: 'Океания',
    country: 'США',
    city: 'Гавайи',
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
