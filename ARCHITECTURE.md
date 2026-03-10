# Excalidraw 项目架构说明

## 项目概述

Excalidraw 是一个开源的虚拟手绘风格白板应用，采用 **Monorepo** 架构，包含核心绘图库和完整的 Web 应用。项目使用 React、TypeScript 构建，支持实时协作、端到端加密和本地优先存储。

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    excalidraw-app (Web应用)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │   UI组件层   │  │  状态管理层  │  │    数据持久层      │  │
│  │             │  │             │  │                   │  │
│  │- App.tsx    │  │- Jotai      │  │- LocalStorage    │  │
│  │- 组件       │  │- React状态  │  │- IndexedDB       │  │
│  └─────────────┘  └─────────────┘  │- Firebase        │  │
│                                     │- Server API      │  │
│                                     └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   │ 导入/使用
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│              @excalidraw/excalidraw (核心库)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  渲染引擎    │  │  元素管理    │  │   工具系统   │          │
│  │             │  │             │  │             │          │
│  │- Canvas渲染 │  │- CRUD操作   │  │- 选择工具    │          │
│  │- SVG导出    │  │- 历史记录   │  │- 绘制工具    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
         │                │                │
         │ 依赖           │ 依赖           │ 依赖
         ▼                ▼                ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
│ @excalidraw/    │ │ @excalidraw/│ │ @excalidraw/│
│ element         │ │ math        │ │ common      │
│ (元素逻辑)       │ │ (数学计算)   │ │ (公共工具)   │
└─────────────────┘ └─────────────┘ └─────────────┘
```

## 核心组件依赖关系

### 1. 基础层 (Foundation Layer)

#### @excalidraw/common
- **职责**: 提供公共工具函数、常量、类型定义
- **主要模块**:
  - `utils.ts` - 通用工具函数
  - `colors.ts` - 颜色处理
  - `constants.ts` - 常量定义
  - `keys.ts` - 键盘事件处理
  - `emitter.ts` - 事件发射器
- **依赖**: 无 (纯工具库)

#### @excalidraw/math
- **职责**: 2D 数学计算、几何运算
- **主要模块**:
  - `point.ts` - 点坐标运算
  - `vector.ts` - 向量运算
  - `line.ts` - 线段计算
  - `curve.ts` - 曲线计算
  - `rectangle.ts` - 矩形运算
  - `ellipse.ts` - 椭圆计算
- **依赖**: `@excalidraw/common`

### 2. 核心层 (Core Layer)

#### @excalidraw/element
- **职责**: 元素建模、几何计算、元素操作
- **主要模块**:
  - `types.ts` - 元素类型定义
  - `newElement.ts` - 创建新元素
  - `mutateElement.ts` - 修改元素
  - `resizeElements.ts` - 缩放元素
  - `dragElements.ts` - 拖拽元素
  - `binding.ts` - 箭头绑定
  - `collision.ts` - 碰撞检测
  - `renderElement.ts` - 元素渲染逻辑
- **依赖**: `@excalidraw/common`, `@excalidraw/math`

#### @excalidraw/utils
- **职责**: 工具函数、文件处理、导出功能
- **主要模块**:
  - 图片处理
  - PNG/SVG 导出
  - 序列化/反序列化
- **依赖**: 多个外部库 (pako, roughjs, perfect-freehand 等)

### 3. 主库层 (Main Library)

#### @excalidraw/excalidraw
- **职责**: 主编辑器组件、UI、交互逻辑
- **主要模块**:
  - `index.tsx` - 主入口，导出 Excalidraw 组件
  - `components/App.tsx` - 主应用组件
  - `components/` - UI 组件
  - `scene/` - 场景管理
  - `renderer/` - 渲染器
  - `actions/` - 用户操作
  - `hooks/` - React hooks
- **依赖**:
  - `@excalidraw/common`
  - `@excalidraw/element`
  - `@excalidraw/math`
  - `@excalidraw/utils`
  - 外部库: jotai, roughjs, radix-ui 等

### 4. 应用层 (Application Layer)

#### excalidraw-app
- **职责**: 完整的 Web 应用，包含协作、存储、UI 定制
- **主要模块**:
  - `App.tsx` - 应用主组件
  - `components/` - 应用特定组件
  - `data/` - 数据持久化 (Firebase, LocalStorage)
  - `collab/` - 实时协作
  - `app-jotai.ts` - 全局状态
- **依赖**:
  - `@excalidraw/excalidraw`
  - Firebase (实时协作)
  - Jotai (状态管理)

## 组件交互流程

### 1. 用户交互流程

```
用户操作 (鼠标/键盘)
    ↓
Excalidraw 组件 (事件处理)
    ↓
Actions (操作分发)
    ↓
Element 模块 (修改元素)
    ↓
History (记录历史)
    ↓
Renderer (重新渲染)
    ↓
Canvas (视觉更新)
```

### 2. 数据流

```
App State (Jotai)
    ↓
Elements Array (元素列表)
    ↓
Scene (场景管理)
    ↓
Renderer (渲染树)
    ↓
Canvas (实际绘制)
```

### 3. 协作同步流程

```
本地操作
    ↓
生成操作记录
    ↓
Firebase Realtime DB
    ↓
其他客户端接收
    ↓
Reconcile Elements (合并元素)
    ↓
更新本地状态
```

## 关键技术点

### 1. 元素系统
- 所有图形都是 `ExcalidrawElement` 类型
- 支持: 矩形、圆形、菱形、箭头、线条、手绘、文本、图片
- 每个元素有唯一 ID、版本号、几何属性、样式属性

### 2. 渲染系统
- 使用 Canvas 2D API 进行绘制
- 使用 Rough.js 实现手绘风格
- 支持 SVG 导出
- 分层渲染: 网格 → 元素 → 选择框 → UI

### 3. 状态管理
- 使用 Jotai 进行原子化状态管理
- 主要状态: elements, appState, files, collaborators
- 支持时间旅行 (撤销/重做)

### 4. 协作机制
- 基于 Firebase Realtime Database
- 使用 CRDT (无冲突复制数据类型) 思想
- 操作转换和版本合并
- 端到端加密 (E2EE)

### 5. 性能优化
- 虚拟化渲染 (只渲染视口内元素)
- 元素版本控制 (避免不必要的重绘)
- 批量更新和防抖
- Web Workers 处理耗时任务

## 外部依赖

### 核心依赖
- **React 19**: UI 框架
- **TypeScript**: 类型系统
- **Vite**: 构建工具
- **Jotai**: 状态管理
- **Rough.js**: 手绘风格渲染
- **Radix UI**: 无样式组件

### 功能依赖
- **Firebase**: 实时协作、存储
- **Socket.io**: 实时通信
- **i18next**: 国际化
- **pako**: 数据压缩
- **perfect-freehand**: 手绘算法

## 开发建议

### 修改元素逻辑
- 位置: `packages/element/src/`
- 主要文件: `mutateElement.ts`, `resizeElements.ts`, `dragElements.ts`

### 添加新工具
- 位置: `packages/excalidraw/actions/`
- 需要: 工具类、光标、事件处理、渲染逻辑

### 修改渲染
- 位置: `packages/excalidraw/renderer/`
- 主要文件: `renderElement.ts`, `renderScene.ts`

### 添加 UI 组件
- 位置: `packages/excalidraw/components/`
- 使用 Radix UI 作为基础

### 修改协作逻辑
- 位置: `excalidraw-app/collab/`
- 主要文件: `Collab.tsx`, `reconcileElements.ts`

## 部署架构

```
┌─────────────────┐
│   CDN / Vercel  │  (静态资源)
└────────┬────────┘
         │
┌────────▼────────┐
│ excalidraw.com  │  (前端应用)
└────────┬────────┘
         │ API 调用
┌────────▼────────┐
│  Server API     │  (可选后端)
│  (Node.js)      │
└────────┬────────┘
         │ 文件存储
┌────────▼────────┐
│  File System    │  (/usr/local/lib/excalidram/)
└─────────────────┘
```

协作模式:
```
┌─────────────┐     ┌─────────────┐
│  Client 1   │     │  Client 2   │
│  (Browser)  │     │  (Browser)  │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └────────┬──────────┘
                │
       ┌────────▼────────┐
       │  Firebase RTDB   │
       │  (Real-time)     │
       └──────────────────┘
```

## 总结

Excalidraw 采用分层架构设计，从底层数学计算到上层 UI 交互，各层职责清晰。通过 Monorepo 管理，实现了核心库与应用分离，既支持作为 npm 包集成，也提供了完整的 Web 应用体验。协作功能基于 Firebase 实现，支持实时同步和端到端加密。
