import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/src/theme';
import type { AlertItem } from '@/src/types/models';
import { StatusBadge } from './StatusBadge';
import { formatDateDDMMYYYY } from '@/src/utils/date';

function iconForKind(kind: AlertItem['kind']): React.ComponentProps<typeof FontAwesome>['name'] {
  if (kind === 'CriticalCondition') return 'exclamation-triangle';
  if (kind === 'OverdueAudit') return 'calendar';
  if (kind === 'SyncIssue') return 'cloud-upload';
  return 'flag';
}

function toneForSeverity(sev: AlertItem['severity']) {
  if (sev === 'Urgent') return 'bad';
  if (sev === 'Attention') return 'warn';
  return 'info';
}

function kindLabel(kind: AlertItem['kind']) {
  if (kind === 'CriticalCondition') return 'Critical condition';
  if (kind === 'OverdueAudit') return 'Overdue condition report';
  if (kind === 'SyncIssue') return 'Sync issue';
  return 'Asset flag';
}

export function AlertListItem({
  item,
  onComplete,
}: {
  item: AlertItem;
  onComplete?: () => void;
}) {
  const t = useTheme();
  const completed = Boolean(item.completedAt);

  return (
    <View
      style={{
        paddingVertical: t.spacing.md,
        paddingHorizontal: t.spacing.md,
        borderRadius: t.radius.lg,
        backgroundColor: completed ? 'rgba(47, 107, 75, 0.10)' : item.read ? t.colors.card.surface : t.colors.card.surfaceAlt,
        borderWidth: 1,
        borderColor: completed
          ? 'rgba(47, 107, 75, 0.30)'
          : item.read
            ? t.colors.border.subtle
            : 'rgba(31, 59, 44, 0.14)',
        opacity: completed ? 0.72 : 1,
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.md }}>
        <View style={{ flexDirection: 'row', gap: t.spacing.md, flex: 1 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 16,
              backgroundColor: t.colors.brand.forestTint,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(31, 59, 44, 0.16)',
            }}>
            <FontAwesome name={iconForKind(item.kind)} size={16} color={t.colors.brand.forest} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs }}>
              <Text style={{ fontWeight: '800', color: t.colors.text.primary }}>{item.title}</Text>
              {completed ? (
                <Text style={{ color: t.colors.status.good, fontSize: 12, fontWeight: '700' }}>
                  Completed {formatDateDDMMYYYY(item.completedAt as string)}
                </Text>
              ) : null}
            </View>
            <Text style={[t.text.caption, { marginTop: 2, color: t.colors.text.muted }]}>
              {kindLabel(item.kind)}
            </Text>
            <Text style={[t.text.caption, { marginTop: 2 }]}>{item.body}</Text>
            <Text style={[t.text.caption, { marginTop: 6 }]}>
              {formatDateDDMMYYYY(item.createdAt)}
            </Text>
          </View>
        </View>
        <View style={{ gap: t.spacing.xs, alignItems: 'flex-end' }}>
          {!completed ? <StatusBadge label={item.severity} tone={toneForSeverity(item.severity)} /> : null}
        </View>
      </View>
      <View style={{ height: t.spacing.md }} />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={onComplete}
          disabled={completed}
          style={({ pressed }) => [
            {
              minHeight: 40,
              paddingHorizontal: 14,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: completed ? 'rgba(47, 107, 75, 0.16)' : t.colors.brand.forestTint,
              borderWidth: 1,
              borderColor: completed ? 'rgba(47, 107, 75, 0.30)' : 'rgba(31, 59, 44, 0.18)',
              opacity: pressed ? 0.92 : 1,
            },
          ]}>
          <Text style={{ color: t.colors.brand.forest, fontWeight: '700', fontSize: 13 }}>
            {completed ? 'Completed' : 'Mark as completed'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

