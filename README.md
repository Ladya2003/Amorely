# Amorely
A love app for beloved couples to bond together

## Features
- Chat
- Voice call
- Video call
- Shared calendar

### How to run
- Clone the repository
- Run `npm i` for root, client and server
- Create a `.env` file at server and fill in the port number (PORT=8000)
- Run `npm run dev` at root

### How to run server with debugger
- At root folder Open new JavaScript Debugger Terminal
- Run `npm run server`

### What to improve?
#### Tech issues
- Create Toaster Notifications
- Don't reset email on validation error
- Make header sticky?
- Add Calendar Page, Chat Page
- Can't upload content on Feed
- Settings/Theme doesn't work
- Test notifications
- Crop image on pasting (Settings and Feed)
- Settings/Profile can't see sign out button in the bottom

#### Ideas
- Create questions for couples. And ability to create own quiz and share with community. When it hits certain point (ex. 100 complitions), it'll be shown to me and i can accept it so other ppl can see it too

#### Customization 
- Custom Font
- Change Design

#### Other improvment
- Gather feedback

##### Last improving tasks
отлично! сделай изменения:
Палитра
1) сделай еще черные оттенки для палитры и чтобы этот градиент был еще более полупрозрачным и лучше видно было изображение сзади
2) надпись о кол-ве дней можно сделать того же цвета что и цвет палитры (просто сделать ее видно)
3) сделай все элементы внутри этого компонента не статически розовыми, а пусть подстраиваются под цвет палитры

Добавление подписи
1) при открытии модалки, уже сохраненная надпись не подгружается
2) добавь возможность выбирать размер кисти и выбирать ластик (чтобы вытирать рисунок)

Добавление фото
1) При кроппинге я не могу сохранить размеры которые кроп предлагает по дефолту. (нажимаю применить и ничего не происходит)