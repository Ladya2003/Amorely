# -*- coding: utf-8 -*-
BASE = r"c:\Projects\Amorely\server\src\games\quizGameContentExtra2.ts"
PART1 = r"c:\Projects\Amorely\server\src\games\quizGameContentExtra2.part1.ts"
PART2 = r"c:\Projects\Amorely\server\src\games\quizGameContentExtra2.part2.ts"

with open(BASE, encoding="utf-8") as f:
    base = f.read().rstrip()
if base.endswith("];"):
    base = base[:-2].rstrip()
with open(PART1, encoding="utf-8") as f:
    part1 = f.read().strip()
with open(PART2, encoding="utf-8") as f:
    part2 = f.read().strip()

content = base + "\n" + part1 + "\n" + part2 + "\n];\n"

with open(BASE, "w", encoding="utf-8", newline="\n") as f:
    f.write(content)

print("Questions:", content.count("categoryId:"))
