# changelog

<!-- 参考 https://github.com/codefrau/SqueakJS?tab=readme-ov-file#changelog -->

## 0.2.0(2024-03-19)

-   结构化消息的解释过程(通过优化 Agent.interpret 方法)。目前的实现机制是: 将消息映射到对象方法
    -   LivelyDemoAgent(理解 `echo` 和 `eval`)

## 0.1.0(2024-03-18)

- 实现最小版本的 Dynatalk.
    -   agent 可以解释它所理解的消息, 根据需要做出回复(包括错误信息)
    -   实现了 MQTTSpace, Supervisor, Agent, 以及一个简单的示例: LivelyDemoAgent(仅理解 `echo`)

[更多细节](./docs/0.1.0.md)