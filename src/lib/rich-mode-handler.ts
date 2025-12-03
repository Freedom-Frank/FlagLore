/**
 * 丰富模式处理器
 * 处理连线交互逻辑
 */

import type { RichLearningSession, ConnectionState } from '../types';
import { CODE_DESC } from '../../data/countries/codeDesc';
import { getFlagImageUrl } from './data-loader';

/**
 * 丰富模式处理器类
 */
export class RichModeHandler {
  private connections: Map<string, string> = new Map();
  private selectedDescription: string | null = null;
  private selectedFlag: string | null = null; // 新增：支持先选国旗再选描述
  private container: HTMLElement | null = null;
  private session: RichLearningSession;
  private timer: number | null = null;
  private startTime: number;
  private allCountries: any[] = [];
  private currentGroupIndex = 0;
  private groupSize = 4;
  private currentGroupCountries: any[] = [];
  private isCategoryCompleted: boolean = false; // 标记是否完成整个分类
  private correctConnections: Set<string> = new Set(); // 记录正确的连接

  constructor(session: RichLearningSession) {
    this.session = session;
    this.startTime = Date.now();
    this.allCountries = [...session.countries];
    this.currentGroupCountries = this.getCurrentGroup();
    this.init();
  }

  /**
   * 获取当前组的国家
   */
  private getCurrentGroup(): any[] {
    const start = this.currentGroupIndex * this.groupSize;
    const end = Math.min(start + this.groupSize, this.allCountries.length);
    return this.allCountries.slice(start, end);
  }

  /**
   * 是否有下一组
   */
  private hasNextGroup(): boolean {
    return (this.currentGroupIndex + 1) * this.groupSize < this.allCountries.length;
  }

  /**
   * 切换到下一组
   */
  private nextGroup(): void {
    if (this.hasNextGroup()) {
      this.currentGroupIndex++;
      this.currentGroupCountries = this.getCurrentGroup();

      this.resetConnections();
      this.render();
      this.updateProgress();
    }
  }

  /**
   * 检查当前组答案并继续到下一组
   */
  private checkAndContinue(): void {
    // 检查当前组的答案（不显示弹窗）
    this.checkAnswers(false);

    // 获取检查结果
    const results = this.validateConnections();
    const isAllCorrect = results.every(result => result.isCorrect);

    if (isAllCorrect) {
      // 全部正确，延迟0.5秒后自动跳转到下一组
      setTimeout(() => {
        if (this.hasNextGroup()) {
          this.nextGroup();
        } else {
          // 没有下一组了，标记整个分类完成
          this.completeCategory();
        }
      }, 500);
    }
    // 如果有错误，不跳转，让用户重新连线
  }

  
  /**
   * 同步学习进度（确保界面显示最新数据）
   */
  private syncLearningProgress(): void {
    try {
      if (typeof window !== 'undefined' && (window as any).memoryModule) {
        const memoryModule = (window as any).memoryModule;

        // 强制重新加载进度数据
        if (memoryModule.reloadProgress && typeof memoryModule.reloadProgress === 'function') {
          memoryModule.reloadProgress();
        } else if (memoryModule.loadProgress && typeof memoryModule.loadProgress === 'function') {
          memoryModule.loadProgress();
        }

        // 更新进度显示
        this.updateProgress();

        console.log('🔄 已同步学习进度');
      }
    } catch (error) {
      console.error('❌ 同步学习进度失败:', error);
    }
  }

  /**
   * 记录学习进度到记忆模块
   */
  private recordLearningProgress(countryCode: string): void {
    // 添加到正确的连接集合中
    this.correctConnections.add(countryCode);

    // 只有在完成整个分类时才真正记录到记忆模块
    if (this.isCategoryCompleted) {
      this.commitLearningProgress(countryCode);
    }
  }

  /**
   * 提交学习进度到记忆模块（实际保存）
   */
  private commitLearningProgress(countryCode: string): void {
    try {
      // 触发全局记忆模块的学习记录
      if (typeof window !== 'undefined' && (window as any).memoryModule) {
        const memoryModule = (window as any).memoryModule;

        // 直接调用记忆模块的学习记录方法
        if (memoryModule.recordFlagLearned && typeof memoryModule.recordFlagLearned === 'function') {
          memoryModule.recordFlagLearned(countryCode);
          console.log(`📚 已记录学习进度: ${countryCode}`);

          // 立即更新进度显示
          setTimeout(() => {
            this.updateProgress();
            this.syncLearningProgress();
          }, 100);
        } else {
          console.warn('⚠️ 记忆模块的 recordFlagLearned 方法不可用');
        }
      }
    } catch (error) {
      console.error('❌ 记录学习进度失败:', error);
    }
  }

  /**
   * 显示自动检查结果
   */
  
  /**
   * 初始化处理器
   */
  private init(): void {
    this.container = document.querySelector('.rich-mode-container') as HTMLElement;

    if (!this.container) {
      console.error('丰富模式容器未找到');
      return;
    }

    this.setupEventListeners();
    this.startTimer();
    this.updateProgress();
    this.render();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 隐藏检查答案按钮
    const checkBtn = document.getElementById('checkAnswersBtn');
    if (checkBtn) {
      checkBtn.style.display = 'none';
    }

    // 重置连线按钮
    const resetBtn = document.getElementById('resetConnectionsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetConnections());
    }

    // 隐藏完成学习按钮
    const completeBtn = document.getElementById('completeLearningBtn');
    if (completeBtn) {
      completeBtn.style.display = 'none';
    }

    // 继续下一组按钮 - 修改为自动检查并进入下一组
    const continueBtn = document.getElementById('continueGroupBtn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        // 先检查当前组的答案，然后进入下一组
        this.checkAndContinue();
      });
      // 初始时禁用继续按钮，直到完成当前组
      continueBtn.style.display = 'none';
    }

    // 描述卡片点击事件
    if (this.container) {
      this.container.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const descCard = target.closest('.description-card') as HTMLElement;
        if (descCard) {
          this.handleDescriptionClick(descCard);
        }
      });

      // 国旗卡片点击事件
      this.container.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const flagCard = target.closest('.rich-flag-card') as HTMLElement;
        if (flagCard) {
          this.handleFlagClick(flagCard);
        }
      });
    }
  }

  /**
   * 处理描述卡片点击
   */
  private handleDescriptionClick(card: HTMLElement): void {
    const countryCode = card.dataset.country || '';
    if (!countryCode) return;

    // 清除之前的选择
    this.container?.querySelectorAll('.description-card.selected').forEach(element => {
      element.classList.remove('selected');
    });

    // 如果点击的是已选中的描述，则取消选择
    if (this.selectedDescription === countryCode) {
      this.selectedDescription = null;
      return;
    }

    // 如果该描述已经有连接，点击时应该取消连接
    if (this.connections.has(countryCode)) {
      // 添加视觉反馈表示正在取消连接
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.removeConnection(countryCode);
        this.updateProgress();
        card.style.transform = '';
      }, 100);
      return;
    }

    // 如果已经选中了国旗，创建连接
    if (this.selectedFlag) {
      console.log(`🔗 通过描述点击创建连接: ${countryCode} -> ${this.selectedFlag}`);
      this.createConnection(countryCode, this.selectedFlag);

      // 清除选择状态
      this.selectedFlag = null;
      this.container?.querySelectorAll('.rich-flag-card.selected').forEach(element => {
        element.classList.remove('selected');
      });

      this.updateProgress();
      this.checkAndAutoNext();
      return;
    }

    // 选中新的描述
    card.classList.add('selected');
    this.selectedDescription = countryCode;
  }

  /**
   * 处理国旗卡片点击
   */
  private handleFlagClick(card: HTMLElement): void {
    const countryCode = card.dataset.country || '';
    if (!countryCode) return;

    // 检查是否点击了已连接的国旗（取消连接）
    for (const [descriptionCode, connectedFlagCode] of Array.from(this.connections.entries())) {
      if (connectedFlagCode === countryCode) {
        // 添加视觉反馈表示正在取消连接
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this.removeConnection(descriptionCode);
          this.updateProgress();
          card.style.transform = '';
        }, 100);
        return;
      }
    }

    // 清除之前的选择
    this.container?.querySelectorAll('.rich-flag-card.selected').forEach(element => {
      element.classList.remove('selected');
    });

    // 如果点击的是已选中的国旗，则取消选择
    if (this.selectedFlag === countryCode) {
      this.selectedFlag = null;
      return;
    }

    // 如果已经选中了描述，创建连接
    if (this.selectedDescription) {
      console.log(`🔗 通过国旗点击创建连接: ${this.selectedDescription} -> ${countryCode}`);
      this.createConnection(this.selectedDescription, countryCode);

      // 清除选择状态
      this.selectedDescription = null;
      this.container?.querySelectorAll('.description-card.selected').forEach(element => {
        element.classList.remove('selected');
      });

      this.updateProgress();
      this.checkAndAutoNext();
      return;
    }

    // 选中新的国旗
    card.classList.add('selected');
    this.selectedFlag = countryCode;
  }

  /**
   * 检查是否完成当前组并自动切换到下一组
   * 当所有连接完成时自动检查并跳转
   */

  /**
   * 手动触发检查和跳转
   */
  public triggerManualCheck(): void {
    console.log('🔵 手动触发检查答案');
    this.checkAnswers(); // 直接执行检查答案
  }

  private checkAndAutoNext(): void {
    // 检查当前组是否完成所有连接
    if (this.currentGroupCountries.length > 0 && this.connections.size === this.currentGroupCountries.length) {
      console.log('🎯 当前组所有连接已完成，显示"下一组"按钮');
      // 显示"下一组"按钮，等待用户点击
      this.updateContinueButton();
    }
  }

  /**
   * 创建连接
   */
  private createConnection(descriptionCode: string, flagCode: string): void {
    // 检查是否已经存在连接，如果存在则先移除
    const existingConnection = this.connections.get(descriptionCode);
    if (existingConnection) {
      console.log(`⚠️ 发现重复连接: ${descriptionCode} 已连接到 ${existingConnection}，将被替换为 ${flagCode}`);
      this.removeConnection(descriptionCode);
    }

    // 检查目标国旗是否已被其他描述连接
    for (const [descCode, connectedFlagCode] of Array.from(this.connections.entries())) {
      if (connectedFlagCode === flagCode && descCode !== descriptionCode) {
        console.log(`⚠️ 国旗冲突: ${flagCode} 已被 ${descCode} 连接，将先移除原连接`);
        this.removeConnection(descCode);
        break;
      }
    }

    // 创建新连接
    this.connections.set(descriptionCode, flagCode);

    console.log(`🔗 创建连接: ${descriptionCode} -> ${flagCode}`);

    // 添加连接成功的视觉反馈
    const descCard = this.container?.querySelector(`.description-card[data-country="${descriptionCode}"]`) as HTMLElement;
    const flagCard = this.container?.querySelector(`.rich-flag-card[data-country="${flagCode}"]`) as HTMLElement;

    if (descCard) {
      descCard.classList.add('selected');
      // 添加短暂的动画效果
      descCard.style.transform = 'scale(1.05)';
      setTimeout(() => {
        if (descCard) descCard.style.transform = '';
      }, 200);
    }

    if (flagCard) {
      flagCard.classList.add('selected');
      // 添加短暂的动画效果
      flagCard.style.transform = 'scale(1.05)';
      setTimeout(() => {
        if (flagCard) flagCard.style.transform = '';
      }, 200);
    }

    // 在大屏幕上绘制连线
    if (window.innerWidth > 1024) {
      this.drawConnection(descriptionCode, flagCode);
    }

    // 可选：播放连接成功的声音效果
    this.playConnectionSound();
  }

  /**
   * 绘制连线
   */
  private drawConnection(fromCode: string, toCode: string): void {
    const canvasElement = this.container?.querySelector('#connectionCanvas') as SVGElement;
    if (!canvasElement) return;

    const fromCard = this.container?.querySelector(`.description-card[data-country="${fromCode}"]`);
    const toCard = this.container?.querySelector(`.rich-flag-card[data-country="${toCode}"]`);

    if (!fromCard || !toCard) return;

    const fromRect = fromCard.getBoundingClientRect();
    const toRect = toCard.getBoundingClientRect();
    const canvasRect = canvasElement.getBoundingClientRect();

    const fromX = fromRect.right - canvasRect.left - 8;
    const fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;
    const toX = toRect.left - canvasRect.left + 8;
    const toY = toRect.top + toRect.height / 2 - canvasRect.top;

    // 创建SVG连线
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', fromX.toString());
    line.setAttribute('y1', fromY.toString());
    line.setAttribute('x2', toX.toString());
    line.setAttribute('y2', toY.toString());
    line.setAttribute('class', 'connection-line');
    line.setAttribute('data-from', fromCode);
    line.setAttribute('data-to', toCode);

    canvasElement.appendChild(line);
  }

  /**
   * 移除连接
   */
  private removeConnection(descriptionCode: string): void {
    const flagCode = this.connections.get(descriptionCode);
    if (!flagCode) return;

    console.log(`🔌 移除连接: ${descriptionCode} -> ${flagCode}`);

    // 移除SVG连线
    const canvasElement = this.container?.querySelector('#connectionCanvas') as SVGElement;
    const line = canvasElement?.querySelector(`line[data-from="${descriptionCode}"]`);
    if (line) {
      line.remove();
    }

    // 移除连接状态
    this.connections.delete(descriptionCode);

    // 更新UI状态
    const descCard = this.container?.querySelector(`.description-card[data-country="${descriptionCode}"]`);
    const flagCard = this.container?.querySelector(`.rich-flag-card[data-country="${flagCode}"]`);

    if (descCard) {
      descCard.classList.remove('selected');
    }
    if (flagCard) {
      flagCard.classList.remove('selected');
    }
  }

  /**
   * 重置所有连接
   */
  private resetConnections(): void {
    // 清除SVG连线
    const canvasElement = this.container?.querySelector('#connectionCanvas') as SVGElement;
    const lines = canvasElement?.querySelectorAll('.connection-line');
    lines?.forEach(line => line.remove());

    // 清除连接状态
    this.connections.clear();

    // 清除UI状态
    this.container?.querySelectorAll('.description-card.selected, .rich-flag-card.selected').forEach(card => {
      card.classList.remove('selected');
    });

    this.selectedDescription = null;
    this.selectedFlag = null; // 同时清除国旗选择状态
    this.updateProgress();
  }

  /**
   * 检查答案
   * @param showMessage 是否显示结果弹窗，默认false（不显示）
   */
  private checkAnswers(showMessage: boolean = false): void {
    const results = this.validateConnections();
    let correctCount = 0;

    results.forEach(result => {
      const canvasElement = this.container?.querySelector('#connectionCanvas') as SVGElement;
      const line = canvasElement?.querySelector(`line[data-from="${result.country}"]`);
      if (!line) return;

      if (result.isCorrect) {
        line.setAttribute('class', 'connection-line correct');
        correctCount++;

        // 记录学习进度
        this.recordLearningProgress(result.country);

        // 标记已正确连接
        const flagCard = this.container?.querySelector(`.rich-flag-card[data-country="${result.connectedTo}"]`);
        if (flagCard) {
          flagCard.classList.add('connected');
        }
      } else {
        line.setAttribute('class', 'connection-line incorrect');
      }
    });

    // 只有明确要求时才显示结果弹窗
    if (showMessage) {
      this.showCheckResults(correctCount, results.length);
    }

    // 同步学习进度
    this.syncLearningProgress();

    // 检查是否可以继续下一组
    this.updateContinueButton();
  }

  /**
   * 显示检查结果
   */
  private showCheckResults(correctCount: number, totalCount: number): void {
    const message = `正确: ${correctCount}/${totalCount} (${Math.round(correctCount / totalCount * 100)}%)`;

    // 创建结果弹窗
    const resultDiv = document.createElement('div');
    resultDiv.className = 'rich-results-popup';
    resultDiv.style.position = 'fixed';
    resultDiv.style.top = '50%';
    resultDiv.style.left = '50%';
    resultDiv.style.transform = 'translate(-50%, -50%)';
    resultDiv.style.background = 'white';
    resultDiv.style.borderRadius = '12px';
    resultDiv.style.padding = '24px';
    resultDiv.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
    resultDiv.style.zIndex = '1000';
    resultDiv.style.textAlign = 'center';

    resultDiv.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: var(--primary-dark);">检查结果</h3>
      <p style="margin: 0 0 24px 0; font-size: 1.1rem;">${message}</p>
      <button class="btn btn-primary" style="margin: 0 8px;">继续</button>
      <button class="btn btn-secondary" style="margin: 0 8px;">重试</button>
    `;

    document.body.appendChild(resultDiv);

    // 添加事件监听
    resultDiv.querySelector('.btn-primary')?.addEventListener('click', () => {
      resultDiv.remove();
    });

    resultDiv.querySelector('.btn-secondary')?.addEventListener('click', () => {
      resultDiv.remove();
      this.resetConnections();
    });
  }

  /**
   * 显示分类完成消息
   */
  private showCategoryCompleteMessage(correctCount: number, totalCount: number): void {
    const accuracy = Math.round((correctCount / totalCount) * 100);
    const hasMoreCategories = this.checkIfHasMoreCategories();

    const message = `🎉 恭喜完成本分类学习！\n正确率: ${correctCount}/${totalCount} (${accuracy}%)`;
    const title = hasMoreCategories ? '分类学习完成！' : '🎊 恭喜完成全部分类学习！';
    const subtitle = hasMoreCategories ? '学习进度已自动保存' : '您已经掌握了所有国家的国旗！';

    // 创建完成提示
    const completeDiv = document.createElement('div');
    completeDiv.className = 'rich-complete-popup';
    completeDiv.style.position = 'fixed';
    completeDiv.style.top = '50%';
    completeDiv.style.left = '50%';
    completeDiv.style.transform = 'translate(-50%, -50%)';
    completeDiv.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    completeDiv.style.color = 'white';
    completeDiv.style.borderRadius = '12px';
    completeDiv.style.padding = '32px';
    completeDiv.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
    completeDiv.style.zIndex = '2000';
    completeDiv.style.textAlign = 'center';
    completeDiv.style.maxWidth = '400px';

    // 根据是否还有其他分类决定显示哪些按钮
    const buttonsHTML = hasMoreCategories ? `
      <button id="continueLearningBtn" class="btn" style="
        background: white;
        color: #059669;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        margin-right: 12px;
      ">继续学习</button>
      <button id="returnToMemoryBtn" class="btn" style="
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 2px solid white;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
      ">返回主页</button>
    ` : `
      <button id="returnToMemoryBtn" class="btn" style="
        background: white;
        color: #059669;
        border: none;
        padding: 14px 32px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 18px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      ">🏠 返回主页</button>
    `;

    completeDiv.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 16px;">${hasMoreCategories ? '🎉' : '🎊'}</div>
      <h3 style="margin: 0 0 16px 0; font-size: 1.5rem;">${title}</h3>
      <p style="margin: 0 0 24px 0; font-size: 1.1rem; line-height: 1.5;">${message}</p>
      <p style="margin: 0 0 32px 0; font-size: 0.9rem; opacity: 0.9;">${subtitle}</p>
      <div style="display: flex; gap: 12px; justify-content: center; margin-top: 16px;">
        ${buttonsHTML}
      </div>
    `;

    document.body.appendChild(completeDiv);

    // 添加事件监听器
    const returnBtn = completeDiv.querySelector('#returnToMemoryBtn') as HTMLButtonElement;
    const continueBtn = completeDiv.querySelector('#continueLearningBtn') as HTMLButtonElement;

    if (returnBtn) {
      returnBtn.addEventListener('click', () => {
        completeDiv.remove();
        // 触发返回记忆训练
        this.completeSession();
      });
    }

    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        completeDiv.remove();
        // 触发继续学习 - 清除当前会话并跳转到下一个分类
        this.completeAndContinueToNext();
      });
    }

    // 不自动关闭，等待用户选择
  }

  /**
   * 完成整个分类
   */
  private completeCategory(): void {
    // 标记整个分类完成
    this.isCategoryCompleted = true;

    // 提交所有正确连接的学习进度
    this.correctConnections.forEach(countryCode => {
      this.commitLearningProgress(countryCode);
    });

    // 显示完成消息
    const results = this.validateConnections();
    const correctCount = results.filter(r => r.isCorrect).length;
    this.showCategoryCompleteMessage(correctCount, results.length);
  }

  /**
   * 完成并继续到下一个分类
   */
  private completeAndContinueToNext(): void {
    // 完成当前分类并开始下一个分类
    this.destroy();

    if (typeof window !== 'undefined' && (window as any).memoryModule) {
      const memoryModule = (window as any).memoryModule;

      setTimeout(() => {
        if (memoryModule.showMemory && typeof memoryModule.showMemory === 'function') {
          memoryModule.showMemory();

          // 延迟一点时间后开始智能学习
          setTimeout(() => {
            if (memoryModule.startSmartLearning && typeof memoryModule.startSmartLearning === 'function') {
              memoryModule.startSmartLearning();
            }
          }, 200);
        }
      }, 100);
    }
  }

  /**
   * 验证连接
   */
  private validateConnections(): ConnectionState[] {
    const results: ConnectionState[] = [];

    for (const [descriptionCode, flagCode] of Array.from(this.connections.entries())) {
      results.push({
        country: descriptionCode,
        description: (CODE_DESC as Record<string, string>)[descriptionCode] || '',
        connectedTo: flagCode,
        isCorrect: descriptionCode === flagCode
      });
    }

    return results;
  }

  /**
   * 更新进度
   */
  private updateProgress(): void {
    const total = this.allCountries.length;

    // 计算已学习的数量（从记忆模块获取实际学习进度）
    const learnedCount = this.getActualLearnedCount();

    // 当前组的连接数（用于显示当前进度）
    const currentGroupConnected = this.connections.size;
    const currentGroupTotal = this.currentGroupCountries.length;

    const progressText = document.querySelector('.progress-text');
    const progressFill = document.querySelector('.rich-progress-fill');

    if (progressText) {
      // 显示格式：已学习总数/当前组进度
      progressText.textContent = `${learnedCount}/${total} (本组: ${currentGroupConnected}/${currentGroupTotal})`;
    }

    if (progressFill) {
      // 基于总体学习进度显示进度条
      const percentage = (learnedCount / total) * 100;
      (progressFill as HTMLElement).style.width = `${percentage}%`;
    }

    // 更新组信息显示
    this.updateGroupInfo();
  }

  /**
   * 获取实际已学习的国家数量
   */
  private getActualLearnedCount(): number {
    if (typeof window !== 'undefined' && (window as any).memoryModule) {
      const memoryModule = (window as any).memoryModule;
      return this.allCountries.filter(country =>
        memoryModule.progress[country.code]?.learned
      ).length;
    }
    return 0;
  }

  
  /**
   * 更新组信息显示
   */
  private updateGroupInfo(): void {
    const sessionType = document.querySelector('.session-type');
    if (sessionType) {
      const currentGroupNum = this.currentGroupIndex + 1;
      const totalGroups = Math.ceil(this.allCountries.length / this.groupSize);
      sessionType.textContent = `丰富模式 - 第${currentGroupNum}组/共${totalGroups}组`;
    }
  }

  /**
   * 启动计时器
   */
  private startTimer(): void {
    this.timer = window.setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      const timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      const sessionTimeElement = document.querySelector('.session-time');
      if (sessionTimeElement) {
        sessionTimeElement.textContent = timeText;
      }
    }, 1000);
  }

  /**
   * 停止计时器
   */
  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * 完成会话
   */
  private completeSession(): void {
    this.stopTimer();

    const results = this.validateConnections();
    const correctCount = results.filter(r => r.isCorrect).length;

    // 更新会话数据
    this.session.endTime = Date.now();
    this.session.correctConnections = correctCount;
    this.session.totalAttempts = this.connections.size;

    // 触发完成事件
    const completeEvent = new CustomEvent('richModeComplete', {
      detail: {
        session: this.session,
        results: results
      }
    });

    document.dispatchEvent(completeEvent);
  }

  /**
   * 渲染界面
   */
  public render(): void {
    if (!this.container) return;

    const descriptionsPanel = this.container.querySelector('.descriptions-panel');
    const flagsPanel = this.container.querySelector('.flags-panel');

    if (!descriptionsPanel || !flagsPanel) return;

    // 渲染描述卡片
    descriptionsPanel.innerHTML = '';
    this.currentGroupCountries.forEach(country => {
      const card = this.createDescriptionCard(country);
      descriptionsPanel.appendChild(card);
    });

    // 渲染国旗卡片 - 打乱顺序
    flagsPanel.innerHTML = '';
    const shuffledFlags = this.shuffle([...this.currentGroupCountries]);
    shuffledFlags.forEach(country => {
      const card = this.createFlagCard(country);
      flagsPanel.appendChild(card);
    });

    // 更新继续按钮状态
    this.updateContinueButton();
  }

  /**
   * 打乱数组顺序
   */
  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 更新继续按钮状态
   */
  private updateContinueButton(): void {
    const continueBtn = document.getElementById('continueGroupBtn') as HTMLButtonElement;
    if (continueBtn) {
      // 检查当前组是否完成所有连接
      const isCurrentGroupComplete = this.currentGroupCountries.length > 0 &&
                                  this.connections.size === this.currentGroupCountries.length;

      if (isCurrentGroupComplete) {
        // 额外检查连接是否全部正确
        const results = this.validateConnections();
        const isAllCorrect = results.every(result => result.isCorrect);
        const correctCount = results.filter(r => r.isCorrect).length;
        const totalCount = results.length;

        if (isAllCorrect) {
          continueBtn.style.display = 'inline-block';
          continueBtn.disabled = false;
          if (this.hasNextGroup()) {
            continueBtn.textContent = `下一组 (${this.currentGroupIndex + 2}/${Math.ceil(this.allCountries.length / this.groupSize)})`;
          } else {
            continueBtn.textContent = '完成学习';
          }
        } else {
          // 有错误连接，显示按钮但禁用，并给出更详细的信息
          continueBtn.style.display = 'inline-block';
          continueBtn.disabled = true;
          continueBtn.textContent = `请修正错误连线 (正确: ${correctCount}/${totalCount})`;

          // 在控制台输出调试信息，帮助诊断问题
          console.log('🔍 连线验证结果:', {
            total: totalCount,
            correct: correctCount,
            incorrect: totalCount - correctCount,
            connections: Array.from(this.connections.entries()),
            validationResults: results
          });
        }
      } else {
        continueBtn.style.display = 'none';
      }
    }
  }

  /**
   * 创建描述卡片
   */
  private createDescriptionCard(country: any): HTMLElement {
    const card = document.createElement('div');
    card.className = 'description-card';
    card.dataset.country = country.code;

    const description = (CODE_DESC as Record<string, string>)[country.code] || '暂无描述';

    card.innerHTML = `
      <h3>${country.nameCN}</h3>
      <p>${description}</p>
      <div class="connection-point"></div>
    `;

    return card;
  }

  /**
   * 创建国旗卡片
   */
  private createFlagCard(country: any): HTMLElement {
    const card = document.createElement('div');
    card.className = 'rich-flag-card';
    card.dataset.country = country.code;

    card.innerHTML = `
      <img src="${getFlagImageUrl(country.code)}" alt="${country.nameCN}"
           onerror="this.src='https://via.placeholder.com/80x60/f0f0f0/999?text=FLAG'">
      <div class="connection-point"></div>
    `;

    return card;
  }

  /**
   * 销毁处理器
   */
  public destroy(): void {
    this.stopTimer();
    this.connections.clear();
    this.selectedDescription = null;
    this.selectedFlag = null; // 同时清除国旗选择状态

    // 如果未完成整个分类，清除学习进度（不保存）
    if (!this.isCategoryCompleted && this.correctConnections.size > 0) {
      console.log('📝 用户中途退出，本次学习进度不保存');
      this.correctConnections.clear();
    }

    // 清除事件监听器
    const checkBtn = document.getElementById('checkAnswersBtn');
    const resetBtn = document.getElementById('resetConnectionsBtn');
    const completeBtn = document.getElementById('completeLearningBtn');

    if (checkBtn) {
      checkBtn.removeEventListener('click', () => this.checkAnswers());
    }
    if (resetBtn) {
      resetBtn.removeEventListener('click', () => this.resetConnections());
    }
    if (completeBtn) {
      completeBtn.removeEventListener('click', () => this.completeSession());
    }
  }

  /**
   * 播放连接成功的声音效果（可选功能）
   */
  private playConnectionSound(): void {
    try {
      // 创建简单的音效（可选）
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 频率
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // 音量
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1); // 淡出

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // 如果浏览器不支持AudioContext或用户禁用了音频，静默失败
      console.log('🔇 音效播放失败或被禁用:', error);
    }
  }

  /**
   * 检查是否还有其他未完成的分类
   */
  private checkIfHasMoreCategories(): boolean {
    try {
      if (typeof window !== 'undefined' && (window as any).memoryModule) {
        const memoryModule = (window as any).memoryModule;

        // 使用记忆模块的selectBestCategory方法来检查是否还有未完成的分类
        if (memoryModule.selectBestCategory && typeof memoryModule.selectBestCategory === 'function') {
          const nextCategory = memoryModule.selectBestCategory();
          return nextCategory !== null;
        }
      }
    } catch (error) {
      console.error('❌ 检查分类进度失败:', error);
    }

    // 如果无法获取记忆模块信息，默认认为还有其他分类
    return true;
  }
}
