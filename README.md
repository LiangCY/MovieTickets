# 电影票价

获取南京市各电影院在各平台上的电影票价。
项目使用Node.js实现，利用request、cheerio爬取网页，MongoDB存储数据，express+ejs做页面展示。

目前已经获取了淘宝电影、百度糯米、美团、微票、大众点评的电影票价。
因为美团的网页上的票价全部以图片形式展现，目前只能先获取整个票价部分的HTML展现出来。

### 2015.12.10更新
新增了大众点评的电影票价。

### 2015.11.30更新
新增了微票儿的电影票价。

### 如何使用
- npm install
- node app.js运行网站
- 在浏览器中打开http://localhost:3030/cinemas/manage 添加影院
- 爬虫在scraper文件夹下，node index.js开启爬虫(已设置为每日固定时间爬取)

### 存在的问题
- 由于各平台上的影院名称不一致，直接通过程序匹配比较复杂，所以目前只能手动添加和输入各平台的影院ID。
- 频繁请求网页会返回输入验证码的页面，目前只是降低了请求频率，没有解决IP访问限制的问题。
- 美团网页上的票价使用了CSS Sprites，都是图片，没法获取数值，目前只能获取票价区域的html进行展示。
- 因为当时写的匆忙，技术上也有所欠缺，所以还有不少没考虑好的地方。以后有空了会继续完善。

### 部分截图

- 电影列表

![电影列表](https://raw.githubusercontent.com/LiangCY/MovieTickets/master/screenshots/movies.jpg)

- 影院管理

![影院管理](https://raw.githubusercontent.com/LiangCY/MovieTickets/master/screenshots/cinemas.jpg)

- 电影票价

![电影票价](https://raw.githubusercontent.com/LiangCY/MovieTickets/master/screenshots/tickets.jpg)
