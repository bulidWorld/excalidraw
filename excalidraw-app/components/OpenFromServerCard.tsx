import React, { useState, useCallback, useEffect } from "react";
import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { Button } from "@excalidraw/excalidraw/components/Button";

import { restoreElements, restoreAppState } from "@excalidraw/excalidraw/data/restore";
import { cleanAppStateForExport } from "@excalidraw/excalidraw/appState";
import { calculateScrollCenter } from "@excalidraw/excalidraw/scene";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import {
  getFolders,
  loadFromServer,
  type FolderInfo,
  type ServerFile,
} from "../data/serverStorage";

import "./OpenFromServerCard.scss";

interface OpenFromServerCardProps {
  excalidrawAPI: ExcalidrawImperativeAPI;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * OpenFromServerCard - 从服务器打开文件组件
 * 复用 SaveToServerCard 的文件浏览逻辑
 */
export const OpenFromServerCard: React.FC<OpenFromServerCardProps> = ({
  excalidrawAPI,
  isOpen,
  onClose,
}) => {
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [serverFiles, setFiles] = useState<ServerFile[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<ServerFile | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // 加载文件夹和文件列表
  const loadFolders = useCallback(async (path = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getFolders(path);
      if (result.success) {
        setFolders(result.folders || []);
        setFiles(result.files || []);
        setCurrentPath(result.currentPath || "");
      } else {
        setError(result.error || "加载失败");
      }
    } catch (err: any) {
      setError(err.message || "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 对话框打开时加载数据
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setError(null);
      setCurrentPath("");
      loadFolders("");
    }
  }, [isOpen, loadFolders]);

  const handleNavigateFolder = (folderPath: string) => {
    setSelectedFile(null);
    loadFolders(folderPath);
  };

  const handleBackToParent = () => {
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
    loadFolders(parentPath);
  };

  const handleSelectFile = (file: ServerFile) => {
    setSelectedFile(file);
  };

  // 从服务器加载文件并更新画布
  const handleOpenFile = async () => {
    if (!selectedFile) return;

    setIsLoadingFile(true);
    setError(null);

    try {
      const result = await loadFromServer(selectedFile.path);
      if (!result.success || !result.data) {
        setError(result.error || "加载文件失败");
        setIsLoadingFile(false);
        return;
      }

      const data = result.data;
      const appState = excalidrawAPI.getAppState();

      // 恢复元素和应用状态
      const elements = restoreElements(data.elements || [], null, {
        repairBindings: true,
        deleteInvisibleElements: true,
      });

      const restoredAppState = restoreAppState(
        {
          theme: appState?.theme,
          fileHandle: null,
          ...cleanAppStateForExport(data.appState || {}),
          ...(appState ? calculateScrollCenter(data.elements || [], appState) : {}),
        },
        appState,
      );

      // 更新画布
      excalidrawAPI.updateScene({
        elements,
        appState: restoredAppState,
      });

      // 设置文件名
      const fileName = selectedFile.name.replace(/\.excalidraw$/, "");
      excalidrawAPI.updateScene({
        appState: { name: fileName },
      });

      onClose();
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || "加载文件失败");
    } finally {
      setIsLoadingFile(false);
    }
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

  // 图标
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

  if (!isOpen) return null;

  return (
    <Dialog
      title="从服务器打开"
      onCloseRequest={onClose}
      size="wide"
      closeOnClickOutside={!isLoadingFile}
    >
      <div className="OpenFromServerDialog" role="dialog" aria-modal="true">

        {/* 路径导航 */}
        <div className="OpenFromServerDialog__breadcrumb" role="navigation" aria-label="文件夹路径">
          <button
            className="OpenFromServerDialog__back-btn"
            onClick={handleBackToParent}
            disabled={!currentPath}
            title="返回上级"
            type="button"
            aria-label="返回上级文件夹"
          >
            {BackIcon}
          </button>
          <span className="OpenFromServerDialog__path" aria-current="location">
            📁 {currentPath || "根目录"}
          </span>
        </div>

        {/* 文件列表 */}
        <div className="OpenFromServerDialog__file-list" role="list" aria-label="文件和文件夹列表">
          {isLoading ? (
            <div className="OpenFromServerDialog__loading" aria-busy="true">
              <div className="spinner" role="status"></div>
              <span>加载中...</span>
            </div>
          ) : folders.length === 0 && serverFiles.length === 0 ? (
            <div className="OpenFromServerDialog__empty" role="status">
              <div className="empty-icon" aria-hidden="true">📭</div>
              <p>此目录为空</p>
            </div>
          ) : (
            <>
              {/* 文件夹列表 */}
              {folders.map((folder) => (
                <div
                  key={folder.path}
                  className="OpenFromServerDialog__file-item"
                  onClick={() => handleNavigateFolder(folder.path)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleNavigateFolder(folder.path);
                    }
                  }}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`文件夹 ${folder.name}`}
                >
                  <span className="OpenFromServerDialog__file-icon" aria-hidden="true">
                    {FolderIcon}
                  </span>
                  <span className="OpenFromServerDialog__file-name">
                    📁 {folder.name}
                  </span>
                </div>
              ))}

              {/* 文件列表 */}
              {serverFiles.map((file) => (
                <div
                  key={file.path}
                  className={`OpenFromServerDialog__file-item ${selectedFile?.path === file.path ? "selected" : ""}`}
                  onClick={() => handleSelectFile(file)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleSelectFile(file);
                    }
                  }}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`文件 ${file.name}`}
                >
                  <span className="OpenFromServerDialog__file-icon" aria-hidden="true">
                    {FileIcon}
                  </span>
                  <span className="OpenFromServerDialog__file-name">
                    {file.name}
                  </span>
                  <span className="OpenFromServerDialog__file-meta">
                    {formatFileSize(file.size)} · {formatDate(file.modifiedAt)}
                  </span>
                  {selectedFile?.path === file.path && (
                    <span className="OpenFromServerDialog__check">✓</span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="OpenFromServerDialog__error" role="alert">
            ❌ {error}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="OpenFromServerDialog__actions" role="group" aria-label="对话框操作">
          <Button
            onSelect={onClose}
            onClick={onClose}
            disabled={isLoadingFile}
          >
            取消
          </Button>
          <Button
            onSelect={handleOpenFile}
            onClick={handleOpenFile}
            disabled={!selectedFile || isLoadingFile}
          >
            {isLoadingFile ? "⏳ 打开中..." : "📂 打开"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};