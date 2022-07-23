# 区块链众包系统

## 技术栈

**Solidity + Truffle + Web3.js + MetaMask + lite-server + Ganache**

Solidity开发智能合约

Truffle作为集成开发环境

Web3.js实现合约与前端交互

MetaMask钱包进行转账

lite-server网站页面服务器

Ganache搭建测试链

## 环境搭建

1.运行Ganache客户端，启动一个测试链

2.在该目录下启动powershell，执行`truffle compile`编译众包合约

3.执行`truffle migrate`命令部署合约至链上

4.执行 `npm install lite-server`安装lite-server服务器

5.执行`npm run dev`启动lite-server服务器

6.访问`127.0.0.1:3000`

7.导入测试账户

## 系统设计方案

Crowdsourcing to smartphones: incentive mechanism design for mobile phone sensing[C]

参考该论文中以平台为中心的激励机制

### 网站架构图

![](..\image\02.png)

### 业务流程图

![](..\image\01.png)

