import { serializeAsJSON } from "@excalidraw/excalidraw/data/json";

import type {
  ExcalidrawElement,
} from "@excalidraw/element/types";
import type {
  AppState,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";

// 服务器 API 地址
const SERVER_URL = import.meta.env.VITE_APP_SERVER_URL || "http://localhost:3002";

export interface SaveToServerResult {
  success: boolean;
  message?: string;
  filename?: string;
  filePath?: string;
  error?: string;
}

export interface ServerFile {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
}

export interface ServerFilesResult {
  success: boolean;
  files?: ServerFile[];
  error?: string;
}

/**
 * 保存绘图到服务器
 */
export const saveToServer = async (
  elements: readonly ExcalidrawElement[],
  appState: Partial<AppState>,
  files: BinaryFiles,
  name: string,
  folder = "",
): Promise<SaveToServerResult> => {
  try {
    const serializedData = serializeAsJSON(elements, appState, files, "local");
    const data = JSON.parse(serializedData);

    const response = await fetch(`${SERVER_URL}/api/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "untitled", data, folder }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Failed to save file" };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message,
      filename: result.filename,
      filePath: result.filePath,
    };
  } catch (error: any) {
    console.error("Error saving to server:", error);
    return { success: false, error: error.message || "Failed to save file" };
  }
};

/**
 * 从服务器加载文件列表
 */
export const getServerFiles = async (folder = ""): Promise<ServerFilesResult> => {
  try {
    const url = folder
      ? `${SERVER_URL}/api/files?folder=${encodeURIComponent(folder)}`
      : `${SERVER_URL}/api/files`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Failed to get files" };
    }

    const result = await response.json();
    return { success: true, files: result.files };
  } catch (error: any) {
    console.error("Error getting server files:", error);
    return { success: false, error: error.message || "Failed to get files" };
  }
};

/**
 * 获取文件夹列表
 */
export interface FolderInfo {
  name: string;
  path: string;
}

export interface FoldersResult {
  success: boolean;
  folders?: FolderInfo[];
  files?: ServerFile[];
  currentPath?: string;
  error?: string;
}

export const getFolders = async (subPath = ""): Promise<FoldersResult> => {
  try {
    const url = subPath
      ? `${SERVER_URL}/api/folders?path=${encodeURIComponent(subPath)}`
      : `${SERVER_URL}/api/folders`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Failed to get folders" };
    }

    const result = await response.json();
    return {
      success: true,
      folders: result.folders,
      files: result.files,
      currentPath: result.currentPath,
    };
  } catch (error: any) {
    console.error("Error getting folders:", error);
    return { success: false, error: error.message || "Failed to get folders" };
  }
};

/**
 * 创建文件夹
 */
export const createFolder = async (
  name: string,
  parentPath = "",
): Promise<{ success: boolean; error?: string; path?: string }> => {
  try {
    const response = await fetch(`${SERVER_URL}/api/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentPath }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Failed to create folder" };
    }

    const result = await response.json();
    return { success: true, path: result.path };
  } catch (error: any) {
    console.error("Error creating folder:", error);
    return { success: false, error: error.message || "Failed to create folder" };
  }
};

/**
 * 从服务器加载指定文件
 */
export const loadFromServer = async (
  filename: string,
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await fetch(`${SERVER_URL}/api/files/${encodeURIComponent(filename)}`);

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Failed to load file" };
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error("Error loading from server:", error);
    return { success: false, error: error.message || "Failed to load file" };
  }
};

/**
 * 从服务器删除文件
 */
export const deleteServerFile = async (
  filename: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${SERVER_URL}/api/files/${encodeURIComponent(filename)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || "Failed to delete file" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting server file:", error);
    return { success: false, error: error.message || "Failed to delete file" };
  }
};