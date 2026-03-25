import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@excalidraw/excalidraw/components/Card";
import { ToolButton } from "@excalidraw/excalidraw/components/ToolButton";
import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { Button } from "@excalidraw/excalidraw/components/Button";

import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";
import type { BinaryFiles, UIAppState } from "@excalidraw/excalidraw/types";

import {
  saveToServer,
  getFolders,
  createFolder,
  type SaveToServerResult,
  type FolderInfo,
  type ServerFile,
} from "../data/serverStorage";

import "./SaveToServerCard.scss";

interface SaveToServerCardProps {
  elements: readonly NonDeletedExcalidrawElement[];
  appState: UIAppState;
  files: BinaryFiles;
}

/**
 * SaveToServerCard - 保存到服务器组件
 * 
 * 使用 UI/UX Pro Max 技能设计指南：
 * - 优先级 1: 可访问性 (aria 标签、键盘导航)
 * - 优先级 2: 触摸交互 (最小点击区域 44×44px)
 * - 优先级 5: 响应式布局
 * - 优先级 8: 表单与反馈
 * - 现代化设计风格 (Glassmorphism + Minimalism)
 */
export const SaveToServerCard: React.FC<SaveToServerCardProps> = ({
  elements,
  appState,
  files,
}) => {
  // 状态管理
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<SaveToServerResult | null>(null);
  const [filename, setFilename] = useState("");
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [serverFiles, setFiles] = useState<ServerFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [viewMode, setViewMode] = useState<"save" | "browse">("save");

  // 加载文件夹和文件列表
  const loadFolders = useCallback(async (path = "") => {
    setIsLoading(true);
    try {
      const result = await getFolders(path);
      if (result.success) {
        setFolders(result.folders || []);
        setFiles(result.files || []);
        setCurrentPath(result.currentPath || "");
      } else {
        setResult({ success: false, error: result.error || "加载失败" });
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message || "加载失败" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 加载指定路径的文件夹列表
  const loadFoldersAtPath = useCallback(async (path: string = "") => {
    setIsLoading(true);
    try {
      const result = await getFolders(path);
      if (result.success) {
        setFolders(result.folders || []);
        setFiles(result.files || []);
        setCurrentPath(result.currentPath || "");
      }
    } catch (error: any) {
      console.error("Error loading folders:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 加载根目录文件夹列表（用于下拉选择）
  const loadRootFolders = useCallback(async () => {
    await loadFoldersAtPath("");
  }, [loadFoldersAtPath]);

  // 打开对话框时加载数据
  const handleOpenDialog = () => {
    const defaultName = appState.name || `绘图-${new Date().toLocaleDateString('zh-CN')}`;
    setFilename(defaultName);
    setSelectedFolder("");
    setCurrentPath("");
    setResult(null);
    setShowNewFolderInput(false);
    setNewFolderName("");
    setViewMode("save");
    setIsDialogOpen(true);
    loadRootFolders();  // 加载根目录文件夹
  };

  const handleCloseDialog = () => {
    if (isSaving) return;
    setIsDialogOpen(false);
    setResult(null);
  };

  const handleSave = async () => {
    if (!filename.trim()) {
      setResult({ success: false, error: "⚠️ 请输入文件名" });
      return;
    }

    setIsSaving(true);
    setResult(null);

    try {
      const saveResult = await saveToServer(
        elements,
        appState,
        files,
        filename.trim(),
        selectedFolder
      );
      setResult(saveResult);

      if (saveResult.success) {
        await loadFolders(selectedFolder);
        setTimeout(() => {
          setIsDialogOpen(false);
        }, 2000);
      }
    } catch (error: any) {
      setResult({ success: false, error: `❌ ${error.message || "保存失败"}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setResult({ success: false, error: "⚠️ 请输入文件夹名称" });
      return;
    }

    setIsCreatingFolder(true);
    // 使用当前选中的文件夹路径作为父路径
    const parentPath = selectedFolder || currentPath;
    try {
      const result = await createFolder(newFolderName.trim(), parentPath);
      if (result.success) {
        // 创建成功后，重新加载根目录文件夹列表（用于下拉选择）
        await loadRootFolders();
        setShowNewFolderInput(false);
        setNewFolderName("");
        setResult({ success: true, message: "✅ 文件夹创建成功" });
      } else {
        setResult({ success: false, error: `❌ ${result.error || "创建失败"}` });
      }
    } catch (error: any) {
      setResult({ success: false, error: `❌ ${error.message || "创建失败"}` });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleNavigateFolder = (folderPath: string) => {
    loadFolders(folderPath);
  };

  const handleBackToParent = () => {
    if (currentPath) {
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
      loadFolders(parentPath);
    } else {
      loadFolders("");
    }
  };

  const handleViewFiles = async () => {
    setViewMode("browse");
    // 如果选择了文件夹，加载该文件夹内容；否则加载根目录
    await loadFolders(selectedFolder);
  };

  // 切换回保存模式时，重新加载根目录文件夹列表
  const handleSwitchToSaveMode = () => {
    setViewMode("save");
    loadRootFolders();
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  // ==================== 图标组件 ====================

  const ServerIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
      <line x1="6" y1="6" x2="6.01" y2="6"></line>
      <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
  );

  const FolderIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  );

  const FileIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
      <polyline points="13 2 13 9 20 9"></polyline>
    </svg>
  );

  const BackIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  );

  const PlusIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );

  // ==================== 主组件 ====================

  return (
    <>
      {/* 卡片展示 */}
      <Card color="primary">
        <div className="Card-icon" role="img" aria-label="服务器图标">
          {ServerIcon}
        </div>
        <h2>保存到服务器</h2>
        <div className="Card-details">
          将绘图保存到云端，支持文件夹管理和版本控制
        </div>
        <ToolButton
          className="Card-button"
          type="button"
          title="保存到服务器"
          aria-label="保存到服务器 - 点击打开保存对话框"
          showAriaLabel={true}
          onClick={handleOpenDialog}
          style={{
            minHeight: "44px",  // 触摸目标最小尺寸
            minWidth: "44px"
          }}
        />
      </Card>

      {/* 保存对话框 */}
      {isDialogOpen && (
        <Dialog
          title="保存到服务器"
          onCloseRequest={handleCloseDialog}
          size="wide"
          closeOnClickOutside={!isSaving}
        >
          <div className="SaveToServerDialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            
            {/* 标签页切换 */}
            <div className="SaveToServerDialog__tabs" role="tablist" aria-label="视图切换">
              <button
                className={`SaveToServerDialog__tab ${viewMode === "save" ? "active" : ""}`}
                onClick={handleSwitchToSaveMode}
                type="button"
                role="tab"
                aria-selected={viewMode === "save"}
                aria-controls="save-panel"
                id="save-tab"
                style={{
                  minHeight: "44px",
                  padding: "12px 24px"
                }}
              >
                💾 保存绘图
              </button>
              <button
                className={`SaveToServerDialog__tab ${viewMode === "browse" ? "active" : ""}`}
                onClick={handleViewFiles}
                type="button"
                role="tab"
                aria-selected={viewMode === "browse"}
                aria-controls="browse-panel"
                id="browse-tab"
                style={{
                  minHeight: "44px",
                  padding: "12px 24px"
                }}
              >
                📁 浏览文件
              </button>
            </div>

            {/* 保存模式面板 */}
            {viewMode === "save" && (
              <div id="save-panel" role="tabpanel" aria-labelledby="save-tab">
                
                {/* 文件夹选择 */}
                <div className="SaveToServerDialog__section">
                  <label className="SaveToServerDialog__label">
                    选择保存目录 <span className="required" aria-hidden="true">*</span>
                    <span className="visually-hidden">（必填）</span>
                  </label>
                  
                  {/* 当前路径显示 */}
                  {selectedFolder && (
                    <div className="SaveToServerDialog__selected-path">
                      当前选择：📁 <strong>{selectedFolder}</strong>
                      <button
                        type="button"
                        className="SaveToServerDialog__clear-selection"
                        onClick={() => {
                          setSelectedFolder("");
                          loadRootFolders();
                        }}
                        title="清除选择"
                        aria-label="清除选择"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  
                  {/* 文件夹浏览器 */}
                  <div className="SaveToServerDialog__folder-browser">
                    {/* 路径导航 */}
                    {currentPath && (
                      <div className="SaveToServerDialog__breadcrumb">
                        <button
                          className="SaveToServerDialog__back-btn"
                          onClick={() => {
                            const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
                            loadFoldersAtPath(parentPath);
                          }}
                          disabled={isLoading}
                          title="返回上级"
                          type="button"
                          aria-label="返回上级文件夹"
                        >
                          {BackIcon}
                        </button>
                        <span className="SaveToServerDialog__path">
                          📁 {currentPath || "根目录"}
                        </span>
                      </div>
                    )}
                    
                    {/* 文件夹列表 */}
                    <div className="SaveToServerDialog__file-list" style={{ maxHeight: "200px" }}>
                      {isLoading ? (
                        <div className="SaveToServerDialog__loading" aria-busy="true">
                          <div className="spinner"></div>
                          <span>加载中...</span>
                        </div>
                      ) : folders.length === 0 ? (
                        <div className="SaveToServerDialog__empty">
                          <div className="empty-icon" aria-hidden="true">📭</div>
                          <p>此目录为空</p>
                        </div>
                      ) : (
                        <>
                          {/* 根目录选项 */}
                          {!currentPath && (
                            <div
                              className={`SaveToServerDialog__file-item ${!selectedFolder ? "selected" : ""}`}
                              onClick={() => setSelectedFolder("")}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  setSelectedFolder("");
                                }
                              }}
                              role="listitem"
                              tabIndex={0}
                              aria-label="选择根目录"
                              style={{
                                minHeight: "48px",
                                padding: "12px 16px",
                                cursor: "pointer"
                              }}
                            >
                              <span className="SaveToServerDialog__file-icon" aria-hidden="true">
                                {FolderIcon}
                              </span>
                              <span className="SaveToServerDialog__file-name">
                                📂 根目录
                              </span>
                              {selectedFolder === "" && (
                                <span className="SaveToServerDialog__check">✓</span>
                              )}
                            </div>
                          )}
                          
                          {/* 子文件夹列表 */}
                          {folders.map((folder) => (
                            <div
                              key={folder.path}
                              className={`SaveToServerDialog__file-item ${selectedFolder === folder.path ? "selected" : ""}`}
                              onClick={() => {
                                // 点击文件夹时，可以选择或进入
                                if (selectedFolder === folder.path) {
                                  // 已选中，进入文件夹
                                  loadFoldersAtPath(folder.path);
                                } else {
                                  // 未选中，选择此文件夹
                                  setSelectedFolder(folder.path);
                                }
                              }}
                              onDoubleClick={() => {
                                // 双击进入文件夹
                                loadFoldersAtPath(folder.path);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  loadFoldersAtPath(folder.path);
                                } else if (e.key === " ") {
                                  setSelectedFolder(folder.path);
                                }
                              }}
                              role="listitem"
                              tabIndex={0}
                              aria-label={`文件夹 ${folder.name}`}
                              style={{
                                minHeight: "48px",
                                padding: "12px 16px",
                                cursor: "pointer"
                              }}
                            >
                              <span className="SaveToServerDialog__file-icon" aria-hidden="true">
                                {FolderIcon}
                              </span>
                              <span className="SaveToServerDialog__file-name">
                                📁 {folder.name}
                              </span>
                              {selectedFolder === folder.path && (
                                <span className="SaveToServerDialog__check">✓</span>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* 新建文件夹 */}
                  <div className="SaveToServerDialog__folder-actions">
                    <button
                      type="button"
                      className="SaveToServerDialog__action-btn"
                      onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                      disabled={isSaving}
                      title="新建文件夹"
                      aria-label={showNewFolderInput ? "取消新建文件夹" : "新建文件夹"}
                      aria-expanded={showNewFolderInput}
                      style={{
                        minHeight: "44px",
                        padding: "8px 16px"
                      }}
                    >
                      {PlusIcon} 新建文件夹
                    </button>
                  </div>
                  <p id="folder-help" className="visually-hidden">
                    选择要保存到的文件夹，或点击加号按钮创建新文件夹
                  </p>

                  {/* 新建文件夹输入框 */}
                  {showNewFolderInput && (
                    <div className="SaveToServerDialog__new-folder" role="group" aria-label="新建文件夹">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="输入文件夹名称..."
                        className="SaveToServerDialog__input"
                        disabled={isCreatingFolder}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCreateFolder();
                          }
                        }}
                        aria-label="新文件夹名称"
                        aria-required="true"
                        style={{ minHeight: "44px" }}
                      />
                      <button
                        type="button"
                        className="SaveToServerDialog__create-btn"
                        onClick={handleCreateFolder}
                        disabled={isCreatingFolder || !newFolderName.trim()}
                        aria-busy={isCreatingFolder}
                        style={{ minHeight: "44px" }}
                      >
                        {isCreatingFolder ? "⏳ 创建中..." : "✨ 创建"}
                      </button>
                    </div>
                  )}
                </div>

                {/* 文件名输入 */}
                <div className="SaveToServerDialog__section">
                  <label className="SaveToServerDialog__label" htmlFor="filename-input">
                    文件名
                    <span className="visually-hidden">（必填）</span>
                  </label>
                  <input
                    id="filename-input"
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="例如：我的设计草图"
                    className="SaveToServerDialog__input"
                    disabled={isSaving}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSave();
                      }
                    }}
                    aria-required="true"
                    aria-describedby="filename-help"
                    style={{ minHeight: "44px" }}
                  />
                  <p id="filename-help" className="visually-hidden">
                    输入文件名后按回车键可快速保存
                  </p>
                </div>

                {/* 结果提示 */}
                {result && (
                  <div
                    className={`SaveToServerDialog__result ${
                      result.success
                        ? "SaveToServerDialog__result--success"
                        : "SaveToServerDialog__result--error"
                    }`}
                    role="alert"
                    aria-live="polite"
                  >
                    {result.success ? `✅ ${result.message}` : `❌ ${result.error}`}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="SaveToServerDialog__actions" role="group" aria-label="对话框操作">
                  <Button
                    onSelect={handleCloseDialog}
                    onClick={handleCloseDialog}
                    disabled={isSaving}
                    style={{ minHeight: "44px", padding: "12px 24px" }}
                  >
                    取消
                  </Button>
                  <Button
                    onSelect={handleSave}
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{ minHeight: "44px", padding: "12px 24px" }}
                    aria-busy={isSaving}
                  >
                    {isSaving ? "⏳ 保存中..." : "💾 保存"}
                  </Button>
                </div>
              </div>
            )}

            {/* 浏览模式面板 */}
            {viewMode === "browse" && (
              <div id="browse-panel" role="tabpanel" aria-labelledby="browse-tab">
                
                {/* 路径导航 */}
                <div className="SaveToServerDialog__breadcrumb" role="navigation" aria-label="文件夹路径">
                  <button
                    className="SaveToServerDialog__back-btn"
                    onClick={handleBackToParent}
                    disabled={!currentPath}
                    title="返回上级"
                    type="button"
                    aria-label="返回上级文件夹"
                    style={{
                      minHeight: "44px",
                      minWidth: "44px",
                      padding: "12px"
                    }}
                  >
                    {BackIcon}
                  </button>
                  <span className="SaveToServerDialog__path" aria-current="location">
                    📁 {currentPath || "根目录"}
                  </span>
                </div>

                {/* 文件列表 */}
                <div className="SaveToServerDialog__file-list" role="list" aria-label="文件和文件夹列表">
                  {isLoading ? (
                    <div className="SaveToServerDialog__loading" aria-busy="true" aria-live="polite">
                      <div className="spinner" role="status"></div>
                      <span>加载中...</span>
                    </div>
                  ) : folders.length === 0 && serverFiles.length === 0 ? (
                    <div className="SaveToServerDialog__empty" role="status">
                      <div className="empty-icon" aria-hidden="true">📭</div>
                      <p>此目录为空</p>
                    </div>
                  ) : (
                    <>
                      {/* 文件夹列表 */}
                      {folders.map((folder) => (
                        <div
                          key={folder.path}
                          className="SaveToServerDialog__file-item"
                          onClick={() => handleNavigateFolder(folder.path)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleNavigateFolder(folder.path);
                            }
                          }}
                          role="listitem"
                          tabIndex={0}
                          aria-label={`文件夹 ${folder.name}`}
                          style={{
                            minHeight: "48px",
                            padding: "12px 16px"
                          }}
                        >
                          <span className="SaveToServerDialog__file-icon" aria-hidden="true">
                            {FolderIcon}
                          </span>
                          <span className="SaveToServerDialog__file-name">
                            {folder.name}
                          </span>
                        </div>
                      ))}

                      {/* 文件列表 */}
                      {serverFiles.map((file) => (
                        <div
                          key={file.path}
                          className="SaveToServerDialog__file-item"
                          role="listitem"
                          style={{
                            minHeight: "48px",
                            padding: "12px 16px"
                          }}
                        >
                          <span className="SaveToServerDialog__file-icon" aria-hidden="true">
                            {FileIcon}
                          </span>
                          <span className="SaveToServerDialog__file-name">
                            {file.name}
                          </span>
                          <span className="SaveToServerDialog__file-meta">
                            {formatFileSize(file.size)} · {formatDate(file.modifiedAt)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* 关闭按钮 */}
                <div className="SaveToServerDialog__actions" role="group" aria-label="对话框操作">
                  <Button onSelect={handleCloseDialog} onClick={handleCloseDialog}>
                    关闭
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
};
