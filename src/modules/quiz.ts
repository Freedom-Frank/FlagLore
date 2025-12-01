/**
 * 测验模块
 * 负责知识测验功能，包括题目生成、答案检查、结果显示和统计数据等
 */

import type { Country, QuizStats } from '../types';
import { i18n } from '../lib/i18n-core';
import { getAllCountries } from '../lib/state';
import { getStats, saveStats } from '../lib/storage';
import { safeSetText, safeSetDisplay, formatTime } from '../lib/utils';
import { getFlagImageUrl } from '../lib/data-loader';

/**
 * 测验类型（别名）
 */
export type QuizType = 'flag-to-country' | 'country-to-flag';

/**
 * 难度级别
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * 内部题目格式（用于向后兼容）
 */
interface InternalQuestion {
  correct: Country;
  options: Country[];
}


/**
 * 已答题目格式
 */
interface AnsweredQuestion {
  questionIndex: number;
  questionType: QuizType;
  correctCountry: Country;
  selectedCountry?: Country;
  isCorrect: boolean;
  timestamp: number;
}

/**
 * 测验状态
 */
interface QuizState {
  /** 测验类型 */
  quizType: QuizType | '';
  /** 难度级别 */
  difficulty: Difficulty;
  /** 题目列表 */
  questions: InternalQuestion[];
  /** 当前题目索引 */
  currentQuestion: number;
  /** 得分 */
  score: number;
  /** 开始时间 */
  startTime: number | null;
  /** 计时器ID */
  timerInterval: number | null;
  /** 已答题目列表 */
  answeredQuestions: AnsweredQuestion[];
}

/**
 * 测验模块类
 */
class QuizModule {
  private state: QuizState;

  constructor() {
    this.state = {
      quizType: '',
      difficulty: 'medium',
      questions: [],
      currentQuestion: 0,
      score: 0,
      startTime: null,
      timerInterval: null,
      answeredQuestions: [],
    };
  }

  /**
   * 设置测验类型
   */
  setQuizType(type: QuizType): void {
    this.state.quizType = type;
  }

  /**
   * 设置难度级别
   */
  setDifficulty(difficulty: Difficulty): void {
    this.state.difficulty = difficulty;
  }

  /**
   * 开始测验
   */
  startQuiz(): void {
    if (!this.state.quizType) {
      alert(i18n.t('alerts.selectTestType'));
      return;
    }

    // 确保i18n数据已加载
    // 简单的延迟，确保翻译数据已加载
    if (!i18n.t('quiz.question')) {
      console.warn('i18n data not loaded, waiting...');
      setTimeout(() => this.startQuiz(), 100);
      return;
    }

    const questionCount =
      {
        easy: 5,
        medium: 10,
        hard: 20,
      }[this.state.difficulty] || 5;

    this.state.questions = this.generateQuestions(questionCount);
    this.state.currentQuestion = 0;
    this.state.score = 0;
    this.state.startTime = Date.now();
    this.state.answeredQuestions = [];

    safeSetDisplay('quiz-start', 'none');
    safeSetDisplay('quiz-game', 'block');
    safeSetDisplay('quiz-result', 'none');

    // 初始化预览面板
    this.initializePreviewPanel();

    this.startTimer();
    this.showQuestion();
  }

  /**
   * 生成题目
   */
  private generateQuestions(count: number): InternalQuestion[] {
    const questionsArray: InternalQuestion[] = [];
    const allCountries = getAllCountries();
    const availableCountries = [...allCountries];

    for (let i = 0; i < Math.min(count, availableCountries.length); i++) {
      const correctIndex = Math.floor(Math.random() * availableCountries.length);
      const correct = availableCountries[correctIndex];
      availableCountries.splice(correctIndex, 1);

      const options = [correct];
      const tempCountries = allCountries.filter((c) => c.code !== correct.code);

      // 添加3个错误选项
      for (let j = 0; j < 3 && j < tempCountries.length; j++) {
        const wrongIndex = Math.floor(Math.random() * tempCountries.length);
        options.push(tempCountries[wrongIndex]);
        tempCountries.splice(wrongIndex, 1);
      }

      // 打乱选项顺序
      options.sort(() => Math.random() - 0.5);

      questionsArray.push({
        correct: correct,
        options: options,
      });
    }

    return questionsArray;
  }

  /**
   * 显示当前题目
   */
  private showQuestion(): void {
    const q = this.state.questions[this.state.currentQuestion];
    const total = this.state.questions.length;

    // 更新进度条
    const progressFill = document.getElementById('progressFill') as HTMLElement;
    if (progressFill) {
      progressFill.style.width = `${((this.state.currentQuestion + 1) / total) * 100}%`;
    }

    // 更新题号
    const questionTemplate = i18n.t('quiz.question', {
      current: this.state.currentQuestion + 1,
      total: total,
    });
    safeSetText('questionNumber', questionTemplate);

    // 设置quiz-game元素的data-quiz-type属性，用于CSS样式调整
    const quizGame = document.getElementById('quiz-game') as HTMLElement;
    if (quizGame) {
      quizGame.setAttribute('data-quiz-type', this.state.quizType);
    }

    const questionContent = document.getElementById('questionContent');
    const optionsContainer = document.getElementById('optionsContainer');

    if (!questionContent || !optionsContainer) return;

    if (this.state.quizType === 'flag-to-country') {
      this.showFlagToCountryQuestion(q, questionContent, optionsContainer);
    } else {
      this.showCountryToFlagQuestion(q, questionContent, optionsContainer);
    }
  }

  /**
   * 显示"国旗到国家"题目
   */
  private showFlagToCountryQuestion(
    q: InternalQuestion,
    questionContent: HTMLElement,
    optionsContainer: HTMLElement
  ): void {
    // 使用国旗到国家模板
    const flagTemplate = document.getElementById('question-flag-template') as HTMLTemplateElement;
    if (flagTemplate) {
      questionContent.innerHTML = '';
      const templateContent = flagTemplate.content.cloneNode(true) as DocumentFragment;
      const img = templateContent.querySelector('.question-flag') as HTMLImageElement;
      if (img) {
        img.src = getFlagImageUrl(q.correct.code);
        img.alt = '国旗';
        img.onerror = function (this: HTMLImageElement) {
          this.src = `https://via.placeholder.com/360x240/f0f0f0/999?text=${q.correct.code.toUpperCase()}`;
        };
      }
      questionContent.appendChild(templateContent);

      // 更新问题文本
      setTimeout(() => {
        const questionText = questionContent.querySelector('.question-text');
        if (questionText) {
          questionText.textContent = i18n.t('quiz.flagQuestion');
        }
      }, 10);
    }

    // 使用选项按钮模板
    const buttonTemplate = document.getElementById('option-button-template') as HTMLTemplateElement;
    if (buttonTemplate) {
      optionsContainer.innerHTML = '';
      q.options.forEach((opt) => {
        const buttonContent = buttonTemplate.content.cloneNode(true) as DocumentFragment;
        const button = buttonContent.querySelector('.option-btn') as HTMLButtonElement;
        const textSpan = buttonContent.querySelector('.option-text');

        if (button && textSpan) {
          button.onclick = () => this.checkAnswer(opt.code, q.correct.code);
          button.dataset.code = opt.code;
          textSpan.textContent = i18n.getCountryName(opt);
          optionsContainer.appendChild(buttonContent);
        }
      });
    }
  }

  /**
   * 显示"国家到国旗"题目
   */
  private showCountryToFlagQuestion(
    q: InternalQuestion,
    questionContent: HTMLElement,
    optionsContainer: HTMLElement
  ): void {
    // 使用国家到国旗模板
    const countryTemplate = document.getElementById(
      'question-country-template'
    ) as HTMLTemplateElement;
    if (countryTemplate) {
      questionContent.innerHTML = '';
      const templateContent = countryTemplate.content.cloneNode(true) as DocumentFragment;
      const countryName = templateContent.querySelector('.country-name');
      if (countryName) {
        countryName.textContent = i18n.getCountryName(q.correct);
      }

      // 更新问题文本
      const questionText = templateContent.querySelector('.question-text');
      if (questionText) {
        const template = i18n.t('quiz.countryQuestion');
        questionText.textContent = template.replace('{country}', i18n.getCountryName(q.correct));
      }
      questionContent.appendChild(templateContent);
    }

    // 使用国旗选项模板
    const flagTemplate = document.getElementById('option-flag-template') as HTMLTemplateElement;
    if (flagTemplate) {
      optionsContainer.innerHTML = '';
      q.options.forEach((opt) => {
        const templateContent = flagTemplate.content.cloneNode(true) as DocumentFragment;
        const button = templateContent.querySelector('.option-btn') as HTMLButtonElement;
        const img = templateContent.querySelector('.option-flag') as HTMLImageElement;

        if (button && img) {
          button.onclick = () => this.checkAnswer(opt.code, q.correct.code);
          button.dataset.code = opt.code;
          img.src = getFlagImageUrl(opt.code);
          img.alt = opt.nameCN;
          img.onerror = function (this: HTMLImageElement) {
            this.src = `https://via.placeholder.com/200x120/f0f0f0/999?text=${opt.code.toUpperCase()}`;
          };
          optionsContainer.appendChild(templateContent);
        }
      });
    }
  }

  /**
   * 检查答案
   */
  private checkAnswer(selected: string, correct: string): void {
    const buttons = document.querySelectorAll('.option-btn') as NodeListOf<HTMLButtonElement>;

    buttons.forEach((btn) => {
      btn.disabled = true;
      const btnCode = btn.dataset.code;

      if (btnCode === correct) {
        btn.classList.add('correct');
      } else if (btnCode === selected) {
        btn.classList.add('wrong');
      }
    });

    // 记录已答题目
    this.recordAnsweredQuestion(selected, correct);

    if (selected === correct) {
      this.state.score++;
    }

    // 更新预览面板
    this.updatePreviewPanel();

    setTimeout(() => {
      this.state.currentQuestion++;
      if (this.state.currentQuestion < this.state.questions.length) {
        this.showQuestion();
      } else {
        this.endQuiz();
      }
    }, 1500);
  }

  /**
   * 记录已答题目
   */
  private recordAnsweredQuestion(selectedCode: string, correctCode: string): void {
    const currentQuestion = this.state.questions[this.state.currentQuestion];
    const selectedCountry = currentQuestion.options.find((opt) => opt.code === selectedCode);

    const answeredQuestion: AnsweredQuestion = {
      questionIndex: this.state.currentQuestion + 1,
      questionType: this.state.quizType as QuizType,
      correctCountry: currentQuestion.correct,
      selectedCountry: selectedCountry,
      isCorrect: selectedCode === correctCode,
      timestamp: Date.now()
    };

    this.state.answeredQuestions.push(answeredQuestion);
  }

  /**
   * 初始化预览面板
   */
  private initializePreviewPanel(): void {
    const previewList = document.getElementById('preview-list');
    if (previewList) {
      previewList.innerHTML = '';
    }

    // 更新总题数
    const totalQuestions = document.getElementById('total-questions');
    if (totalQuestions) {
      totalQuestions.textContent = this.state.questions.length.toString();
    }

    // 更新已答题数
    this.updatePreviewStats();
  }

  /**
   * 更新预览面板
   */
  private updatePreviewPanel(): void {
    const previewList = document.getElementById('preview-list');
    const template = document.getElementById('preview-item-template') as HTMLTemplateElement;

    if (!previewList || !template) return;

    // 添加新的预览项
    const latestAnswer = this.state.answeredQuestions[this.state.answeredQuestions.length - 1];
    if (latestAnswer) {
      const newItem = this.createPreviewItem(latestAnswer, template);
      previewList.appendChild(newItem);
    }

    // 更新统计信息
    this.updatePreviewStats();
  }

  /**
   * 创建预览项
   */
  private createPreviewItem(question: AnsweredQuestion, template: HTMLTemplateElement): HTMLElement {
    const item = template.content.cloneNode(true) as HTMLElement;

    // 填充题号
    item.querySelector('.number')!.textContent = question.questionIndex.toString();

    // 设置国旗图片
    const flagImg = item.querySelector('.flag-image') as HTMLImageElement;
    if (flagImg) {
      flagImg.src = this.getFlagImagePath(question.correctCountry.code);
      flagImg.alt = question.correctCountry.nameCN;
    }

    // 设置正确答案
    item.querySelector('.correct-answer')!.textContent = i18n.getCountryName(question.correctCountry);

    // 如果答错了，显示用户答案
    if (!question.isCorrect && question.selectedCountry) {
      const userAnswer = item.querySelector('.user-answer') as HTMLElement;
      userAnswer.style.display = 'block';
      userAnswer.textContent = `${i18n.t('quiz.preview.yourAnswer') || '你的答案'}: ${i18n.getCountryName(question.selectedCountry)}`;

      // 显示错误图标
      const correctIcon = item.querySelector('.status-icon.correct') as HTMLElement;
      const wrongIcon = item.querySelector('.status-icon.wrong') as HTMLElement;
      correctIcon.style.display = 'none';
      wrongIcon.style.display = 'inline';
    }

    return item;
  }

  /**
   * 更新预览统计
   */
  private updatePreviewStats(): void {
    const answeredCount = document.getElementById('answered-count');
    const totalQuestions = document.getElementById('total-questions');

    if (answeredCount) {
      answeredCount.textContent = this.state.answeredQuestions.length.toString();
    }

    if (totalQuestions) {
      totalQuestions.textContent = this.state.questions.length.toString();
    }
  }

  /**
   * 获取国旗图片路径
   */
  private getFlagImagePath(countryCode: string): string {
    return getFlagImageUrl(countryCode);
  }

  /**
   * 结束测验
   */
  private endQuiz(): void {
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
      this.state.timerInterval = null;
    }

    const endTime = Date.now();
    const timeSpent = Math.floor((endTime - (this.state.startTime || endTime)) / 1000);

    // 更新统计数据
    const stats = getStats();
    stats.totalTests++;
    stats.totalQuestions += this.state.questions.length;
    stats.correctAnswers += this.state.score;

    // 更新最高分
    if (this.state.score > stats.bestScore) {
      stats.bestScore = this.state.score;
    }

    // 更新总体准确率
    stats.accuracy = Math.round((stats.correctAnswers / stats.totalQuestions) * 100);

    // 更新最高准确率（基于单次测验）
    const currentAccuracy = Math.round((this.state.score / this.state.questions.length) * 100);
    if (currentAccuracy > stats.bestAccuracy) {
      stats.bestAccuracy = currentAccuracy;
    }

    saveStats(stats);

    safeSetDisplay('quiz-game', 'none');
    safeSetDisplay('quiz-result', 'block');

    const accuracy = Math.round((this.state.score / this.state.questions.length) * 100);

    safeSetText('scoreDisplay', `${this.state.score}/${this.state.questions.length}`);
    safeSetText('correctCount', this.state.score.toString());
    safeSetText('wrongCount', (this.state.questions.length - this.state.score).toString());
    safeSetText('accuracyRate', `${accuracy}%`);
    safeSetText('timeSpent', formatTime(timeSpent));

    // 根据准确率显示不同的消息
    let message = '';
    if (accuracy === 100) {
      message = i18n.t('quiz.messages.perfect') || '完美！你是真正的国旗专家！🏆';
    } else if (accuracy >= 80) {
      message = i18n.t('quiz.messages.excellent') || '优秀！你的国旗知识非常丰富！⭐';
    } else if (accuracy >= 60) {
      message = i18n.t('quiz.messages.good') || '不错！继续努力，你会更棒的！💪';
    } else if (accuracy >= 40) {
      message = i18n.t('quiz.messages.keepTrying') || '加油！多练习就能进步！📚';
    } else {
      message = i18n.t('quiz.messages.keepLearning') || '没关系，学习需要时间，继续努力！🌟';
    }

    safeSetText('resultMessage', message);
  }

  /**
   * 开始计时器
   */
  private startTimer(): void {
    const timerEl = document.getElementById('timer');
    if (!timerEl) return;

    this.state.timerInterval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - (this.state.startTime || Date.now())) / 1000);
      timerEl.textContent = `⏱️ ${formatTime(elapsed)}`;
    }, 1000);
  }

  
  /**
   * 返回测验选择页面
   */
  backToQuiz(): void {
    this.resetQuizState();

    // 重置UI界面的选中状态
    this.resetUISelection();

    safeSetDisplay('quiz-start', 'block');
    safeSetDisplay('quiz-game', 'none');
    safeSetDisplay('quiz-result', 'none');
  }

  /**
   * 重置UI界面的选中状态
   */
  private resetUISelection(): void {
    // 重置测试类型选择卡片
    const quizTypeCards = document.querySelectorAll('.quiz-type-card');
    quizTypeCards.forEach((card) => {
      card.classList.remove('selected');
    });

    // 重置难度选择按钮
    const difficultyButtons = document.querySelectorAll('[data-difficulty]');
    difficultyButtons.forEach((btn) => {
      btn.classList.remove('selected');
    });

    // 恢复默认选中状态（中等难度）
    const mediumButton = document.querySelector('[data-difficulty="medium"]') as HTMLElement;
    if (mediumButton) {
      mediumButton.classList.add('selected');
    }

    // 隐藏开始测试按钮
    const startQuizBtn = document.getElementById('startQuizBtn');
    if (startQuizBtn) {
      (startQuizBtn as HTMLElement).style.display = 'none';
    }
  }

  /**
   * 重置测验状态
   */
  private resetQuizState(): void {
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
    }
    this.state = {
      quizType: '',
      difficulty: 'medium',
      questions: [],
      currentQuestion: 0,
      score: 0,
      startTime: null,
      timerInterval: null,
      answeredQuestions: [],
    };
  }

  /**
   * 获取当前状态
   */
  getState(): Readonly<QuizState> {
    return { ...this.state };
  }

  /**
   * 显示统计页面
   */
  showStats(): void {
    this.updateQuizStats();
    this.displayAchievements();
  }

  /**
   * 更新测验统计显示
   */
  private updateQuizStats(): void {
    const stats = getStats();

    // 显示基本统计
    safeSetText('stats-total-tests', stats.totalTests.toString());
    safeSetText('stats-total-questions', stats.totalQuestions.toString());
    safeSetText('stats-correct-answers', stats.correctAnswers.toString());
    safeSetText('stats-best-score', stats.bestScore.toString());
    safeSetText('stats-best-accuracy', `${stats.bestAccuracy}%`);

    // 计算总体准确率
    const accuracy =
      stats.totalQuestions > 0
        ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
        : 0;
    safeSetText('stats-accuracy', `${accuracy}%`);

    // 显示准确率等级
    const accuracyGrade = this.getAccuracyGrade(accuracy);
    safeSetText('stats-accuracy-grade', accuracyGrade);

    // 更新进度条
    const progressBar = document.getElementById('stats-accuracy-bar') as HTMLElement;
    if (progressBar) {
      progressBar.style.width = `${accuracy}%`;
      progressBar.style.backgroundColor = this.getAccuracyColor(accuracy);
    }
  }

  
  /**
   * 获取准确率等级
   */
  private getAccuracyGrade(accuracy: number): string {
    if (accuracy >= 90) return i18n.t('stats.grade.excellent') || '优秀';
    if (accuracy >= 80) return i18n.t('stats.grade.good') || '良好';
    if (accuracy >= 70) return i18n.t('stats.grade.average') || '中等';
    if (accuracy >= 60) return i18n.t('stats.grade.fair') || '及格';
    return i18n.t('stats.grade.needImprovement') || '需加强';
  }

  /**
   * 获取准确率对应的颜色
   */
  private getAccuracyColor(accuracy: number): string {
    if (accuracy >= 90) return '#22c55e'; // 绿色
    if (accuracy >= 80) return '#3b82f6'; // 蓝色
    if (accuracy >= 70) return '#eab308'; // 黄色
    if (accuracy >= 60) return '#f59e0b'; // 橙色
    return '#ef4444'; // 红色
  }

  /**
   * 重置统计数据
   */
  resetStats(): void {
    const confirmed = confirm(
      i18n.getCurrentLanguage() === 'en'
        ? 'Are you sure you want to reset all statistics? This action cannot be undone.'
        : '确定要重置所有统计数据吗？此操作无法撤销。'
    );

    if (!confirmed) return;

    const emptyStats: QuizStats = {
      totalTests: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      averageTime: 0,
      bestScore: 0,
      bestAccuracy: 0,
    };

    saveStats(emptyStats);

    // 强制更新统计数据显示
    setTimeout(() => {
      this.updateQuizStats();
      this.displayAchievements();
    }, 100);

    alert(
      i18n.getCurrentLanguage() === 'en'
        ? 'Statistics have been reset successfully!'
        : '统计数据已重置成功！'
    );
  }

  /**
   * 导出统计数据
   */
  exportStats(): void {
    try {
      const stats = getStats();

      const exportData = {
        quizStats: stats,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `flagstar-stats-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);

      console.log('✅ 统计数据导出成功');
    } catch (error) {
      console.error('导出统计数据失败:', error);
      alert(
        i18n.getCurrentLanguage() === 'en' ? 'Failed to export statistics!' : '导出统计数据失败！'
      );
    }
  }

  /**
   * 导入统计数据
   */
  importStats(file: File): void {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (data.quizStats) {
          localStorage.setItem('quizStats', JSON.stringify(data.quizStats));
        }

        this.updateQuizStats();

        alert(
          i18n.getCurrentLanguage() === 'en'
            ? 'Statistics imported successfully!'
            : '统计数据导入成功！'
        );

        console.log('✅ 统计数据导入成功');
      } catch (error) {
        console.error('导入统计数据失败:', error);
        alert(
          i18n.getCurrentLanguage() === 'en'
            ? 'Failed to import statistics! Invalid file format.'
            : '导入统计数据失败！文件格式无效。'
        );
      }
    };

    reader.readAsText(file);
  }

  /**
   * 获取成就徽章
   */
  private getAchievements(): {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    icon: string;
  }[] {
    const stats = getStats();

    return [
      {
        id: 'first_test',
        name: i18n.t('achievements.firstTest.name') || '初次尝试',
        description: i18n.t('achievements.firstTest.desc') || '完成第一次测验',
        unlocked: stats.totalTests >= 1,
        icon: '🎯',
      },
      {
        id: 'ten_tests',
        name: i18n.t('achievements.tenTests.name') || '勤学苦练',
        description: i18n.t('achievements.tenTests.desc') || '完成10次测验',
        unlocked: stats.totalTests >= 10,
        icon: '📚',
      },
      {
        id: 'perfect_score',
        name: i18n.t('achievements.perfectScore.name') || '满分大师',
        description: i18n.t('achievements.perfectScore.desc') || '获得一次满分',
        unlocked: stats.bestScore >= 100,
        icon: '🏆',
      },
      {
        id: 'high_accuracy',
        name: i18n.t('achievements.highAccuracy.name') || '准确率达人',
        description: i18n.t('achievements.highAccuracy.desc') || '单次测验准确率达到90%以上',
        unlocked: stats.bestAccuracy >= 90,
        icon: '🎯',
      },
      {
        id: 'persistent',
        name: i18n.t('achievements.persistent.name') || '坚持不懈',
        description: i18n.t('achievements.persistent.desc') || '完成50次测验',
        unlocked: stats.totalTests >= 50,
        icon: '💪',
      },
      {
        id: 'master',
        name: i18n.t('achievements.master.name') || '测验大师',
        description: i18n.t('achievements.master.desc') || '完成100次测验',
        unlocked: stats.totalTests >= 100,
        icon: '👑',
      },
    ];
  }

  /**
   * 显示成就徽章
   */
  private displayAchievements(): void {
    const achievements = this.getAchievements();
    const container = document.getElementById('achievements-container');

    if (!container) return;

    container.innerHTML = '';

    achievements.forEach((achievement) => {
      const card = document.createElement('div');
      card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
          <h4 class="achievement-name">${achievement.name}</h4>
          <p class="achievement-desc">${achievement.description}</p>
        </div>
        ${achievement.unlocked ? '<div class="achievement-badge">✓</div>' : ''}
      `;
      container.appendChild(card);
    });
  }
}

// 创建单例实例
export const quizModule = new QuizModule();

// 初始化标志
let quizModuleInitialized = false;

/**
 * 初始化测验模块的事件监听
 */
export function initQuizModule(): void {
  // 防止重复初始化
  if (quizModuleInitialized) {
    return;
  }

  // 测验导航切换
  const quizModeBtn = document.getElementById('quiz-mode-btn');
  const quizStatsBtn = document.getElementById('quiz-stats-btn');
  const quizModeContent = document.getElementById('quiz-mode-content');
  const quizStatsContent = document.getElementById('quiz-stats-content');

  if (quizModeBtn && quizStatsBtn && quizModeContent && quizStatsContent) {
    quizModeBtn.addEventListener('click', () => {
      // 切换到知识测试模式
      quizModeBtn.classList.add('active');
      quizStatsBtn.classList.remove('active');
      quizModeContent.style.display = 'block';
      quizStatsContent.style.display = 'none';
    });

    quizStatsBtn.addEventListener('click', () => {
      // 切换到统计模式
      quizModeBtn.classList.remove('active');
      quizStatsBtn.classList.add('active');
      quizModeContent.style.display = 'none';
      quizStatsContent.style.display = 'block';

      // 显示统计数据
      quizModule.showStats();
    });
  }

  // 测验类型选择
  const quizTypeCards = document.querySelectorAll('.quiz-type-card[data-type]');
  const startQuizBtn = document.getElementById('startQuizBtn');

  quizTypeCards.forEach((card) => {
    card.addEventListener('click', () => {
      const type = (card as HTMLElement).dataset.type as QuizType;
      quizModule.setQuizType(type);

      // 更新卡片选中状态
      quizTypeCards.forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');

      // 显示开始测验按钮
      if (startQuizBtn) {
        (startQuizBtn as HTMLElement).style.display = 'inline-block';
      }
    });
  });

  // 难度选择
  const difficultyButtons = document.querySelectorAll('[data-difficulty]');
  difficultyButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const difficulty = (btn as HTMLElement).dataset.difficulty as Difficulty;
      quizModule.setDifficulty(difficulty);

      // 更新按钮状态
      difficultyButtons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // 开始测验按钮
  if (startQuizBtn) {
    startQuizBtn.addEventListener('click', () => {
      quizModule.startQuiz();
    });
  }

  // 测验进行中的返回按钮
  const backToQuizBtn = document.getElementById('backToQuizBtn');
  if (backToQuizBtn) {
    backToQuizBtn.addEventListener('click', () => {
      quizModule.backToQuiz();
    });
  }

  // 结果页面的"再测一次"按钮
  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      quizModule.startQuiz();
    });
  }

  // 结果页面的"返回"按钮
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      quizModule.backToQuiz();
    });
  }

  // 统计相关按钮事件监听
  const resetStatsBtn = document.getElementById('reset-stats-btn');
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', () => quizModule.resetStats());
  }

  const exportStatsBtn = document.getElementById('export-stats-btn');
  if (exportStatsBtn) {
    exportStatsBtn.addEventListener('click', () => quizModule.exportStats());
  }

  const importStatsBtn = document.getElementById('import-stats-btn');
  const importStatsInput = document.getElementById('import-stats-input') as HTMLInputElement;

  if (importStatsBtn && importStatsInput) {
    importStatsBtn.addEventListener('click', () => importStatsInput.click());
    importStatsInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        quizModule.importStats(file);
      }
    });
  }

  quizModuleInitialized = true;
  console.log('✅ Quiz module initialized');
}

// 导出到全局（向后兼容）
if (typeof window !== 'undefined') {
  (window as any).quizModule = quizModule;
  (window as any).checkAnswer = () => {
    // 向后兼容的包装器
    console.warn('Using deprecated global checkAnswer function');
  };
}
