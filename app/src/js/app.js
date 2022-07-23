App = {
  web3Provider: null,
  Voting: null,
  web3: null,
  accounts: null,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: async function() {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        App.accounts = await ethereum.send('eth_requestAccounts')
        console.log("accounts: " + App.accounts.result[0]);
        App.account = App.accounts.result[0];
      } catch (error) {
        console.error("User denied account access");
      }
    } else {
      App.web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545")
    }
    App.web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: function() {

    $.getJSON('Crowdsourcing.json', function (data) {
        App.Crowdsourcing = TruffleContract(data);
        App.Crowdsourcing.setProvider(App.web3Provider);
        App.listenForPublish();
        App.listenForSubmit();
        App.listenForResult();
    });
    $("#submit").on("click", App.submitres);
    $("#publishtask").on("click", App.publish);
    $("#registered").on("click", App.joinsystem);
    $("#Rewarding").on("click", App.reward);
  },

  listenForPublish: function() {    
    App.Crowdsourcing.deployed().then(function(instance) {
      instance.TaskPublished({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, result) {
        if(!error){
          console.log("返回的发包日志："+result.args.description);
          App.render(result);
        }
        else 
          console.log("出错了："+result)
      });
    });
  },

  listenForSubmit: function() {    
    App.Crowdsourcing.deployed().then(function(instance) {
      instance.DataSubmitted({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, result) {
        if(!error){
          console.log("返回的提交日志："+result.args.data);
          if(App.account == result.args._task){
            App.render1(result);
          }
        }
        else 
          console.log("出错了："+result)
      });
    });
  },

  listenForResult: function() {    
    App.Crowdsourcing.deployed().then(function(instance) {
      instance.Result({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, result) {
        if(!error){
          console.log("返回的任务结果："+result.args.isok);
          if(App.account == result.args._worker){
            App.render2(result);
          }
        }
        else 
          console.log("出错了："+result)
      });
    });
  },

  render: function(result) {
      var information = $("#information");
      var addre = result.args.addrs;
      var income = result.args.workersIncome;
      for(var i=0;i<addre.length;i++){
        if(App.account == addre[i]) {
          // Render events Result
          var informationTemplate = "<div>任务id：" + result.args._task + "<br>任务描述：" + result.args.description + "<br>奖金：" + income[i]*10000 + "</div><br>";
          information.append(informationTemplate);
          break;
        }
      } 
  },

  render1: function(result) {
      var resultinfo = $("#result");
      // Render submit Result
      var resultTemplate = "<div>交包者id：" + result.args._worker + "<br>成果：" + result.args.data + "</div><br>"
      resultinfo.append(resultTemplate); 
  },

  render2: function(result) {
      var yesorno = $("#yesorno");
      var Template = "";
      // Render submit Result
      Template = "<div>任务id：" + result.args._task + "<br>任务结果：" + result.args.isok + "</div><br>";
      yesorno.append(Template); 
  },

  submitres: function() {
    let taskaddr = $("#taskaddr").val();
    let data = $("#data").val();

    App.Crowdsourcing.deployed().then(function(contractInstance) {
      // 设置使用call和sendTransaction时的默认账户地址
      App.web3.eth.defaultAccount=App.web3.eth.coinbase;
      return contractInstance.SubmitData(taskaddr,data);
      }).then(function(v) {
        alert("成功提交！");
      }).catch(function(err) {
        alert("提交失败");
        console.log("vate:" + err.message);
      });
  },

  publish: function() {
    App.Crowdsourcing.deployed().then(function(contractInstance) {
      App.web3.eth.defaultAccount=App.web3.eth.coinbase;
      return contractInstance.WorkerCosts.call();
      }).then(function(result) {
        workers = result[0];
        costOfWorkers = result[1];
        console.log("workers:"+workers);
        console.log("costOfWorkers:"+costOfWorkers);
        var worker_cost_map = new Map();
        for(var i = 0; i < workers.length; i++){
          worker_cost_map.set(workers[i],costOfWorkers[i]);
        }
        // 根据cost的大小排名
        var arrayObj=Array.from(worker_cost_map);
        arrayObj.sort(function(a,b){return a[1]-b[1]});
        var costResult=new Map(arrayObj)
        console.log("排序后的costResult:");
        for (var [key, value] of costResult) {
          console.log(key + ' = ' + value);
        }

        // 算工人们的地址
        var S = new Array();
        var sum = 0;
        for(var [key, value] of costResult){
          if(S.length < 2) {
            S.push(key);
            sum = sum + parseInt(value);
          } else {
            if(parseFloat(value) < parseFloat((parseInt(value) + sum)/S.length)){
              S.push(key);
              sum = sum + parseInt(value);
            } else {
              break;
            }
          }
        }
        console.log("S:" + S);
        // 算工人们的策略
        var T = new Array();
        var tsum = 0;
        var n = S.length;
        for(var j = 0; j < n; j++){
          var t = ((n-1)/sum)*(1-((n-1)*parseInt(costResult.get(S[j])))/sum);
          T.push(t);
          tsum = tsum + t;
        }
        console.log("T:" + T);
        console.log("tsum:" + tsum);

        // 算R
        let l = 0;
        let r = 30;
        while(l<r) {
          mid = parseInt((l+r)/2);
          var tem = 0;
          var tem1 = 0;
          for(var k = 0; k < T.length; k++){
            tem = tem + Math.log(1+T[k]*mid);
            tem1 = tem1 + Math.log(1+T[k]*(mid+1));
          }
          if((30*Math.log(1+tem)-mid)>(30*Math.log(1+tem1)-(mid+1))) {
            r = mid;
          } else {
            l = mid + 1;
          }
        }
        var R = l;
        console.log("R:" + R);

        // 算每个工人对应的奖励
        var incomes = new Array();
        for(var c = 0; c < T.length; c++) {
          var b = parseInt((T[c]/tsum)*R*100000000000000);
          incomes.push(b);
        }
        console.log("incomes:" + incomes);

        // 调用fallback
        let weivalue = App.web3.toWei(R, 'ether');
        App.Crowdsourcing.deployed().then(function(contractInstance) {
          return App.web3.eth.sendTransaction({from: App.account, to:contractInstance.address, value: weivalue, data:App.web3.toHex(1)},function(err,res){
            if(!err) {
              alert("成功提交！");
              console.log(res);
            }else{
              alert("提交失败");
              console.log(err);
            }
          })
        }).then(function(){
          // 调用发包函数
          let description = $("#description").val();
          App.Crowdsourcing.deployed().then(function(contractInstance) {
            App.web3.eth.defaultAccount=App.web3.eth.coinbase;
            return contractInstance.PublishCrowdsourcingTask(description, S, incomes);
            }).then(function(v) {
              alert("成功发布任务！");
            }).catch(function(err) {
              alert("成功发布失败");
              console.log("vate:" + err.message);
            });
        })
      }).catch(function(err) {
        alert("WorkerCosts出错了");
        console.log("vate:" + err.message);
      });
    
  },

  joinsystem: function() {
    var cost = Math.floor(Math.random()*10)+1;
    console.log("生成的随机数:" + cost);
    App.Crowdsourcing.deployed().then(function(contractInstance) {
      App.web3.eth.defaultAccount=App.web3.eth.coinbase;
      return contractInstance.JoinSystem(cost);
      }).then(function(v) {
        alert("成功注册！");
      }).catch(function(err) {
        alert("注册失败");
        console.log("vate:" + err.message);
      });
  },

  reward: function() {
    let worker = $("#worker").val();
    let isok = $("#isok").val();

    App.Crowdsourcing.deployed().then(function(contractInstance) {
      App.web3.eth.defaultAccount=App.web3.eth.coinbase;
      return contractInstance.Rewarding(worker,isok);
      }).then(function(v) {
        alert("完成操作！");
      }).catch(function(err) {
        alert("操作失败");
        console.log("vate:" + err.message);
      });
  }


};


$(function() {
  $(window).load(function() {
    App.init();
  });
});