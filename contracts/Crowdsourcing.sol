pragma solidity >=0.6.0 <0.8.0;

// 主要负责处理Workers和Requesters之间的关系
contract Crowdsourcing {
    // 工人的列表
    address[] workers;
    // 保存工人们的成本
    uint[] costOfWorkers;
    // 确保每个任务都有其对应的workers，在进行奖励分发的时候使用
    mapping(address => mapping(address => uint)) workerAwards;
    // 每个worker是否进行了数据上传
    mapping(address => mapping(address => bool)) dataSubmitted;
    // 负责在特定条件下用来进行交互的Event，进行交易的触发
    event TaskPublished(address indexed _task, string description, address[] addrs, uint[] workersIncome);
    event Result(address indexed _task, address indexed _worker, string isok);
    event DataSubmitted(address indexed _task, address indexed _worker, string data);

    // 接收发包者的激励金额
    // 用CALLDATA测试这个函数
    // receive()当向合约发送Ether且未指定调用任何函数(calldata 为空)时执行。
    fallback() external payable {
        bytes memory requester = hex"01";
        require(keccak256(abi.encodePacked(msg.data)) == keccak256(abi.encodePacked(requester)), 
            "You should be requester");
    }

    // 创建一个新的众包任务，同时该函数会发出一个新的Event表示任务已经创建成功
    function PublishCrowdsourcingTask(string memory description, address[] memory addrs, uint[] memory workersIncome) public {
        // 对任务的信息进行记录
        address requester = msg.sender;
        for(uint i = 0; i < addrs.length; i++) {
            workerAwards[requester][addrs[i]] = workersIncome[i];
        }
        // 任务发布
        emit TaskPublished(requester, description, addrs, workersIncome);
    }
    // 返回所有Workers的成本
    function WorkerCosts() public view returns (address[] memory m, uint[] memory u) {
        m = workers;
        u = costOfWorkers;
    }
    /** 
    * Workers注册到系统
    **/
    function JoinSystem(uint cost) public {
        address worker = msg.sender;
        workers.push(worker);
        costOfWorkers.push(cost);
    }
    /**
    * Workers进行任务上传
    */
    function SubmitData(address payable task, string memory data) public {
        require(dataSubmitted[task][msg.sender] == false, "You already submitted your data");
        dataSubmitted[task][msg.sender] = true;
        // 
        emit DataSubmitted(task, msg.sender, data); 
    }
    /**
    * 进行任务奖励
    */
    function Rewarding(address payable worker, string memory isok) public {
        // 只有Requester才能调用此信息
        require(workerAwards[msg.sender][worker] != 0, "Only requester can call this to workers who participants its task and has not been rewarded.");
        uint i;
        for(i = 0; i < workers.length; i++){
            if (worker == workers[i]) {
                break;
            }
        }
        require(i < workers.length, "No worker found");
        if (hashCompareInternal(isok, "合格")) {
            worker.transfer(workerAwards[msg.sender][worker] * 10**4);// transfer默认单位是Wei
            if (costOfWorkers[i] > 1) {
                costOfWorkers[i] -= 1;
            }
        }
        else {
            msg.sender.transfer(workerAwards[msg.sender][worker] * 10**4); // 把金额退回发包者
            if (costOfWorkers[i] < 10) {
                costOfWorkers[i] += 1;
            }
        }
        emit Result(msg.sender, worker, isok);
        // 奖励已经发出，现在清除其状态
        delete workerAwards[msg.sender][worker];
        delete dataSubmitted[msg.sender][worker];
    }
    // 字符串比较函数
    function hashCompareInternal(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
}