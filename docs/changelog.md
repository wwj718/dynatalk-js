# changelog

<!-- 参考 https://github.com/codefrau/SqueakJS?tab=readme-ov-file#changelog -->

### 0.4.0(2024-03-23)

-   重构
    -   调整对象组织形式: supervisor 包含 space
-   mqtt 的消息线程会触发 Agent interpret 方法(为了简单和可调试性, 开发阶段采用单线程), 添加了错误处理, 避免损坏 mqtt 线程(不然会造成意外的mqtt错误, 如重复发消息等)
-   对方法进行归类

### 0.3.0(2024-03-22)

-   添加同步请求方法: request

[更多细节](0.3.0.md)

## 0.2.0(2024-03-19)

-   结构化消息的解释过程(通过优化 Agent.interpret 方法)。目前的实现机制是: 将消息映射到对象方法
    -   LivelyDemoAgent(理解 `echo` 和 `eval`)
-   这个版本就可以支持最初的目标了: "在 Squeak 里使用 Python 或浏览器的 API"

[更多细节](0.2.0.md)

## 0.1.0(2024-03-18)

- 实现最小版本的 Dynatalk.
    -   agent 可以解释它所理解的消息, 根据需要做出回复(包括错误信息)
    -   实现了 MQTTSpace, Supervisor, Agent, 以及一个简单的示例: LivelyDemoAgent(仅理解 `echo`)

[更多细节](0.1.0.md)