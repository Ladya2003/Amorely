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
ответь как опытный разработчик, архитектор и знаток моего приложения. для компонента DaysTogether сделай изменения:
Палитра цветов
1) добавь черные оттенки для палитры (вместо двух серых) и чтобы градиент на заднем фоне был еще более полупрозрачным и лучше видно было изображение сзади
2) надпись о кол-ве дней вместе (пр., 329 дней вместе) можно сделать того же цвета что и градиент палитры. просто выделить его как-то, чтобы был лучше виден
3) сделай все элементы внутри этого компонента не статически розовыми, а пусть подстраиваются под цвет палитры: прогресс бар до следующей значимой даты, кубок достижений, кол-во достижений, до следующей годовщины 37 дней и кнопку скачивания изображения, кнопка отмена в модалке для рисования подписи, модалка добавления изображения: без обрезки, отмена

Компонент Добавление подписи
1) при открытии модалки, уже сохраненная надпись не подгружается
2) размер кисти не меняет сам размер кисти
3) ластик не стирает (он ничего не делает)

Добавление фото
1) не делай кроппинг строго по 16 на 9. сделай его свободным.