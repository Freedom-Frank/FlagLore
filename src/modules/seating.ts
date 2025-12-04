/**
 * 国际场合席位安排模块
 * 提供国际场合的国旗席位安排功能
 */

import html2canvas from 'html2canvas';
import type { Country } from '../types';
import type {
  SeatingRule,
  SeatingConfig,
  SeatingArrangement,
  LayoutType,
  DiplomaticRelations,
  SeatingTemplate,
} from '../types/seating';
import { getAllCountries, getFilteredCountries } from '../lib/state';
import { DATA_SOURCES } from '../lib/constants';
import { getFlagImageUrl } from '../lib/data-loader';

/**
 * 模块初始化标志
 */
let moduleInitialized = false;

/**
 * 当前配置
 */
let currentConfig: SeatingConfig = {
  rule: 'alphabetical-en',
};

/**
 * 当前布局类型
 */
let currentLayout: LayoutType = 'linear';

/**
 * 当前排位结果
 */
let currentArrangement: SeatingArrangement | null = null;

/**
 * 当前选择的数据源
 */
let currentDataSource: string = 'un';

/**
 * 可选国家列表（根据数据源）
 */
let availableCountries: Country[] = [];

/**
 * 选中的国家代码列表
 */
let selectedCountryCodes: Set<string> = new Set();

/**
 * 保存的方案接口
 */
interface SavedTemplate {
  name: string;
  dataSource: string;
  selectedCountries: string[];
  config: SeatingConfig;
  layout: LayoutType;
  savedAt: string;
}

/**
 * localStorage 键名
 */
const STORAGE_KEY = 'seating-saved-templates';

/**
 * 建交时间数据（中国与各国）
 * 从 cn_diplomatic.txt 解析
 */
const diplomaticRelations: DiplomaticRelations = {
  // 亚洲
  af: '1955.1.20', // 阿富汗
  am: '1992.4.6', // 亚美尼亚
  az: '1992.4.2', // 阿塞拜疆
  bh: '1989.4.18', // 巴林
  bd: '1975.10.4', // 孟加拉国
  bn: '1991.9.30', // 文莱
  kh: '1958.7.19', // 柬埔寨
  kp: '1949.10.6', // 朝鲜
  tl: '2002.5.20', // 东帝汶
  ge: '1992.6.9', // 格鲁吉亚
  in: '1950.4.1', // 印度
  id: '1950.4.13', // 印度尼西亚
  ir: '1971.8.16', // 伊朗
  iq: '1958.8.25', // 伊拉克
  il: '1992.1.24', // 以色列
  jp: '1972.9.29', // 日本
  jo: '1977.4.7', // 约旦
  kz: '1992.1.3', // 哈萨克斯坦
  kw: '1971.3.22', // 科威特
  kg: '1992.1.5', // 吉尔吉斯斯坦
  la: '1961.4.25', // 老挝
  lb: '1971.11.9', // 黎巴嫩
  my: '1974.5.31', // 马来西亚
  mv: '1972.10.14', // 马尔代夫
  mn: '1949.10.16', // 蒙古
  mm: '1950.6.8', // 缅甸
  np: '1955.8.1', // 尼泊尔
  om: '1978.5.25', // 阿曼
  pk: '1951.5.21', // 巴基斯坦
  ps: '1988.11.20', // 巴勒斯坦
  ph: '1975.6.9', // 菲律宾
  qa: '1988.7.9', // 卡塔尔
  kr: '1992.8.24', // 韩国
  sa: '1990.7.21', // 沙特阿拉伯
  sg: '1990.10.3', // 新加坡
  lk: '1957.2.7', // 斯里兰卡
  sy: '1956.8.1', // 叙利亚
  tj: '1992.1.4', // 塔吉克斯坦
  th: '1975.7.1', // 泰国
  tr: '1971.8.4', // 土耳其
  tm: '1992.1.6', // 土库曼斯坦
  ae: '1984.11.1', // 阿联酋
  uz: '1992.1.2', // 乌兹别克斯坦
  vn: '1950.1.18', // 越南
  ye: '1956.9.24', // 也门
  // 其他大洲的数据可以继续添加...
};

/**
 * 法文字母排序映射表
 * 处理法文特殊字符的排序
 */
const frenchCollator = new Intl.Collator('fr', { sensitivity: 'base' });

/**
 * 预设配置模板
 */
const PRESET_TEMPLATES: SeatingTemplate[] = [
  {
    id: 'un-general-assembly',
    name: '联合国大会',
    description: '联合国成员国，英文字母顺序排列',
    icon: '🌐',
    dataSource: 'un',
    rule: 'alphabetical-en',
    recommendedLayout: 'grid',
  },
  {
    id: 'g20-summit',
    name: 'G20峰会',
    description: '二十国集团，主办国优先',
    icon: '🏛️',
    dataSource: 'g20',
    rule: 'host-first',
    hostCountry: 'cn',
    recommendedLayout: 'circular',
  },
  {
    id: 'olympic-ceremony',
    name: '奥运会入场',
    description: '希腊第一、东道主最后、其余按英文字母',
    icon: '🏅',
    dataSource: 'un',
    rule: 'olympic',
    hostCountry: 'cn',
    recommendedLayout: 'linear',
  },
  {
    id: 'china-diplomatic',
    name: '中国外交场合',
    description: '与中国建交国家，按建交时间排序',
    icon: '🇨🇳',
    dataSource: 'china_diplomatic',
    rule: 'diplomatic-time',
    recommendedLayout: 'linear',
  },
  {
    id: 'eu-meeting',
    name: '欧盟会议',
    description: '欧盟成员国，英文字母顺序',
    icon: '🇪🇺',
    dataSource: 'euu',
    rule: 'alphabetical-en',
    recommendedLayout: 'u-shape',
  },
  {
    id: 'asia-conference',
    name: '亚洲会议',
    description: '亚洲国家，按大洲分组',
    icon: '🌏',
    dataSource: 'un',
    rule: 'continent-group',
    recommendedLayout: 'grid',
  },
];

/**
 * 初始化模块
 */
export function initSeatingModule(): void {
  if (moduleInitialized) {
    console.warn('⚠️ Seating module already initialized');
    return;
  }

  console.log('🪑 Initializing seating module...');

  // 渲染模板
  renderTemplates();

  // 绑定事件监听器
  setupEventListeners();

  moduleInitialized = true;
  console.log('✅ Seating module initialized');
}

/**
 * 渲染模板卡片
 */
function renderTemplates(): void {
  const container = document.getElementById('templates-grid');
  if (!container) return;

  container.innerHTML = '';

  PRESET_TEMPLATES.forEach((template) => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.dataset.templateId = template.id;

    card.innerHTML = `
      <span class="template-icon">${template.icon}</span>
      <div class="template-name">${template.name}</div>
      <div class="template-desc">${template.description}</div>
    `;

    card.addEventListener('click', () => applyTemplate(template));

    container.appendChild(card);
  });
}

/**
 * 应用模板
 */
function applyTemplate(template: SeatingTemplate): void {
  // 更新数据源
  currentDataSource = template.dataSource;
  const sourceSelect = document.getElementById('seating-source-select') as HTMLSelectElement;
  if (sourceSelect) {
    sourceSelect.value = template.dataSource;
  }

  // 更新可选国家列表
  updateAvailableCountries();

  // 更新排序规则
  currentConfig.rule = template.rule;
  const ruleSelect = document.getElementById('seating-rule-select') as HTMLSelectElement;
  if (ruleSelect) {
    ruleSelect.value = template.rule;
  }

  // 更新主办国（如果有）
  if (template.hostCountry) {
    currentConfig.hostCountry = template.hostCountry;
    const hostInput = document.getElementById('seating-host-input') as HTMLInputElement;
    if (hostInput) {
      hostInput.value = template.hostCountry;
    }
  }

  // 更新布局
  currentLayout = template.recommendedLayout;
  document.querySelectorAll('.layout-btn').forEach((btn) => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-layout') === template.recommendedLayout) {
      btn.classList.add('active');
    }
  });

  // 显示/隐藏配置项
  toggleConfigOptions();

  // 高亮选中的模板
  document.querySelectorAll('.template-card').forEach((card) => {
    card.classList.remove('active');
  });
  const selectedCard = document.querySelector(`[data-template-id="${template.id}"]`);
  if (selectedCard) {
    selectedCard.classList.add('active');
  }

  // 跳转到国家选择页面
  showCountrySelectionPage();
}

/**
 * 显示国家选择页面
 */
function showCountrySelectionPage(): void {
  const detailSection = document.getElementById('seating-detail-section');
  const selectionPage = document.getElementById('country-selection-page');

  if (detailSection) detailSection.style.display = 'none';
  if (selectionPage) selectionPage.style.display = 'block';

  // 更新数据源名称显示
  const sourceNameEl = document.getElementById('selection-source-name');
  if (sourceNameEl) {
    const sourceNames: Record<string, string> = {
      un: '联合国会员国',
      g20: '二十国集团',
      euu: '欧洲联盟',
      auu: '非洲联盟',
      china_diplomatic: '与中国建交国家',
      asiasim: '亚洲仿真联盟',
      current: '当前浏览筛选结果',
    };
    sourceNameEl.textContent = sourceNames[currentDataSource] || currentDataSource;
  }

  // 渲染选择页面的国家列表
  renderSelectionPageCountries();

  // 更新计数显示
  updateSelectionCount();
}

/**
 * 隐藏国家选择页面，返回配置页面
 */
function hideCountrySelectionPage(): void {
  const detailSection = document.getElementById('seating-detail-section');
  const selectionPage = document.getElementById('country-selection-page');

  if (selectionPage) selectionPage.style.display = 'none';
  if (detailSection) detailSection.style.display = 'block';
}

/**
 * 渲染选择页面的国家列表
 */
function renderSelectionPageCountries(): void {
  const container = document.getElementById('country-selection-grid');
  if (!container) return;

  container.innerHTML = '';

  availableCountries.forEach((country) => {
    const item = document.createElement('div');
    item.className = 'country-select-item';
    item.dataset.countryCode = country.code;

    if (selectedCountryCodes.has(country.code)) {
      item.classList.add('selected');
    }

    const flag = document.createElement('img');
    flag.src = getFlagImageUrl(country.code);
    flag.alt = country.nameCN;
    flag.className = 'country-select-flag';

    const name = document.createElement('div');
    name.className = 'country-select-name';
    name.textContent = country.nameCN;

    item.appendChild(flag);
    item.appendChild(name);

    // 点击切换选中状态
    item.addEventListener('click', () => handleSelectionPageCountryToggle(country.code));

    container.appendChild(item);
  });

  // 更新总数显示
  const totalDisplay = document.getElementById('selection-total-display');
  if (totalDisplay) {
    totalDisplay.textContent = String(availableCountries.length);
  }
}

/**
 * 处理选择页面的国家切换
 */
function handleSelectionPageCountryToggle(countryCode: string): void {
  if (selectedCountryCodes.has(countryCode)) {
    selectedCountryCodes.delete(countryCode);
  } else {
    selectedCountryCodes.add(countryCode);
  }

  // 更新UI
  const item = document.querySelector(
    `#country-selection-grid [data-country-code="${countryCode}"]`
  );
  if (item) {
    item.classList.toggle('selected');
  }

  updateSelectionCount();
}

/**
 * 更新选择计数显示
 */
function updateSelectionCount(): void {
  // 更新原配置页面的计数
  const countEl = document.getElementById('selected-count');
  if (countEl) {
    countEl.textContent = `(已选 ${selectedCountryCodes.size} 个)`;
  }

  // 更新选择页面的计数
  const displayEl = document.getElementById('selection-count-display');
  if (displayEl) {
    displayEl.textContent = String(selectedCountryCodes.size);
  }
}

/**
 * 完成国家选择，返回配置页面
 */
function finishCountrySelection(): void {
  if (selectedCountryCodes.size === 0) {
    showMessage('请至少选择一个国家', 'warning');
    return;
  }

  hideCountrySelectionPage();
  showMessage(`已选择 ${selectedCountryCodes.size} 个国家，可以生成排位方案`, 'success');
}

/**
 * 选择页面全选
 */
function selectAllInSelectionPage(): void {
  selectedCountryCodes = new Set(availableCountries.map((c) => c.code));

  // 更新UI
  document.querySelectorAll('#country-selection-grid .country-select-item').forEach((item) => {
    item.classList.add('selected');
  });

  updateSelectionCount();
}

/**
 * 选择页面清空
 */
function deselectAllInSelectionPage(): void {
  selectedCountryCodes.clear();

  // 更新UI
  document.querySelectorAll('#country-selection-grid .country-select-item').forEach((item) => {
    item.classList.remove('selected');
  });

  updateSelectionCount();
}

/**
 * 处理选择页面搜索
 */
function handleSelectionPageSearch(e: Event): void {
  const input = e.target as HTMLInputElement;
  const searchTerm = input.value.toLowerCase().trim();

  const items = document.querySelectorAll('#country-selection-grid .country-select-item');

  items.forEach((item) => {
    const countryCode = item.getAttribute('data-country-code');
    if (!countryCode) return;

    const country = availableCountries.find((c) => c.code === countryCode);
    if (!country) return;

    // 搜索匹配：中文名、英文名、国家代码
    const matchesCN = country.nameCN.toLowerCase().includes(searchTerm);
    const matchesEN = country.nameEN.toLowerCase().includes(searchTerm);
    const matchesCode = country.code.toLowerCase().includes(searchTerm);

    if (searchTerm === '' || matchesCN || matchesEN || matchesCode) {
      (item as HTMLElement).style.display = 'flex';
    } else {
      (item as HTMLElement).style.display = 'none';
    }
  });
}

/**
 * 设置事件监听器
 */
function setupEventListeners(): void {
  // 工具卡片点击
  const seatingCard = document.getElementById('seating-tool-card');
  if (seatingCard) {
    seatingCard.addEventListener('click', showSeatingDetail);
  }

  // 返回按钮
  const backBtn = document.getElementById('backToToolsBtn');
  if (backBtn) {
    backBtn.addEventListener('click', backToTools);
  }

  // 数据源选择
  const sourceSelect = document.getElementById('seating-source-select') as HTMLSelectElement;
  if (sourceSelect) {
    sourceSelect.addEventListener('change', handleSourceChange);
  }

  // 排序规则选择
  const ruleSelect = document.getElementById('seating-rule-select') as HTMLSelectElement;
  if (ruleSelect) {
    ruleSelect.addEventListener('change', handleRuleChange);
  }

  // 主办国输入
  const hostInput = document.getElementById('seating-host-input') as HTMLInputElement;
  if (hostInput) {
    hostInput.addEventListener('input', handleHostChange);
  }

  // 布局选择
  const layoutButtons = document.querySelectorAll('.layout-btn');
  layoutButtons.forEach((btn) => {
    btn.addEventListener('click', handleLayoutChange);
  });

  // 生成排位按钮
  const generateBtn = document.getElementById('generate-seating-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateSeating);
  }

  // 导出按钮
  const exportTextBtn = document.getElementById('export-text-btn');
  const exportImageBtn = document.getElementById('export-image-btn');
  const copyBtn = document.getElementById('copy-seating-btn');

  if (exportTextBtn) exportTextBtn.addEventListener('click', () => exportSeating('text'));
  if (exportImageBtn) exportImageBtn.addEventListener('click', () => exportSeating('image'));
  if (copyBtn) copyBtn.addEventListener('click', copyToClipboard);

  // 保存/加载方案按钮
  const saveTemplateBtn = document.getElementById('save-template-btn');
  const loadTemplateBtn = document.getElementById('load-template-btn');

  if (saveTemplateBtn) saveTemplateBtn.addEventListener('click', saveCurrentTemplate);
  if (loadTemplateBtn) loadTemplateBtn.addEventListener('click', showSavedTemplates);

  // 国家选择器相关按钮
  const toggleSelectorBtn = document.getElementById('toggle-selector-btn');
  const selectAllBtn = document.getElementById('select-all-btn');
  const deselectAllBtn = document.getElementById('deselect-all-btn');
  const searchInput = document.getElementById('country-search-input') as HTMLInputElement;

  if (toggleSelectorBtn) toggleSelectorBtn.addEventListener('click', toggleCountrySelector);
  if (selectAllBtn) selectAllBtn.addEventListener('click', selectAllCountries);
  if (deselectAllBtn) deselectAllBtn.addEventListener('click', deselectAllCountries);
  if (searchInput) searchInput.addEventListener('input', handleCountrySearch);

  // 显示选项复选框
  const showNumbersCheckbox = document.getElementById('show-numbers-checkbox') as HTMLInputElement;
  const showNamesCheckbox = document.getElementById('show-names-checkbox') as HTMLInputElement;

  if (showNumbersCheckbox) {
    showNumbersCheckbox.addEventListener('change', toggleNumbersDisplay);
  }
  if (showNamesCheckbox) {
    showNamesCheckbox.addEventListener('change', toggleNamesDisplay);
  }

  // 国家选择页面相关按钮
  const backToConfigBtn = document.getElementById('backToConfigBtn');
  const finishSelectionBtn = document.getElementById('finish-selection-btn');
  const selectAllCountriesBtn = document.getElementById('select-all-countries-btn');
  const deselectAllCountriesBtn = document.getElementById('deselect-all-countries-btn');
  const selectionSearchInput = document.getElementById(
    'country-selection-search-input'
  ) as HTMLInputElement;

  if (backToConfigBtn) backToConfigBtn.addEventListener('click', hideCountrySelectionPage);
  if (finishSelectionBtn) finishSelectionBtn.addEventListener('click', finishCountrySelection);
  if (selectAllCountriesBtn) selectAllCountriesBtn.addEventListener('click', selectAllInSelectionPage);
  if (deselectAllCountriesBtn)
    deselectAllCountriesBtn.addEventListener('click', deselectAllInSelectionPage);
  if (selectionSearchInput) selectionSearchInput.addEventListener('input', handleSelectionPageSearch);
}

/**
 * 显示座位排位详细页面
 */
function showSeatingDetail(): void {
  const toolsSection = document.getElementById('tools-section');
  const seatingSection = document.getElementById('seating-detail-section');

  if (toolsSection) toolsSection.style.display = 'none';
  if (seatingSection) seatingSection.style.display = 'block';

  // 确保模板已渲染
  renderTemplates();

  // 初始化国家选择器
  updateAvailableCountries();
  renderCountrySelector();
}

/**
 * 导出的显示座位排位详细页面函数
 */
export function showSeatingDetailInterface(): void {
  showSeatingDetail();
}

/**
 * 返回工具列表
 */
function backToTools(): void {
  const toolsSection = document.getElementById('tools-section');
  const seatingSection = document.getElementById('seating-detail-section');

  if (seatingSection) seatingSection.style.display = 'none';
  if (toolsSection) toolsSection.style.display = 'block';

  // 清理排位结果
  cleanup();
}

/**
 * 处理数据源变更
 */
function handleSourceChange(e: Event): void {
  const select = e.target as HTMLSelectElement;
  currentDataSource = select.value;

  // 更新可选国家列表并渲染选择器
  updateAvailableCountries();
  renderCountrySelector();
}

/**
 * 处理规则变更
 */
function handleRuleChange(e: Event): void {
  const select = e.target as HTMLSelectElement;
  currentConfig.rule = select.value as SeatingRule;

  // 显示/隐藏相关配置项
  toggleConfigOptions();
}

/**
 * 处理主办国变更
 */
function handleHostChange(e: Event): void {
  const input = e.target as HTMLInputElement;
  currentConfig.hostCountry = input.value.trim().toLowerCase();
}

/**
 * 处理布局变更
 */
function handleLayoutChange(e: Event): void {
  const btn = e.target as HTMLButtonElement;
  const layout = btn.dataset.layout as LayoutType;

  // 更新按钮状态
  document.querySelectorAll('.layout-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');

  currentLayout = layout;

  // 如果已有排位结果，重新渲染
  if (currentArrangement) {
    renderSeatingResult(currentArrangement);
  }
}

/**
 * 显示/隐藏配置选项
 */
function toggleConfigOptions(): void {
  const hostConfig = document.getElementById('host-config');
  const orgConfig = document.getElementById('org-config');

  if (hostConfig) {
    const shouldShow = currentConfig.rule === 'host-first' || currentConfig.rule === 'olympic';
    hostConfig.style.display = shouldShow ? 'block' : 'none';
  }

  if (orgConfig) {
    const shouldShow = currentConfig.rule === 'organization-priority';
    orgConfig.style.display = shouldShow ? 'block' : 'none';
  }
}

/**
 * 检查布局是否适合当前国家数量，并自动切换到更合适的布局
 */
function checkAndAdjustLayout(countryCount: number): boolean {
  const recommendations: Record<LayoutType, { min: number; max: number; alternative?: LayoutType }> = {
    linear: { min: 1, max: 30 },
    'double-column': { min: 10, max: 60 },
    circular: { min: 5, max: 50, alternative: 'grid' },
    'u-shape': { min: 10, max: 80 },
    grid: { min: 1, max: 500 },
  };

  const currentRec = recommendations[currentLayout];

  // 检查当前布局是否适合
  if (countryCount >= currentRec.min && countryCount <= currentRec.max) {
    return false; // 不需要切换
  }

  // 需要切换布局
  let newLayout: LayoutType;

  if (countryCount <= 5) {
    newLayout = 'linear';
  } else if (countryCount <= 30) {
    newLayout = 'circular';
  } else if (countryCount <= 60) {
    newLayout = 'double-column';
  } else if (countryCount <= 80) {
    newLayout = 'u-shape';
  } else {
    newLayout = 'grid';
  }

  // 更新布局
  const oldLayout = getLayoutDescription(currentLayout);
  currentLayout = newLayout;

  // 更新按钮状态
  document.querySelectorAll('.layout-btn').forEach((btn) => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-layout') === newLayout) {
      btn.classList.add('active');
    }
  });

  // 显示提示
  showMessage(
    `已自动从「${oldLayout}」切换到「${getLayoutDescription(newLayout)}」，更适合 ${countryCount} 个国家`,
    'info'
  );

  return true; // 已切换
}

/**
 * 生成座位排位
 */
function generateSeating(): void {
  // 检查是否有选中的国家
  if (selectedCountryCodes.size === 0) {
    showMessage('请先选择参与排位的国家', 'info');
    // 自动跳转到国家选择页面
    showCountrySelectionPage();
    return;
  }

  // 使用选中的国家
  const countries = availableCountries.filter((c) => selectedCountryCodes.has(c.code));

  // 检查并自动调整布局
  checkAndAdjustLayout(countries.length);

  // 执行排序
  const sortedCountries = applySortingRule([...countries], currentConfig);

  // 生成排位结果
  currentArrangement = {
    countries: sortedCountries,
    rule: currentConfig.rule,
    ruleDescription: getRuleDescription(currentConfig.rule),
    generatedAt: new Date(),
  };

  // 渲染结果
  renderSeatingResult(currentArrangement);

  // 渲染统计信息
  renderStatistics(countries);

  // 显示结果区域
  const resultSection = document.getElementById('seating-result-section');
  if (resultSection) {
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * 应用排序规则
 */
function applySortingRule(countries: Country[], config: SeatingConfig): Country[] {
  switch (config.rule) {
    case 'alphabetical-en':
      return sortByAlphabeticalEN(countries);

    case 'alphabetical-cn':
      return sortByAlphabeticalCN(countries);

    case 'alphabetical-fr':
      return sortByAlphabeticalFR(countries);

    case 'host-first':
      return sortByHostFirst(countries, config.hostCountry);

    case 'olympic':
      return sortByOlympic(countries, config.hostCountry);

    case 'diplomatic-time':
      return sortByDiplomaticTime(countries);

    case 'continent-group':
      return sortByContinentGroup(countries);

    case 'organization-priority':
      return sortByOrganizationPriority(countries, config.priorityOrg);

    case 'custom':
      return sortByCustom(countries, config.pinnedCountries);

    default:
      return sortByAlphabeticalEN(countries);
  }
}

/**
 * 英文字母顺序
 */
function sortByAlphabeticalEN(countries: Country[]): Country[] {
  return countries.sort((a, b) => a.nameEN.localeCompare(b.nameEN, 'en'));
}

/**
 * 中文拼音顺序
 */
function sortByAlphabeticalCN(countries: Country[]): Country[] {
  return countries.sort((a, b) => a.nameCN.localeCompare(b.nameCN, 'zh-CN'));
}

/**
 * 法文字母顺序
 */
function sortByAlphabeticalFR(countries: Country[]): Country[] {
  return countries.sort((a, b) => frenchCollator.compare(a.nameEN, b.nameEN));
}

/**
 * 主办国优先
 */
function sortByHostFirst(countries: Country[], hostCode?: string): Country[] {
  if (!hostCode) return sortByAlphabeticalEN(countries);

  const host = countries.find((c) => c.code === hostCode);
  const others = countries.filter((c) => c.code !== hostCode);

  return host ? [host, ...sortByAlphabeticalEN(others)] : sortByAlphabeticalEN(countries);
}

/**
 * 奥运会模式（希腊第一，东道主最后，其余按英文字母）
 */
function sortByOlympic(countries: Country[], hostCode?: string): Country[] {
  const greece = countries.find((c) => c.code === 'gr'); // 希腊
  const host = hostCode ? countries.find((c) => c.code === hostCode) : null;

  const others = countries.filter((c) => c.code !== 'gr' && c.code !== hostCode);
  const sortedOthers = sortByAlphabeticalEN(others);

  const result: Country[] = [];
  if (greece) result.push(greece);
  result.push(...sortedOthers);
  if (host && host.code !== 'gr') result.push(host);

  return result;
}

/**
 * 按建交时间排序（与中国）
 */
function sortByDiplomaticTime(countries: Country[]): Country[] {
  return countries.sort((a, b) => {
    const timeA = diplomaticRelations[a.code];
    const timeB = diplomaticRelations[b.code];

    // 未建交的国家排在后面
    if (!timeA && !timeB) return a.nameEN.localeCompare(b.nameEN);
    if (!timeA) return 1;
    if (!timeB) return -1;

    // 比较建交时间
    return timeA.localeCompare(timeB);
  });
}

/**
 * 按大洲分组
 */
function sortByContinentGroup(countries: Country[]): Country[] {
  const continentOrder = ['亚洲', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲', '南极洲'];

  return countries.sort((a, b) => {
    const continentCompare =
      continentOrder.indexOf(a.continent) - continentOrder.indexOf(b.continent);
    if (continentCompare !== 0) return continentCompare;

    // 同一大洲内按中文拼音排序
    return a.nameCN.localeCompare(b.nameCN, 'zh-CN');
  });
}

/**
 * 按国际组织成员优先
 */
function sortByOrganizationPriority(countries: Country[], priorityOrg?: string[]): Country[] {
  if (!priorityOrg || priorityOrg.length === 0) return sortByAlphabeticalEN(countries);

  const priority = countries.filter((c) => priorityOrg.includes(c.code));
  const others = countries.filter((c) => !priorityOrg.includes(c.code));

  return [...sortByAlphabeticalEN(priority), ...sortByAlphabeticalEN(others)];
}

/**
 * 自定义规则（置顶国家）
 */
function sortByCustom(countries: Country[], pinnedCodes?: string[]): Country[] {
  if (!pinnedCodes || pinnedCodes.length === 0) return sortByAlphabeticalEN(countries);

  const pinned: Country[] = [];
  const others: Country[] = [];

  // 按照置顶列表的顺序排列
  pinnedCodes.forEach((code) => {
    const country = countries.find((c) => c.code === code);
    if (country) pinned.push(country);
  });

  // 剩余国家按字母排序
  countries.forEach((country) => {
    if (!pinnedCodes.includes(country.code)) {
      others.push(country);
    }
  });

  return [...pinned, ...sortByAlphabeticalEN(others)];
}

/**
 * 获取规则描述
 */
function getRuleDescription(rule: SeatingRule): string {
  const descriptions: Record<SeatingRule, string> = {
    'alphabetical-en': '按英文名称字母顺序排列（联合国标准）',
    'alphabetical-cn': '按中文名称拼音顺序排列',
    'alphabetical-fr': '按法文名称字母顺序排列',
    'host-first': '主办国排在第一位，其余按英文字母顺序',
    olympic: '希腊第一，东道主最后，其余按英文字母顺序（奥运会标准）',
    'diplomatic-time': '按与中国建交时间先后排序',
    'continent-group': '按大洲分组，组内按中文拼音排序',
    'organization-priority': '国际组织成员优先，其余按字母顺序',
    custom: '自定义置顶国家，其余按字母顺序',
  };

  return descriptions[rule] || '未知规则';
}

/**
 * 渲染排位结果
 */
function renderSeatingResult(arrangement: SeatingArrangement): void {
  const container = document.getElementById('seating-display-container');
  if (!container) return;

  // 清空容器
  container.innerHTML = '';

  // 添加规则说明
  const ruleInfo = document.createElement('div');
  ruleInfo.className = 'seating-rule-info';
  ruleInfo.innerHTML = `
    <div class="rule-desc">
      <strong>排序规则：</strong>${arrangement.ruleDescription}
    </div>
    <div class="rule-meta">
      共 ${arrangement.countries.length} 个国家/地区 |
      生成时间：${arrangement.generatedAt.toLocaleString('zh-CN')}
    </div>
  `;
  container.appendChild(ruleInfo);

  // 根据布局类型渲染
  switch (currentLayout) {
    case 'linear':
      renderLinearLayout(container, arrangement.countries);
      break;
    case 'double-column':
      renderDoubleColumnLayout(container, arrangement.countries);
      break;
    case 'circular':
      renderCircularLayout(container, arrangement.countries);
      break;
    case 'u-shape':
      renderUShapeLayout(container, arrangement.countries);
      break;
    case 'grid':
      renderGridLayout(container, arrangement.countries);
      break;
  }
}

/**
 * 线性布局
 */
function renderLinearLayout(container: HTMLElement, countries: Country[]): void {
  const list = document.createElement('div');
  list.className = 'seating-linear-layout';

  countries.forEach((country, index) => {
    const item = createSeatingItem(country, index + 1);
    list.appendChild(item);
  });

  container.appendChild(list);
}

/**
 * 双列对称布局
 */
function renderDoubleColumnLayout(container: HTMLElement, countries: Country[]): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'seating-double-column-layout';

  const leftColumn = document.createElement('div');
  leftColumn.className = 'column column-left';

  const rightColumn = document.createElement('div');
  rightColumn.className = 'column column-right';

  countries.forEach((country, index) => {
    const item = createSeatingItem(country, index + 1);
    if (index % 2 === 0) {
      leftColumn.appendChild(item);
    } else {
      rightColumn.appendChild(item);
    }
  });

  wrapper.appendChild(leftColumn);
  wrapper.appendChild(rightColumn);
  container.appendChild(wrapper);
}

/**
 * 圆桌布局（优化版：支持动态半径和多圈布局）
 */
function renderCircularLayout(container: HTMLElement, countries: Country[]): void {
  const totalCountries = countries.length;

  // 智能布局检测：太多国家时提示
  if (totalCountries > 100) {
    const warning = document.createElement('div');
    warning.className = 'layout-warning';
    warning.innerHTML = `
      <div class="warning-icon">⚠️</div>
      <div class="warning-text">
        <strong>圆桌模式不太适合 ${totalCountries} 个国家</strong>
        <p>建议切换到「网格布局」或「U型布局」以获得更好的视觉效果</p>
      </div>
    `;
    container.appendChild(warning);
  }

  // 动态计算布局参数
  const layoutParams = calculateCircularLayoutParams(totalCountries);
  const { circles, itemSize, containerSize } = layoutParams;

  // 创建圆桌容器
  const circleWrapper = document.createElement('div');
  circleWrapper.className = 'seating-circular-layout';
  circleWrapper.style.position = 'relative';
  circleWrapper.style.width = `${containerSize}px`;
  circleWrapper.style.height = `${containerSize}px`;
  circleWrapper.style.margin = '40px auto';

  // 添加圆心装饰
  const centerDot = document.createElement('div');
  centerDot.className = 'circular-center-dot';
  centerDot.style.position = 'absolute';
  centerDot.style.left = '50%';
  centerDot.style.top = '50%';
  centerDot.style.transform = 'translate(-50%, -50%)';
  circleWrapper.appendChild(centerDot);

  const centerX = containerSize / 2;
  const centerY = containerSize / 2;

  let countryIndex = 0;

  // 按圈渲染国家
  circles.forEach((circleConfig, circleIndex) => {
    const { radius, count } = circleConfig;
    const startAngle = -Math.PI / 2; // 从顶部开始

    for (let i = 0; i < count && countryIndex < totalCountries; i++, countryIndex++) {
      const country = countries[countryIndex];
      const angle = startAngle + (i / count) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const item = createSeatingItem(country, countryIndex + 1);
      item.style.position = 'absolute';
      item.style.left = `${x}px`;
      item.style.top = `${y}px`;
      item.style.transform = 'translate(-50%, -50%)';
      item.style.width = `${itemSize}px`;
      item.dataset.circleIndex = String(circleIndex);

      // 添加圈层标识类名
      item.classList.add(`circle-layer-${circleIndex}`);

      circleWrapper.appendChild(item);
    }
  });

  container.appendChild(circleWrapper);

  // 添加布局说明
  if (circles.length > 1) {
    const layoutInfo = document.createElement('div');
    layoutInfo.className = 'circular-layout-info';
    layoutInfo.innerHTML = `
      <div class="layout-info-item">
        <strong>布局方式：</strong>${circles.length} 圈环形布局
      </div>
      <div class="layout-info-item">
        ${circles.map((c, i) => `第${i + 1}圈: ${c.count}个国家`).join(' | ')}
      </div>
    `;
    container.appendChild(layoutInfo);
  }
}

/**
 * 计算圆桌布局参数（动态算法）
 */
function calculateCircularLayoutParams(totalCountries: number): {
  circles: Array<{ radius: number; count: number }>;
  itemSize: number;
  containerSize: number;
} {
  const baseItemSize = 150; // 基础国旗项宽度

  let itemSize = baseItemSize;
  let circles: Array<{ radius: number; count: number }> = [];

  // 根据国家数量分档处理
  if (totalCountries <= 20) {
    // 少量国家：单圈，小半径
    const radius = 180;
    const containerSize = radius * 2 + itemSize + 100;
    circles = [{ radius, count: totalCountries }];
    return { circles, itemSize, containerSize };
  } else if (totalCountries <= 40) {
    // 中等数量：单圈，大半径，缩小国旗项
    itemSize = 120;
    const radius = 250;
    const containerSize = radius * 2 + itemSize + 100;
    circles = [{ radius, count: totalCountries }];
    return { circles, itemSize, containerSize };
  } else if (totalCountries <= 80) {
    // 较多国家：双圈布局
    itemSize = 100;
    const innerRadius = 180;
    const outerRadius = 300;
    const innerCount = Math.min(30, totalCountries);
    const outerCount = totalCountries - innerCount;
    const containerSize = outerRadius * 2 + itemSize + 100;
    circles = [
      { radius: innerRadius, count: innerCount },
      { radius: outerRadius, count: outerCount },
    ];
    return { circles, itemSize, containerSize };
  } else {
    // 大量国家：三圈布局
    itemSize = 90;
    const innerRadius = 160;
    const middleRadius = 260;
    const outerRadius = 360;

    const innerCount = Math.min(25, totalCountries);
    const middleCount = Math.min(35, totalCountries - innerCount);
    const outerCount = totalCountries - innerCount - middleCount;

    const containerSize = outerRadius * 2 + itemSize + 120;

    circles = [
      { radius: innerRadius, count: innerCount },
      { radius: middleRadius, count: middleCount },
      { radius: outerRadius, count: outerCount },
    ];
    return { circles, itemSize, containerSize };
  }
}

/**
 * U型布局
 */
function renderUShapeLayout(container: HTMLElement, countries: Country[]): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'seating-u-shape-layout';

  const topRow = document.createElement('div');
  topRow.className = 'u-row u-top';

  const leftRow = document.createElement('div');
  leftRow.className = 'u-row u-left';

  const rightRow = document.createElement('div');
  rightRow.className = 'u-row u-right';

  const total = countries.length;
  const topCount = Math.ceil(total / 3);
  const leftCount = Math.floor((total - topCount) / 2);

  countries.forEach((country, index) => {
    const item = createSeatingItem(country, index + 1);

    if (index < topCount) {
      topRow.appendChild(item);
    } else if (index < topCount + leftCount) {
      leftRow.appendChild(item);
    } else {
      rightRow.appendChild(item);
    }
  });

  wrapper.appendChild(topRow);
  const sideWrapper = document.createElement('div');
  sideWrapper.className = 'u-sides';
  sideWrapper.appendChild(leftRow);
  sideWrapper.appendChild(rightRow);
  wrapper.appendChild(sideWrapper);

  container.appendChild(wrapper);
}

/**
 * 网格布局
 */
function renderGridLayout(container: HTMLElement, countries: Country[]): void {
  const grid = document.createElement('div');
  grid.className = 'seating-grid-layout';

  countries.forEach((country, index) => {
    const item = createSeatingItem(country, index + 1);
    grid.appendChild(item);
  });

  container.appendChild(grid);
}

/**
 * 创建座位项
 */
function createSeatingItem(country: Country, position: number): HTMLElement {
  const item = document.createElement('div');
  item.className = 'seating-item';

  // 添加特殊排位样式
  if (position === 1) {
    item.classList.add('rank-1');
  } else if (position === 2) {
    item.classList.add('rank-2');
  } else if (position === 3) {
    item.classList.add('rank-3');
  }

  const flagImg = document.createElement('img');
  flagImg.src = getFlagImageUrl(country.code);
  flagImg.alt = country.nameCN;
  flagImg.className = 'seating-flag';

  const info = document.createElement('div');
  info.className = 'seating-info';

  const positionEl = document.createElement('div');
  positionEl.className = 'seating-position';
  positionEl.textContent = `${position}`;

  const namesWrapper = document.createElement('div');
  namesWrapper.className = 'seating-names';

  const namesCN = document.createElement('div');
  namesCN.className = 'seating-name-cn';
  namesCN.textContent = country.nameCN;

  const namesEN = document.createElement('div');
  namesEN.className = 'seating-name-en';
  namesEN.textContent = country.nameEN;

  namesWrapper.appendChild(namesCN);
  namesWrapper.appendChild(namesEN);

  info.appendChild(positionEl);
  info.appendChild(namesWrapper);

  item.appendChild(flagImg);
  item.appendChild(info);

  return item;
}

/**
 * 导出排位结果
 */
function exportSeating(format: 'text' | 'image'): void {
  if (!currentArrangement) {
    showMessage('请先生成排位结果', 'warning');
    return;
  }

  if (format === 'text') {
    exportAsText();
  } else if (format === 'image') {
    exportAsImage();
  }
}

/**
 * 导出为文本
 */
function exportAsText(): void {
  if (!currentArrangement) return;

  let text = `国际场合席位安排结果\n`;
  text += `规则：${currentArrangement.ruleDescription}\n`;
  text += `生成时间：${currentArrangement.generatedAt.toLocaleString('zh-CN')}\n`;
  text += `共 ${currentArrangement.countries.length} 个国家/地区\n\n`;

  currentArrangement.countries.forEach((country, index) => {
    text += `${index + 1}. ${country.nameCN} (${country.nameEN})\n`;
  });

  // 创建下载链接
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `席位安排_${new Date().getTime()}.txt`;
  a.click();
  URL.revokeObjectURL(url);

  showMessage('已导出为文本文件', 'success');
}

/**
 * 导出为图片
 */
async function exportAsImage(): Promise<void> {
  if (!currentArrangement) return;

  const container = document.getElementById('seating-display-container');
  if (!container) {
    showMessage('找不到排位结果容器', 'error');
    return;
  }

  try {
    showMessage('正在生成图片，请稍候...', 'info');

    // 使用 html2canvas 将 DOM 转换为 canvas
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2, // 提高清晰度
      logging: false,
      useCORS: true, // 允许跨域图片
      allowTaint: true,
    });

    // 将 canvas 转换为 blob
    canvas.toBlob((blob) => {
      if (!blob) {
        showMessage('图片生成失败', 'error');
        return;
      }

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `席位安排_${new Date().getTime()}.png`;
      a.click();
      URL.revokeObjectURL(url);

      showMessage('图片已导出', 'success');
    }, 'image/png');
  } catch (error) {
    console.error('导出图片失败:', error);
    showMessage('图片导出失败，请重试', 'error');
  }
}

/**
 * 复制到剪贴板
 */
function copyToClipboard(): void {
  if (!currentArrangement) {
    showMessage('请先生成排位结果', 'warning');
    return;
  }

  let text = '';
  currentArrangement.countries.forEach((country, index) => {
    text += `${index + 1}. ${country.nameCN} (${country.nameEN})\n`;
  });

  navigator.clipboard
    .writeText(text)
    .then(() => {
      showMessage('已复制到剪贴板', 'success');
    })
    .catch(() => {
      showMessage('复制失败，请手动复制', 'error');
    });
}

/**
 * 显示消息
 */
function showMessage(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
  // 创建消息元素
  const msgEl = document.createElement('div');
  msgEl.className = `seating-message seating-message-${type}`;
  msgEl.textContent = message;

  // 添加到页面
  document.body.appendChild(msgEl);

  // 3秒后移除
  setTimeout(() => {
    msgEl.remove();
  }, 3000);
}

/**
 * 更新可选国家列表
 */
function updateAvailableCountries(): void {
  if (currentDataSource === 'current') {
    // 使用当前浏览筛选结果
    availableCountries = getFilteredCountries();
  } else {
    // 使用选定的数据源
    const allCountries = getAllCountries();
    const sourceConfig = DATA_SOURCES[currentDataSource as keyof typeof DATA_SOURCES];

    if (sourceConfig && sourceConfig.countries) {
      availableCountries = allCountries.filter((c) => sourceConfig.countries.includes(c.code));
    } else {
      availableCountries = [];
    }
  }

  // 默认为未选状态
  selectedCountryCodes.clear();
  updateSelectedCount();
}

/**
 * 渲染国家选择器
 */
function renderCountrySelector(): void {
  const container = document.getElementById('country-selector');
  if (!container) return;

  container.innerHTML = '';

  availableCountries.forEach((country) => {
    const item = document.createElement('div');
    item.className = 'country-select-item';
    item.dataset.countryCode = country.code;

    if (selectedCountryCodes.has(country.code)) {
      item.classList.add('selected');
    }

    const flag = document.createElement('img');
    flag.src = getFlagImageUrl(country.code);
    flag.alt = country.nameCN;
    flag.className = 'country-select-flag';

    const name = document.createElement('div');
    name.className = 'country-select-name';
    name.textContent = country.nameCN;

    item.appendChild(flag);
    item.appendChild(name);

    // 点击切换选中状态
    item.addEventListener('click', () => handleCountryToggle(country.code));

    container.appendChild(item);
  });
}

/**
 * 切换国家选中状态
 */
function handleCountryToggle(countryCode: string): void {
  if (selectedCountryCodes.has(countryCode)) {
    selectedCountryCodes.delete(countryCode);
  } else {
    selectedCountryCodes.add(countryCode);
  }

  // 更新UI
  const item = document.querySelector(`[data-country-code="${countryCode}"]`);
  if (item) {
    item.classList.toggle('selected');
  }

  updateSelectedCount();
}

/**
 * 更新选中计数显示
 */
function updateSelectedCount(): void {
  const countEl = document.getElementById('selected-count');
  if (countEl) {
    countEl.textContent = `(已选 ${selectedCountryCodes.size} 个)`;
  }
}

/**
 * 展开/收起国家选择器
 */
function toggleCountrySelector(): void {
  const selector = document.getElementById('country-selector');
  const searchBox = document.getElementById('country-search-box');
  const toggleText = document.getElementById('toggle-selector-text');
  const toggleIcon = document.querySelector('.toggle-icon') as HTMLElement;

  if (!selector || !toggleText) return;

  const isVisible = selector.style.display !== 'none';

  if (isVisible) {
    selector.style.display = 'none';
    if (searchBox) searchBox.style.display = 'none';
    toggleText.textContent = '展开选择';
    if (toggleIcon) toggleIcon.textContent = '▼';
  } else {
    selector.style.display = 'grid';
    if (searchBox) searchBox.style.display = 'block';
    toggleText.textContent = '收起选择';
    if (toggleIcon) toggleIcon.textContent = '▲';
  }
}

/**
 * 处理国家搜索
 */
function handleCountrySearch(e: Event): void {
  const input = e.target as HTMLInputElement;
  const searchTerm = input.value.toLowerCase().trim();

  const items = document.querySelectorAll('.country-select-item');

  items.forEach((item) => {
    const countryCode = item.getAttribute('data-country-code');
    if (!countryCode) return;

    const country = availableCountries.find((c) => c.code === countryCode);
    if (!country) return;

    // 搜索匹配：中文名、英文名、国家代码
    const matchesCN = country.nameCN.toLowerCase().includes(searchTerm);
    const matchesEN = country.nameEN.toLowerCase().includes(searchTerm);
    const matchesCode = country.code.toLowerCase().includes(searchTerm);

    if (searchTerm === '' || matchesCN || matchesEN || matchesCode) {
      (item as HTMLElement).style.display = 'flex';
    } else {
      (item as HTMLElement).style.display = 'none';
    }
  });
}

/**
 * 全选国家
 */
function selectAllCountries(): void {
  selectedCountryCodes = new Set(availableCountries.map((c) => c.code));

  // 更新UI
  document.querySelectorAll('.country-select-item').forEach((item) => {
    item.classList.add('selected');
  });

  updateSelectedCount();
}

/**
 * 全不选国家
 */
function deselectAllCountries(): void {
  selectedCountryCodes.clear();

  // 更新UI
  document.querySelectorAll('.country-select-item').forEach((item) => {
    item.classList.remove('selected');
  });

  updateSelectedCount();
}

/**
 * 切换编号显示
 */
function toggleNumbersDisplay(e: Event): void {
  const checkbox = e.target as HTMLInputElement;
  const container = document.getElementById('seating-display-container');

  if (!container) return;

  if (checkbox.checked) {
    container.classList.remove('hide-numbers');
  } else {
    container.classList.add('hide-numbers');
  }
}

/**
 * 切换名称显示
 */
function toggleNamesDisplay(e: Event): void {
  const checkbox = e.target as HTMLInputElement;
  const container = document.getElementById('seating-display-container');

  if (!container) return;

  if (checkbox.checked) {
    container.classList.remove('hide-names');
  } else {
    container.classList.add('hide-names');
  }
}

/**
 * 渲染统计信息面板
 */
function renderStatistics(countries: Country[]): void {
  const statsContainer = document.getElementById('seating-stats');
  if (!statsContainer) return;

  // 统计各大洲国家数量
  const continentCount: Record<string, number> = {};
  countries.forEach((country) => {
    const continent = country.continent || '未知';
    continentCount[continent] = (continentCount[continent] || 0) + 1;
  });

  // 生成统计HTML
  const statsHTML = `
    <h4>📊 席位统计</h4>
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">总座位数</div>
        <div class="stat-value">${countries.length}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">涉及大洲</div>
        <div class="stat-value">${Object.keys(continentCount).length}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">排序规则</div>
        <div class="stat-value" style="font-size: 14px;">${getRuleDescription(currentConfig.rule)}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">布局方式</div>
        <div class="stat-value" style="font-size: 14px;">${getLayoutDescription(currentLayout)}</div>
      </div>
    </div>
    <div class="continent-breakdown">
      <h5>🌍 各大洲分布</h5>
      <div class="continent-list">
        ${Object.entries(continentCount)
          .sort((a, b) => b[1] - a[1])
          .map(
            ([continent, count]) => `
          <div class="continent-badge">
            <span class="badge-name">${continent}</span>
            <span class="badge-count">${count}</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;

  statsContainer.innerHTML = statsHTML;
}

/**
 * 获取布局描述
 */
function getLayoutDescription(layout: LayoutType): string {
  const descriptions: Record<LayoutType, string> = {
    linear: '线性排列',
    'double-column': '双列对称',
    circular: '圆桌环形',
    'u-shape': 'U型布局',
    grid: '网格布局',
  };
  return descriptions[layout] || layout;
}

/**
 * 保存当前配置为方案
 */
function saveCurrentTemplate(): void {
  // 弹出输入框让用户输入方案名称
  const name = prompt('请输入方案名称：');
  if (!name || !name.trim()) {
    return;
  }

  const template: SavedTemplate = {
    name: name.trim(),
    dataSource: currentDataSource,
    selectedCountries: Array.from(selectedCountryCodes),
    config: { ...currentConfig },
    layout: currentLayout,
    savedAt: new Date().toISOString(),
  };

  // 获取已保存的方案列表
  const templates = getSavedTemplates();

  // 检查是否已存在同名方案
  const existingIndex = templates.findIndex((t) => t.name === template.name);
  if (existingIndex >= 0) {
    const overwrite = confirm(`方案"${template.name}"已存在，是否覆盖？`);
    if (overwrite) {
      templates[existingIndex] = template;
    } else {
      return;
    }
  } else {
    templates.push(template);
  }

  // 保存到 localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));

  showMessage(`方案"${template.name}"已保存`, 'success');
}

/**
 * 显示已保存的方案列表
 */
function showSavedTemplates(): void {
  const templates = getSavedTemplates();

  if (templates.length === 0) {
    showMessage('还没有保存的方案', 'info');
    return;
  }

  // 创建模态对话框
  const modal = document.createElement('div');
  modal.className = 'seating-modal';
  modal.innerHTML = `
    <div class="seating-modal-content">
      <div class="seating-modal-header">
        <h3>📂 已保存的方案</h3>
        <button class="seating-modal-close" id="close-modal">✕</button>
      </div>
      <div class="seating-modal-body">
        <div class="saved-templates-list">
          ${templates
            .map(
              (template, index) => `
            <div class="saved-template-item" data-index="${index}">
              <div class="template-info">
                <div class="template-name">${template.name}</div>
                <div class="template-meta">
                  ${template.selectedCountries.length} 个国家 |
                  ${getLayoutDescription(template.layout)} |
                  ${new Date(template.savedAt).toLocaleString('zh-CN')}
                </div>
              </div>
              <div class="template-actions">
                <button class="btn btn-primary btn-sm load-template-btn" data-index="${index}">
                  加载
                </button>
                <button class="btn btn-danger btn-sm delete-template-btn" data-index="${index}">
                  删除
                </button>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 绑定事件
  const closeBtn = modal.querySelector('#close-modal');
  closeBtn?.addEventListener('click', () => modal.remove());

  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // 加载按钮
  modal.querySelectorAll('.load-template-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt((e.target as HTMLElement).dataset.index || '0');
      loadTemplate(templates[index]);
      modal.remove();
    });
  });

  // 删除按钮
  modal.querySelectorAll('.delete-template-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt((e.target as HTMLElement).dataset.index || '0');
      deleteTemplate(index);
      modal.remove();
      showMessage('方案已删除', 'success');
    });
  });
}

/**
 * 加载方案
 */
function loadTemplate(template: SavedTemplate): void {
  // 恢复数据源
  currentDataSource = template.dataSource;
  const sourceSelect = document.getElementById('seating-source-select') as HTMLSelectElement;
  if (sourceSelect) {
    sourceSelect.value = currentDataSource;
  }

  // 恢复配置
  currentConfig = { ...template.config };
  const ruleSelect = document.getElementById('seating-rule-select') as HTMLSelectElement;
  if (ruleSelect) {
    ruleSelect.value = currentConfig.rule;
  }

  // 恢复主办国配置
  if (currentConfig.hostCountry) {
    const hostInput = document.getElementById('seating-host-input') as HTMLInputElement;
    if (hostInput) {
      hostInput.value = currentConfig.hostCountry;
    }
  }

  // 恢复布局
  currentLayout = template.layout;
  document.querySelectorAll('.layout-btn').forEach((btn) => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-layout') === currentLayout) {
      btn.classList.add('active');
    }
  });

  // 恢复选中的国家
  updateAvailableCountries();
  selectedCountryCodes = new Set(template.selectedCountries);
  renderCountrySelector();
  updateSelectedCount();

  // 显示/隐藏主办国输入框
  const hostConfig = document.getElementById('host-config');
  if (hostConfig) {
    const shouldShow = currentConfig.rule === 'host-first' || currentConfig.rule === 'olympic';
    hostConfig.style.display = shouldShow ? 'block' : 'none';
  }

  showMessage(`方案"${template.name}"已加载`, 'success');
}

/**
 * 删除方案
 */
function deleteTemplate(index: number): void {
  const templates = getSavedTemplates();
  templates.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

/**
 * 获取已保存的方案列表
 */
function getSavedTemplates(): SavedTemplate[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('读取保存的方案失败:', error);
    return [];
  }
}

/**
 * 清理模块
 */
export function cleanup(): void {
  // 清空结果显示
  const resultSection = document.getElementById('seating-result-section');
  if (resultSection) {
    resultSection.style.display = 'none';
  }

  const container = document.getElementById('seating-display-container');
  if (container) {
    container.innerHTML = '';
  }

  // 清除模板选中状态
  document.querySelectorAll('.template-card').forEach((card) => {
    card.classList.remove('active');
  });

  // 重置状态
  currentArrangement = null;
}

/**
 * 导出模块对象
 */
export const seatingModule = {
  init: initSeatingModule,
  showDetail: showSeatingDetailInterface,
  cleanup,
  generateSeating,
  exportSeating,
  copyToClipboard,
};
