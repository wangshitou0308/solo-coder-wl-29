## 1. 架构设计
```mermaid
graph TD
    UI["React UI 层<br/>(组件/页面/路由)"] --> STATE["Zustand 状态管理"]
    STATE --> DB["IndexedDB 数据层<br/>(idb 封装)"]
    DB --> STORES["数据存储对象<br/>日记/鸟种观察/图鉴/装备"]
    UI --> UTILS["工具函数<br/>PDF导出/JSON备份/日期处理"]
    UI --> CHARTS["图表组件<br/>(recharts)"]
    SEED["预置鸟类数据种子"] --> DB
```

## 2. 技术描述
- 前端框架：React@18 + TypeScript + Vite
- 路由：react-router-dom@6
- 状态管理：zustand
- 样式：tailwindcss@3
- 本地数据库：IndexedDB（idb 库封装）
- 图表：recharts
- PDF导出：jsPDF + html2canvas
- 图标：lucide-react
- 初始化工具：vite-init react-ts 模板

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 首页仪表盘 |
| /journal | 观鸟日记列表 |
| /journal/new | 新建观鸟日记 |
| /journal/:id | 查看/编辑日记详情 |
| /species | 鸟类图鉴首页（目列表） |
| /species/:orderId | 某目下的科列表 |
| /species/:orderId/:familyId | 某科下的属/种列表 |
| /species/:orderId/:familyId/:speciesId | 物种详情页 |
| /statistics | 统计分析 |
| /equipment | 装备管理 |
| /export | 数据导出 |

## 4. 数据模型

### 4.1 数据模型ER图
```mermaid
erDiagram
    BIRDING_JOURNAL ||--o{ BIRD_OBSERVATION : contains
    BIRD_SPECIES ||--o{ BIRD_OBSERVATION : refers_to
    BIRD_SPECIES }o--|| BIRD_GENUS : belongs_to
    BIRD_GENUS }o--|| BIRD_FAMILY : belongs_to
    BIRD_FAMILY }o--|| BIRD_ORDER : belongs_to
    EQUIPMENT ||--o{ EQUIPMENT_USAGE : has

    BIRDING_JOURNAL {
        string id PK
        string location
        string latitude
        string longitude
        string weather
        string habitat_type
        string companions
        datetime start_time
        datetime end_time
        text notes
        datetime created_at
        datetime updated_at
    }

    BIRD_OBSERVATION {
        string id PK
        string journal_id FK
        string species_id FK
        int count
        string behavior
        string photo_url
        text notes
        datetime created_at
    }

    BIRD_ORDER {
        string id PK
        string name_cn
        string name_latin
    }

    BIRD_FAMILY {
        string id PK
        string order_id FK
        string name_cn
        string name_latin
    }

    BIRD_GENUS {
        string id PK
        string family_id FK
        string name_cn
        string name_latin
    }

    BIRD_SPECIES {
        string id PK
        string genus_id FK
        string name_cn
        string name_latin
        string common_name
        string habitat_type
        string residence_type
        string conservation_status
        string description
        string image_url
        boolean is_common
    }

    USER_SPECIES_RECORD {
        string species_id PK
        datetime first_observed_at
        string first_location
        int total_observations
    }

    EQUIPMENT {
        string id PK
        string type
        string brand
        string model
        date purchase_date
        int usage_count
        int shutter_count
        text notes
        datetime created_at
    }
```

### 4.2 IndexedDB Store 定义
- **bird_orders**：鸟类目数据（预置数据，keyPath: id）
- **bird_families**：鸟类科数据（预置数据，keyPath: id，索引: order_id）
- **bird_genera**：鸟类属数据（预置数据，keyPath: id，索引: family_id）
- **bird_species**：鸟类物种数据（预置数据，keyPath: id，索引: genus_id, habitat_type, residence_type）
- **journals**：观鸟日记（用户数据，keyPath: id，索引: created_at, location）
- **observations**：鸟种观察记录（用户数据，keyPath: id，索引: journal_id, species_id）
- **user_species_records**：用户图鉴记录（用户数据，keyPath: species_id）
- **equipment**：装备管理（用户数据，keyPath: id）

## 5. 核心模块划分
```
src/
├── components/         # 可复用UI组件
│   ├── Layout/         # 布局组件（导航、侧边栏、容器）
│   ├── Journal/        # 日记相关组件
│   ├── Species/        # 图鉴相关组件
│   ├── Stats/          # 统计相关组件
│   ├── Equipment/      # 装备相关组件
│   └── Common/         # 通用组件（按钮、卡片、表单）
├── pages/              # 页面组件
├── hooks/              # 自定义hooks（useIndexedDB等）
├── stores/             # zustand状态管理
├── utils/              # 工具函数
│   ├── db.ts           # IndexedDB封装
│   ├── seed.ts         # 预置鸟类数据
│   ├── date.ts         # 日期处理
│   ├── pdf.ts          # PDF导出
│   └── backup.ts       # JSON备份
├── types/              # TypeScript类型定义
└── assets/             # 静态资源
```
