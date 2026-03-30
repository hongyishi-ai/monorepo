import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStorage } from '@/hooks/use-storage';
import type { AssessmentRecord } from '@/lib/storage';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ContainerWithIcon from '@/components/ui/container-with-icon';
import { Calendar, Clock, Download, Upload, Trash2, Star, StarOff, BarChart3, Activity, AlertTriangle, CheckCircle, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { 
    getAllAssessments, 
    deleteAssessment, 
    updateAssessment, 
    exportData, 
    importData, 
    getStatistics,
    isLoading,
    error 
  } = useStorage();

  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [statistics, setStatistics] = useState<{
    totalAssessments: number;
    starredAssessments: number;
    avgScore: number;
    latestAssessment?: Date;
  }>({
    totalAssessments: 0,
    starredAssessments: 0,
    avgScore: 0,
    latestAssessment: undefined
  });

  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  // 加载数据
  const loadData = async () => {
    try {
      const [assessmentsData, statsData] = await Promise.all([
        getAllAssessments(),
        getStatistics()
      ]);
      setAssessments(assessmentsData);
      setStatistics(statsData);
    } catch (err) {
      console.error('加载历史数据失败:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 删除评估记录
  const handleDelete = async (record: AssessmentRecord) => {
    try {
      await deleteAssessment(record.id!);
      await loadData(); // 重新加载数据
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  // 切换收藏状态
  const toggleStar = async (record: AssessmentRecord) => {
    try {
      await updateAssessment(record.id!, { isStarred: !record.isStarred });
      await loadData(); // 重新加载数据
    } catch (err) {
      console.error('更新收藏状态失败:', err);
    }
  };

  // 查看评估记录
  const viewAssessment = (record: AssessmentRecord) => {
    // 使用URL参数传递记录ID，确保刷新后仍能恢复数据
    navigate(`/report?recordId=${record.id}`);
  };

  // 导出数据
  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fms-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出失败:', err);
    }
  };

  // 导入数据
  const handleImport = async () => {
    if (!importText.trim()) return;
    
    try {
      const result = await importData(importText);
      setImportResult(result);
      if (result.imported > 0) {
        await loadData(); // 重新加载数据
        setImportText('');
      }
    } catch (err) {
      console.error('导入失败:', err);
      setImportResult({ imported: 0, errors: ['导入失败'] });
    }
  };

  // 上传文件导入
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportText(content);
      };
      reader.readAsText(file);
    }
  };

  // 获取评估状态信息
  const getAssessmentStatus = (record: AssessmentRecord) => {
    const { assessmentData } = record;
    const hasPain = assessmentData.painfulTests.length > 0;
    const hasAsymmetry = Object.keys(assessmentData.asymmetryIssues).length > 0;
    const score = assessmentData.totalScore;

    if (hasPain) {
      return { 
        status: '需要关注', 
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: AlertTriangle
      };
    }
    if (hasAsymmetry || score < 14) {
      return { 
        status: '建议改善', 
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        icon: BarChart3
      };
    }
    return { 
      status: '功能良好', 
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: CheckCircle
    };
  };

  if (error) {
    return (
      <div className="brooklyn-section">
        <ContainerWithIcon
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconSize="2xl"
          iconPosition="center"
          iconOpacity={0.1}
          className="brooklyn-container max-w-2xl text-center"
        >
          <h1 className="brooklyn-title text-2xl mb-4 text-red-600">加载失败</h1>
          <p className="brooklyn-text mb-8">{error}</p>
          <Button onClick={() => window.location.reload()} className="brooklyn-button">
            重新加载
          </Button>
        </ContainerWithIcon>
      </div>
    );
  }

  return (
    <div className="brooklyn-section" role="region" aria-label="历史评估记录">
      <div className="brooklyn-container max-w-6xl">
        {/* 页面标题和统计信息 */}
        <div className="text-center mb-16 md:mb-20 minimal-fade-in" role="region" aria-label="页面标题与说明">
          <h1 className="brooklyn-title">历史评估记录</h1>
          <p className="brooklyn-subtitle max-w-3xl mx-auto mt-6">
            管理您的所有FMS评估记录，支持查看详细报告、数据导入导出和记录管理功能。
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="mb-16 md:mb-20" role="region" aria-label="统计概览">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
            <Card className="brooklyn-card">
              <CardContent className="p-4 text-center">
                <Archive className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-light text-blue-600">{statistics.totalAssessments}</div>
                <div className="text-sm text-muted-foreground">总记录数</div>
              </CardContent>
            </Card>
            <Card className="brooklyn-card">
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                <div className="text-2xl font-light text-amber-600">{statistics.starredAssessments}</div>
                <div className="text-sm text-muted-foreground">收藏记录</div>
              </CardContent>
            </Card>
            <Card className="brooklyn-card">
              <CardContent className="p-4 text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-light text-green-600">{statistics.avgScore}</div>
                <div className="text-sm text-muted-foreground">平均得分</div>
              </CardContent>
            </Card>
            <Card className="brooklyn-card">
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm font-light text-muted-foreground">
                  {statistics.latestAssessment 
                    ? format(statistics.latestAssessment, 'MM/dd')
                    : '无'
                  }
                </div>
                <div className="text-sm text-muted-foreground">最近评估</div>
              </CardContent>
            </Card>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" role="region" aria-label="导入导出与新建操作">
            <Link to="/assessment">
              <Button className="brooklyn-button px-8">新建评估</Button>
            </Link>
            <Button onClick={handleExport} variant="outline" className="px-8">
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="px-8">
                  <Upload className="w-4 h-4 mr-2" />
                  导入数据
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>导入评估数据</DialogTitle>
                  <DialogDescription>
                    您可以导入之前导出的备份文件或直接粘贴JSON数据
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">选择备份文件</Label>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="import-text">或粘贴JSON数据</Label>
                    <Textarea
                      id="import-text"
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="粘贴导出的JSON数据..."
                      className="mt-2 min-h-[200px] font-mono text-xs"
                    />
                  </div>
                  {importResult && (
                    <div className={cn(
                      "p-4 rounded-md",
                      importResult.errors.length > 0 
                        ? "bg-red-50 border border-red-200" 
                        : "bg-green-50 border border-green-200"
                    )}>
                      <div className="text-sm">
                        <div className="font-medium">
                          成功导入 {importResult.imported} 条记录
                        </div>
                        {importResult.errors.length > 0 && (
                          <div className="mt-2 text-red-600">
                            错误信息：
                            <ul className="list-disc list-inside mt-1">
                              {importResult.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleImport} disabled={!importText.trim()}>
                    开始导入
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 评估记录列表 */}
        {isLoading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="brooklyn-text">加载中...</p>
          </div>
        ) : assessments.length === 0 ? (
          <ContainerWithIcon
            icon={Archive}
            iconColor="text-muted-foreground"
            iconSize="2xl"
            iconPosition="center"
            iconOpacity={0.1}
            className="text-center py-20"
          >
            <h3 className="brooklyn-title text-xl mb-4">暂无评估记录</h3>
            <p className="brooklyn-text mb-8 max-w-md mx-auto">
              您还没有保存任何评估记录。完成评估后，系统会自动保存您的结果。
            </p>
            <Link to="/assessment">
              <Button className="brooklyn-button px-8">开始第一次评估</Button>
            </Link>
          </ContainerWithIcon>
        ) : (
          <div className="space-y-6" role="list" aria-label="评估记录列表">
            {assessments.map((record) => {
              const status = getAssessmentStatus(record);
              const StatusIcon = status.icon;

              return (
                <Card key={record.id} className="brooklyn-card group hover:shadow-lg transition-all duration-300" role="listitem">
                  <CardHeader className="pb-6">
                    <div className="space-y-4">
                      {/* 标题行 */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="brooklyn-title text-xl font-light truncate">{record.title}</h3>
                            {record.isStarred && (
                              <Star className="w-5 h-5 text-amber-500 fill-current flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={cn("px-3 py-1.5 text-sm font-medium", status.color)}>
                              <StatusIcon className="w-4 h-4 mr-2" />
                              {status.status}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStar(record)}
                          className="p-2 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          {record.isStarred ? (
                            <StarOff className="w-4 h-4" />
                          ) : (
                            <Star className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {/* 评估信息 */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-t border-border/40">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="brooklyn-text">
                            {format(new Date(record.createdAt), 'yyyy年MM月dd日')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Activity className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="brooklyn-text font-medium">
                            总分: {record.assessmentData.totalScore}/21
                          </span>
                        </div>
                        {record.assessmentData.painfulTests.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">
                              {record.assessmentData.painfulTests.length} 处疼痛
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 描述 */}
                      {record.description && (
                        <p className="brooklyn-text text-sm text-muted-foreground leading-relaxed">
                          {record.description}
                        </p>
                      )}

                      {/* 标签 */}
                      {record.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {record.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                        <Button
                          onClick={() => viewAssessment(record)}
                          className="brooklyn-button flex-1 sm:flex-none"
                        >
                          查看详情
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除评估记录"{record.title}"吗？此操作无法撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(record)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage; 