/**
 * 使用对象存储数据库来存储
 * 概念：
 *    一个录音是一个bucket ，bucket可以不断添加blob 
 *    bucket可以创建url
 * 实现
 *    一个bucket就是一个目录，有一个id，里面存了很多item，同时在另一个数据库中存储了它的信息，通过id索引
 *    添加blob时就往bucket中添加blob，并记录顺序
 *    创建url时通过mediastream来创建，动态的添加data
 */