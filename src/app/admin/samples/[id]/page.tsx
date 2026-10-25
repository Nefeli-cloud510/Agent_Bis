import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Route as RouteIcon,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import {
  ALL_QUESTION_IDS,
  QUESTIONNAIRE_CONTENT,
} from "@/config/content";
import { getSampleById } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/admin-guard";

export const instant = false;

type SampleParams = Promise<{ id: string }>;

const QUESTION_TEXT = new Map<string, string>();
for (const section of QUESTIONNAIRE_CONTENT.sections) {
  for (const question of section.questions) {
    QUESTION_TEXT.set(question.id, question.text);
  }
}

export default async function SampleDetailPage({
  params,
}: {
  params: SampleParams;
}) {
  const username = await requireAdmin();
  const { id } = await params;
  const sample = await getSampleById(id);
  if (!sample) notFound();

  const permissionShown = Boolean(sample.permission_page_shown);

  return (
    <AdminShell username={username}>
      <Link className="btn-ghost back-link" href="/admin">
        <ArrowLeft size={16} aria-hidden />
        返回后台总览
      </Link>

      <section className="admin-card">
        <h1 className="admin-title">样本详情</h1>
        <div className="detail-grid">
          <DetailItem label="参与编号" value={String(sample.participant_id ?? "")} />
          <DetailItem label="组别" value={`组 ${String(sample.group_id)}`} />
          <DetailItem
            label="实验参数"
            value={`remind=${sample.remind} · scope=${sample.scope} · goods=${sample.goods}`}
          />
          <DetailItem
            label="权限告知页"
            value={permissionShown ? "已显示" : "未显示（flow-v1 历史记录）"}
          />
          <DetailItem
            label="收集阶段"
            value={String(sample.collection_phase ?? "")}
          />
          <DetailItem
            label="材料 / 问卷版本"
            value={`${String(sample.material_version ?? "")} / ${String(
              sample.questionnaire_version ?? ""
            )}`}
          />
          <DetailItem
            label="提交时间"
            value={formatDateTime(sample.submitted_at as string | null)}
          />
          <DetailItem
            label="总活动时长"
            value={formatMs(sample.total_active_ms)}
          />
        </div>
      </section>

      <section className="admin-card">
        <h2 className="admin-subtitle">
          <CheckCircle2 size={18} aria-hidden />
          15 题原始回答
        </h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>题号</th>
              <th>题目原文</th>
              <th>回答</th>
            </tr>
          </thead>
          <tbody>
            {ALL_QUESTION_IDS.map((questionId) => {
              const value = sample[questionId];
              return (
                <tr key={questionId}>
                  <td>{questionId.toUpperCase()}</td>
                  <td className="question-text">
                    {QUESTION_TEXT.get(questionId) ?? questionId}
                  </td>
                  <td>{typeof value === "number" ? value : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2 className="admin-subtitle">
          <CircleAlert size={18} aria-hidden />
          数据质量标记
        </h2>
        {Array.isArray(sample.quality_flags) && sample.quality_flags.length > 0 ? (
          <div className="flag-list">
            {sample.quality_flags.map((flag) => (
              <span key={flag} className="quality-chip">
                {flag}
              </span>
            ))}
          </div>
        ) : (
          <p className="value-muted">无标记，未发现明显异常。标记仅提示，不自动剔除。</p>
        )}
      </section>

      <section className="admin-card">
        <h2 className="admin-subtitle">
          <RouteIcon size={18} aria-hidden />
          实际页面停留摘要
        </h2>
        <div className="detail-grid">
          <DetailItem
            label="知情同意"
            value={formatMs(sample.consent_active_ms)}
          />
          <DetailItem
            label="历史记录"
            value={formatMs(sample.history_active_ms)}
          />
          <DetailItem
            label="权限告知"
            value={
              permissionShown
                ? formatMs(sample.permission_active_ms)
                : "页面未出现（flow-v1 / null）"
            }
          />
          <DetailItem label="购买任务" value={formatMs(sample.task_active_ms)} />
          <DetailItem
            label="推荐结果"
            value={formatMs(sample.recommendation_active_ms)}
          />
          <DetailItem
            label="问卷"
            value={formatMs(sample.questionnaire_active_ms)}
          />
        </div>
      </section>

      <section className="admin-card">
        <h2 className="admin-subtitle">页面访问记录</h2>
        {Array.isArray(sample.page_visits) && sample.page_visits.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>顺序</th>
                <th>页面</th>
                <th>进入时间</th>
                <th>离开时间</th>
                <th>活动时长</th>
              </tr>
            </thead>
            <tbody>
              {sample.page_visits.map(
                (visit: Record<string, unknown>, index: number) => (
                  <tr key={`${visit.page}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{String(visit.page ?? "")}</td>
                    <td>{String(visit.enteredAt ?? "—")}</td>
                    <td>{String(visit.leftAt ?? "—")}</td>
                    <td>{formatMs(visit.activeMs)}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        ) : (
          <p className="value-muted">该样本没有保存页面访问记录。</p>
        )}
        <p className="admin-note">
          活动时长仅累计页面可见且窗口聚焦的时间；隐藏标签页或失焦时暂停，不等同于认真阅读时长。
        </p>
      </section>
    </AdminShell>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
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

function formatMs(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const ms = Number(value);
  if (!Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}
