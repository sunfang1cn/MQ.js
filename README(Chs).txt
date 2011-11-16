MQ.js v0.1 简易说明

使用方法：
1、node index.js
2、telnet localhost 8888(or other address) 或者通过socket连接
3、put xxxxx （程序中要加上\r\n, telnet中直接回车）
4、get (会返回队首+\r\n)

持久化方式：
1、在config.js里设置。none为不持久化。time为每隔一段时间和磁盘文件同步一次。always为每次更改队列均同步一次。
2、当开启持久化后，当队列服务意外终止时，下次启动会自动加载还原磁盘持久化目录中最新一次的队列镜像
3、也可以通过flushall 和readall命令手工建立和还原镜像。