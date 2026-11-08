import React, { useState, useEffect, useMemo } from 'react';
import { 
  Utensils, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Sparkles,
  Award,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

// Default user settings
const DEFAULT_GOALS = {
  protein: 90, // in grams
  carbs: 220,  // in grams
};

// Seed initial sample data if empty
const generateInitialData = () => {
  const data = {};
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Create reasonable randomized sample data for past 7 days
    data[dateStr] = {
      date: dateStr,
      breakfast: i !== 3 && i !== 6, // missed 2 days
      lunch: {
        protein: Math.floor(35 + Math.random() * 15),
        carbs: Math.floor(75 + Math.random() * 25)
      },
      dinner: {
        protein: Math.floor(40 + Math.random() * 15),
        carbs: Math.floor(80 + Math.random() * 25)
      },
      notes: i === 0 ? "今天午餐吃了鸡胸肉配紫米饭！" : ""
    };
  }
  return data;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'weekly', 'history', 'settings'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('diet_tracker_goals');
    return saved ? JSON.parse(saved) : DEFAULT_GOALS;
  });
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('diet_tracker_logs');
    return saved ? JSON.parse(saved) : generateInitialData();
  });

  // Notifications/Toasts
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('diet_tracker_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('diet_tracker_logs', JSON.stringify(logs));
  }, [logs]);

  // Current selected log entry (or default empty template)
  const currentLog = useMemo(() => {
    return logs[selectedDate] || {
      date: selectedDate,
      breakfast: false,
      lunch: { protein: '', carbs: '' },
      dinner: { protein: '', carbs: '' },
      notes: ''
    };
  }, [logs, selectedDate]);

  // Helper calculation for daily total
  const getDailyTotals = (log) => {
    const lProt = Number(log?.lunch?.protein) || 0;
    const lCarb = Number(log?.lunch?.carbs) || 0;
    const dProt = Number(log?.dinner?.protein) || 0;
    const dCarb = Number(log?.dinner?.carbs) || 0;

    const totalProtein = lProt + dProt;
    const totalCarbs = lCarb + dCarb;

    return {
      totalProtein,
      totalCarbs,
      proteinRatio: Math.min(Math.round((totalProtein / (goals.protein || 1)) * 100), 200),
      carbsRatio: Math.min(Math.round((totalCarbs / (goals.carbs || 1)) * 100), 200),
      isProteinMet: totalProtein >= goals.protein,
      isCarbsMet: totalCarbs >= goals.carbs,
      isFullyMet: log?.breakfast && totalProtein >= goals.protein && totalCarbs >= goals.carbs
    };
  };

  const currentTotals = useMemo(() => getDailyTotals(currentLog), [currentLog, goals]);

  // Handlers for modifying log
  const handleLogChange = (field, value) => {
    setLogs(prev => ({
      ...prev,
      [selectedDate]: {
        ...currentLog,
        [field]: value
      }
    }));
  };

  const handleMealChange = (meal, type, value) => {
    const val = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    setLogs(prev => ({
      ...prev,
      [selectedDate]: {
        ...currentLog,
        [meal]: {
          ...currentLog[meal],
          [type]: val
        }
      }
    }));
  };

  // Date Navigation
  const changeDateByDays = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Weekly Stats Calculation
  const weeklyStats = useMemo(() => {
    const today = new Date(selectedDate);
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
    // Start of week (Monday)
    const distanceToMon = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - distanceToMon);

    const weekDays = [];
    let bFastCount = 0;
    let totalProt = 0;
    let totalCarb = 0;
    let loggedDays = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLog = logs[dateStr];
      const totals = dayLog ? getDailyTotals(dayLog) : { totalProtein: 0, totalCarbs: 0 };
      
      const dayName = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i];
      
      if (dayLog) {
        if (dayLog.breakfast) bFastCount++;
        totalProt += totals.totalProtein;
        totalCarb += totals.totalCarbs;
        loggedDays++;
      }

      weekDays.push({
        dateStr,
        dayName,
        isToday: dateStr === new Date().toISOString().split('T')[0],
        breakfast: !!dayLog?.breakfast,
        protein: totals.totalProtein,
        carbs: totals.totalCarbs,
        hasData: !!dayLog
      });
    }

    const avgProt = loggedDays > 0 ? Math.round(totalProt / loggedDays) : 0;
    const avgCarb = loggedDays > 0 ? Math.round(totalCarb / loggedDays) : 0;

    return {
      weekDays,
      bFastCount,
      bFastRate: Math.round((bFastCount / 7) * 100),
      avgProt,
      avgCarb,
      loggedDays,
      startOfWeekStr: startOfWeek.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      endOfWeekStr: new Date(startOfWeek.getTime() + 6 * 86400000).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    };
  }, [logs, selectedDate, goals]);

  // Dynamic feedback tips based on weekly performance
  const weeklyTips = useMemo(() => {
    const tips = [];
    if (weeklyStats.bFastCount === 7) {
      tips.push({ type: 'success', text: '🔥 棒极了！本周每天都按时吃了早餐，维持了健康的新陈代谢！' });
    } else if (weeklyStats.bFastCount < 4) {
      tips.push({ type: 'warning', text: '⚠️ 本周吃早餐的天数偏少，记得早餐是开启能量满满一天的钥匙哦！' });
    }

    if (weeklyStats.avgProt >= goals.protein) {
      tips.push({ type: 'success', text: '💪 蛋白质摄入达标！这有助于肌肉维持与组织修复。' });
    } else {
      tips.push({ type: 'info', text: `💡 蛋白质平均少摄入 ${goals.protein - weeklyStats.avgProt}g，建议多吃鸡胸肉、蛋类或豆制品。` });
    }

    if (weeklyStats.avgCarb > goals.carbs * 1.2) {
      tips.push({ type: 'warning', text: '🍚 本周碳水化合物摄入偏高，适当替换为全谷物粗粮会更健康。' });
    } else if (weeklyStats.avgCarb >= goals.carbs * 0.8) {
      tips.push({ type: 'success', text: '✨ 碳水化合物控制得相当均衡，能持续稳定提供能量！' });
    }

    return tips;
  }, [weeklyStats, goals]);

  // Backup & Restore
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ goals, logs }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `diet_tracker_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("数据导出成功！");
  };

  const handleImportData = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.logs) setLogs(parsed.logs);
          if (parsed.goals) setGoals(parsed.goals);
          showToast("数据导入成功！");
        } catch (err) {
          showToast("导入失败，文件格式有误！");
        }
      };
    }
  };

  const handleResetData = () => {
    if (window.confirm("确定要清空所有打卡数据吗？此操作无法撤销！")) {
      setLogs({});
      showToast("已清空所有打卡记录");
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/40 text-slate-800 pb-16 md:pb-8 font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800 leading-tight">每日饮食打卡</h1>
              <p className="text-xs text-slate-500">记录营养 · 规划健康生活</p>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'today', label: '每日打卡', icon: Calendar },
              { id: 'weekly', label: '周小结分析', icon: BarChart3 },
              { id: 'history', label: '历史记录', icon: TrendingUp },
              { id: 'settings', label: '目标设置', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6">

        {/* TAB 1: DAILY LOG ENTRY */}
        {activeTab === 'today' && (
          <div className="space-y-6">
            {/* Date Selector Header */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100/60 flex items-center justify-between">
              <button 
                onClick={() => changeDateByDays(-1)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"
                title="前一天"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {selectedDate === new Date().toISOString().split('T')[0] && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium">
                    今天
                  </span>
                )}
              </div>

              <button 
                onClick={() => changeDateByDays(1)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"
                title="后一天"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Daily Overview / Nutritional Target Progress */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/60 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <span>本日营养摄入概览</span>
                </h2>
                <div className="text-xs text-slate-500">
                  目标: 蛋 {goals.protein}g / 碳 {goals.carbs}g
                </div>
              </div>

              {/* Progress Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Protein Bar */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <div className="flex justify-between items-center text-sm font-medium mb-2">
                    <span className="text-emerald-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      蛋白质 (Protein)
                    </span>
                    <span className="text-emerald-700 font-bold">
                      {currentTotals.totalProtein} / {goals.protein} g
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200/60 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        currentTotals.isProteinMet ? 'bg-emerald-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, (currentTotals.totalProtein / goals.protein) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs flex justify-between text-slate-500">
                    <span>达成率: {Math.round((currentTotals.totalProtein / goals.protein) * 100)}%</span>
                    <span>{currentTotals.isProteinMet ? '✅ 已摄入足够' : `还差 ${goals.protein - currentTotals.totalProtein}g`}</span>
                  </div>
                </div>

                {/* Carbs Bar */}
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                  <div className="flex justify-between items-center text-sm font-medium mb-2">
                    <span className="text-amber-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      碳水化合物 (Carbs)
                    </span>
                    <span className="text-amber-700 font-bold">
                      {currentTotals.totalCarbs} / {goals.carbs} g
                    </span>
                  </div>
                  <div className="w-full bg-amber-200/60 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        currentTotals.isCarbsMet ? 'bg-amber-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.min(100, (currentTotals.totalCarbs / goals.carbs) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs flex justify-between text-slate-500">
                    <span>达成率: {Math.round((currentTotals.totalCarbs / goals.carbs) * 100)}%</span>
                    <span>{currentTotals.isCarbsMet ? '✅ 已摄入足够' : `还差 ${goals.carbs - currentTotals.totalCarbs}g`}</span>
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-3 rounded-xl text-sm flex items-center space-x-3 ${
                currentTotals.isFullyMet 
                  ? 'bg-emerald-100 text-emerald-800 font-medium' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {currentTotals.isFullyMet ? (
                  <>
                    <Award className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>太棒了！今日早餐已打卡，且蛋白质与碳水摄入均已满足全天营养指标需求！🎉</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <span>
                      {!currentLog.breakfast 
                        ? '请记得先完成早餐打卡。' 
                        : '继续加油！填报午餐和晚餐营养克数，看看今天吃够了没有。'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Meal Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* BREAKFAST CARD */}
              <div className={`rounded-2xl p-5 border transition-all ${
                currentLog.breakfast 
                  ? 'bg-gradient-to-b from-emerald-50 to-white border-emerald-200 shadow-sm' 
                  : 'bg-white border-slate-200/80 shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🍳</span>
                    <h3 className="font-bold text-slate-800">早餐打卡</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">仅需打卡</span>
                </div>

                <p className="text-xs text-slate-500 mb-6">
                  吃早餐能够开启全天新陈代谢。记录你今天是否享受了营养早饭。
                </p>

                <button
                  onClick={() => handleLogChange('breakfast', !currentLog.breakfast)}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-sm ${
                    currentLog.breakfast
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {currentLog.breakfast ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>早餐已打卡</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-slate-400" />
                      <span>点击完成早餐打卡</span>
                    </>
                  )}
                </button>
              </div>

              {/* LUNCH CARD */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🥗</span>
                    <h3 className="font-bold text-slate-800">午餐定量</h3>
                  </div>
                  <span className="text-xs text-slate-400">蛋白质 & 碳水</span>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      蛋白质 (克/g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="如: 35"
                      value={currentLog.lunch?.protein ?? ''}
                      onChange={(e) => handleMealChange('lunch', 'protein', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      碳水化合物 (克/g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="如: 80"
                      value={currentLog.lunch?.carbs ?? ''}
                      onChange={(e) => handleMealChange('lunch', 'carbs', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-lg flex justify-between">
                  <span>午餐合计:</span>
                  <span className="font-semibold text-slate-700">
                    {(Number(currentLog.lunch?.protein) || 0)}g 蛋白 / {(Number(currentLog.lunch?.carbs) || 0)}g 碳水
                  </span>
                </div>
              </div>

              {/* DINNER CARD */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🍲</span>
                    <h3 className="font-bold text-slate-800">晚餐定量</h3>
                  </div>
                  <span className="text-xs text-slate-400">蛋白质 & 碳水</span>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      蛋白质 (克/g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="如: 40"
                      value={currentLog.dinner?.protein ?? ''}
                      onChange={(e) => handleMealChange('dinner', 'protein', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      碳水化合物 (克/g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="如: 60"
                      value={currentLog.dinner?.carbs ?? ''}
                      onChange={(e) => handleMealChange('dinner', 'carbs', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-lg flex justify-between">
                  <span>晚餐合计:</span>
                  <span className="font-semibold text-slate-700">
                    {(Number(currentLog.dinner?.protein) || 0)}g 蛋白 / {(Number(currentLog.dinner?.carbs) || 0)}g 碳水
                  </span>
                </div>
              </div>

            </div>

            {/* Optional Daily Notes */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                📝 每日饮食随记 / 备注（选填）
              </label>
              <textarea
                rows="2"
                placeholder="例如：今天午饭肉量很足，晚饭少吃了点碳水；喝了2升水。"
                value={currentLog.notes || ''}
                onChange={(e) => handleLogChange('notes', e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* TAB 2: WEEKLY SUMMARY */}
        {activeTab === 'weekly' && (
          <div className="space-y-6">
            {/* Header / Week Navigator */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">周度健康小结</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  统计时间范围: {weeklyStats.startOfWeekStr} - {weeklyStats.endOfWeekStr}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => changeDateByDays(-7)}
                  className="px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-xl hover:bg-slate-50 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> 上一周
                </button>
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl hover:bg-emerald-100"
                >
                  本周
                </button>
                <button
                  onClick={() => changeDateByDays(7)}
                  className="px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-xl hover:bg-slate-50 flex items-center gap-1"
                >
                  下一周 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Card 1: Breakfast Rate */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-md">
                <div className="flex justify-between items-start">
                  <span className="text-emerald-100 text-xs font-medium">早餐打卡完成率</span>
                  <span className="text-2xl">🍳</span>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold">{weeklyStats.bFastCount}</span>
                  <span className="text-sm text-emerald-100">/ 7 天 ({weeklyStats.bFastRate}%)</span>
                </div>
                <div className="mt-3 w-full bg-emerald-700/50 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${weeklyStats.bFastRate}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Average Protein */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 text-xs font-medium">日均蛋白质摄入</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-slate-800">{weeklyStats.avgProt}</span>
                  <span className="text-sm text-slate-500">g / 天</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  目标需求: {goals.protein}g 
                  <span className={`ml-2 font-bold ${weeklyStats.avgProt >= goals.protein ? 'text-emerald-600' : 'text-amber-600'}`}>
                    ({weeklyStats.avgProt >= goals.protein ? '已达标' : '未达标'})
                  </span>
                </div>
              </div>

              {/* Card 3: Average Carbs */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 text-xs font-medium">日均碳水化合物摄入</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-slate-800">{weeklyStats.avgCarb}</span>
                  <span className="text-sm text-slate-500">g / 天</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  目标需求: {goals.carbs}g 
                  <span className={`ml-2 font-bold ${weeklyStats.avgCarb >= goals.carbs ? 'text-emerald-600' : 'text-amber-600'}`}>
                    ({weeklyStats.avgCarb >= goals.carbs ? '已达标' : '未达标'})
                  </span>
                </div>
              </div>

            </div>

            {/* Weekly Visual Chart Bar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>近 7 天营养趋势图 (蛋白质 vs 碳水化合物)</span>
              </h3>

              <div className="grid grid-cols-7 gap-2 pt-6 pb-2 border-b border-slate-100">
                {weeklyStats.weekDays.map((day, idx) => {
                  const protRatio = Math.min(100, (day.protein / (goals.protein || 1)) * 100);
                  const carbRatio = Math.min(100, (day.carbs / (goals.carbs || 1)) * 100);

                  return (
                    <div key={idx} className="flex flex-col items-center space-y-2 group">
                      {/* Bar Container */}
                      <div className="h-40 w-full max-w-[40px] bg-slate-50 rounded-xl p-1 flex items-end justify-center gap-1 relative border border-slate-100">
                        
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] p-2 rounded-lg z-20 whitespace-nowrap shadow-xl">
                          <div>{day.dateStr}</div>
                          <div>蛋白: {day.protein}g / 碳水: {day.carbs}g</div>
                        </div>

                        {/* Protein bar */}
                        <div 
                          className="w-1/2 bg-emerald-500 rounded-t-md transition-all duration-500"
                          style={{ height: `${protRatio}%` }}
                          title={`蛋白质: ${day.protein}g`}
                        />
                        {/* Carbs bar */}
                        <div 
                          className="w-1/2 bg-amber-400 rounded-t-md transition-all duration-500"
                          style={{ height: `${carbRatio}%` }}
                          title={`碳水: ${day.carbs}g`}
                        />
                      </div>

                      {/* Day Label */}
                      <div className="text-center">
                        <div className="text-xs font-semibold text-slate-700">{day.dayName}</div>
                        <div className="mt-1">
                          {day.breakfast ? (
                            <span className="text-xs" title="早餐已打卡">🍳</span>
                          ) : (
                            <span className="text-xs text-slate-300" title="未吃早餐">⚪</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center space-x-6 text-xs text-slate-500 pt-2">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
                  <span>蛋白质 (目标: {goals.protein}g)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 bg-amber-400 rounded-sm"></span>
                  <span>碳水化合物 (目标: {goals.carbs}g)</span>
                </div>
              </div>
            </div>

            {/* Intelligent Health Advice Card */}
            <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100 space-y-3">
              <h3 className="font-bold text-emerald-900 flex items-center space-x-2 text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>本周健康饮食分析建议</span>
              </h3>

              <div className="space-y-2">
                {weeklyTips.map((tip, idx) => (
                  <div key={idx} className="bg-white/80 backdrop-blur-sm p-3 rounded-xl text-xs sm:text-sm text-slate-700 shadow-sm border border-emerald-50">
                    {tip.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HISTORY LOGS */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800">历史打卡数据</h2>
                <p className="text-xs text-slate-500">查看及修改以往日期的饮食记录</p>
              </div>
              <span className="text-xs text-slate-400">共 {Object.keys(logs).length} 条记录</span>
            </div>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              {Object.keys(logs).sort((a,b) => b.localeCompare(a)).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  暂无历史打卡记录，去“每日打卡”添加第一条吧！
                </div>
              ) : (
                Object.keys(logs).sort((a,b) => b.localeCompare(a)).map(dateKey => {
                  const item = logs[dateKey];
                  const totals = getDailyTotals(item);

                  return (
                    <div key={dateKey} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition">
                      <div className="flex items-center space-x-4">
                        <div className="font-semibold text-slate-800 text-sm w-24">
                          {dateKey}
                        </div>
                        
                        {/* Breakfast icon status */}
                        <div className="flex items-center space-x-1">
                          {item.breakfast ? (
                            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                              🍳 早餐已打卡
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-400 text-xs px-2 py-0.5 rounded-md">
                              未打卡早餐
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nutrient totals */}
                      <div className="flex items-center space-x-4">
                        <div className="text-xs text-right">
                          <span className="text-emerald-700 font-semibold">蛋白: {totals.totalProtein}g</span>
                          <span className="text-slate-300 mx-1">|</span>
                          <span className="text-amber-700 font-semibold">碳水: {totals.totalCarbs}g</span>
                        </div>

                        {/* Quick edit or jump button */}
                        <button
                          onClick={() => {
                            setSelectedDate(dateKey);
                            setActiveTab('today');
                          }}
                          className="text-xs bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 px-2.5 py-1 rounded-lg transition"
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: GOALS & SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Goal Config */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
              <div>
                <h2 className="font-bold text-slate-800 text-base">每日营养目标设置</h2>
                <p className="text-xs text-slate-500 mt-0.5">根据个人体质、健身或减脂需求设定每日所需的基础摄入量</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    每日蛋白质目标 (g)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={goals.protein}
                    onChange={(e) => setGoals(prev => ({ ...prev, protein: Math.max(1, parseInt(e.target.value, 10) || 0) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">如：一般成年人建议每公斤体重摄入 1.2g ~ 1.8g 蛋白质</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    每日碳水化合物目标 (g)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={goals.carbs}
                    onChange={(e) => setGoals(prev => ({ ...prev, carbs: Math.max(1, parseInt(e.target.value, 10) || 0) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">如：保持能量充沛所需的基础碳水供应</p>
                </div>
              </div>
            </div>

            {/* Data Backup & Management */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <h2 className="font-bold text-slate-800 text-base">数据管理与备份</h2>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>导出 JSON 数据备份</span>
                </button>

                <label className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold flex items-center space-x-2 cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>导入本地数据</span>
                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </label>

                <button
                  onClick={handleResetData}
                  className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>清空本地记录</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-2 flex justify-between items-center z-40">
        {[
          { id: 'today', label: '打卡', icon: Calendar },
          { id: 'weekly', label: '周结', icon: BarChart3 },
          { id: 'history', label: '历史', icon: TrendingUp },
          { id: 'settings', label: '设置', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center space-y-1 ${
              activeTab === tab.id ? 'text-emerald-600 font-bold' : 'text-slate-400 font-normal'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px]">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}