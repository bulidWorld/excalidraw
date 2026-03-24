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
} from "../data/serverStorage";

import "./SaveToServerCard.scss";

interface SaveToServerCardProps {
  elements: readonly NonDeletedExcalidrawElement[];
  appState: UIAppState;
  files: BinaryFiles;
}

export const SaveToServerCard: React.FC<SaveToServerCardProps> = ({
  elements,
  appState,
  files,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<SaveToServerResult | null>(null);
  const [filename, setFilename] = useState("");
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // 加载文件夹列表
  const loadFolders = useCallback(async () => {
    setIsLoadingFolders(true);
    const result = await getFolders();
    if (result.success && result.folders) {
      setFolders(result.folders);
    }
    setIsLoadingFolders(false);
  }, []);

  // 打开对话框时加载数据
  const handleOpenDialog = () => {
    setFilename(appState.name || "");
    setSelectedFolder("");
    setResult(null);
    setShowNewFolderInput(false);
    setNewFolderName("");
    setIsDialogOpen(true);
    loadFolders();
  };

  const handleCloseDialog = () => {
    if (isSaving) return;
    setIsDialogOpen(false);
    setResult(null);
  };

  const handleSave = async () => {
    // 根目录隐藏，必须选择一个子目录
    if (!selectedFolder) {
      setResult({
        success: false,
        error: "请选择一个保存目录（根目录不可用）",
      });
      return;
    }

    setIsSaving(true);
    setResult(null);

    const name = filename.trim() || "untitled";
    const saveResult = await saveToServer(
      elements,
      appState,
      files,
      name,
      selectedFolder,
    );

    setResult(saveResult);
    setIsSaving(false);

    // 保存成功后关闭对话框
    if (saveResult.success) {
      setTimeout(() => {
        setIsDialogOpen(false);
      }, 1000);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    const result = await createFolder(newFolderName.trim(), "");

    if (result.success) {
      await loadFolders();
      setSelectedFolder(result.path || newFolderName.trim());
      setShowNewFolderInput(false);
      setNewFolderName("");
    } else {
      setResult({
        success: false,
        error: result.error || "创建文件夹失败",
      });
    }

    setIsCreatingFolder(false);
  };

  // 服务器图标
  const ServerIcon = (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
      <line x1="6" y1="6" x2="6.01" y2="6"></line>
      <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
  );

  // 文件夹图标
  const FolderIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  );

  return (
    <>
      <Card color="primary">
        <div className="Card-icon">{ServerIcon}</div>
        <h2>保存到服务器</h2>
        <div className="Card-details">
          将文件保存到远程服务器
        </div>
        <ToolButton
          className="Card-button"
          type="button"
          title="保存到服务器"
          aria-label="保存到服务器"
          showAriaLabel={true}
          onClick={handleOpenDialog}
        />
      </Card>

      {isDialogOpen && (
        <Dialog
          title="保存到服务器"
          onCloseRequest={handleCloseDialog}
          size="small"
          closeOnClickOutside={!isSaving}
        >
          <div className="SaveToServerDialog">
            {/* 目录选择 */}
            <div className="SaveToServerDialog__section">
              <label className="SaveToServerDialog__label">
                选择保存目录 <span className="required">*</span>
              </label>
              <div className="SaveToServerDialog__folder-row">
                <select
                  className="SaveToServerDialog__select"
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  disabled={isSaving || isLoadingFolders}
                >
                  <option value="">-- 请选择目录 --</option>
                  {folders.map((folder) => (
                    <option key={folder.path} value={folder.path}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="SaveToServerDialog__folder-btn"
                  onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                  disabled={isSaving}
                  title="新建文件夹"
                >
                  {FolderIcon}
                </button>
              </div>

              {showNewFolderInput && (
                <div className="SaveToServerDialog__new-folder">
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
                  />
                  <button
                    type="button"
                    className="SaveToServerDialog__create-btn"
                    onClick={handleCreateFolder}
                    disabled={isCreatingFolder || !newFolderName.trim()}
                  >
                    {isCreatingFolder ? "创建中..." : "创建"}
                  </button>
                </div>
              )}
            </div>

            {/* 文件名 */}
            <div className="SaveToServerDialog__section">
              <label className="SaveToServerDialog__label">文件名</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="输入文件名..."
                className="SaveToServerDialog__input"
                disabled={isSaving}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
              />
            </div>

            {/* 结果提示 */}
            {result && (
              <div
                className={`SaveToServerDialog__result ${
                  result.success
                    ? "SaveToServerDialog__result--success"
                    : "SaveToServerDialog__result--error"
                }`}
              >
                {result.success ? `✓ ${result.message}` : `✗ ${result.error}`}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="SaveToServerDialog__actions">
              <Button
                onSelect={handleCloseDialog}
                onClick={handleCloseDialog}
                disabled={isSaving}
              >
                取消
              </Button>
              <Button
                onSelect={handleSave}
                onClick={handleSave}
                disabled={isSaving || !selectedFolder}
              >
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
};