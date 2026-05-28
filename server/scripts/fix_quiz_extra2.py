# -*- coding: utf-8 -*-
PATH = r"c:\Projects\Amorely\server\src\games\quizGameContentExtra2.ts"

with open(PATH, encoding="utf-8") as f:
    s = f.read()

# Mixed Latin/Cyrillic -> proper forms
FIXES = [
    # cinema
    ("answers: ['\u043d\u0430\u0437ad \u0432 \u0431\u0443\u0434\u0443\u0449\u0435\u0435', 'back to the future', '\u043d\u0430\u0437\u0430\u0434 \u0432 \u0431\u0443\u0434\u0443\u0449\u0435\u0435']",
     "answers: ['\u043d\u0430\u0437\u0430\u0434 \u0432 \u0431\u0443\u0434\u0443\u0449\u0435\u0435', 'back to the future']"),
    ("answers: ['\u0440\u0430\u0442at\u0443\u0439', 'ratatouille']",
     "answers: ['\u0440\u0430\u0442\u0430\u0442\u0443\u0439', 'ratatouille']"),
    ("answers: ['\u0431\u043e\u043d \u0434\u0436\u0443\u043d-\u0445o', 'bong joon-ho']",
     "answers: ['\u0431\u043e\u043d \u0434\u0436\u0443\u043d-\u0445\u043e', 'bong joon-ho']"),
    ("answers: ['\u0447eshir', '\u0447\u0435\u0448\u0438\u0440\u0441\u043a\u0438\u0439 \u043a\u043e\u0442', 'cheshire']",
     "answers: ['\u0447\u0435\u0448\u0438\u0440', '\u0447\u0435\u0448\u0438\u0440\u0441\u043a\u0438\u0439 \u043a\u043e\u0442', 'cheshire']"),
    ("\u00ab\u0424\u043e\u0440rest\u0435 \u0413\u0430\u043c\u043f\u0435\u00bb", "\u00ab\u0424\u043e\u0440\u0440\u0435\u0441\u0442 \u0413\u0430\u043c\u043f\u0435\u00bb"),
    ("answers: ['marvel', '\u043carvel', 'marvel studios']", "answers: ['marvel', 'marvel studios']"),
    # travel
    ("answers: ['\u0433ibraltar', '\u0433ibraltar\u0441\u043a\u0438\u0439 \u043f\u0440\u043e\u043b\u0438\u0432']",
     "answers: ['\u0433\u0438\u0431\u0440\u0430\u043b\u0442\u0430\u0440', '\u0433\u0438\u0431\u0440\u0430\u043b\u0442\u0430\u0440\u0441\u043a\u0438\u0439 \u043f\u0440\u043e\u043b\u0438\u0432', 'gibraltar']"),
    ("answers: ['stockholm', '\u0441tok\u0433\u043e\u043b\u044c\u043c']", "answers: ['stockholm', '\u0441\u0442\u043e\u043a\u0433\u043e\u043b\u044c\u043c']"),
    ("answers: ['\u043aambodja', '\u043aambod\u0436i']", "answers: ['\u043a\u0430\u043c\u0431\u043e\u0434\u0436\u0430', '\u043a\u0430\u043c\u0431\u043e\u0434\u0436\u0435']"),
    ("answers: ['mexico city', '\u043cexico \u0441\u0438\u0442\u0438']", "answers: ['mexico city', '\u043c\u0435\u043a\u0441\u0438\u043a\u043e \u0441\u0438\u0442\u0438']"),
    ("answers: ['niagara', '\u043d\u0438agara']", "answers: ['niagara', '\u043d\u0438\u0430\u0433\u0430\u0440\u0430']"),
    ("answers: ['lisbon', '\u043b\u0438\u0441\u0441abon']", "answers: ['lisbon', '\u043b\u0438\u0441\u0441\u0430\u0431\u043e\u043d']"),
    ("answers: ['sicily', '\u0441icilia']", "answers: ['sicily', '\u0441\u0438\u0446\u0438\u043b\u0438\u044f']"),
    ("answers: ['bangkok', '\u0431angkok']", "answers: ['bangkok', '\u0431\u0430\u043d\u0433\u043a\u043e\u043a']"),
    ("answers: ['prague', 'praha', '\u043fraha']", "answers: ['prague', 'praha', '\u043f\u0440\u0430\u0433\u0430']"),
    ("\u0444\u044cord \u0413eiranger", "\u0444\u044c\u043e\u0440\u0434 \u0433\u0435\u0439\u0440\u0430\u043d\u0433\u0435\u0440"),
    ("\u0432\u0443\u043b\u043a\u0430\u043d \u042dtna", "\u0432\u0443\u043b\u043a\u0430\u043d \u044d\u0442\u043d\u0430"),
    ("\u0410\u043d\u0433kor Wat", "\u0410\u043d\u0433\u043a\u043e\u0440 \u0412\u0430\u0442"),
    # music
    ("answers: ['\u0431iz\u0435', '\u0436or\u0436 \u0431iz\u0435', 'bizet']", "answers: ['\u0431\u0438\u0437\u0435', '\u0436\u043e\u0440\u0436 \u0431\u0438\u0437\u0435', 'bizet']"),
    ("answers: ['allegro', '\u0430llegro']", "answers: ['allegro', '\u0430\u043b\u043b\u0435\u0433\u0440\u043e']"),
    ("answers: ['\u0442uba', 'tuba', '\u0442\u0443\u0431\u0430']", "answers: ['\u0442\u0443\u0431\u0430', 'tuba']"),
    ("answers: ['\u0447astushka', '\u0447ast\u0443\u0448\u043a\u0430']", "answers: ['\u0447\u0430\u0441\u0442\u0443\u0448\u043a\u0430', 'chastushka']"),
    ("answers: ['puccini', '\u043fuccini']", "answers: ['puccini', '\u043f\u0443\u0447\u0447\u0438\u043d\u0438']"),
    ("answers: ['vivaldi', '\u0432ivaldi']", "answers: ['vivaldi', '\u0432\u0438\u0432\u0430\u043b\u044c\u0434\u0438']"),
    ("\u00ab\u0420ekviem\u00bb", "\u00ab\u0420\u0435\u043a\u0432\u0438\u0435\u043c\u00bb"),
    ("\u00ab\u0422osca\u00bb", "\u00ab\u0422\u043e\u0441\u043a\u0430\u00bb"),
    # nature
    ("answers: ['\u0441lon', '\u0441lon']", "answers: ['\u0441\u043b\u043e\u043d', 'elephant']"),
    ("answers: ['panda', 'panda']", "answers: ['\u043f\u0430\u043d\u0434\u0430', 'panda']"),
    ("answers: ['listvennitsa', 'larch']", "answers: ['\u043b\u0438\u0441\u0442\u0432\u0435\u043d\u043d\u0438\u0446\u0430', 'larch']"),
    ("answers: ['hameleon', 'hameleon']", "answers: ['\u0445\u0430\u043c\u0435\u043b\u0435\u043e\u043d', 'chameleon']"),
    ("answers: ['metamorphosis', 'metamorphosis']", "answers: ['\u043c\u0435\u0442\u0430\u043c\u043e\u0440\u0444\u043e\u0437', 'metamorphosis']"),
    ("answers: ['\u043b\u0435\u0442uchaya mysh', '\u043b\u0435\u0442uchaya mysh']", "answers: ['\u043b\u0435\u0442\u0443\u0447\u0430\u044f \u043c\u044b\u0448\u044c', 'bat']"),
    ("answers: ['\u0443litka', '\u0443litka']", "answers: ['\u0443\u043b\u0438\u0442\u043a\u0430', 'snail']"),
    ("answers: ['sp\u044f\u0447ka', 'sp\u044f\u0447ka']", "answers: ['\u0441\u043f\u044f\u0447\u043a\u0430', 'hibernation']"),
    ("answers: ['svetlyachok', 'svetlyachok']", "answers: ['\u0441\u0432\u0435\u0442\u043b\u044f\u0447\u043e\u043a', 'firefly']"),
    ("answers: ['\u043aora', '\u043aora']", "answers: ['\u043a\u043e\u0440\u0430', 'bark']"),
    ("answers: ['bobr', 'bobr']", "answers: ['\u0431\u043e\u0431\u0440', 'beaver']"),
    ("answers: ['ravnodenstvie', 'ravnodenstvie']", "answers: ['\u0440\u0430\u0432\u043d\u043e\u0434\u0435\u043d\u0441\u0442\u0432\u0438\u0435', 'equinox']"),
    ("answers: ['s\u043b\u043e\u043d', 's\u043b\u043e\u043d']", "answers: ['\u0441\u043b\u043e\u043d', 'elephant']"),
    ("answers: ['linyka', 'linyka']", "answers: ['\u043b\u0438\u043d\u044c\u043a\u0430', 'molting']"),
    ("answers: ['k\u043bever', 'k\u043bever']", "answers: ['\u043a\u043b\u0435\u0432\u0435\u0440', 'shamrock']"),
    ("\u0438\u0433olki", "\u0438\u0433\u043e\u043b\u043a\u0438"),
    ("\u0433useni\u0446\u044b", "\u0433\u0443\u0441\u0435\u043d\u0438\u0446\u044b"),
    # home
    ("answers: ['\u0441\u0443\u0448ilka', '\u0441\u0443\u0448ilka \u0434\u043b\u044f \u0431\u0435\u043b\u044c\u044f']", "answers: ['\u0441\u0443\u0448\u0438\u043b\u043a\u0430', '\u0441\u0443\u0448\u0438\u043b\u043a\u0430 \u0434\u043b\u044f \u0431\u0435\u043b\u044c\u044f']"),
    ("answers: ['\u0448\u0442\u043e\u0440\u044b', 'jal\u044ezi', 'jal\u044ezi']", "answers: ['\u0448\u0442\u043e\u0440\u044b', '\u0436\u0430\u043b\u044e\u0437\u0438']"),
    ("answers: ['\u0448kaf', '\u0448kaf', '\u0448kaf']", "answers: ['\u0448\u043a\u0430\u0444', '\u0448\u043a\u0430\u0444\u0443']"),
    ("answers: ['\u043d\u043e\u0436', '\u0445le\u0431\u043d\u044b\u0439 \u043d\u043e\u0436']", "answers: ['\u043d\u043e\u0436', '\u0445\u043b\u0435\u0431\u043d\u044b\u0439 \u043d\u043e\u0436']"),
    ("answers: ['\u043a\u043efemashina', '\u043a\u043efemashina', '\u043a\u043efemashina']", "answers: ['\u043a\u043e\u0444\u0435\u043c\u0430\u0448\u0438\u043d\u0430', '\u043a\u043e\u0444\u0435\u0432\u0430\u0440\u043a\u0430']"),
    ("answers: ['\u0433ostinaya', '\u0433ostinaya', '\u0433ostinaya']", "answers: ['\u0433\u043e\u0441\u0442\u0438\u043d\u0430\u044f', '\u0437\u0430\u043b']"),
    ("answers: ['vedro', 'vedro', 'vedro']", "answers: ['\u0432\u0435\u0434\u0440\u043e', '\u043c\u0443\u0441\u043e\u0440\u043a\u0430']"),
    ("answers: ['skatert', 'skatert', 'skatert']", "answers: ['\u0441\u043a\u0430\u0442\u0435\u0440\u0442\u044c', '\u0441\u043a\u0430\u0442\u0435\u0440\u0442\u044c\u044e']"),
    ("answers: ['prihozhaya', 'prihozhaya', 'prihozhaya']", "answers: ['\u043f\u0440\u0438\u0445\u043e\u0436\u0430\u044f', '\u043f\u0440\u0438\u0445\u043e\u0436\u0435\u0439']"),
    ("answers: ['uvlazhnitel', 'uvlazhnitel', 'uvlazhnitel']", "answers: ['\u0443\u0432\u043b\u0430\u0436\u043d\u0438\u0442\u0435\u043b\u044c', '\u0443\u0432\u043b\u0430\u0436\u043d\u0438\u0442\u0435\u043b\u044c \u0432\u043e\u0437\u0434\u0443\u0445\u0430']"),
    ("answers: ['t\u044fpka', 't\u044fpka', 't\u044fpka']", "answers: ['\u0442\u0440\u044f\u043f\u043a\u0430', '\u0442\u0440\u044f\u043f\u043a\u043e\u0439']"),
    ("answers: ['krovat', 'krovat', 'krovat']", "answers: ['\u043a\u0440\u043e\u0432\u0430\u0442\u044c', '\u043a\u0440\u043e\u0432\u0430\u0442\u0438']"),
    ("answers: ['prihozhaya', 'veshalka', 'veshalka']", "answers: ['\u043f\u0440\u0438\u0445\u043e\u0436\u0430\u044f', '\u0432\u0435\u0448\u0430\u043b\u043a\u0430']"),
    ("answers: ['skovoroda', 'skovoroda', 'skovoroda']", "answers: ['\u0441\u043a\u043e\u0432\u043e\u0440\u043e\u0434\u0430', '\u0441\u043a\u043e\u0432\u043e\u0440\u043e\u0434\u043a\u0430']"),
    ("answers: ['\u0440\u043eeetku', '\u0440\u043eeetku', '\u0440\u043eeetku']", "answers: ['\u0440\u043e\u0437\u0435\u0442\u043a\u0443', '\u0437\u0430\u0433\u043b\u0443\u0448\u043a\u0430']"),
    ("answers: ['zaglushka', 'zaglushka', 'zaglushka']", "answers: ['\u0437\u0430\u0433\u043b\u0443\u0448\u043a\u0430']"),
    ("answers: ['korzina', 'korzina', 'korzina']", "answers: ['\u043a\u043e\u0440\u0437\u0438\u043d\u0430', '\u043a\u043e\u0440\u0437\u0438\u043d\u0430 \u0434\u043b\u044f \u0431\u0435\u043b\u044c\u044f']"),
    ("answers: ['kuhnya', 'kuhnya', 'kuhnya']", "answers: ['\u043a\u0443\u0445\u043d\u044f', '\u043a\u0443\u0445\u043d\u0435']"),
    ("answers: ['termometr', 'termometr', 'termometr']", "answers: ['\u0442\u0435\u0440\u043c\u043e\u043c\u0435\u0442\u0440']"),
    ("answers: ['t\u044fpka', 'salfetka', 'salfetka']", "answers: ['\u0442\u0440\u044f\u043f\u043a\u0430', '\u0441\u0430\u043b\u0444\u0435\u0442\u043a\u0430']"),
    # tech
    ("answers: ['\u0446uckerberg', 'mark zuckerberg', '\u0446uckerberg']", "answers: ['\u0446\u0443\u043a\u0435\u0440\u0431\u0435\u0440\u0433', 'mark zuckerberg', 'zuckerberg']"),
    ("answers: ['gates', 'bill gates', '\u0431ill gates']", "answers: ['gates', 'bill gates', '\u0431\u0438\u043b\u043b \u0433\u0435\u0439\u0442\u0441']"),
    ("answers: ['netflix', '\u043detflix']", "answers: ['netflix', '\u043d\u0435\u0442\u0444\u043b\u0438\u043a\u0441']"),
    ("answers: ['firefox', '\u0444irefox']", "answers: ['firefox', '\u0444\u0430\u0439\u0440\u0444\u043e\u043a\u0441']"),
    ("answers: ['whatsapp', '\u0432\u0430\u0442\u0441ap']", "answers: ['whatsapp', '\u0432\u0430\u0442\u0441\u0430\u043f']"),
    # love
    ("'\u0441\u0442\u0440\u0435\u043b\u0430 \u043aupid\u043e\u043d\u0430', ", "'\u0441\u0442\u0440\u0435\u043b\u0430 \u043a\u0443\u043f\u0438\u0434\u043e\u043d\u0430', "),
    # holidays
    ("answers: ['spas', 'spas']", "answers: ['\u0441\u043f\u0430\u0441', '\u044f\u0431\u043b\u043e\u0447\u043d\u044b\u0439 \u0441\u043f\u0430\u0441']"),
    ("answers: ['festival \u0444onarey', 'festival \u0444onarey']", "answers: ['\u0444\u0435\u0441\u0442\u0438\u0432\u0430\u043b\u044c \u0444\u043e\u043d\u0430\u0440\u0435\u0439', 'mid autumn']"),
    ("answers: ['den pobedy', 'den pobedy']", "answers: ['\u0434\u0435\u043d\u044c \u043f\u043e\u0431\u0435\u0434\u044b', '9 \u043c\u0430\u044f']"),
    ("\u0441akura", "\u0441\u0430\u043a\u0443\u0440\u0430"),
    ("\u0427epmena", "\u0427\u0435\u043f\u043c\u0435\u043d\u0430"),
    # art
    ("answers: ['tolstoy', '\u0442olstoy', '\u043b\u0435\u0432 \u0442olstoy']", "answers: ['\u0442\u043e\u043b\u0441\u0442\u043e\u0439', 'tolstoy', '\u043b\u0435\u0432 \u0442\u043e\u043b\u0441\u0442\u043e\u0439']"),
    ("answers: ['shakespeare', '\u0448ekspir', '\u0443\u0438\u043b\u044c\u044f\u043c \u0448ekspir']", "answers: ['\u0448\u0435\u043a\u0441\u043f\u0438\u0440', 'shakespeare']"),
    ("answers: ['dostoevsky', 'dostoevsky', 'dostoevsky']", "answers: ['\u0434\u043e\u0441\u0442\u043e\u0435\u0432\u0441\u043a\u0438\u0439', 'dostoevsky']"),
    ("answers: ['bolshoy', 'bolshoy', 'bolshoy']", "answers: ['\u0431\u043e\u043b\u044c\u0448\u043e\u0439', 'bolshoy']"),
    ("answers: ['chekhov', 'chekhov', 'chekhov']", "answers: ['\u0447\u0435\u0445\u043e\u0432', 'chekhov']"),
    ("answers: ['lermontov', 'lermontov', 'lermontov']", "answers: ['\u043b\u0435\u0440\u043c\u043e\u043d\u0442\u043e\u0432', 'lermontov']"),
    ("answers: ['gogol', 'gogol', 'gogol']", "answers: ['\u0433\u043e\u0433\u043e\u043b\u044c', 'gogol']"),
    ("answers: ['pushkin', 'pushkin', 'pushkin']", "answers: ['\u043f\u0443\u0448\u043a\u0438\u043d', 'pushkin']"),
    ("answers: ['ostrovsky', 'ostrovsky', 'ostrovsky']", "answers: ['\u043e\u0441\u0442\u0440\u043e\u0432\u0441\u043a\u0438\u0439', 'ostrovsky']"),
    ("\u00ab\u0413am\u043b\u0435\u0442\u0430\u00bb", "\u00ab\u0413\u0430\u043c\u043b\u0435\u0442\u00bb"),
    ("\u00ab\u0418\u0434iota\u00bb", "\u00ab\u0418\u0434\u0438\u043e\u0442\u00bb"),
    ("\u00ab\u0412\u0438\u0448\u043d\u0451\u0432\u044b\u0439 \u0441ad\u00bb", "\u00ab\u0412\u0438\u0448\u043d\u0451\u0432\u044b\u0439 \u0441\u0430\u0434\u00bb"),
    ("\u00ab\u0420evizora\u00bb", "\u00ab\u0420\u0435\u0432\u0438\u0437\u043e\u0440\u00bb"),
    ("\u00ab\u041f\u0438\u043a\u043e\u0432\u0443\u044e damu\u00bb", "\u00ab\u041f\u0438\u043a\u043e\u0432\u0443\u044e \u0434\u0430\u043c\u0443\u00bb"),
    ("\u00ab\u0421\u0442\u0430\u0440\u0438\u043a\u0430 \u0438 mor\u0435\u00bb", "\u00ab\u0421\u0442\u0430\u0440\u0438\u043a \u0438 \u043c\u043e\u0440\u0435\u00bb"),
    ("\u00ab\u041cal\u0435\u043d\u044c\u043a\u043e\u0433\u043e prince\u00bb", "\u00ab\u041c\u0430\u043b\u0435\u043d\u044c\u043a\u0438\u0439 \u043f\u0440\u0438\u043d\u0446\u00bb"),
    # sport
    ("\u0440itual\u043d\u044b\u043c\u0438", "\u0440\u0438\u0442\u0443\u0430\u043b\u044c\u043d\u044b\u043c\u0438"),
    ("batutom", "\u0431\u0430\u0442\u0443\u0442\u043e\u043c"),
    ("\u0421\u0442\u044d\u043dley", "\u0421\u0442\u044d\u043d\u043b\u0438"),
    ("\u0441obak", "\u0441\u043e\u0431\u0430\u043a"),
    ("\u0433andball", "\u0433\u0430\u043d\u0434\u0431\u043e\u043b"),
    ("\u0411razil", "\u0411\u0440\u0430\u0437\u0438\u043b\u0438\u0438"),
    ("\u0433ryaznogo", "\u0433\u0440\u044f\u0437\u043d\u043e\u0433\u043e"),
]

for old, new in FIXES:
    s = s.replace(old, new)

with open(PATH, "w", encoding="utf-8", newline="\n") as f:
    f.write(s)

print("Fixed. Questions:", s.count("categoryId:"))
