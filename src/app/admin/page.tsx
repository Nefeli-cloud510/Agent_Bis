import Link from "next/link";
import { Database, Download, FileSpreadsheet } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import GroupPreviewForm from "@/components/GroupPreviewForm";
import {
  MATERIAL_VERSION,
  GROUP_IDS,
  QUESTIONNAIRE_CONTENT,
} from "@/config/content";
import {
  getOverview,
  getQuestionStats,
  listSamples,
  toAdminFilters,
  type AdminFilters,
} from "@/lib/admin-data";
import { requireAdmin } from "@/lib/admin-guard";
import { allowGroupPreview } from "@/lib/env";

export const instant = false;

type AdminSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

function filterQueryString(filters: AdminFilters): string {
  const query = new URLSearchParams();
  if (filters.collection_phase) query.set("phase", filters.collection_phase);
  if (filters.material_version) query.set("version", filters.material_version);
  if (filters.group_id !== undefined) query.set("group", String(filters.group_id));
  if (filters.remind !== undefined) query.set("remind", String(filters.remind));
  if (filters.scope !== undefined) query.set("scope", String(filters.scope));
  if (filters.goods !== undefined) query.set("goods", String(filters.goods));
  const value = query.toString();
  return value ? `?${value}` : "";
}

function formatDateTime(value: string | Date | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
        hour12: false,
      });
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const username = await requireAdmin();
  const params = await searchParams;
  const filters = toAdminFilters(params);
  const query = filterQueryString(filters);
  const [overview, questionStats, samples] = await Promise.all([
    getOverview(filters),
    getQuestionStats(filters),
    listSamples(filters, 80),
  ]);
  const versions = Array.from(
    new Set([MATERIAL_VERSION, ...overview.versions])
  );
  const previewEnabled = allowGroupPreview();

  return (
    <AdminShell username={username}>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">研究数据后台</h1>
          <p className="admin-intro">
            所有数据来自服务器数据库；质量标记仅供提示，不会自动剔除或修改样本。
          </p>
        </div>
        <div className="admin-export-actions">
          <a
            className="btn-ghost admin-export-link"
            href={`/api/admin/export/raw${query}`}
          >
            <FileSpreadsheet size={16} aria-hidden />
            原始数据 CSV
          </a>
          <a
            className="btn-ghost admin-export-link"
            href={`/api/admin/export/group-summary${query}`}
          >
            <Database size={16} aria-hidden />
            分组描述统计 CSV
          </a>
          <a
            className="btn-ghost admin-export-link"
            href="/api/admin/export/variable-dictionary"
          >
            <Download size={16} aria-hidden />
            变量说明表 CSV
          </a>
        </div>
      </div>

      <section className="admin-card">
        <h2 className="admin-subtitle">总体情况</h2>
        <div className="stat-grid">
          <div className="stat-box">
            <div className="stat-value">{overview.total}</div>
            <div className="stat-label">已提交样本数</div>
          </div>
          <div className="stat-box">
            <div className="stat-value stat-value-small">
              {formatDateTime(overview.lastSubmittedAt)}
            </div>
            <div className="stat-label">最后提交时间</div>
          </div>
          {overview.groups.map((group) => (
            <div className="stat-box" key={group.group_id}>
              <div className="stat-value">{group.count}</div>
              <div className="stat-label">
                组 {group.group_id} · R{group.assignment.remind}/
                S{group.assignment.scope}/G{group.assignment.goods}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <h2 className="admin-subtitle">筛选</h2>
        <form className="admin-filter" method="get">
          <label>
            收集阶段
            <select name="phase" defaultValue={filters.collection_phase ?? ""}>
              <option value="">全部</option>
              <option value="dev">dev（开发测试）</option>
              <option value="pilot">pilot（预实验）</option>
              <option value="formal">formal（正式实验）</option>
            </select>
          </label>
          <label>
            材料版本
            <select
              name="version"
              defaultValue={filters.material_version ?? ""}
            >
              <option value="">全部</option>
              {versions.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </label>
          <label>
            组别
            <select name="group" defaultValue={filters.group_id ?? ""}>
              <option value="">全部</option>
              {GROUP_IDS.map((groupId) => (
                <option key={groupId} value={groupId}>
                  组 {groupId}
                </option>
              ))}
            </select>
          </label>
          <label>
            remind
            <select name="remind" defaultValue={filters.remind ?? ""}>
              <option value="">全部</option>
              <option value="0">0（无提醒）</option>
              <option value="1">1（有提醒）</option>
            </select>
          </label>
          <label>
            scope
            <select name="scope" defaultValue={filters.scope ?? ""}>
              <option value="">全部</option>
              <option value="1">1（仅最近会话）</option>
              <option value="2">2（全部会话）</option>
            </select>
          </label>
          <label>
            goods
            <select name="goods" defaultValue={filters.goods ?? ""}>
              <option value="">全部</option>
              <option value="1">1（笔记本电脑）</option>
              <option value="2">2（电脑包）</option>
            </select>
          </label>
          <button type="submit" className="btn-primary">
            应用筛选
          </button>
          <Link className="btn-ghost" href="/admin">
            清除筛选
          </Link>
        </form>
      </section>

      {previewEnabled ? (
        <section className="admin-card">
          <h2 className="admin-subtitle">固定组预览</h2>
          <GroupPreviewForm />
        </section>
      ) : null}

      <section className="admin-card">
        <h2 className="admin-subtitle">Q1 至 Q15 逐题统计</h2>
        {overview.total === 0 ? (
          <div className="empty-state">当前筛选条件下暂无已提交样本。</div>
        ) : (
          <table className="data-table question-table">
            <thead>
              <tr>
                <th>题号</th>
                <th>题目原文</th>
                <th>有效</th>
                <th>缺失</th>
                <th>1 非常不同意</th>
                <th>2 不同意</th>
                <th>3 中立</th>
                <th>4 同意</th>
                <th>5 非常同意</th>
                <th>均值</th>
                <th>标准差</th>
              </tr>
            </thead>
            <tbody>
              {questionStats.map((stat) => (
                <tr key={stat.questionId}>
                  <td>{stat.questionId.toUpperCase()}</td>
                  <td className="question-text">{stat.text}</td>
                  <td>{stat.valid}</td>
                  <td>{stat.missing}</td>
                  <td>{stat.counts[1]}</td>
                  <td>{stat.counts[2]}</td>
                  <td>{stat.counts[3]}</td>
                  <td>{stat.counts[4]}</td>
                  <td>{stat.counts[5]}</td>
                  <td>{stat.mean ?? "—"}</td>
                  <td>{stat.stddev ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="admin-card">
        <h2 className="admin-subtitle">已提交样本</h2>
        {samples.length === 0 ? (
          <div className="empty-state">
            当前筛选条件下没有已提交样本，后台不显示示例数据。
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>参与编号</th>
                <th>组别</th>
                <th>阶段</th>
                <th>材料版本</th>
                <th>提交时间</th>
                <th>总活动时长</th>
                <th>质量标记</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample) => (
                <tr key={sample.id}>
                  <td>{sample.participant_id as string}</td>
                  <td>组 {sample.group_id as number}</td>
                  <td>{sample.collection_phase as string}</td>
                  <td>{sample.material_version as string}</td>
                  <td>{formatDateTime(sample.submitted_at as string)}</td>
                  <td>{formatMs(sample.total_active_ms)}</td>
                  <td>
                    <SampleFlags flags={sample.quality_flags} />
                  </td>
                  <td>
                    <Link href={`/admin/samples/${sample.id}`}>查看详情</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="admin-card">
        <h2 className="admin-subtitle">问卷题目原文</h2>
        <table className="data-table question-table">
          <thead>
            <tr>
              <th>题号</th>
              <th>题目原文</th>
            </tr>
          </thead>
          <tbody>
            {QUESTIONNAIRE_CONTENT.sections.flatMap((section) =>
              section.questions.map((question) => (
                <tr key={question.id}>
                  <td>{question.id.toUpperCase()}</td>
                  <td className="question-text">{question.text}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}

function formatMs(value: unknown): string {
  const ms = Number(value ?? 0);
  if (!Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function SampleFlags({ flags }: { flags: string[] }) {
  if (flags.length === 0) return <span className="value-muted">无</span>;
  return (
    <span className="flag-list">
      {flags.map((flag) => (
        <span key={flag} className="quality-chip">
          {flag}
        </span>
      ))}
    </span>
  );
}
