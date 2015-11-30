# 电影票价

获取南京市各电影院在各平台上的电影票价。
项目使用Node.js实现，利用request、cheerio爬取网页，MongoDB存储数据，express+ejs做页面展示。

目前已经获取了淘宝电影、百度糯米、美团的电影票价。
因为美团的网页上的票价全部以图片形式展现，目前只能先获取整个票价部分的HTML展现出来。

### 2015.11.30更新
新增了微票儿的电影票价。

### 部分截图

- 电影列表

![电影列表](https://raw.githubusercontent.com/LiangCY/MovieTickets/master/screenshots/movies.jpg)

- 影院管理

![影院管理](https://raw.githubusercontent.com/LiangCY/MovieTickets/master/screenshots/cinemas.jpg)

- 电影票价

![电影票价](https://raw.githubusercontent.com/LiangCY/MovieTickets/master/screenshots/tickets.jpg)
