# -*- coding: utf-8 -*-
import re
from collections import Counter

PATH = r"c:\Projects\Amorely\server\src\games\quizGameContentExtra2.ts"
t = open(PATH, encoding="utf-8").read()
cats = Counter(re.findall(r"categoryId: '([^']+)'", t))
ids = re.findall(r"id: '([^']+)'", t)
print("total", len(ids))
for c in sorted(cats):
    print(c, cats[c])
mixed = re.findall(r"['\"][^'\"]*[a-zA-Z][а-яА-ЯёЁ][^'\"]*['\"]|['\"][^'\"]*[а-яА-ЯёЁ][a-zA-Z][^'\"]*['\"]", t)
print("mixed samples", len(mixed))
for m in mixed[:15]:
    print(" ", m)
