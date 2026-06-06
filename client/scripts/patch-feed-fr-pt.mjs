import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../src/locales');

const patch = (locale, status, milestones, achievements) => {
  const filePath = path.join(localesDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  data.feed.status = status;
  data.feed.milestones = milestones;
  data.feed.achievements = achievements;
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const mkM = (items, description) =>
  Object.fromEntries(items.map(([id, title]) => [id, { title, description }]));

const mkA = (items) =>
  Object.fromEntries(items.map(([id, title, description]) => [id, { title, description }]));

patch(
  'fr',
  {
    lt3: "Le tout début de notre histoire d'amour 💕",
    lt7: 'Les premiers jours magiques ensemble ✨',
    lt14: 'Semaine après semaine, on se découvre 🌸',
    lt30: 'Le premier mois de moments inoubliables 🌟',
    lt60: 'Deux mois de bonheur et de papillons 🦋',
    lt90: "Trois mois d'amour et de tendresse 💑",
    lt120: 'Quatre mois ensemble — notre petit monde 🌍',
    lt180: "Six mois d'amour et de compréhension 💝",
    lt270: 'Neuf mois — comme la naissance de notre amour 🎈',
    lt365: 'Presque un an ensemble — notre amour se renforce 💕',
    lt548: "Plus d'un an d'amour et d'attention 💖",
    lt730: 'Un an et demi — notre amour comme un chêne solide 🌳',
    lt1095: 'Deux ans ensemble — notre histoire continue 📖',
    lt1460: "Trois ans d'amour — invincibles ensemble 👑",
    lt1825: 'Quatre ans — notre amour comme une pierre précieuse 💎',
    lt2190: 'Cinq ans ensemble — une demi-décennie de bonheur 🎊',
    lt2555: 'Six ans — notre lien devient plus profond 🌊',
    lt2920: 'Sept ans — nous avons tout traversé ensemble 🌈',
    lt3650: "Huit ans d'amour — une vraie forteresse 🏰",
    lt4380: "Dix ans ensemble — toute une époque d'amour 🎭",
    lt5475: "Douze ans — notre amour s'améliore avec le temps 🍷",
    lt7300: "Quinze ans ensemble — nous ne faisons qu'un 💫",
    lt10950: "Vingt ans d'amour — notre légende ⭐",
    lt14600: "Vingt-cinq ans — noces d'argent bientôt ! 🥈",
    lt18250: 'Trente ans ensemble — force de perle 📿',
    default: 'Un amour pour la vie — éternel et infini 💎✨',
  },
  mkM(
    [
      ['week1', 'Première semaine'],
      ['week2', 'Deux semaines'],
      ['month1', "Mois d'amour"],
      ['month2', 'Deux mois'],
      ['month3', 'Trois mois'],
      ['days100', 'Première centaine !'],
      ['month6', 'Six mois'],
      ['month9', 'Neuf mois'],
      ['year1', 'Un an ensemble !'],
      ['year1_5', 'Un an et demi'],
      ['year2', 'Deux ans !'],
      ['year3', 'Trois ans !'],
      ['year4', 'Quatre ans !'],
      ['year5', 'Cinq ans !'],
      ['year7', 'Sept ans !'],
      ['year10', 'Dix ans !'],
      ['year15', 'Quinze ans !'],
      ['year20', 'Vingt ans !'],
      ['year25', "Noces d'argent !"],
      ['year30', 'Noces de perle !'],
    ],
    '{{days}} jours ensemble'
  ),
  mkA([
    ['first_week', 'Première semaine', 'Les premiers jours magiques ensemble'],
    ['two_weeks', 'Deux semaines', 'On se découvre'],
    ['first_month', "Mois d'amour", 'Un mois de moments inoubliables !'],
    ['two_months', 'Deux mois', 'Bonheur et papillons'],
    ['three_months', 'Trois mois', 'Amour et tendresse'],
    ['century', 'Première centaine', '100 jours — génial !'],
    ['half_year', 'Six mois de bonheur', 'Amour et compréhension'],
    ['nine_months', 'Neuf mois', 'Comme la naissance de notre amour'],
    ['first_year', 'Un an ensemble', "Une année entière d'amour et d'attention !"],
    ['year_and_half', 'Un an et demi', 'Amour comme un chêne solide'],
    ['two_years', 'Deux ans', 'Notre histoire continue'],
    ['three_years', 'Trois ans', 'Invincibles ensemble'],
    ['four_years', 'Quatre ans', 'Amour comme une pierre précieuse'],
    ['five_years', 'Cinq ans', 'Une demi-décennie de bonheur !'],
    ['seven_years', 'Sept ans', 'Tout traversé ensemble'],
    ['ten_years', 'Dix ans', "Toute une époque d'amour !"],
    ['fifteen_years', 'Quinze ans', "Nous ne faisons qu'un"],
    ['twenty_years', 'Vingt ans', 'Notre légende !'],
    ['silver_wedding', "Noces d'argent", '25 ans ensemble — incroyable !'],
    ['pearl_wedding', 'Noces de perle', '30 ans — force de perle'],
  ])
);

patch(
  'pt',
  {
    lt3: 'O começo da nossa história de amor 💕',
    lt7: 'Os primeiros dias mágicos juntos ✨',
    lt14: 'Semana após semana, descobrindo um ao outro 🌸',
    lt30: 'O primeiro mês de momentos inesquecíveis 🌟',
    lt60: 'Dois meses de felicidade e borboletas 🦋',
    lt90: 'Três meses de amor e ternura 💑',
    lt120: 'Quatro meses juntos — nosso pequeno mundo 🌍',
    lt180: 'Meio ano de amor e compreensão 💝',
    lt270: 'Nove meses — como o nascimento do nosso amor 🎈',
    lt365: 'Quase um ano juntos — nosso amor se fortalece 💕',
    lt548: 'Mais de um ano de amor e cuidado 💖',
    lt730: 'Um ano e meio — nosso amor como um carvalho forte 🌳',
    lt1095: 'Dois anos juntos — nossa história continua 📖',
    lt1460: 'Três anos de amor — imbatíveis juntos 👑',
    lt1825: 'Quatro anos — nosso amor como uma joia 💎',
    lt2190: 'Cinco anos juntos — metade de uma década de felicidade 🎊',
    lt2555: 'Seis anos — nosso vínculo fica mais profundo 🌊',
    lt2920: 'Sete anos — passamos por tudo juntos 🌈',
    lt3650: 'Oito anos de amor — uma verdadeira fortaleza 🏰',
    lt4380: 'Dez anos juntos — uma era inteira de amor 🎭',
    lt5475: 'Doze anos — nosso amor melhora com o tempo 🍷',
    lt7300: 'Quinze anos juntos — somos um só 💫',
    lt10950: 'Vinte anos de amor — nossa lenda ⭐',
    lt14600: 'Vinte e cinco anos — bodas de prata perto! 🥈',
    lt18250: 'Trinta anos juntos — força de pérola 📿',
    default: 'Um amor para a vida toda — eterno e infinito 💎✨',
  },
  mkM(
    [
      ['week1', 'Primeira semana'],
      ['week2', 'Duas semanas'],
      ['month1', 'Mês de amor'],
      ['month2', 'Dois meses'],
      ['month3', 'Três meses'],
      ['days100', 'Primeira centena!'],
      ['month6', 'Meio ano'],
      ['month9', 'Nove meses'],
      ['year1', 'Um ano juntos!'],
      ['year1_5', 'Um ano e meio'],
      ['year2', 'Dois anos!'],
      ['year3', 'Três anos!'],
      ['year4', 'Quatro anos!'],
      ['year5', 'Cinco anos!'],
      ['year7', 'Sete anos!'],
      ['year10', 'Dez anos!'],
      ['year15', 'Quinze anos!'],
      ['year20', 'Vinte anos!'],
      ['year25', 'Bodas de prata!'],
      ['year30', 'Bodas de pérola!'],
    ],
    '{{days}} dias juntos'
  ),
  mkA([
    ['first_week', 'Primeira semana', 'Os primeiros dias mágicos juntos'],
    ['two_weeks', 'Duas semanas', 'Descobrindo um ao outro'],
    ['first_month', 'Mês de amor', 'Um mês de momentos inesquecíveis!'],
    ['two_months', 'Dois meses', 'Felicidade e borboletas'],
    ['three_months', 'Três meses', 'Amor e ternura'],
    ['century', 'Primeira centena', '100 dias — incrível!'],
    ['half_year', 'Meio ano de felicidade', 'Amor e compreensão'],
    ['nine_months', 'Nove meses', 'Como o nascimento do nosso amor'],
    ['first_year', 'Um ano juntos', 'Um ano inteiro de amor e cuidado!'],
    ['year_and_half', 'Um ano e meio', 'Amor como um carvalho forte'],
    ['two_years', 'Dois anos', 'Nossa história continua'],
    ['three_years', 'Três anos', 'Imbatíveis juntos'],
    ['four_years', 'Quatro anos', 'Amor como uma joia'],
    ['five_years', 'Cinco anos', 'Metade de uma década de felicidade!'],
    ['seven_years', 'Sete anos', 'Passamos por tudo juntos'],
    ['ten_years', 'Dez anos', 'Uma era inteira de amor!'],
    ['fifteen_years', 'Quinze anos', 'Somos um só'],
    ['twenty_years', 'Vinte anos', 'Nossa lenda!'],
    ['silver_wedding', 'Bodas de prata', '25 anos juntos — incrível!'],
    ['pearl_wedding', 'Bodas de pérola', '30 anos — força de pérola'],
  ])
);

console.log('Patched fr and pt');
