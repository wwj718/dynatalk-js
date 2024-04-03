# readme

本仓库是 [Dynatalk](https://github.com/wwj718/Dynatalk) 的 JavaScript 客户端。

> Dynatalk 致力于对象之间的交流, 尤其关心不同语言/环境之间的互操作。 -- [Dynatalk](https://github.com/wwj718/Dynatalk)

要使用 Dynatalk, 需要做两件事:

1. [运行一个 MQTT broker](https://github.com/wwj718/Dynatalk/blob/main/mqtt/readme.md)
2. 然后当前语言的 dynatalk 客户端中开始编程。

## get started

```js
let supervisor = new Supervisor();
// agent 既可以作为 server (提供服务给其他 agent) 也可以作为 client (请问其他 agent 的服务)
let agent = new LivelyDemoAgent("LivelyDemoAgent");  // LivelyDemoAgent 对外提供了两个服务: add, echo
supervisor.addAgent(agent)

// agent 作为**客户端**, 请求 LivelyEvalAgent 执行 add , 参数是 [1, 2]
let aPromise = agent.request('LivelyEvalAgent', 'add', [1, 2]);
aPromise.then((value)=> console.log(value)).

// 与 request 不同, sendTo 没有返回值
// agent.sendTo...
```

发现当前网络上的 agents:

```js
agent.broadcastHelp();
setTimeout(()=>{console.log(agent.availableActions)}, 1000);
```


## 示例

参考 [examples](./examples/).

## 开发

将当前仓库的 `dynatalk.js` 文件引入 [LivelyKernel](https://github.com/LivelyKernel/LivelyKernel)  进行开发。

<!--

使用软链接将代码仓库放到 lively 中: `ln -s /Users/wwj718/Documents/mylab/dynalab/dynatalk_new/dynatalk-js /Users/wwj718/Documents/mylab/dynalab/lab/LivelyKernel/users/wwj/dynatalk-js`

-->

## FAQ

### 配置 MQTT

默认为:

```json
{   
    "host": "127.0.0.1",
    "port": 1883,
    "username": "guest",
    "password": "test"
}
```

配置方式: `window._mqttConf={"host":...}` 


### 如何使用公网 emqx 服务器?

以下是一个例子

```js
window._mqttConf={   
    "host": "ws://mqtt.aimaker.space:8083/mqtt",
    "username": "guest",
    "password": "test"
}
```