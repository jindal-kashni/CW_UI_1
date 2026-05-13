import React from "react";
import { router } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button, SearchInput, StatusBadge } from "@/src/components";
import { AdminAppBottomNav, ScreenContainer, TopBar } from "@/src/layout";
import { useTheme } from "@/src/theme";
import {
  fetchAdminAuditResults,
  type AdminAuditResultSearchRecord,
} from "@/src/services/reports";
import { resolveUserNames } from "@/src/services/lookups";
import { formatDateDDMMYYYY } from "@/src/utils/date";

type ConditionFilter = "All" | "5" | "4" | "3" | "2" | "1";
type PriorityFilter = "All" | "Low" | "Medium" | "High" | "Critical";
type FlagFilter = "All" | "Maintenance" | "Replacement" | "Safety" | "HighRisk";
type ScopeFilter = "All" | "Finalised" | "NotFinalised";
type HistoryFilter = "Latest" | "All";
type SortOption =
  | "DateDesc"
  | "DateAsc"
  | "PriorityDesc"
  | "ConditionAsc"
  | "ConditionDesc"
  | "MaintenanceCostDesc"
  | "ReplacementCostDesc"
  | "AssetNameAsc"
  | "LocationAsc";
type FilterMode = "search" | "filters";
type ResultsFilterKey =
  | "condition"
  | "priority"
  | "flag"
  | "scope"
  | "history"
  | "sort"
  | "assetHistory"
  | "location"
  | "room"
  | "department"
  | "category"
  | "subCategory";
type PickerOption = { label: string; value: string };

const conditionLabels: Record<number, string> = {
  5: "5 · Excellent",
  4: "4 · Good",
  3: "3 · Fair",
  2: "2 · Poor",
  1: "1 · Needs urgent attention",
};

function conditionLabel(value: number | null) {
  if (!value) return "Not set";
  return conditionLabels[value] ?? `${value}`;
}

function formatCurrency(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `$${value.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return value ? formatDateDDMMYYYY(value) : "-";
}

function formatDateTime(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return date.toLocaleString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(
  status: string,
): "good" | "neutral" | "warn" | "bad" | "info" {
  if (status === "Completed") return "good";
  if (status === "InProgress") return "warn";
  if (status === "Cancelled") return "bad";
  if (status === "Assigned") return "info";
  return "neutral";
}

function priorityTone(
  priority: string,
): "good" | "neutral" | "warn" | "bad" | "info" {
  if (priority === "Critical") return "bad";
  if (priority === "High") return "warn";
  if (priority === "Medium") return "info";
  if (priority === "Low") return "good";
  return "neutral";
}

function boolLabel(value: boolean) {
  return value ? "Yes" : "No";
}

function ReportsAreaTabs({ active }: { active: "reports" | "results" }) {
  const t = useTheme();

  const items = [
    { key: "reports" as const, label: "Reports", href: "/admin/reports" },
    {
      key: "results" as const,
      label: "Audit Results",
      href: "/admin/reports/results",
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        gap: t.spacing.sm,
        borderWidth: 1,
        borderColor: "rgba(0,74,38,0.16)",
        borderRadius: t.radius.lg,
        padding: 4,
        backgroundColor: t.colors.card.surfaceAlt,
      }}
    >
      {items.map((item) => {
        const selected = active === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => {
              if (!selected) router.push(item.href as any);
            }}
            style={({ pressed }) => [
              {
                flex: 1,
                minHeight: 42,
                borderRadius: t.radius.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: selected
                  ? "#2F6B4B"
                  : pressed
                    ? "rgba(0,74,38,0.08)"
                    : "transparent",
              },
            ]}
          >
            <Text
              style={{
                fontWeight: selected ? "800" : "700",
                color: selected ? "#fff" : "#2F5B45",
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function normaliseFilterValue(value: string) {
  return value.trim().toLowerCase();
}

function matchesExactFilter(currentValue: string, filterValue: string) {
  if (filterValue === "All") return true;
  return (
    normaliseFilterValue(currentValue) === normaliseFilterValue(filterValue)
  );
}

function resultAssetKey(result: AdminAuditResultSearchRecord) {
  return result.assetId || result.assetCode || result.assetName || result.id;
}

function sortByNewest(results: AdminAuditResultSearchRecord[]) {
  return [...results].sort((a, b) => {
    const left = new Date(a.completedAt || 0).getTime();
    const right = new Date(b.completedAt || 0).getTime();
    return right - left;
  });
}

function resultTime(result: AdminAuditResultSearchRecord) {
  const time = new Date(result.completedAt || "").getTime();
  return Number.isFinite(time) ? time : 0;
}

function priorityRank(priority: string) {
  if (priority === "Critical") return 4;
  if (priority === "High") return 3;
  if (priority === "Medium") return 2;
  if (priority === "Low") return 1;
  return 0;
}

function textCompare(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function sortAuditResults(
  results: AdminAuditResultSearchRecord[],
  sortOption: SortOption,
) {
  return [...results].sort((a, b) => {
    if (sortOption === "DateAsc") return resultTime(a) - resultTime(b);
    if (sortOption === "PriorityDesc") {
      return (
        priorityRank(b.priorityLevel) - priorityRank(a.priorityLevel) ||
        resultTime(b) - resultTime(a)
      );
    }
    if (sortOption === "ConditionAsc") {
      return (
        (a.conditionRating ?? 99) - (b.conditionRating ?? 99) ||
        resultTime(b) - resultTime(a)
      );
    }
    if (sortOption === "ConditionDesc") {
      return (
        (b.conditionRating ?? -1) - (a.conditionRating ?? -1) ||
        resultTime(b) - resultTime(a)
      );
    }
    if (sortOption === "MaintenanceCostDesc") {
      return (
        (b.estimatedMaintenanceCost ?? -1) -
          (a.estimatedMaintenanceCost ?? -1) ||
        resultTime(b) - resultTime(a)
      );
    }
    if (sortOption === "ReplacementCostDesc") {
      return (
        (b.estimatedReplacementCost ?? -1) -
          (a.estimatedReplacementCost ?? -1) ||
        resultTime(b) - resultTime(a)
      );
    }
    if (sortOption === "AssetNameAsc") {
      return (
        textCompare(
          a.assetName || a.assetCode || "",
          b.assetName || b.assetCode || "",
        ) ||
        resultTime(b) - resultTime(a)
      );
    }
    if (sortOption === "LocationAsc") {
      return (
        textCompare(a.locationName || "", b.locationName || "") ||
        textCompare(a.assetName || "", b.assetName || "") ||
        resultTime(b) - resultTime(a)
      );
    }
    return resultTime(b) - resultTime(a);
  });
}

function makeLatestResultsByAsset(results: AdminAuditResultSearchRecord[]) {
  const seen = new Set<string>();
  const latest: AdminAuditResultSearchRecord[] = [];

  for (const result of sortByNewest(results)) {
    const key = resultAssetKey(result);
    if (seen.has(key)) continue;
    seen.add(key);
    latest.push(result);
  }

  return latest;
}

function makeAssetHistoryOptions(results: AdminAuditResultSearchRecord[]) {
  const options = new Map<string, string>();

  for (const result of results) {
    const key = resultAssetKey(result);
    if (!key || options.has(key)) continue;

    const labelParts = [result.assetCode, result.assetName].filter(Boolean);
    const detailParts = [
      result.locationName,
      result.roomName,
      result.departmentName,
    ].filter(Boolean);
    const label = [labelParts.join(" · ") || key, detailParts.join(" · ")]
      .filter(Boolean)
      .join(" — ");
    options.set(key, label);
  }

  return Array.from(options.entries())
    .map(([value, label]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function makeTextOptions(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

function matchesSearch(
  result: AdminAuditResultSearchRecord,
  search: string,
  completedByName: string,
) {
  const term = search.trim().toLowerCase();
  if (!term) return true;

  const haystack = [
    result.reportTitle,
    result.assetCode,
    result.assetName,
    result.category,
    result.subCategory,
    result.locationName,
    result.roomName,
    result.departmentName,
    result.priorityLevel,
    result.operationalStatus,
    result.issueDescription,
    result.recommendedAction,
    result.generalNotes,
    completedByName,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(term);
}

function AuditPhotoTile({ uri, index }: { uri: string; index: number }) {
  const t = useTheme();
  const [failed, setFailed] = React.useState(false);

  return (
    <Pressable
      onPress={() => Linking.openURL(uri).catch(() => undefined)}
      style={{
        width: 96,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        overflow: "hidden",
        backgroundColor: t.colors.card.surfaceAlt,
      }}
    >
      {failed ? (
        <View
          style={{
            height: 72,
            alignItems: "center",
            justifyContent: "center",
            padding: 6,
          }}
        >
          <Text style={[t.text.caption, { textAlign: "center" }]}>
            Photo {index + 1}
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri }}
          onError={() => setFailed(true)}
          style={{
            width: "100%",
            height: 72,
            backgroundColor: t.colors.card.surfaceAlt,
          }}
          resizeMode="cover"
        />
      )}
      <Text style={[t.text.caption, { padding: 6, fontSize: 11 }]}>
        Open original
      </Text>
    </Pressable>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  const t = useTheme();

  return (
    <View
      style={{
        minWidth: 170,
        flex: 1,
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        borderRadius: t.radius.lg,
        padding: t.spacing.md,
        backgroundColor: t.colors.card.surface,
        gap: 4,
      }}
    >
      <Text style={t.text.caption}>{label}</Text>
      <Text style={[t.text.title, { fontSize: 24, lineHeight: 30 }]}>
        {value}
      </Text>
      {helper ? <Text style={t.text.caption}>{helper}</Text> : null}
    </View>
  );
}

function FilterModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 38,
          borderRadius: 999,
          paddingHorizontal: 14,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: active ? "rgba(31,59,44,0.22)" : t.colors.border.subtle,
          backgroundColor: active
            ? t.colors.brand.forestTint
            : pressed
              ? "rgba(30,31,28,0.04)"
              : t.colors.card.surface,
        },
      ]}
    >
      <Text
        style={[
          t.text.caption,
          {
            fontWeight: "700",
            color: active ? t.colors.brand.forest : t.colors.text.secondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DropdownField({
  label,
  valueLabel,
  isDefault,
  onPress,
}: {
  label: string;
  valueLabel: string;
  isDefault: boolean;
  onPress: () => void;
}) {
  const t = useTheme();

  return (
    <View style={{ flex: 1, minWidth: 190, gap: 6 }}>
      <Text style={[t.text.caption, { fontWeight: "700" }]}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            minHeight: 52,
            borderWidth: 1,
            borderColor: t.colors.border.subtle,
            borderRadius: t.radius.lg,
            backgroundColor: t.colors.card.surface,
            paddingHorizontal: t.spacing.md,
            alignItems: "center",
            justifyContent: "space-between",
            flexDirection: "row",
            opacity: pressed ? 0.96 : 1,
          },
        ]}
      >
        <Text
          style={[
            t.text.body,
            { color: isDefault ? t.colors.text.muted : t.colors.text.primary },
          ]}
          numberOfLines={1}
        >
          {valueLabel}
        </Text>
        <Text style={{ color: t.colors.text.muted, fontSize: 12 }}>▼</Text>
      </Pressable>
    </View>
  );
}

function ResetFiltersButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 40,
          borderWidth: 1,
          borderColor: "rgba(0,74,38,0.42)",
          borderRadius: 999,
          paddingHorizontal: 16,
          justifyContent: "center",
          backgroundColor: pressed
            ? "rgba(0,74,38,0.20)"
            : "rgba(0,74,38,0.14)",
        },
      ]}
    >
      <Text
        style={[
          t.text.caption,
          { fontWeight: "800", color: "#0F4A31", fontSize: 15 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ResultCard({
  result,
  completedByName,
  onViewAssetHistory,
}: {
  result: AdminAuditResultSearchRecord;
  completedByName: string;
  onViewAssetHistory: (result: AdminAuditResultSearchRecord) => void;
}) {
  const t = useTheme();

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: t.colors.border.subtle,
        borderRadius: t.radius.lg,
        padding: t.spacing.lg,
        backgroundColor: t.colors.card.surface,
        gap: t.spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: t.spacing.md,
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>
            {result.assetName}
          </Text>
          <Text style={t.text.caption}>
            {result.assetCode || "No asset code"} ·{" "}
            {result.category || "No category"}
            {result.subCategory ? ` · ${result.subCategory}` : ""}
          </Text>
          <Text
            style={[
              t.text.caption,
              { fontWeight: "700", color: t.colors.brand.forest },
            ]}
          >
            Submitted: {formatDateTime(result.completedAt)}
          </Text>
          <Text style={t.text.caption}>
            {result.locationName || "Unknown location"}
            {result.roomName ? ` · ${result.roomName}` : ""}
          </Text>
          <Text style={t.text.caption}>
            {result.departmentName || "Unknown department"}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <StatusBadge
            label={result.priorityLevel || "No priority"}
            tone={priorityTone(result.priorityLevel)}
          />
          {result.criticalAlert ? (
            <StatusBadge label="High risk" tone="bad" />
          ) : null}
        </View>
      </View>

      <View
        style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm }}
      >
        <StatusBadge
          label={`Condition ${conditionLabel(result.conditionRating)}`}
          tone={
            result.conditionRating && result.conditionRating <= 2
              ? "bad"
              : "info"
          }
        />
        <StatusBadge
          label={result.operationalStatus || "Operational status not set"}
          tone="neutral"
        />
        <StatusBadge
          label={result.isFinalised ? "Finalised report" : "Not finalised"}
          tone={result.isFinalised ? "good" : "warn"}
        />
        <StatusBadge
          label={result.reportAssetStatus || "Asset status unknown"}
          tone={result.reportAssetStatus === "Completed" ? "good" : "neutral"}
        />
      </View>

      <View
        style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.md }}
      >
        <View style={{ minWidth: 180, flex: 1 }}>
          <Text style={t.text.caption}>Report</Text>
          <Text style={[t.text.body, { fontWeight: "700" }]}>
            {result.reportTitle}
          </Text>
          <Text style={t.text.caption}>
            Completed: {formatDateTime(result.completedAt)}
          </Text>
          <Text style={t.text.caption}>
            Auditor: {completedByName || result.completedBy || "Unknown"}
          </Text>
        </View>

        <View style={{ minWidth: 180, flex: 1 }}>
          <Text style={t.text.caption}>Maintenance</Text>
          <Text style={t.text.caption}>
            Required: {boolLabel(result.maintenanceRequired)}
          </Text>
          <Text style={t.text.caption}>
            Estimated cost: {formatCurrency(result.estimatedMaintenanceCost)}
          </Text>
        </View>

        <View style={{ minWidth: 180, flex: 1 }}>
          <Text style={t.text.caption}>Replacement</Text>
          <Text style={t.text.caption}>
            Required: {boolLabel(result.replacementRequired)}
          </Text>
          <Text style={t.text.caption}>
            Estimated cost: {formatCurrency(result.estimatedReplacementCost)}
          </Text>
        </View>

        <View style={{ minWidth: 180, flex: 1 }}>
          <Text style={t.text.caption}>Safety</Text>
          <Text style={t.text.caption}>
            Safety concern: {boolLabel(result.safetyConcern)}
          </Text>
          <Text style={t.text.caption}>
            Remaining life: {result.expectedRemainingLifeYears ?? "-"} years
          </Text>
        </View>
      </View>

      {result.issueDescription ? (
        <View style={{ gap: 4 }}>
          <Text style={[t.text.caption, { fontWeight: "700" }]}>
            Issue description
          </Text>
          <Text style={t.text.caption}>{result.issueDescription}</Text>
        </View>
      ) : null}

      {result.recommendedAction ? (
        <View style={{ gap: 4 }}>
          <Text style={[t.text.caption, { fontWeight: "700" }]}>
            Recommended action
          </Text>
          <Text style={t.text.caption}>{result.recommendedAction}</Text>
        </View>
      ) : null}

      {result.generalNotes ? (
        <View style={{ gap: 4 }}>
          <Text style={[t.text.caption, { fontWeight: "700" }]}>
            General notes
          </Text>
          <Text style={t.text.caption}>{result.generalNotes}</Text>
        </View>
      ) : null}

      {result.photoUrls.length ? (
        <View style={{ gap: t.spacing.sm }}>
          <Text style={[t.text.caption, { fontWeight: "700" }]}>
            Audit photos
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: t.spacing.sm,
            }}
          >
            {result.photoUrls.map((uri, index) => (
              <AuditPhotoTile key={`${uri}-${index}`} uri={uri} index={index} />
            ))}
          </View>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: t.spacing.md,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Text style={t.text.caption}>
          Report status: {result.reportStatus || "Unknown"}
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: t.spacing.sm,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <Button
            label="View asset history"
            variant="secondary"
            onPress={() => onViewAssetHistory(result)}
          />
          <Button
            label="Open report"
            variant="secondary"
            onPress={() =>
              router.push(`/admin/reports/${result.reportId}` as any)
            }
          />
        </View>
      </View>
    </View>
  );
}

export default function AdminReportResultsPage() {
  const t = useTheme();
  const [results, setResults] = React.useState<AdminAuditResultSearchRecord[]>(
    [],
  );
  const [userNamesById, setUserNamesById] = React.useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const [filterMode, setFilterMode] = React.useState<FilterMode>("search");
  const [search, setSearch] = React.useState("");
  const [pickerField, setPickerField] = React.useState<ResultsFilterKey | null>(
    null,
  );
  const [pickerDraftValue, setPickerDraftValue] = React.useState("All");
  const [conditionFilter, setConditionFilter] =
    React.useState<ConditionFilter>("All");
  const [priorityFilter, setPriorityFilter] =
    React.useState<PriorityFilter>("All");
  const [flagFilter, setFlagFilter] = React.useState<FlagFilter>("All");
  const [scopeFilter, setScopeFilter] = React.useState<ScopeFilter>("All");
  const [historyFilter, setHistoryFilter] =
    React.useState<HistoryFilter>("Latest");
  const [sortOption, setSortOption] = React.useState<SortOption>("DateDesc");
  const [assetHistoryFilter, setAssetHistoryFilter] = React.useState("All");
  const [locationFilter, setLocationFilter] = React.useState("All");
  const [roomFilter, setRoomFilter] = React.useState("All");
  const [departmentFilter, setDepartmentFilter] = React.useState("All");
  const [categoryFilter, setCategoryFilter] = React.useState("All");
  const [subCategoryFilter, setSubCategoryFilter] = React.useState("All");

  const loadResults = React.useCallback(async () => {
    setMessage(null);
    const rows = await fetchAdminAuditResults({ limit: 750 });
    setResults(rows);

    const userIds = Array.from(
      new Set(rows.map((row) => row.completedBy).filter(Boolean)),
    );
    if (userIds.length > 0) {
      setUserNamesById(await resolveUserNames(userIds));
    } else {
      setUserNamesById({});
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      await loadResults();
      if (mounted) setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [loadResults]);

  const baseResults = React.useMemo(() => {
    if (assetHistoryFilter !== "All") return sortByNewest(results);
    return historyFilter === "Latest"
      ? makeLatestResultsByAsset(results)
      : sortByNewest(results);
  }, [assetHistoryFilter, historyFilter, results]);

  const filterOptions = React.useMemo(() => {
    return {
      assetHistory: makeAssetHistoryOptions(results),
      locations: makeTextOptions(results.map((row) => row.locationName)),
      rooms: makeTextOptions(results.map((row) => row.roomName)),
      departments: makeTextOptions(results.map((row) => row.departmentName)),
      categories: makeTextOptions(results.map((row) => row.category)),
      subCategories: makeTextOptions(results.map((row) => row.subCategory)),
    };
  }, [results]);

  const filterValues = React.useMemo<Record<ResultsFilterKey, string>>(
    () => ({
      condition: conditionFilter,
      priority: priorityFilter,
      flag: flagFilter,
      scope: scopeFilter,
      history: historyFilter,
      sort: sortOption,
      assetHistory: assetHistoryFilter,
      location: locationFilter,
      room: roomFilter,
      department: departmentFilter,
      category: categoryFilter,
      subCategory: subCategoryFilter,
    }),
    [
      assetHistoryFilter,
      categoryFilter,
      conditionFilter,
      departmentFilter,
      flagFilter,
      historyFilter,
      locationFilter,
      priorityFilter,
      roomFilter,
      scopeFilter,
      sortOption,
      subCategoryFilter,
    ],
  );

  const filterFieldOptions = React.useMemo<
    Record<ResultsFilterKey, PickerOption[]>
  >(
    () => ({
      condition: [
        { label: "All conditions", value: "All" },
        { label: "5 · Excellent", value: "5" },
        { label: "4 · Good", value: "4" },
        { label: "3 · Fair", value: "3" },
        { label: "2 · Poor", value: "2" },
        { label: "1 · Needs urgent attention", value: "1" },
      ],
      priority: [
        { label: "All priorities", value: "All" },
        { label: "Low", value: "Low" },
        { label: "Medium", value: "Medium" },
        { label: "High", value: "High" },
        { label: "Critical", value: "Critical" },
      ],
      flag: [
        { label: "All results", value: "All" },
        { label: "Maintenance required", value: "Maintenance" },
        { label: "Replacement required", value: "Replacement" },
        { label: "Safety concern", value: "Safety" },
        { label: "High-risk only", value: "HighRisk" },
      ],
      scope: [
        { label: "All synced results", value: "All" },
        { label: "Finalised reports only", value: "Finalised" },
        { label: "Not finalised", value: "NotFinalised" },
      ],
      history: [
        { label: "Latest result per asset", value: "Latest" },
        { label: "All historical results", value: "All" },
      ],
      sort: [
        { label: "Date submitted · newest first", value: "DateDesc" },
        { label: "Date submitted · oldest first", value: "DateAsc" },
        { label: "Priority · critical first", value: "PriorityDesc" },
        { label: "Condition · worst first", value: "ConditionAsc" },
        { label: "Condition · best first", value: "ConditionDesc" },
        { label: "Maintenance cost · highest first", value: "MaintenanceCostDesc" },
        { label: "Replacement cost · highest first", value: "ReplacementCostDesc" },
        { label: "Asset name · A to Z", value: "AssetNameAsc" },
        { label: "Location · A to Z", value: "LocationAsc" },
      ],
      assetHistory: [
        { label: "All assets", value: "All" },
        ...filterOptions.assetHistory,
      ],
      location: [
        { label: "All locations", value: "All" },
        ...filterOptions.locations.map((value) => ({ label: value, value })),
      ],
      room: [
        { label: "All rooms", value: "All" },
        ...filterOptions.rooms.map((value) => ({ label: value, value })),
      ],
      department: [
        { label: "All departments", value: "All" },
        ...filterOptions.departments.map((value) => ({ label: value, value })),
      ],
      category: [
        { label: "All categories", value: "All" },
        ...filterOptions.categories.map((value) => ({ label: value, value })),
      ],
      subCategory: [
        { label: "All sub-categories", value: "All" },
        ...filterOptions.subCategories.map((value) => ({
          label: value,
          value,
        })),
      ],
    }),
    [filterOptions],
  );

  const pickerConfig = React.useMemo(() => {
    if (!pickerField) return { label: "", options: [] as PickerOption[] };

    const labels: Record<ResultsFilterKey, string> = {
      condition: "Condition",
      priority: "Priority",
      flag: "Issue type",
      scope: "Report scope",
      history: "Result history",
      sort: "Sort results",
      assetHistory: "Asset history",
      location: "Location",
      room: "Room",
      department: "Department",
      category: "Category",
      subCategory: "Sub-category",
    };

    return {
      label: labels[pickerField],
      options: filterFieldOptions[pickerField],
    };
  }, [filterFieldOptions, pickerField]);

  const activeFilterCount = [
    conditionFilter !== "All",
    priorityFilter !== "All",
    flagFilter !== "All",
    scopeFilter !== "All",
    historyFilter !== "Latest",
    sortOption !== "DateDesc",
    assetHistoryFilter !== "All",
    locationFilter !== "All",
    roomFilter !== "All",
    departmentFilter !== "All",
    categoryFilter !== "All",
    subCategoryFilter !== "All",
  ].filter(Boolean).length;

  const openFilterPicker = (field: ResultsFilterKey) => {
    setPickerField(field);
    setPickerDraftValue(filterValues[field]);
  };

  const labelForFilterValue = (field: ResultsFilterKey) => {
    const currentValue = filterValues[field];
    return (
      filterFieldOptions[field].find((option) => option.value === currentValue)
        ?.label ?? currentValue
    );
  };

  const applyPickerValue = () => {
    if (!pickerField) return;

    const value = pickerDraftValue;
    if (pickerField === "condition")
      setConditionFilter(value as ConditionFilter);
    if (pickerField === "priority") setPriorityFilter(value as PriorityFilter);
    if (pickerField === "flag") setFlagFilter(value as FlagFilter);
    if (pickerField === "scope") setScopeFilter(value as ScopeFilter);
    if (pickerField === "history") setHistoryFilter(value as HistoryFilter);
    if (pickerField === "sort") setSortOption(value as SortOption);
    if (pickerField === "assetHistory") {
      setAssetHistoryFilter(value);
      if (value !== "All") setHistoryFilter("All");
    }
    if (pickerField === "location") setLocationFilter(value);
    if (pickerField === "room") setRoomFilter(value);
    if (pickerField === "department") setDepartmentFilter(value);
    if (pickerField === "category") setCategoryFilter(value);
    if (pickerField === "subCategory") setSubCategoryFilter(value);
    setPickerField(null);
  };

  const filteredResults = React.useMemo(() => {
    return baseResults.filter((result) => {
      const completedByName = userNamesById[result.completedBy] || "";
      if (!matchesSearch(result, search, completedByName)) return false;
      if (
        assetHistoryFilter !== "All" &&
        resultAssetKey(result) !== assetHistoryFilter
      )
        return false;
      if (
        conditionFilter !== "All" &&
        String(result.conditionRating ?? "") !== conditionFilter
      )
        return false;
      if (priorityFilter !== "All" && result.priorityLevel !== priorityFilter)
        return false;
      if (scopeFilter === "Finalised" && !result.isFinalised) return false;
      if (scopeFilter === "NotFinalised" && result.isFinalised) return false;
      if (!matchesExactFilter(result.locationName, locationFilter))
        return false;
      if (!matchesExactFilter(result.roomName, roomFilter)) return false;
      if (!matchesExactFilter(result.departmentName, departmentFilter))
        return false;
      if (!matchesExactFilter(result.category, categoryFilter)) return false;
      if (!matchesExactFilter(result.subCategory, subCategoryFilter))
        return false;

      if (flagFilter === "Maintenance" && !result.maintenanceRequired)
        return false;
      if (flagFilter === "Replacement" && !result.replacementRequired)
        return false;
      if (flagFilter === "Safety" && !result.safetyConcern) return false;
      if (flagFilter === "HighRisk" && !result.criticalAlert) return false;

      return true;
    });
  }, [
    assetHistoryFilter,
    baseResults,
    categoryFilter,
    conditionFilter,
    departmentFilter,
    flagFilter,
    locationFilter,
    priorityFilter,
    roomFilter,
    scopeFilter,
    search,
    subCategoryFilter,
    userNamesById,
  ]);

  const sortedResults = React.useMemo(
    () => sortAuditResults(filteredResults, sortOption),
    [filteredResults, sortOption],
  );

  const metrics = React.useMemo(() => {
    const maintenance = filteredResults.filter(
      (row) => row.maintenanceRequired,
    ).length;
    const replacement = filteredResults.filter(
      (row) => row.replacementRequired,
    ).length;
    const safety = filteredResults.filter((row) => row.safetyConcern).length;
    const highRisk = filteredResults.filter((row) => row.criticalAlert).length;
    const estimatedMaintenance = filteredResults.reduce(
      (sum, row) => sum + (row.estimatedMaintenanceCost ?? 0),
      0,
    );
    const estimatedReplacement = filteredResults.reduce(
      (sum, row) => sum + (row.estimatedReplacementCost ?? 0),
      0,
    );

    return {
      maintenance,
      replacement,
      safety,
      highRisk,
      estimatedMaintenance,
      estimatedReplacement,
    };
  }, [filteredResults]);

  const resetFilters = () => {
    setSearch("");
    setConditionFilter("All");
    setPriorityFilter("All");
    setFlagFilter("All");
    setScopeFilter("All");
    setHistoryFilter("Latest");
    setSortOption("DateDesc");
    setAssetHistoryFilter("All");
    setLocationFilter("All");
    setRoomFilter("All");
    setDepartmentFilter("All");
    setCategoryFilter("All");
    setSubCategoryFilter("All");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResults();
    setRefreshing(false);
    setMessage("Audit results refreshed.");
  };

  const selectedAssetHistoryLabel = React.useMemo(() => {
    if (assetHistoryFilter === "All") return "";
    return (
      filterFieldOptions.assetHistory.find(
        (option) => option.value === assetHistoryFilter,
      )?.label ?? assetHistoryFilter
    );
  }, [assetHistoryFilter, filterFieldOptions.assetHistory]);

  const handleViewAssetHistory = React.useCallback(
    (result: AdminAuditResultSearchRecord) => {
      setAssetHistoryFilter(resultAssetKey(result));
      setHistoryFilter("All");
      setFilterMode("filters");
      setSearch("");
      setMessage(
        `Showing full audit history for ${result.assetCode || result.assetName || "selected asset"}.`,
      );
    },
    [],
  );

  return (
    <ScreenContainer>
      <TopBar
        title="Audit Results"
        userName="Admin"
        onPressBack={() => router.replace("/admin/reports" as any)}
        onPressUser={() => router.push("/admin/profile" as any)}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.xl,
        }}
      >
        <View style={{ gap: t.spacing.sm }}>
          <Text style={[t.text.title, { fontSize: 28, lineHeight: 34 }]}>
            Submitted audit results
          </Text>
          <Text style={t.text.caption}>
            Search across synced universal asset audit results. Offline auditor
            work appears here after it has been synced.
          </Text>
          {message ? (
            <Text
              style={[
                t.text.caption,
                { color: t.colors.brand.forest, fontWeight: "700" },
              ]}
            >
              {message}
            </Text>
          ) : null}
        </View>

        <ReportsAreaTabs active="results" />

        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.md }}
        >
          <MetricCard
            label="Results shown"
            value={filteredResults.length}
            helper={
              historyFilter === "Latest"
                ? `${baseResults.length} latest asset results · ${results.length} total loaded`
                : `${results.length} total loaded`
            }
          />
          <MetricCard
            label="High-risk findings"
            value={metrics.highRisk}
            helper="Critical, condition 1, or safety concern"
          />
          <MetricCard
            label="Maintenance required"
            value={metrics.maintenance}
          />
          <MetricCard
            label="Replacement required"
            value={metrics.replacement}
          />
          <MetricCard
            label="Est. maintenance cost"
            value={formatCurrency(metrics.estimatedMaintenance)}
          />
          <MetricCard
            label="Est. replacement cost"
            value={formatCurrency(metrics.estimatedReplacement)}
          />
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: t.colors.border.subtle,
            borderRadius: t.radius.lg,
            padding: t.spacing.lg,
            backgroundColor: t.colors.card.surface,
            gap: t.spacing.lg,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: t.spacing.md,
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>
                Search and filters
              </Text>
              <Text style={t.text.caption}>
                Filter results by asset, report, location, condition, priority,
                and issue type.
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: t.spacing.sm }}>
              <Button
                label="Clear"
                variant="secondary"
                onPress={resetFilters}
              />
              <Button
                label={refreshing ? "Refreshing..." : "Refresh"}
                variant="secondary"
                disabled={refreshing}
                onPress={onRefresh}
              />
            </View>
          </View>

          <View style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: "row", gap: t.spacing.sm }}>
              <FilterModeButton
                label="Search"
                active={filterMode === "search"}
                onPress={() => setFilterMode("search")}
              />
              <FilterModeButton
                label="Search by filters"
                active={filterMode === "filters"}
                onPress={() => setFilterMode("filters")}
              />
            </View>

            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search asset code/name, location, room, department, category, sub-category, report, issue, action, notes, or auditor..."
            />

            {filterMode === "filters" ? (
              <View style={{ gap: t.spacing.md }}>
                {/* Asset history gets its own full-width row */}
                <View style={{ width: "100%" }}>
                  <DropdownField
                    label="Asset history"
                    valueLabel={labelForFilterValue("assetHistory")}
                    isDefault={assetHistoryFilter === "All"}
                    onPress={() => openFilterPicker("assetHistory")}
                  />
                </View>

                {/* Audit result filters */}
                <View style={{ gap: t.spacing.sm }}>
                  <Text style={[t.text.caption, { fontWeight: "700" }]}>
                    Audit result filters
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: t.spacing.md,
                    }}
                  >
                    <DropdownField
                      label="Condition"
                      valueLabel={labelForFilterValue("condition")}
                      isDefault={conditionFilter === "All"}
                      onPress={() => openFilterPicker("condition")}
                    />
                    <DropdownField
                      label="Priority"
                      valueLabel={labelForFilterValue("priority")}
                      isDefault={priorityFilter === "All"}
                      onPress={() => openFilterPicker("priority")}
                    />
                    <DropdownField
                      label="Issue type"
                      valueLabel={labelForFilterValue("flag")}
                      isDefault={flagFilter === "All"}
                      onPress={() => openFilterPicker("flag")}
                    />
                    <DropdownField
                      label="Report scope"
                      valueLabel={labelForFilterValue("scope")}
                      isDefault={scopeFilter === "All"}
                      onPress={() => openFilterPicker("scope")}
                    />
                    <DropdownField
                      label="Result history"
                      valueLabel={labelForFilterValue("history")}
                      isDefault={historyFilter === "Latest"}
                      onPress={() => openFilterPicker("history")}
                    />
                    <DropdownField
                      label="Sort results"
                      valueLabel={labelForFilterValue("sort")}
                      isDefault={sortOption === "DateDesc"}
                      onPress={() => openFilterPicker("sort")}
                    />
                  </View>
                </View>

                {/* Asset detail filters */}
                <View style={{ gap: t.spacing.sm }}>
                  <Text style={[t.text.caption, { fontWeight: "700" }]}>
                    Asset detail filters
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: t.spacing.md,
                    }}
                  >
                    <DropdownField
                      label="Location"
                      valueLabel={labelForFilterValue("location")}
                      isDefault={locationFilter === "All"}
                      onPress={() => openFilterPicker("location")}
                    />
                    <DropdownField
                      label="Room"
                      valueLabel={labelForFilterValue("room")}
                      isDefault={roomFilter === "All"}
                      onPress={() => openFilterPicker("room")}
                    />
                    <DropdownField
                      label="Department"
                      valueLabel={labelForFilterValue("department")}
                      isDefault={departmentFilter === "All"}
                      onPress={() => openFilterPicker("department")}
                    />
                    <DropdownField
                      label="Category"
                      valueLabel={labelForFilterValue("category")}
                      isDefault={categoryFilter === "All"}
                      onPress={() => openFilterPicker("category")}
                    />
                    <DropdownField
                      label="Sub-category"
                      valueLabel={labelForFilterValue("subCategory")}
                      isDefault={subCategoryFilter === "All"}
                      onPress={() => openFilterPicker("subCategory")}
                    />
                  </View>
                </View>

                {activeFilterCount > 0 ? (
                  <View style={{ alignItems: "flex-start" }}>
                    <ResetFiltersButton label="Reset filters" onPress={resetFilters} />
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        {assetHistoryFilter !== "All" ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: "rgba(0,74,38,0.18)",
              borderRadius: t.radius.lg,
              padding: t.spacing.md,
              backgroundColor: t.colors.brand.forestTint,
              gap: 6,
            }}
          >
            <Text
              style={[
                t.text.caption,
                { fontWeight: "800", color: t.colors.brand.forest },
              ]}
            >
              Asset history mode
            </Text>
            <Text style={t.text.caption}>
              Showing all submitted audit results for{" "}
              {selectedAssetHistoryLabel || "the selected asset"}.
            </Text>
            <View style={{ alignItems: "flex-start" }}>
              <Button
                label="Clear asset history"
                variant="secondary"
                onPress={() => {
                  setAssetHistoryFilter("All");
                  setHistoryFilter("Latest");
                }}
              />
            </View>
          </View>
        ) : null}

        {loading ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: t.spacing.xxxl,
              gap: 8,
            }}
          >
            <ActivityIndicator size="small" color={t.colors.brand.forest} />
            <Text style={t.text.caption}>Loading audit results...</Text>
          </View>
        ) : sortedResults.length === 0 ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              padding: t.spacing.lg,
              backgroundColor: t.colors.card.surface,
              gap: 6,
            }}
          >
            <Text style={[t.text.title, { fontSize: 20, lineHeight: 26 }]}>
              No audit results found
            </Text>
            <Text style={t.text.caption}>
              Try clearing filters or syncing completed auditor work first.
            </Text>
          </View>
        ) : (
          <View style={{ gap: t.spacing.md }}>
            <Text style={t.text.caption}>
              {assetHistoryFilter !== "All"
                ? "Showing all historical submitted audit results for the selected asset."
                : historyFilter === "Latest"
                  ? "Showing the most recent submitted result for each asset. Switch Result history to view previous audit results."
                  : "Showing all historical submitted audit results."}
            </Text>
            {sortedResults.map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                completedByName={userNamesById[result.completedBy] || ""}
                onViewAssetHistory={handleViewAssetHistory}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(pickerField)}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerField(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.18)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: t.spacing.xl,
          }}
        >
          <Pressable
            onPress={() => setPickerField(null)}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          />

          <View
            style={{
              width: "100%",
              maxWidth: 560,
              borderWidth: 1,
              borderColor: t.colors.border.subtle,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.card.surface,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                minHeight: 46,
                paddingHorizontal: t.spacing.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottomWidth: 1,
                borderBottomColor: t.colors.border.subtle,
              }}
            >
              <Pressable onPress={() => setPickerField(null)}>
                <Text style={{ color: t.colors.text.muted, fontWeight: "700" }}>
                  Cancel
                </Text>
              </Pressable>

              <Text style={[t.text.caption, { fontWeight: "700" }]}>
                {pickerConfig.label}
              </Text>

              <Pressable onPress={applyPickerValue}>
                <Text
                  style={{ color: t.colors.brand.forest, fontWeight: "700" }}
                >
                  Done
                </Text>
              </Pressable>
            </View>

            <Picker
              selectedValue={pickerDraftValue}
              onValueChange={(value) => setPickerDraftValue(String(value))}
              style={{ height: 230 }}
              itemStyle={{ fontSize: 18 }}
            >
              {pickerConfig.options.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      <AdminAppBottomNav />
    </ScreenContainer>
  );
}
