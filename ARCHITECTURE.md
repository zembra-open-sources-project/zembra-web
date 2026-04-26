# ARCHITECTURE

## 共享数据契约

- 项目群共享数据表契约由 `vendor/zembra-schema` submodule 提供。
- 本仓库只引用共享契约，不复制维护数据表设计正文。
- 前端架构以 UI、状态管理、API Client 和本地缓存分层为主，数据库细节隔离在服务端或数据访问实现之后。
- SQLite 阶段和后续 Supabase 阶段需要保持同一套前端业务接口，避免 UI 层感知数据库提供方变化。
