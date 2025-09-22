// 全局变量
let allCountries = [];
let filteredCountries = [];
let currentSection = 'browse';
let selectedContinent = 'all';
let selectedStyles = new Set();
let sortMethod = 'name';
let searchTerm = '';
let selectedDataSource = 'all';

// 数据来源配置
const dataSources = {
    all: { 
        name: '全部国家和国际组织', 
    countries: [
        "al", "dz", "af", "ar", "ae", "sy", "om", "az", "eg", "et", 
        "ie", "ee", "ad", "ao", "ag", "at", "au", "bb", "pg", "bs", 
        "pk", "py", "bh", "pa", "br", "by", "bg", "mk", "bj", "be", 
        "pe", "is", "pl", "ba", "bz", "bw", "bt", "bf", "bi", "kp", 
        "gq", "gb", "kr", "dk", "de", "tl", "tg", "do", "dm", "bo", 
        "ru", "ec", "er", "fr", "ph", "fj", "fi", "cv", "gm", "cg", 
        "cd", "co", "cr", "gd", "ge", "cu", "gy", "kz", "ht", "nl", 
        "me", "hn", "ki", "dj", "kg", "gn", "gw", "ca", "gh", "ga", 
        "kh", "cz", "zw", "cm", "qa", "km", "ci", "kw", "hr", "ke", 
        "lv", "ls", "la", "lb", "lt", "lr", "ly", "li", "lu", "rw", 
        "ro", "mg", "mv", "mt", "mw", "my", "ml", "mh", "mu", "mr", 
        "us", "mn", "bd", "fm", "mm", "md", "ma", "mc", "mz", "mx", 
        "na", "za", "ss", "nr", "np", "ni", "ne", "ng", "no", "pw", 
        "pt", "jp", "se", "ch", "sv", "ws", "rs", "sl", "sn", "cy", 
        "sc", "sa", "st", "kn", "lc", "sm", "vc", "lk", "sk", "si", 
        "sz", "sd", "sr", "sb", "so", "tj", "th", "tz", "to", "tt", 
        "tn", "tv", "tr", "tm", "vu", "gt", "ve", "bn", "ug", "ua", 
        "uy", "uz", "es", "gr", "sg", "nz", "hu", "jm", "am", "ye", 
        "iq", "ir", "il", "it", "in", "id", "jo", "vn", "zm", "td", 
        "cl", "cf", "cn", //un_countries
        "ck", "nu", "ps", //Have diplomatic relations with china but not UN members
        "euu", "auu" //oganiations
        ]
    },
    un: { 
    name: '联合国成员国', 
    countries: [
        "al", "dz", "af", "ar", "ae", "sy", "om", "az", "eg", "et", 
        "ie", "ee", "ad", "ao", "ag", "at", "au", "bb", "pg", "bs", 
        "pk", "py", "bh", "pa", "br", "by", "bg", "mk", "bj", "be", 
        "pe", "is", "pl", "ba", "bz", "bw", "bt", "bf", "bi", "kp", 
        "gq", "gb", "kr", "dk", "de", "tl", "tg", "do", "dm", "bo", 
        "ru", "ec", "er", "fr", "ph", "fj", "fi", "cv", "gm", "cg", 
        "cd", "co", "cr", "gd", "ge", "cu", "gy", "kz", "ht", "nl", 
        "me", "hn", "ki", "dj", "kg", "gn", "gw", "ca", "gh", "ga", 
        "kh", "cz", "zw", "cm", "qa", "km", "ci", "kw", "hr", "ke", 
        "lv", "ls", "la", "lb", "lt", "lr", "ly", "li", "lu", "rw", 
        "ro", "mg", "mv", "mt", "mw", "my", "ml", "mh", "mu", "mr", 
        "us", "mn", "bd", "fm", "mm", "md", "ma", "mc", "mz", "mx", 
        "na", "za", "ss", "nr", "np", "ni", "ne", "ng", "no", "pw", 
        "pt", "jp", "se", "ch", "sv", "ws", "rs", "sl", "sn", "cy", 
        "sc", "sa", "st", "kn", "lc", "sm", "vc", "lk", "sk", "si", 
        "sz", "sd", "sr", "sb", "so", "tj", "th", "tz", "to", "tt", 
        "tn", "tv", "tr", "tm", "vu", "gt", "ve", "bn", "ug", "ua", 
        "uy", "uz", "es", "gr", "sg", "nz", "hu", "jm", "am", "ye", 
        "iq", "ir", "il", "it", "in", "id", "jo", "vn", "zm", "td", 
        "cl", "cf", "cn"
        ]
    },
    g20: {
        name: 'G20',
        countries: [
            "cn", // 1. 中国
            "ar", // 2. 阿根廷
            "au", // 3. 澳大利亚
            "br", // 4. 巴西
            "ca", // 5. 加拿大
            "fr", // 6. 法国
            "de", // 7. 德国
            "in", // 8. 印度
            "id", // 9. 印度尼西亚
            "it", // 10. 意大利
            "jp", // 11. 日本
            "kr", // 12. 韩国
            "mx", // 13. 墨西哥
            "ru", // 14. 俄罗斯
            "sa", // 15. 沙特阿拉伯
            "za", // 16. 南非
            "tr", // 17. 土耳其
            "gb", // 18. 英国
            "us", // 19. 美国
            // 注：欧盟和非洲联盟作为区域组织不使用国家代码
            "euu", // 20. 欧盟（European Union）
            "auu"  // 21. 非洲联盟（African Union）
        ]
    },
    euu: {
        name: '欧洲联盟',
        countries: [
            "at", // 奥地利
            "be", // 比利时
            "bg", // 保加利亚
            "cy", // 塞浦路斯
            "cz", // 捷克
            "hr", // 克罗地亚
            "dk", // 丹麦
            "ee", // 爱沙尼亚
            "fi", // 芬兰
            "fr", // 法国
            "de", // 德国
            "gr", // 希腊
            "hu", // 匈牙利
            "ie", // 爱尔兰
            "it", // 意大利
            "lv", // 拉脱维亚
            "lt", // 立陶宛
            "lu", // 卢森堡
            "mt", // 马耳他
            "nl", // 荷兰
            "pl", // 波兰
            "pt", // 葡萄牙
            "ro", // 罗马尼亚
            "sk", // 斯洛伐克
            "si", // 斯洛文尼亚
            "es", // 西班牙
            "se"  // 瑞典
        ]
    },
    auu: {
        name: '非洲联盟',
        countries: [
            "dz", // 1. 阿尔及利亚
            "eg", // 2. 埃及
            "et", // 3. 埃塞俄比亚
            "ao", // 4. 安哥拉
            "bj", // 5. 贝宁
            "bw", // 6. 博茨瓦纳
            "bf", // 7. 布基纳法索
            "bi", // 8. 布隆迪
            "gq", // 9. 赤道几内亚
            "tg", // 10. 多哥
            "er", // 11. 厄立特里亚
            "cv", // 12. 佛得角
            "gm", // 13. 冈比亚
            "cg", // 14. 刚果（布）
            "cd", // 15. 刚果（金）
            "dj", // 16. 吉布提
            "gn", // 17. 几内亚
            "gw", // 18. 几内亚比绍
            "gh", // 19. 加纳
            "ga", // 20. 加蓬
            "zw", // 21. 津巴布韦
            "cm", // 22. 喀麦隆
            "km", // 23. 科摩罗
            "ci", // 24. 科特迪瓦
            "ke", // 25. 肯尼亚
            "ls", // 26. 莱索托
            "lr", // 27. 利比里亚
            "ly", // 28. 利比亚
            "rw", // 29. 卢旺达
            "mg", // 30. 马达加斯加
            "mw", // 31. 马拉维
            "ml", // 32. 马里
            "mu", // 33. 毛里求斯
            "mr", // 34. 毛里塔尼亚
            "mz", // 35. 莫桑比克
            "na", // 36. 纳米比亚
            "za", // 37. 南非
            "ne", // 38. 尼日尔
            "ng", // 39. 尼日利亚
            "sl", // 40. 塞拉利昂
            "sn", // 41. 塞内加尔
            "sc", // 42. 塞舌尔
            "st", // 43. 圣多美和普林西比
            "sz", // 44. 斯威士兰
            "sd", // 45. 苏丹
            "so", // 46. 索马里
            "tz", // 47. 坦桑尼亚
            "tn", // 48. 突尼斯
            "ug", // 49. 乌干达
            "zm", // 50. 赞比亚
            "td", // 51. 乍得
            "cf", // 52. 中非
            "eh", // 53. 阿拉伯撒哈拉民主共和国（西撒哈拉）非盟中唯一不是联合国会员国的国家
            "ss", // 54. 南苏丹
            "ma"  // 55. 摩洛哥
        ]
    },
    china_diplomatic: {
        name: '与中华人民共和国建交国家',
        countries: [
            // 亚洲 (45个国家)
            "af", // 阿富汗
            "am", // 亚美尼亚
            "az", // 阿塞拜疆
            "bh", // 巴林
            "bd", // 孟加拉国
            "bn", // 文莱
            "kh", // 柬埔寨
            "kp", // 朝鲜
            "tl", // 东帝汶
            "ge", // 格鲁吉亚
            "in", // 印度
            "id", // 印度尼西亚
            "ir", // 伊朗
            "iq", // 伊拉克
            "il", // 以色列
            "jp", // 日本
            "jo", // 约旦
            "kz", // 哈萨克斯坦
            "kw", // 科威特
            "kg", // 吉尔吉斯斯坦
            "la", // 老挝
            "lb", // 黎巴嫩
            "my", // 马来西亚
            "mv", // 马尔代夫
            "mn", // 蒙古
            "mm", // 缅甸
            "np", // 尼泊尔
            "om", // 阿曼
            "pk", // 巴基斯坦
            "ps", // 巴勒斯坦
            "ph", // 菲律宾
            "qa", // 卡塔尔
            "kr", // 韩国
            "sa", // 沙特阿拉伯
            "sg", // 新加坡
            "lk", // 斯里兰卡
            "sy", // 叙利亚
            "tj", // 塔吉克斯坦
            "th", // 泰国
            "tr", // 土耳其
            "tm", // 土库曼斯坦
            "ae", // 阿拉伯联合酋长国
            "uz", // 乌兹别克斯坦
            "vn", // 越南
            "ye", // 也门
            
            // 非洲 (53个国家)
            "dz", // 阿尔及利亚
            "ao", // 安哥拉
            "bj", // 贝宁
            "bw", // 博茨瓦纳
            "bf", // 布基纳法索
            "bi", // 布隆迪
            "cm", // 喀麦隆
            "cv", // 佛得角
            "cf", // 中非
            "td", // 乍得
            "km", // 科摩罗
            "cd", // 刚果（金）
            "cg", // 刚果（布）
            "ci", // 科特迪瓦
            "dj", // 吉布提
            "eg", // 埃及
            "gq", // 赤道几内亚
            "er", // 厄立特里亚
            "et", // 埃塞俄比亚
            "ga", // 加蓬
            "gm", // 冈比亚
            "gh", // 加纳
            "gn", // 几内亚
            "gw", // 几内亚比绍
            "ke", // 肯尼亚
            "ls", // 莱索托
            "lr", // 利比里亚
            "ly", // 利比亚
            "mg", // 马达加斯加
            "mw", // 马拉维
            "ml", // 马里
            "mr", // 毛里塔尼亚
            "mu", // 毛里求斯
            "ma", // 摩洛哥
            "mz", // 莫桑比克
            "na", // 纳米比亚
            "za", // 南非
            "ne", // 尼日尔
            "ng", // 尼日利亚
            "rw", // 卢旺达
            "st", // 圣多美和普林西比
            "sn", // 塞内加尔
            "sc", // 塞舌尔
            "sl", // 塞拉利昂
            "so", // 索马里
            "ss", // 南苏丹
            "sd", // 苏丹
            "tz", // 坦桑尼亚
            "tg", // 多哥
            "tn", // 突尼斯
            "ug", // 乌干达
            "zm", // 赞比亚
            "zw", // 津巴布韦
            
            // 欧洲 (45个国家)
            "al", // 阿尔巴尼亚
            "ad", // 安道尔
            "at", // 奥地利
            "by", // 白俄罗斯
            "be", // 比利时
            "ba", // 波斯尼亚和黑塞哥维那
            "bg", // 保加利亚
            "hr", // 克罗地亚
            "cy", // 塞浦路斯
            "cz", // 捷克
            "dk", // 丹麦
            "ee", // 爱沙尼亚
            "fi", // 芬兰
            "fr", // 法国
            "de", // 德国
            "gr", // 希腊
            "hu", // 匈牙利
            "is", // 冰岛
            "ie", // 爱尔兰
            "it", // 意大利
            "lv", // 拉脱维亚
            "li", // 列支敦士登
            "lt", // 立陶宛
            "lu", // 卢森堡
            "mt", // 马耳他
            "md", // 摩尔多瓦
            "mc", // 摩纳哥
            "me", // 黑山
            "nl", // 荷兰
            "mk", // 北马其顿
            "no", // 挪威
            "pl", // 波兰
            "pt", // 葡萄牙
            "ro", // 罗马尼亚
            "ru", // 俄罗斯
            "sm", // 圣马力诺
            "rs", // 塞尔维亚
            "sk", // 斯洛伐克
            "si", // 斯洛文尼亚
            "es", // 西班牙
            "se", // 瑞典
            "ch", // 瑞士
            "ua", // 乌克兰
            "gb", // 英国
            
            // 美洲 (24个国家)
            "ag", // 安提瓜和巴布达
            "ar", // 阿根廷
            "bs", // 巴哈马
            "bb", // 巴巴多斯
            "bo", // 玻利维亚
            "br", // 巴西
            "ca", // 加拿大
            "cl", // 智利
            "co", // 哥伦比亚
            "cr", // 哥斯达黎加
            "cu", // 古巴
            "dm", // 多米尼克
            "do", // 多米尼加
            "ec", // 厄瓜多尔
            "sv", // 萨尔瓦多
            "gd", // 格林纳达
            "gy", // 圭亚那
            "hn", // 洪都拉斯
            "jm", // 牙买加
            "mx", // 墨西哥
            "ni", // 尼加拉瓜
            "pa", // 巴拿马
            "pe", // 秘鲁
            "sr", // 苏里南
            "tt", // 特立尼达和多巴哥
            "us", // 美国
            "uy", // 乌拉圭
            "ve", // 委内瑞拉
            
            // 大洋洲 (13个国家)
            "au", // 澳大利亚
            "ck", // 库克群岛
            "fj", // 斐济
            "ki", // 基里巴斯
            "fm", // 密克罗尼西亚
            "nr", // 瑙鲁
            "nz", // 新西兰
            "nu", // 纽埃
            "pg", // 巴布亚新几内亚
            "ws", // 萨摩亚
            "sb", // 所罗门群岛
            "to", // 汤加
            "vu"  // 瓦努阿图
        ]
    },
    asiasim: {
        name: '亚洲仿真联盟',
        countries: ["cn","jp","kr","sg","my"]
    }
};

// 测试相关变量
let quizType = '';
let difficulty = 'easy';
let questions = [];
let currentQuestion = 0;
let score = 0;
let startTime = null;
let timerInterval = null;
let wrongAnswers = [];

// 统计数据
let stats = {
    totalTests: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    bestScore: 0
};

// 设计风格列表
const stylesList = [
    '星星', '十字', '月牙', '太阳', '动物', '植物', '几何图形',
    '水平条纹', '垂直条纹', '对角条纹', '联合杰克', '泛非色彩',
    '泛阿拉伯色彩', '北欧十字', '纯色', '复杂徽章'
];

// 初始化应用
async function init() {
    loadStats();
    await loadCountriesData();
    setupEventListeners();
    displayFlags();
}

// 加载统计数据
function loadStats() {
    const saved = localStorage.getItem('flagQuizStats');
    if (saved) {
        try {
            stats = JSON.parse(saved);
        } catch (error) {
            console.warn('统计数据解析失败，使用默认值');
        }
    }
}

// 保存统计数据
function saveStats() {
    try {
        localStorage.setItem('flagQuizStats', JSON.stringify(stats));
    } catch (error) {
        console.warn('统计数据保存失败');
    }
}

// 加载国家数据
async function loadCountriesData() {
    try {
        const response = await fetch('countries_and_oganizations.json');
        if (response.ok) {
            const data = await response.json();
            allCountries = data.countries;
            console.log(`成功加载 ${allCountries.length} 个国家数据`);
        } else {
            throw new Error('无法加载countries_and_oganizations.json');
        }
    } catch (error) {
        console.log('使用示例数据:', error.message);
        allCountries = generateSampleData();
    }
    filteredCountries = [...allCountries];
    updateStats();
}

// 生成示例数据
function generateSampleData() {
    return [
        { code: "cn", nameCN: "中国", nameEN: "China", continent: "亚洲", styles: ["星星", "纯色"] },
        { code: "us", nameCN: "美国", nameEN: "United States", continent: "北美洲", styles: ["星星", "水平条纹"] },
        { code: "gb", nameCN: "英国", nameEN: "United Kingdom", continent: "欧洲", styles: ["联合杰克", "十字"] },
        { code: "jp", nameCN: "日本", nameEN: "Japan", continent: "亚洲", styles: ["太阳", "纯色"] },
        { code: "de", nameCN: "德国", nameEN: "Germany", continent: "欧洲", styles: ["水平条纹", "纯色"] },
        { code: "fr", nameCN: "法国", nameEN: "France", continent: "欧洲", styles: ["垂直条纹", "纯色"] },
        { code: "br", nameCN: "巴西", nameEN: "Brazil", continent: "南美洲", styles: ["星星", "几何图形", "复杂徽章"] },
        { code: "au", nameCN: "澳大利亚", nameEN: "Australia", continent: "大洋洲", styles: ["联合杰克", "星星"] },
        { code: "za", nameCN: "南非", nameEN: "South Africa", continent: "非洲", styles: ["水平条纹", "几何图形", "泛非色彩"] },
        { code: "eg", nameCN: "埃及", nameEN: "Egypt", continent: "非洲", styles: ["水平条纹", "复杂徽章", "泛阿拉伯色彩"] },
        { code: "in", nameCN: "印度", nameEN: "India", continent: "亚洲", styles: ["水平条纹", "纯色"] },
        { code: "ca", nameCN: "加拿大", nameEN: "Canada", continent: "北美洲", styles: ["植物", "垂直条纹"] },
        { code: "mx", nameCN: "墨西哥", nameEN: "Mexico", continent: "北美洲", styles: ["垂直条纹", "复杂徽章", "动物", "植物"] },
        { code: "ar", nameCN: "阿根廷", nameEN: "Argentina", continent: "南美洲", styles: ["水平条纹", "太阳"] },
        { code: "it", nameCN: "意大利", nameEN: "Italy", continent: "欧洲", styles: ["垂直条纹", "纯色"] },
        { code: "es", nameCN: "西班牙", nameEN: "Spain", continent: "欧洲", styles: ["水平条纹", "复杂徽章"] },
        { code: "ru", nameCN: "俄罗斯", nameEN: "Russia", continent: "欧洲", styles: ["水平条纹", "纯色"] },
        { code: "kr", nameCN: "韩国", nameEN: "South Korea", continent: "亚洲", styles: ["水平条纹"] },
        { code: "sa", nameCN: "沙特阿拉伯", nameEN: "Saudi Arabia", continent: "亚洲", styles: ["水平条纹", "泛阿拉伯色彩"] },
        { code: "nz", nameCN: "新西兰", nameEN: "New Zealand", continent: "大洋洲", styles: ["联合杰克", "星星"] }
    ];
}

// 设置事件监听
function setupEventListeners() {
    // 导航按钮
    safeAddEventListener('browseBtn', 'click', () => showSection('browse'));
    safeAddEventListener('quizBtn', 'click', () => showSection('quiz'));
    safeAddEventListener('statsBtn', 'click', () => showSection('stats'));

    // 搜索框
    safeAddEventListener('searchInput', 'input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        applyFilters();
    });

    // 大洲筛选
    safeAddEventListener('continentSelect', 'change', (e) => {
        selectedContinent = e.target.value;
        applyFilters();
    });

    // 排序方式
    document.querySelectorAll('[data-sort]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-sort]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            sortMethod = btn.dataset.sort;
            applyFilters();
        });
    });

    // 设计风格筛选
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const style = btn.dataset.style;
            if (selectedStyles.has(style)) {
                selectedStyles.delete(style);
                btn.classList.remove('selected');
            } else {
                selectedStyles.add(style);
                btn.classList.add('selected');
            }
            applyFilters();
        });
    });

    // 数据来源筛选
    safeAddEventListener('dataSourceSelect', 'change', (e) => {
        selectedDataSource = e.target.value;
        applyFilters();
    });

    // 测试类型选择
    document.querySelectorAll('.quiz-type-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.quiz-type-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            quizType = card.dataset.type;
            const startBtn = document.getElementById('startQuizBtn');
            if (startBtn) startBtn.style.display = 'block';
        });
    });

    // 难度选择
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            difficulty = btn.dataset.difficulty;
        });
    });

    // 开始测试
    safeAddEventListener('startQuizBtn', 'click', startQuiz);
    safeAddEventListener('retryBtn', 'click', startQuiz);
    safeAddEventListener('backBtn', 'click', () => showSection('quiz'));

    // 清除统计
    safeAddEventListener('clearStatsBtn', 'click', () => {
        if (confirm('确定要清除所有统计数据吗？')) {
            stats = { totalTests: 0, totalQuestions: 0, correctAnswers: 0, bestScore: 0 };
            saveStats();
            updateStatsDisplay();
        }
    });

    // 记忆按钮事件
    safeAddEventListener('memoryBtn', 'click', () => {
        EnhancedMemorySystem.showMemory();
    });
}

// 安全添加事件监听器
function safeAddEventListener(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener(event, handler);
    }
}

// 切换显示区域
function showSection(section) {
    currentSection = section;
    
    // 更新导航按钮
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (section === 'browse') safeSetClass('browseBtn', 'active');
    if (section === 'quiz') safeSetClass('quizBtn', 'active');
    if (section === 'stats') {
        safeSetClass('statsBtn', 'active');
        updateStatsDisplay();
    }
    
    // 显示对应区域
    safeSetDisplay('browse-section', section === 'browse' ? 'block' : 'none');
    safeSetDisplay('quiz-section', section === 'quiz' ? 'block' : 'none');
    safeSetDisplay('stats-section', section === 'stats' ? 'block' : 'none');
    safeSetDisplay('memory-section', 'none'); // 隐藏记忆训练页面
    
    // 重置测试状态
    if (section === 'quiz') {
        resetQuizState();
    }
}

// 安全设置类名
function safeSetClass(id, className) {
    const element = document.getElementById(id);
    if (element) element.classList.add(className);
}

// 安全设置显示状态
function safeSetDisplay(id, display) {
    const element = document.getElementById(id);
    if (element) element.style.display = display;
}

// 重置测试状态
function resetQuizState() {
    safeSetDisplay('quiz-start', 'block');
    safeSetDisplay('quiz-game', 'none');
    safeSetDisplay('quiz-result', 'none');
    
    quizType = '';
    difficulty = 'easy';
    questions = [];
    currentQuestion = 0;
    score = 0;
    wrongAnswers = [];
    
    document.querySelectorAll('.quiz-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    const easyBtn = document.querySelector('.difficulty-btn[data-difficulty="easy"]');
    if (easyBtn) easyBtn.classList.add('selected');
    
    safeSetDisplay('startQuizBtn', 'none');
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// 应用筛选
function applyFilters() {
    filteredCountries = [...allCountries];
    
    // 数据来源筛选
    if (selectedDataSource !== 'all') {
        const sourceCountries = dataSources[selectedDataSource]?.countries;
        if (sourceCountries) {
            filteredCountries = filteredCountries.filter(c => 
                sourceCountries.includes(c.code)
            );
        }
    }
    
    // 搜索筛选
    if (searchTerm) {
        filteredCountries = filteredCountries.filter(c => 
            c.nameCN.toLowerCase().includes(searchTerm) ||
            c.nameEN.toLowerCase().includes(searchTerm)
        );
    }
    
    // 大洲筛选
    if (selectedContinent !== 'all') {
        filteredCountries = filteredCountries.filter(c => c.continent === selectedContinent);
    }
    
    // 风格筛选
    if (selectedStyles.size > 0) {
        filteredCountries = filteredCountries.filter(c => 
            c.styles && c.styles.some(s => selectedStyles.has(s))
        );
    }
    
    sortCountries();
    updateStats();
    displayFlags();
}

// 排序国家
function sortCountries() {
    switch (sortMethod) {
        case 'name':
            filteredCountries.sort((a, b) => a.nameEN.localeCompare(b.nameEN));
            break;
        case 'continent':
            filteredCountries.sort((a, b) => {
                if (a.continent === b.continent) {
                    return a.nameCN.localeCompare(b.nameCN);
                }
                return a.continent.localeCompare(b.continent);
            });
            break;
        case 'random':
            filteredCountries.sort(() => Math.random() - 0.5);
            break;
    }
}

// 更新统计
function updateStats() {
    let totalCount = allCountries.length;
    if (selectedDataSource !== 'all') {
        const sourceCountries = dataSources[selectedDataSource]?.countries;
        if (sourceCountries) {
            totalCount = allCountries.filter(c => 
                sourceCountries.includes(c.code)
            ).length;
        }
    }
    
    safeSetText('totalCount', totalCount.toString());
    safeSetText('filteredCount', filteredCountries.length.toString());
}

// 安全设置文本内容
function safeSetText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}

// 显示国旗
function displayFlags() {
    const container = document.getElementById('flags-container');
    if (!container) return;
    
    if (filteredCountries.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">🔍</div>
                <h3>没有找到匹配的国旗</h3>
                <p>请尝试调整筛选条件</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredCountries.map(country => {
        const styleTags = country.styles ? country.styles.slice(0, 3).map(s => 
            `<span class="flag-tag">${s}</span>`
        ).join('') : '';
        
        return `
            <div class="flag-card">
                <img src="pics/${country.code}.png" 
                        alt="${country.nameCN}" 
                        class="flag-img"
                        onerror="this.src='https://via.placeholder.com/200x140/f0f0f0/999?text=${country.code.toUpperCase()}'">
                <div class="flag-info">
                    <div class="flag-name-cn">${country.nameCN}</div>
                    <div class="flag-name-en">${country.nameEN}</div>
                    <div class="flag-tags">
                        <span class="flag-tag">${country.continent}</span>
                        ${styleTags}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 开始测试
function startQuiz() {
    if (!quizType) {
        alert('请先选择测试类型！');
        return;
    }
    
    const questionCount = {
        easy: 5,
        medium: 10,
        hard: 20
    }[difficulty] || 5;
    
    questions = generateQuestions(questionCount);
    currentQuestion = 0;
    score = 0;
    startTime = Date.now();
    wrongAnswers = [];
    
    safeSetDisplay('quiz-start', 'none');
    safeSetDisplay('quiz-game', 'block');
    safeSetDisplay('quiz-result', 'none');
    
    startTimer();
    showQuestion();
}

// 生成题目
function generateQuestions(count) {
    const questionsArray = [];
    const availableCountries = [...allCountries];
    
    for (let i = 0; i < Math.min(count, availableCountries.length); i++) {
        const correctIndex = Math.floor(Math.random() * availableCountries.length);
        const correct = availableCountries[correctIndex];
        availableCountries.splice(correctIndex, 1);
        
        const options = [correct];
        const tempCountries = allCountries.filter(c => c.code !== correct.code);
        
        for (let j = 0; j < 3 && j < tempCountries.length; j++) {
            const wrongIndex = Math.floor(Math.random() * tempCountries.length);
            options.push(tempCountries[wrongIndex]);
            tempCountries.splice(wrongIndex, 1);
        }
        
        options.sort(() => Math.random() - 0.5);
        
        questionsArray.push({
            correct: correct,
            options: options
        });
    }
    
    return questionsArray;
}

// 显示题目
function showQuestion() {
    const q = questions[currentQuestion];
    const total = questions.length;
    
    const progressFill = document.getElementById('progressFill');
    if (progressFill) progressFill.style.width = `${((currentQuestion + 1) / total) * 100}%`;
    
    safeSetText('questionNumber', `第 ${currentQuestion + 1} / ${total} 题`);
    
    const questionContent = document.getElementById('questionContent');
    const optionsContainer = document.getElementById('optionsContainer');
    
    if (!questionContent || !optionsContainer) return;
    
    if (quizType === 'flag-to-country') {
        questionContent.innerHTML = `
            <img src="pics/${q.correct.code}.png" 
                    class="question-flag"
                    alt="国旗"
                    onerror="this.src='https://via.placeholder.com/360x240/f0f0f0/999?text=${q.correct.code.toUpperCase()}'">
            <p class="question-text">这是哪个国家的国旗？</p>
        `;
        
        optionsContainer.innerHTML = q.options.map(opt => `
            <button class="option-btn" onclick="checkAnswer('${opt.code}', '${q.correct.code}')">
                ${opt.nameCN}
            </button>
        `).join('');
    } else {
        questionContent.innerHTML = `
            <p class="question-text">请选择 ${q.correct.nameCN} 的国旗</p>
        `;
        
        optionsContainer.innerHTML = q.options.map(opt => `
            <button class="option-btn" onclick="checkAnswer('${opt.code}', '${q.correct.code}')">
                <div class="option-flag-container">
                    <img src="pics/${opt.code}.png" 
                            class="option-flag"
                            alt="${opt.nameCN}"
                            onerror="this.src='https://via.placeholder.com/200x120/f0f0f0/999?text=${opt.code.toUpperCase()}'">
                </div>
            </button>
        `).join('');
    }
}

// 检查答案
function checkAnswer(selected, correct) {
    const buttons = document.querySelectorAll('.option-btn');
    
    buttons.forEach(btn => {
        btn.disabled = true;
        const btnCode = extractCodeFromOnclick(btn.onclick);
        
        if (btnCode === correct) {
            btn.classList.add('correct');
        } else if (btnCode === selected) {
            btn.classList.add('wrong');
        }
    });
    
    if (selected === correct) {
        score++;
    } else {
        const currentQ = questions[currentQuestion];
        const selectedCountry = currentQ.options.find(opt => opt.code === selected);
        
        wrongAnswers.push({
            questionIndex: currentQuestion + 1,
            questionType: quizType,
            correctCountry: currentQ.correct,
            selectedCountry: selectedCountry,
            options: currentQ.options
        });
    }
    
    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < questions.length) {
            showQuestion();
        } else {
            endQuiz();
        }
    }, 1500);
}

// 从onclick中提取代码
function extractCodeFromOnclick(onclickFn) {
    if (!onclickFn) return null;
    const str = onclickFn.toString();
    const match = str.match(/checkAnswer\('([^']+)'/);
    return match ? match[1] : null;
}

// 结束测试
function endQuiz() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    const endTime = Date.now();
    const timeSpent = Math.floor((endTime - startTime) / 1000);
    
    stats.totalTests++;
    stats.totalQuestions += questions.length;
    stats.correctAnswers += score;
    if (score > stats.bestScore) {
        stats.bestScore = score;
    }
    saveStats();
    
    safeSetDisplay('quiz-game', 'none');
    safeSetDisplay('quiz-result', 'block');
    
    const accuracy = Math.round((score / questions.length) * 100);
    
    safeSetText('scoreDisplay', `${score}/${questions.length}`);
    safeSetText('correctCount', score.toString());
    safeSetText('wrongCount', (questions.length - score).toString());
    safeSetText('accuracyRate', `${accuracy}%`);
    safeSetText('timeSpent', formatTime(timeSpent));
    
    let message = '';
    if (accuracy === 100) {
        message = '完美！你是真正的国旗专家！🏆';
    } else if (accuracy >= 80) {
        message = '优秀！你的国旗知识非常丰富！⭐';
    } else if (accuracy >= 60) {
        message = '不错！继续努力，你会更棒的！💪';
    } else if (accuracy >= 40) {
        message = '加油！多练习就能进步！📚';
    } else {
        message = '没关系，学习需要时间，继续努力！🌟';
    }
    
    safeSetText('resultMessage', message);
    
    displayWrongAnswers();
}

// 计时器
function startTimer() {
    const timerEl = document.getElementById('timer');
    if (!timerEl) return;
    
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerEl.textContent = `⏱️ ${formatTime(elapsed)}`;
    }, 1000);
}

// 格式化时间
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 更新统计显示
function updateStatsDisplay() {
    safeSetText('totalTests', stats.totalTests.toString());
    safeSetText('totalQuestions', stats.totalQuestions.toString());
    
    const accuracy = stats.totalQuestions > 0 
        ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
        : 0;
    safeSetText('overallAccuracy', `${accuracy}%`);
    safeSetText('bestScore', stats.bestScore.toString());
}

// 显示错题详情
function displayWrongAnswers() {
    const wrongSection = document.getElementById('wrong-answers-section');
    const container = document.getElementById('wrong-answers-container');
    
    if (!wrongSection || !container) return;
    
    if (wrongAnswers.length === 0) {
        wrongSection.style.display = 'none';
        return;
    }
    
    wrongSection.style.display = 'block';
    container.innerHTML = wrongAnswers.map(wrong => {
        if (wrong.questionType === 'flag-to-country') {
            return generateFlagToCountryWrongHTML(wrong);
        } else {
            return generateCountryToFlagWrongHTML(wrong);
        }
    }).join('');
}

// 生成"看国旗选国家"类型错题的HTML
function generateFlagToCountryWrongHTML(wrong) {
    return `
        <div class="wrong-answer-item">
            <div class="wrong-question-header">
                <span class="wrong-question-number">第 ${wrong.questionIndex} 题</span>
                <span class="wrong-question-type">看国旗选国家</span>
            </div>
            <div class="wrong-question-content">
                <img src="pics/${wrong.correctCountry.code}.png" 
                     class="wrong-flag"
                     alt="国旗"
                     onerror="this.src='https://via.placeholder.com/200x120/f0f0f0/999?text=${wrong.correctCountry.code.toUpperCase()}'">
                <div class="wrong-answer-info">
                    <div class="correct-answer">
                        <span class="answer-label">正确答案：</span>
                        <span class="answer-text correct">${wrong.correctCountry.nameCN}</span>
                    </div>
                    <div class="wrong-answer">
                        <span class="answer-label">你的答案：</span>
                        <span class="answer-text wrong">${wrong.selectedCountry.nameCN}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 生成"看国家选国旗"类型错题的HTML
function generateCountryToFlagWrongHTML(wrong) {
    return `
        <div class="wrong-answer-item">
            <div class="wrong-question-header">
                <span class="wrong-question-number">第 ${wrong.questionIndex} 题</span>
                <span class="wrong-question-type">看国家选国旗</span>
            </div>
            <div class="wrong-question-content">
                <div class="country-name">${wrong.correctCountry.nameCN}</div>
                <div class="flags-comparison">
                    <div class="flag-option correct">
                        <div class="flag-label">正确答案</div>
                        <img src="pics/${wrong.correctCountry.code}.png" 
                             class="comparison-flag"
                             alt="正确国旗"
                             onerror="this.src='https://via.placeholder.com/150x100/f0f0f0/999?text=${wrong.correctCountry.code.toUpperCase()}'">
                    </div>
                    <div class="flag-option wrong">
                        <div class="flag-label">你的选择</div>
                        <img src="pics/${wrong.selectedCountry.code}.png" 
                             class="comparison-flag"
                             alt="错误国旗"
                             onerror="this.src='https://via.placeholder.com/150x100/f0f0f0/999?text=${wrong.selectedCountry.code.toUpperCase()}'">
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 增强版记忆训练系统
const EnhancedMemorySystem = {
    // 分类数据
    categories: {
        '🌟 常见国家': {
            description: '最常见和知名的国家国旗，学习国旗的绝佳起点',
            countries: ['cn', 'us', 'gb', 'jp', 'de', 'fr', 'ca', 'au', 'br', 'in', 'ru', 'it', 'es', 'kr'],
            difficulty: 'easy',
            tips: '这些都是经常在新闻中看到的国家，从它们开始学习最容易建立信心'
        },
        '🏳️ 三色旗系列': {
            description: '经典的三色条纹设计，欧洲国家的主流风格',
            countries: ['fr', 'it', 'de', 'ru', 'nl', 'be', 'ro', 'bg', 'hu', 'ie', 'at', 'ee', 'lv', 'lt'],
            difficulty: 'medium',
            tips: '记住条纹方向很重要：法国、荷兰是垂直条纹，德国、奥地利是水平条纹'
        },
        '✝️ 十字设计': {
            description: '包含十字图案的国旗，体现宗教和文化传统',
            countries: ['gb', 'dk', 'no', 'se', 'fi', 'is', 'ch', 'gr', 'ge', 'to', 'mt'],
            difficulty: 'medium',
            tips: '北欧十字（丹麦风格）vs 居中十字（瑞士风格）要区分清楚'
        },
        '☪️ 星月图案': {
            description: '伊斯兰文化圈国家常见的星月符号',
            countries: ['tr', 'pk', 'my', 'sg', 'tn', 'dz', 'ly', 'mr', 'mv', 'az', 'uz', 'tm'],
            difficulty: 'medium',
            tips: '星星数量和排列方式是区别的关键：土耳其1颗星，马来西亚14颗星'
        },
        '🇬🇧 米字旗系列': {
            description: '英联邦国家，左上角保留英国米字旗',
            countries: ['gb', 'au', 'nz', 'fj', 'tv'],
            difficulty: 'easy',
            tips: '重点看右侧图案：澳大利亚有南十字星，新西兰有南十字星但颜色不同'
        },
        '🔴 红白条纹': {
            description: '简洁的红白条纹设计，经典而醒目',
            countries: ['pl', 'at', 'id', 'lv', 'mc', 'pe'],
            difficulty: 'easy',
            tips: '波兰和印尼很像但颜色位置相反，注意区分'
        },
        '🔵 蓝白条纹': {
            description: '蓝白条纹，多为拉丁美洲和地中海国家',
            countries: ['ar', 'uy', 'gr', 'gt', 'hn', 'ni', 'sv', 'il'],
            difficulty: 'medium',
            tips: '阿根廷有太阳，希腊有十字，以色列有大卫星'
        }
    },

    // 用户数据
    progress: JSON.parse(localStorage.getItem('enhancedMemoryProgress') || '{}'),
    achievements: JSON.parse(localStorage.getItem('memoryAchievements') || '[]'),
    dailyGoal: parseInt(localStorage.getItem('dailyGoal') || '10'),

    // 当前学习会话
    currentSession: {
        startTime: null,
        flagsStudied: 0,
        sessionType: null
    },

    init() {
        console.log('增强版记忆系统已初始化');
        this.checkDailyProgress();
    },

    showMemory() {
        // 隐藏其他界面
        ['browse-section', 'quiz-section', 'stats-section'].forEach(id => {
            safeSetDisplay(id, 'none');
        });

        // 显示记忆界面
        safeSetDisplay('memory-section', 'block');
        this.render();

        // 更新导航
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        safeSetClass('memoryBtn', 'active');
        
        // 更新当前区域状态
        currentSection = 'memory';
    },

    showStudyPage() {
        // 隐藏其他所有界面
        ['browse-section', 'quiz-section', 'stats-section', 'memory-section'].forEach(id => {
            safeSetDisplay(id, 'none');
        });

        // 创建或显示学习页面
        let studySection = document.getElementById('study-section');
        if (!studySection) {
            studySection = document.createElement('div');
            studySection.id = 'study-section';
            studySection.style.display = 'none';
            document.body.appendChild(studySection);
        }

        studySection.style.display = 'block';
        
        // 清空导航激活状态
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        // 更新当前区域状态
        currentSection = 'study';
        
        // 渲染学习界面
        this.renderStudyPage(studySection);
    },

    renderStudyPage(container) {
        container.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
                <!-- 返回按钮 -->
                <div style="margin-bottom: 20px;">
                    <button onclick="EnhancedMemorySystem.showMemory()" 
                            style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        ← 返回记忆训练
                    </button>
                </div>
                
                <div id="studyContent" style="min-height: 400px;"></div>
            </div>
        `;
        
        // 将学习内容渲染到新容器
        const studyContent = document.getElementById('studyContent');
        if (studyContent && this.currentFlags && this.currentIndex < this.currentFlags.length) {
            this.showFlag(studyContent);
        }
    },

    render() {
        const container = document.getElementById('simpleMemoryContainer');
        if (!container) return;

        const allFlags = Object.values(this.categories).flatMap(cat => cat.countries);
        const learned = allFlags.filter(code => this.progress[code]?.learned);
        const overallProgress = Math.round((learned.length / allFlags.length) * 100);
        const todayStudied = this.getTodayStudiedCount();

        container.innerHTML = `
            <div style="max-width: 900px; margin: 0 auto;">
                <!-- 头部统计 -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; margin-bottom: 25px; text-align: center;">
                    <h2 style="margin: 0 0 15px 0; font-size: 1.8rem;">🧠 国旗记忆大师</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div>
                            <div style="font-size: 1.5rem; font-weight: bold;">${learned.length}</div>
                            <div style="font-size: 0.9rem; opacity: 0.9;">已学习</div>
                        </div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: bold;">${allFlags.length}</div>
                            <div style="font-size: 0.9rem; opacity: 0.9;">总数量</div>
                        </div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: bold;">${overallProgress}%</div>
                            <div style="font-size: 0.9rem; opacity: 0.9;">完成度</div>
                        </div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: bold;">${todayStudied}</div>
                            <div style="font-size: 0.9rem; opacity: 0.9;">今日学习</div>
                        </div>
                    </div>
                    
                    <!-- 今日目标进度 -->
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span>今日学习目标</span>
                            <span>${todayStudied}/${this.dailyGoal}</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.3); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: #10b981; height: 100%; width: ${Math.min((todayStudied / this.dailyGoal) * 100, 100)}%; transition: width 0.3s;"></div>
                        </div>
                        ${todayStudied >= this.dailyGoal ? '<div style="margin-top: 8px; font-size: 0.9rem;">🎉 今日目标已完成</div>' : ''}
                    </div>
                </div>
                
                <!-- 快捷操作 -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <button style="background: #10b981; color: white; border: none; padding: 15px; border-radius: 10px; cursor: pointer; transition: all 0.3s;" 
                            onclick="EnhancedMemorySystem.quickStudy('random')" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="font-size: 1.2rem; margin-bottom: 5px;">🎲</div>
                        <div style="font-weight: bold;">随机学习</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">混合练习</div>
                    </button>
                    <button style="background: #3b82f6; color: white; border: none; padding: 15px; border-radius: 10px; cursor: pointer; transition: all 0.3s;" 
                            onclick="EnhancedMemorySystem.quickStudy('new')" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="font-size: 1.2rem; margin-bottom: 5px;">📚</div>
                        <div style="font-weight: bold;">学习新知</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">未学内容</div>
                    </button>
                    <button style="background: #f59e0b; color: white; border: none; padding: 15px; border-radius: 10px; cursor: pointer; transition: all 0.3s;" 
                            onclick="EnhancedMemorySystem.quickStudy('review')" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="font-size: 1.2rem; margin-bottom: 5px;">🔄</div>
                        <div style="font-weight: bold;">复习模式</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">巩固记忆</div>
                    </button>
                    <button style="background: #ef4444; color: white; border: none; padding: 15px; border-radius: 10px; cursor: pointer; transition: all 0.3s;" 
                            onclick="EnhancedMemorySystem.speedChallenge()" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="font-size: 1.2rem; margin-bottom: 5px;">⚡</div>
                        <div style="font-weight: bold;">速度挑战</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">测试反应</div>
                    </button>
                </div>
                
                <!-- 分类学习 -->
                <h3 style="margin-bottom: 20px; color: #1f2937;">📂 分类学习</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    ${Object.entries(this.categories).map(([name, data]) => {
                        const categoryLearned = data.countries.filter(code => this.progress[code]?.learned).length;
                        const progress = Math.round((categoryLearned / data.countries.length) * 100);
                        
                        const difficultyColor = {
                            'easy': '#10b981',
                            'medium': '#f59e0b', 
                            'hard': '#ef4444'
                        }[data.difficulty] || '#6b7280';
                        
                        const difficultyText = {
                            'easy': '简单',
                            'medium': '中等',
                            'hard': '困难'
                        }[data.difficulty] || '一般';
                        
                        return `
                            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s;" 
                                 onclick="EnhancedMemorySystem.startCategoryStudy('${name}')"
                                 onmouseover="this.style.borderColor='#3b82f6'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 25px rgba(0,0,0,0.1)'" 
                                 onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                    <h4 style="margin: 0; color: #1f2937; line-height: 1.3;">${name}</h4>
                                    <span style="background: ${difficultyColor}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">${difficultyText}</span>
                                </div>
                                <p style="color: #6b7280; font-size: 14px; line-height: 1.4; margin-bottom: 15px;">${data.description}</p>
                                <div style="background: #f3f4f6; height: 6px; border-radius: 3px; margin-bottom: 10px; overflow: hidden;">
                                    <div style="background: #3b82f6; height: 100%; width: ${progress}%; border-radius: 3px; transition: width 0.3s;"></div>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #6b7280;">
                                    <span>${categoryLearned}/${data.countries.length} 已学习</span>
                                    <span>${progress}%</span>
                                </div>
                                ${data.tips ? `<div style="background: #fef3c7; padding: 8px; border-radius: 6px; margin-top: 10px; border-left: 3px solid #f59e0b;">
                                    <div style="font-size: 11px; font-weight: bold; color: #92400e; margin-bottom: 2px;">💡 学习技巧</div>
                                    <div style="font-size: 11px; color: #92400e; line-height: 1.3;">${data.tips}</div>
                                </div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <!-- 设置区域 -->
                <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
                    <h4 style="margin: 0 0 15px 0; color: #1f2937;">⚙️ 学习设置</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <label style="display: block; font-size: 14px; color: #374151; margin-bottom: 5px;">每日学习目标</label>
                            <input type="number" value="${this.dailyGoal}" min="5" max="50" 
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;"
                                   onchange="EnhancedMemorySystem.updateDailyGoal(this.value)">
                        </div>
                        <div style="display: flex; align-items: end; gap: 10px;">
                            <button onclick="EnhancedMemorySystem.exportProgress()" 
                                    style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;">
                                📤 导出数据
                            </button>
                            <button onclick="EnhancedMemorySystem.resetProgress()" 
                                    style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px;">
                                🗑️ 重置进度
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 学习区域移除，因为已经独立成页面 -->
                <div id="studyArea" style="display: none;"></div>
            </div>
        `;
    },

    quickStudy(mode) {
        const allFlags = Object.values(this.categories).flatMap(cat => cat.countries);
        let studyFlags = [];

        switch(mode) {
            case 'random':
                studyFlags = this.shuffle([...allFlags]).slice(0, 10);
                this.currentSession.sessionType = '随机学习';
                break;
            case 'new':
                const unlearnedFlags = allFlags.filter(code => !this.progress[code]?.learned);
                if (unlearnedFlags.length === 0) {
                    this.showMessage('🎉 太棒了！您已经学习了所有国旗！可以开始复习模式巩固记忆。');
                    return;
                }
                studyFlags = this.shuffle(unlearnedFlags).slice(0, Math.min(8, unlearnedFlags.length));
                this.currentSession.sessionType = '新知学习';
                break;
            case 'review':
                const learnedFlags = allFlags.filter(code => this.progress[code]?.learned);
                if (learnedFlags.length === 0) {
                    this.showMessage('📚 还没有学习过的国旗，先学习一些吧！');
                    return;
                }
                studyFlags = this.shuffle(learnedFlags).slice(0, Math.min(10, learnedFlags.length));
                this.currentSession.sessionType = '复习模式';
                break;
        }

        this.currentFlags = studyFlags;
        this.currentIndex = 0;
        this.startSession();
        this.showStudyPage(); // 进入学习页面
    },

    speedChallenge() {
        const allFlags = Object.values(this.categories).flatMap(cat => cat.countries);
        const learnedFlags = allFlags.filter(code => this.progress[code]?.learned);
        
        if (learnedFlags.length < 10) {
            this.showMessage('📚 速度挑战需要至少掌握10个国旗，继续学习吧！');
            return;
        }
        
        this.showMessage('⚡ 速度挑战功能即将推出，敬请期待！');
    },

    startCategoryStudy(categoryName) {
        const category = this.categories[categoryName];
        if (!category) return;

        // 优先选择未学习的国旗
        const unlearned = category.countries.filter(code => !this.progress[code]?.learned);
        const studyFlags = unlearned.length > 0 ? 
            this.shuffle(unlearned).slice(0, Math.min(8, unlearned.length)) :
            this.shuffle([...category.countries]).slice(0, 8);

        this.currentFlags = studyFlags;
        this.currentIndex = 0;
        this.currentCategory = categoryName;
        this.currentSession.sessionType = `分类学习: ${categoryName}`;
        this.startSession();
        this.showStudyPage(); // 进入学习页面
    },

    startSession() {
        this.currentSession.startTime = Date.now();
        this.currentSession.flagsStudied = 0;
    },

    showFlag(container = null) {
        if (this.currentIndex >= this.currentFlags.length) {
            this.showComplete();
            return;
        }

        const flagCode = this.currentFlags[this.currentIndex];
        const countryInfo = allCountries?.find(c => c.code === flagCode);
        const flagProgress = this.progress[flagCode] || {};

        // 如果指定了容器，使用指定容器，否则使用默认的studyArea
        const targetContainer = container || document.getElementById('studyArea');
        if (!targetContainer) return;

        targetContainer.innerHTML = `
            <div style="background: white; border-radius: 15px; padding: 30px; text-align: center; box-shadow: 0 8px 25px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto;">
                <!-- 进度指示器 -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 12px; background: #f8fafc; border-radius: 10px;">
                    <div style="font-size: 14px; color: #6b7280;">
                        ${this.currentSession.sessionType} | 进度: ${this.currentIndex + 1}/${this.currentFlags.length}
                    </div>
                    <div style="font-size: 14px; color: #6b7280;">
                        ⏱️ ${this.getSessionTime()}
                    </div>
                </div>
                
                <!-- 进度条 -->
                <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 25px;">
                    <div style="background: linear-gradient(90deg, #3b82f6, #10b981); height: 100%; width: ${((this.currentIndex + 1) / this.currentFlags.length) * 100}%; transition: width 0.3s;"></div>
                </div>
                
                <!-- 国旗图片 -->
                <div style="margin-bottom: 25px; position: relative;">
                    <img src="pics/${flagCode}.png" alt="${flagCode}" 
                         style="max-width: 300px; width: 100%; height: auto; max-height: 200px; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); object-fit: contain; background: #f8f9fa;"
                         onerror="this.src='https://via.placeholder.com/300x200/f0f0f0/999?text=${flagCode.toUpperCase()}'">
                    
                    <!-- 学习状态指示 -->
                    ${flagProgress.learned ? `
                        <div style="position: absolute; top: -8px; right: -8px; background: #10b981; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 3px solid white;">
                            ✓
                        </div>
                    ` : ''}
                </div>
                
                <!-- 国旗信息 -->
                <div style="margin-bottom: 25px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 1.5rem; color: #1f2937;">${countryInfo ? countryInfo.nameCN : flagCode.toUpperCase()}</h3>
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 1rem;">${countryInfo ? countryInfo.nameEN : ''}</p>
                    <p style="margin: 0; color: #3b82f6; font-weight: 500;">${countryInfo ? countryInfo.continent : ''}</p>
                </div>
                
                <!-- 操作按钮 -->
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="EnhancedMemorySystem.markLearned('${flagCode}', 'easy')" 
                            style="background: #10b981; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s;"
                            onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                        ✅ 很容易记住
                    </button>
                    <button onclick="EnhancedMemorySystem.markLearned('${flagCode}', 'normal')" 
                            style="background: #3b82f6; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s;"
                            onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
                        👍 记住了
                    </button>
                    <button onclick="EnhancedMemorySystem.markLearned('${flagCode}', 'hard')" 
                            style="background: #f59e0b; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s;"
                            onmouseover="this.style.background='#d97706'" onmouseout="this.style.background='#f59e0b'">
                        🤔 有点困难
                    </button>
                    <button onclick="EnhancedMemorySystem.nextFlag()" 
                            style="background: #6b7280; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s;"
                            onmouseover="this.style.background='#4b5563'" onmouseout="this.style.background='#6b7280'">
                        ⏭️ 跳过
                    </button>
                </div>
                
                <!-- 快捷键提示 -->
                <div style="margin-top: 20px; padding: 10px; background: #f9fafb; border-radius: 8px; font-size: 12px; color: #6b7280;">
                    💡 快捷键：数字 1-3 快速选择难度，空格键跳过
                </div>
            </div>
        `;
        
        // 绑定键盘快捷键
        this.bindKeyboardShortcuts(flagCode);
    },

    bindKeyboardShortcuts(flagCode) {
        const keyHandler = (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    this.markLearned(flagCode, 'easy');
                    break;
                case '2':
                    e.preventDefault();
                    this.markLearned(flagCode, 'normal');
                    break;
                case '3':
                    e.preventDefault();
                    this.markLearned(flagCode, 'hard');
                    break;
                case ' ':
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextFlag();
                    break;
            }
        };
        
        document.removeEventListener('keydown', this.currentKeyHandler);
        this.currentKeyHandler = keyHandler;
        document.addEventListener('keydown', keyHandler);
    },

    markLearned(flagCode, difficulty = 'normal') {
        if (!this.progress[flagCode]) {
            this.progress[flagCode] = {
                learned: false,
                reviewCount: 0,
                lastReview: null,
                difficulty: 'normal',
                firstLearnedAt: null
            };
        }
        
        const now = new Date().toISOString();
        const flagProgress = this.progress[flagCode];
        
        if (!flagProgress.learned) {
            flagProgress.firstLearnedAt = now;
            this.currentSession.flagsStudied++;
        }
        
        flagProgress.learned = true;
        flagProgress.lastReview = now;
        flagProgress.reviewCount = (flagProgress.reviewCount || 0) + 1;
        flagProgress.difficulty = difficulty;
        
        this.saveProgress();
        this.showLearningFeedback(difficulty);
        
        setTimeout(() => {
            this.nextFlag();
        }, 1500);
    },

    showLearningFeedback(difficulty) {
        const messages = {
            'easy': ['太棒了！🎉', '轻松掌握！⭐', '学习之星！🌟'],
            'normal': ['很好！👍', '继续加油！💪', '进步神速！🚀'],
            'hard': ['没关系，多练习！📚', '慢慢来！🐌', '坚持就是胜利！💪']
        };
        
        const colors = {
            'easy': '#10b981',
            'normal': '#3b82f6', 
            'hard': '#f59e0b'
        };
        
        const message = messages[difficulty][Math.floor(Math.random() * messages[difficulty].length)];
        const color = colors[difficulty];
        
        const feedback = document.createElement('div');
        feedback.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: ${color}; color: white; padding: 20px 30px; border-radius: 12px; font-size: 1.2rem; font-weight: bold; z-index: 10000; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); animation: feedbackPop 1.5s ease-out;">
                ${message}
            </div>
            <style>
                @keyframes feedbackPop {
                    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                    20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
                }
            </style>
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 1500);
    },

    nextFlag() {
        this.currentIndex++;
        // 根据当前页面状态决定使用哪个容器
        if (currentSection === 'study') {
            const studyContent = document.getElementById('studyContent');
            this.showFlag(studyContent);
        } else {
            this.showFlag();
        }
    },

    showComplete() {
        document.removeEventListener('keydown', this.currentKeyHandler);
        
        const studyArea = document.getElementById('studyArea');
        if (!studyArea) return;
        
        const sessionTime = this.getSessionTime();
        const studiedCount = this.currentSession.flagsStudied;
        
        studyArea.innerHTML = `
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 20px; padding: 40px; text-align: center; box-shadow: 0 15px 35px rgba(16, 185, 129, 0.3); max-width: 600px; margin: 0 auto;">
                <div style="font-size: 4rem; margin-bottom: 20px; animation: bounce 1s ease-in-out;">🎊</div>
                <h3 style="margin: 0 0 15px 0; font-size: 2rem;">学习完成！</h3>
                <p style="margin: 0 0 30px 0; font-size: 1.1rem; opacity: 0.95;">太棒了！你完成了 ${this.currentSession.sessionType}</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px;">
                        <div style="font-size: 2rem; font-weight: bold; margin-bottom: 5px;">${this.currentFlags.length}</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">学习数量</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px;">
                        <div style="font-size: 2rem; font-weight: bold; margin-bottom: 5px;">${studiedCount}</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">新掌握</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px;">
                        <div style="font-size: 2rem; font-weight: bold; margin-bottom: 5px;">${sessionTime}</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">用时</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="EnhancedMemorySystem.render()" 
                            style="background: rgba(255,255,255,0.9); color: #059669; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        🏠 返回首页
                    </button>
                    <button onclick="EnhancedMemorySystem.quickStudy('random')" 
                            style="background: rgba(255,255,255,0.2); color: white; border: 2px solid white; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        🎲 继续学习
                    </button>
                </div>
                
                <style>
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                </style>
            </div>
        `;
        
        setTimeout(() => this.render(), 1000);
    },

    getSessionTime() {
        if (!this.currentSession.startTime) return '00:00';
        const elapsed = Math.floor((Date.now() - this.currentSession.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    getTodayStudiedCount() {
        const today = new Date().toDateString();
        return Object.values(this.progress).filter(p => 
            p.learned && p.firstLearnedAt && 
            new Date(p.firstLearnedAt).toDateString() === today
        ).length;
    },

    checkDailyProgress() {
        const todayStudied = this.getTodayStudiedCount();
        if (todayStudied >= this.dailyGoal) {
            console.log('今日学习目标已完成！');
        }
    },

    updateDailyGoal(newGoal) {
        this.dailyGoal = parseInt(newGoal);
        localStorage.setItem('dailyGoal', this.dailyGoal.toString());
        this.render();
    },

    exportProgress() {
        const exportData = {
            progress: this.progress,
            dailyGoal: this.dailyGoal,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flag-memory-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showMessage('📤 学习数据已导出成功！');
    },

    resetProgress() {
        if (confirm('确定要重置所有学习进度吗？此操作不可逆！')) {
            localStorage.removeItem('enhancedMemoryProgress');
            localStorage.removeItem('dailyGoal');
            
            this.progress = {};
            this.dailyGoal = 10;
            
            this.render();
            this.showMessage('🗑️ 学习进度已重置！');
        }
    },

    showMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.innerHTML = `
            <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #3b82f6; color: white; padding: 15px 25px; border-radius: 8px; z-index: 10000; box-shadow: 0 5px 20px rgba(59, 130, 246, 0.3); animation: messageSlide 0.3s ease-out;">
                ${message}
            </div>
            <style>
                @keyframes messageSlide {
                    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            </style>
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.animation = 'messageSlide 0.3s ease-out reverse';
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 300);
        }, 3000);
    },

    saveProgress() {
        try {
            localStorage.setItem('enhancedMemoryProgress', JSON.stringify(this.progress));
        } catch (error) {
            console.warn('记忆进度保存失败');
        }
    },

    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};

// 暴露全局函数
window.checkAnswer = checkAnswer;
window.EnhancedMemorySystem = EnhancedMemorySystem;

// 初始化应用
window.addEventListener('DOMContentLoaded', () => {
    init();
    
    // 初始化增强记忆系统
    EnhancedMemorySystem.init();
    
    console.log('🏳️ 国旗系统已完全初始化');
});