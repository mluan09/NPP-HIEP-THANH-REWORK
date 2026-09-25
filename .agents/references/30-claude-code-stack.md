# Bảng Danh Mục 30 Công Cụ & Kỹ Năng (30-Claude-Code-Map) Trong Antigravity

Tài liệu này tổng hợp chi tiết toàn bộ 30 công cụ từ bức ảnh `30 thứ nên cài vào Claude`, kèm link nguồn GitHub và cách chúng được tích hợp vào Google Antigravity cho dự án này.

---

## 1. Harness (Quy trình chuẩn bị trước khi gõ code)

| # | Tên công cụ | Nguồn GitHub | Cách tích hợp vào Antigravity |
|---|-------------|--------------|-------------------------------|
| 1 | **superpowers** | `obra/superpowers` | File Skill `.agents/skills/superpowers/SKILL.md` & Quy tắc lập kế hoạch / TDD trong `GEMINI.md`. |
| 2 | **ECC** (Everything Claude Code) | `afforai/everything-claude-code` | Tinh chỉnh prompt harness & quy tắc tăng tốc độ thực thi trong `GEMINI.md`. |
| 3 | **karpathy-skills** | `karpathy` rules & guidelines | Tích hợp chặt chẽ trong `GEMINI.md` (Think before coding, surgical changes, test before complete). |
| 4 | **gstack** | `garrytan/gstack` | File Skill `.agents/skills/gstack/SKILL.md` (Pipeline 23 lệnh test, build, lint nhanh). |
| 5 | **ponytail** | `ponytail-ai` prompt rules | Quy tắc viết code ngắn gọn, súc tích, không lan man trong `GEMINI.md`. |
| 6 | **learn-claude-code** | `anthropics/courses` & harness guides | Hướng dẫn agentic reasoning & best practices trong `.agents/references/`. |

---

## 2. Skills (Kỹ năng chuyên biệt theo tác vụ)

| # | Tên công cụ | Nguồn GitHub | Cách tích hợp vào Antigravity |
|---|-------------|--------------|-------------------------------|
| 7 | **anthropics/skills** | `anthropics/skills` | File Skill `.agents/skills/anthropics-skills/SKILL.md` (Code review, conventional commits, docs). |
| 8 | **ui-ux-pro-max** | `nextlevelbuilder/ui-ux-pro-max-skill` | File Skill `.agents/skills/ui-ux-pro-max/SKILL.md` (160+ quy tắc thiết kế, màu sắc, font, anti-slop). |
| 9 | **taste-skill** | `Leonxlnx/taste-skill` | File Skill `.agents/skills/taste-skill/SKILL.md` (Thẩm mỹ cao cấp, 90/10 neutral/accent, typography). |
| 10| **awesome-claude-skills** | `awesome-claude-skills` | Danh mục tổng hợp kỹ năng chuẩn hóa trong `.agents/skills/`. |
| 11| **wshobson/agents** | `wshobson/agents` | Cấu hình các vai trò subagent chuyên biệt (Frontend, Architect, Reviewer) trong Antigravity subagents. |
| 12| **claude-plugins** | `anthropics/claude-plugins` | Cấu trúc modular plugin tương thích chuẩn Antigravity. |

---

## 3. Memory (Bộ nhớ ngữ cảnh & cấu trúc dự án)

| # | Tên công cụ | Nguồn GitHub | Cách tích hợp vào Antigravity |
|---|-------------|--------------|-------------------------------|
| 13| **graphify** | `graphify` visual mapping | Bản đồ cấu trúc thư mục & luồng dữ liệu trong `.agents/skills/reponix-codegraph/`. |
| 14| **claude-mem** | `claude-mem` persistent memory | Thư mục `.agents/memory/` lưu trữ quyết định kiến trúc và ngữ cảnh dự án. |
| 15| **codegraph** | `codegraph` indexer | Lập chỉ mục thành phần (components, hooks, pages, types) trong codebase blueprint. |
| 16| **reponix** | `reponix` repo packer | Quy trình gom cụm ngữ cảnh khi cần phân tích sâu file trọng tâm. |
| 17| **planning-with-files** | `planning-with-files` | Duy trì `UPDATE.md` và `TASK_QUEUE.md` để không bao giờ mất dấu tiến độ giữa các phiên. |

---

## 4. Tools (Công cụ tương tác ngoài terminal)

| # | Tên công cụ | Nguồn GitHub | Cách tích hợp vào Antigravity |
|---|-------------|--------------|-------------------------------|
| 18| **firecrawl** | `mendableai/firecrawl` | Cấu hình MCP Server Firecrawl để cào trang web và tài liệu API dạng clean markdown. |
| 19| **cc-switch** | `cc-switch` | Tính năng chuyển đổi mô hình (Flash / Pro) tích hợp sẵn trên UI Antigravity. |
| 20| **awesome-mcp-servers** | `punkpeye/awesome-mcp-servers` | Danh bạ MCP server trong `.agents/references/awesome-mcp-servers.md`. |
| 21| **multica** | `multica` multi-agent | Native Antigravity Subagent Orchestration (`invoke_subagent`). |
| 22| **claude-code-router** | `claude-code-router` | Điều phối tác vụ (tác vụ tra cứu -> Flash, tác vụ logic phức tạp -> Pro/Reasoning). |
| 23| **playwright-mcp** | `modelcontextprotocol/servers/playwright` | MCP Server điều khiển trình duyệt thật, chụp ảnh và test E2E. |
| 24| **github-mcp** | `modelcontextprotocol/servers/github` | MCP Server tương tác trực tiếp với GitHub PRs, issues, commits. |
| 25| **vibe-kanban** | `vibe-kanban` | Bảng quản lý nhiệm vụ trực quan `TASK_QUEUE.md`. |

---

## 5. Cost & Token Optimization (Tiết kiệm token & chi phí)

| # | Tên công cụ | Nguồn GitHub | Cách tích hợp vào Antigravity |
|---|-------------|--------------|-------------------------------|
| 26| **system-prompts-ai** | `system-prompts-ai` | Tối ưu hóa prompt cốt lõi trong `GEMINI.md` để AI hiểu việc ngay lập tức. |
| 27| **caveman** | `caveman` token saver | Quy tắc trả lời trực diện, loại bỏ lời mở đầu/kết thúc xã giao vô nghĩa để tiết kiệm context. |
| 28| **best-practice** | `best-practice` agentic | Bộ tiêu chuẩn Agentic Engineering (viết test, verify thực tế trước khi pass). |
| 29| **codex-plugin-cc** | `codex-plugin-cc` | Kiến trúc hỗ trợ code completion & snippet generator. |
| 30| **claude-hud** | `claude-hud` | Theo dõi và kiểm soát số lượng token tiêu thụ trong mỗi lượt trao đổi. |
